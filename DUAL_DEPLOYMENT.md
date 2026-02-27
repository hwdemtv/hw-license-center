# 双部署架构方案

本方案说明如何通过代码改造，让项目同时支持Cloudflare Workers和VPS两种部署方式。

---

## 🎯 核心理念

采用**适配器模式（Adapter Pattern）**抽象基础设施依赖，通过**环境变量**动态选择实现。

```
┌─────────────────────────────────────────┐
│        Application Layer                │
│  (routes, services, business logic)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        Adapter Interface                │
│  (抽象接口，与部署环境无关)             │
├─────────────────────────────────────────┤
│  - IDatabaseAdapter                     │
│  - IStorageAdapter                      │
│  - ICacheAdapter                        │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────┐      ┌─────────────┐
│ D1Impl   │      │ SQLiteImpl  │
│  (CF)    │      │   (VPS)     │
└──────────┘      └─────────────┘
```

---

## 🏗️ 实现方案

### 第1步：创建适配器接口

#### `src/adapters/database.interface.ts`
```typescript
/**
 * 数据库适配器接口
 * 抽象D1 Database和其他数据库操作
 */
export interface DatabaseAdapter {
  /**
   * 查询数据（返回多条）
   */
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;

  /**
   * 执行更新/插入/删除（返回影响行数）
   */
  run(sql: string, params?: any[]): Promise<RunResult>;

  /**
   * 批量执行（用于事务）
   */
  batch<T = any>(statements: Statement[]): Promise<QueryResult<T>[]>;

  /**
   * 获取单条记录
   */
  get<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

export interface QueryResult<T> {
  results?: T[];
  success: boolean;
  error?: string;
}

export interface RunResult {
  success: boolean;
  changes?: number;
  lastInsertRowid?: number;
  error?: string;
}

export interface Statement {
  sql: string;
  params?: any[];
}
```

### 第2步：实现Cloudflare D1适配器

#### `src/adapters/d1.adapter.ts`
```typescript
import { DatabaseAdapter, QueryResult, RunResult, Statement } from './database.interface';

/**
 * Cloudflare D1数据库适配器
 */
export class D1DatabaseAdapter implements DatabaseAdapter {
  constructor(private db: D1Database) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    try {
      const stmt = this.db.prepare(sql);
      const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await boundStmt.all<T>();

      return {
        results: result.results as T[],
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    try {
      const stmt = this.db.prepare(sql);
      const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await boundStmt.run();

      return {
        success: true,
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async batch<T = any>(statements: Statement[]): Promise<QueryResult<T>[]> {
    try {
      const preparedStatements = statements.map(stmt => {
        const ps = this.db.prepare(stmt.sql);
        return stmt.params ? ps.bind(...stmt.params) : ps;
      });

      const results = await this.db.batch<T>(preparedStatements);

      return results.map(result => ({
        results: result.results as T[],
        success: true,
      }));
    } catch (error) {
      return statements.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const stmt = this.db.prepare(sql);
      const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await boundStmt.first<T>();

      return result || null;
    } catch (error) {
      console.error('Database get error:', error);
      return null;
    }
  }
}
```

### 第3步：实现SQLite适配器（VPS用）

#### `src/adapters/sqlite.adapter.ts`
```typescript
import { Database } from 'sqlite3';
import { DatabaseAdapter, QueryResult, RunResult, Statement } from './database.interface';

/**
 * SQLite数据库适配器（VPS环境）
 */
export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to open database:', err);
        throw err;
      }
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    return new Promise((resolve) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          resolve({
            success: false,
            error: err.message,
          });
        } else {
          resolve({
            results: rows as T[],
            success: true,
          });
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<RunResult> {
    return new Promise((resolve) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          resolve({
            success: false,
            error: err.message,
          });
        } else {
          resolve({
            success: true,
            changes: this.changes,
            lastInsertRowid: this.lastID,
          });
        }
      });
    });
  }

  async batch<T = any>(statements: Statement[]): Promise<QueryResult<T>[]> {
    const results: QueryResult<T>[] = [];

    for (const stmt of statements) {
      const result = await this.query<T>(stmt.sql, stmt.params);
      results.push(result);
    }

    return results;
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err);
          resolve(null);
        } else {
          resolve(row as T || null);
        }
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
```

### 第4步：创建环境配置管理器

#### `src/config/environment.ts`
```typescript
/**
 * 应用配置接口
 */
export interface AppConfig {
  // 管理员配置
  ADMIN_SECRET: string;
  JWT_SECRET: string;

  // 数据库配置
  DB_TYPE: 'd1' | 'sqlite' | 'postgresql';
  DB_PATH?: string;           // SQLite用
  DB_CONNECTION?: string;     // PostgreSQL用
  DB_INSTANCE?: D1Database;   // D1用（Cloudflare环境）

  // 存储配置（如使用文件存储功能）
  STORAGE_TYPE?: 'r2' | 'localfs';
  R2_BUCKET?: R2Bucket;
  STORAGE_PATH?: string;

  // 其他配置
  PORT?: number;  // VPS用
}

/**
 * 环境配置加载器
 */
export class ConfigLoader {
  static load(c?: any): AppConfig {
    // Cloudflare Workers环境
    if (c?.env) {
      return {
        ADMIN_SECRET: c.env.ADMIN_SECRET,
        JWT_SECRET: c.env.JWT_SECRET || c.env.ADMIN_SECRET,
        DB_TYPE: 'd1',
        DB_INSTANCE: c.env.DB,
        STORAGE_TYPE: c.env.R2_BUCKET ? 'r2' : undefined,
        R2_BUCKET: c.env.R2_BUCKET,
      };
    }

    // VPS环境（Node.js）
    require('dotenv').config();

    const dbType = (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgresql';

    return {
      ADMIN_SECRET: process.env.ADMIN_SECRET!,
      JWT_SECRET: process.env.JWT_SECRET || process.env.ADMIN_SECRET!,
      DB_TYPE: dbType,
      DB_PATH: process.env.DB_PATH || './data/license.db',
      DB_CONNECTION: process.env.DB_CONNECTION,
      STORAGE_TYPE: process.env.STORAGE_TYPE as 'localfs' | undefined,
      STORAGE_PATH: process.env.STORAGE_PATH || './uploads',
      PORT: parseInt(process.env.PORT || '3000'),
    };
  }

  /**
   * 创建数据库适配器实例
   */
  static createDatabaseAdapter(config: AppConfig): DatabaseAdapter {
    switch (config.DB_TYPE) {
      case 'd1':
        if (!config.DB_INSTANCE) {
          throw new Error('D1 instance is required for D1 database type');
        }
        return new D1DatabaseAdapter(config.DB_INSTANCE);

      case 'sqlite':
        if (!config.DB_PATH) {
          throw new Error('DB_PATH is required for SQLite database type');
        }
        return new SQLiteDatabaseAdapter(config.DB_PATH);

      case 'postgresql':
        // 如需PostgreSQL，需要实现PostgreSQLAdapter
        throw new Error('PostgreSQL adapter not implemented yet');

      default:
        throw new Error(`Unsupported database type: ${config.DB_TYPE}`);
    }
  }
}
```

### 第5步：修改服务层代码

#### `src/services/license-service.ts`（示例）
```typescript
import { DatabaseAdapter } from '../adapters/database.interface';
import { AppConfig } from '../config/environment';

/**
 * 卡密服务（改造后）
 */
export class LicenseService {
  private db: DatabaseAdapter;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.db = ConfigLoader.createDatabaseAdapter(config);
  }

  /**
   * 获取所有卡密
   */
  async getAllLicenses(): Promise<License[]> {
    const result = await this.db.query<License>(
      'SELECT * FROM licenses ORDER BY created_at DESC'
    );

    if (!result.success) {
      throw new Error(`Failed to get licenses: ${result.error}`);
    }

    return result.results || [];
  }

  /**
   * 创建新卡密
   */
  async createLicense(license: Omit<License, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO licenses (license_key, product_id, status, max_devices, user_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        license.license_key,
        license.product_id,
        license.status,
        license.max_devices,
        license.user_name,
        new Date().toISOString(),
      ]
    );

    if (!result.success) {
      throw new Error(`Failed to create license: ${result.error}`);
    }

    return result.lastInsertRowid || 0;
  }

  // 其他方法...
}
```

### 第6步：修改路由处理

#### `src/routes/admin.ts`（示例）
```typescript
import { Hono } from 'hono';
import { ConfigLoader } from '../config/environment';
import { LicenseService } from '../services/license-service';

const app = new Hono();

// 中间件：加载配置
app.use('*', async (c, next) => {
  const config = ConfigLoader.load(c.env);
  c.set('config', config);
  c.set('licenseService', new LicenseService(config));
  await next();
});

// 获取所有卡密
app.get('/licenses', async (c) => {
  const service = c.get('licenseService');
  const licenses = await service.getAllLicenses();
  return c.json({ success: true, data: licenses });
});

export default app;
```

### 第7步：修改入口文件

#### `src/index.ts`
```typescript
import { Hono } from 'hono';
import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';
import { ConfigLoader } from './config/environment';

const app = new Hono();

// 加载配置（全局）
app.use('*', async (c, next) => {
  const config = ConfigLoader.load(c.env);
  c.set('config', config);
  await next();
});

// 路由
app.route('/api/v1/auth/admin', adminRoutes);
app.route('/api/v1/auth', publicRoutes);

// Cloudflare Workers导出
export default app;

// VPS启动（Node.js环境）
if (typeof module !== 'undefined' && require.main === module) {
  (async () => {
    try {
      const { serve } = await import('@hono/node-server');
      const config = ConfigLoader.load();

      serve({
        fetch: app.fetch,
        port: config.PORT || 3000,
      });

      console.log(`🚀 Server running on http://localhost:${config.PORT || 3000}`);
      console.log(`📊 Database: ${config.DB_TYPE}`);
      console.log(`💾 Storage: ${config.STORAGE_TYPE || 'none'}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  })();
}
```

### 第8步：配置package.json

```json
{
  "scripts": {
    "dev:cf": "wrangler dev",
    "dev:vps": "tsx watch src/index.ts",
    "build": "tsc",
    "deploy:cf": "wrangler deploy",
    "start:vps": "node dist/index.js",
    "pm2:start": "pm2 start dist/index.js --name license-center",
    "docker:build": "docker build -t license-center .",
    "docker:run": "docker run -p 3000:3000 --env-file .env license-center"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "dotenv": "^16.0.0",
    "sqlite3": "^5.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

### 第9步：创建环境配置文件

#### `.env.example`（VPS用）
```bash
# 管理员密钥（必须修改！）
ADMIN_SECRET=your-secure-admin-secret-key

# JWT密钥（可选，默认使用ADMIN_SECRET）
JWT_SECRET=your-jwt-secret-key

# 数据库类型：sqlite, postgresql
DB_TYPE=sqlite

# SQLite数据库路径
DB_PATH=./data/license.db

# PostgreSQL连接字符串（如使用PostgreSQL）
# DB_TYPE=postgresql
# DB_CONNECTION=postgresql://user:password@localhost:5432/license_db

# 存储类型：localfs（本地文件系统）
STORAGE_TYPE=localfs
STORAGE_PATH=./uploads

# 服务端口
PORT=3000
```

#### `wrangler.toml`（Cloudflare用）
```toml
name = "hw-license-center"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
# 注意：生产环境使用wrangler secret put命令设置
# ADMIN_SECRET = "development-secret"

[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"
```

### 第10步：创建Docker配置

#### `Dockerfile`
```dockerfile
# 使用Node.js 20 LTS
FROM node:20-alpine

# 创建工作目录
WORKDIR /app

# 安装SQLite3依赖
RUN apk add --no-cache sqlite

# 复制package文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制应用代码
COPY dist/ ./dist/
COPY .env.example ./.env

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
```

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 🚀 部署方式

### Cloudflare Workers部署

```bash
# 1. 设置密钥
npx wrangler secret put ADMIN_SECRET
npx wrangler secret put JWT_SECRET

# 2. 部署
npm run deploy:cf

# 3. 访问
# https://your-worker.workers.dev/admin
```

### VPS部署

#### 方式1：直接运行
```bash
# 1. 安装依赖
npm install

# 2. 构建
npm run build

# 3. 配置环境变量
cp .env.example .env
# 编辑.env文件

# 4. 启动
npm run start:vps

# 或使用PM2
npm install -g pm2
npm run pm2:start
```

#### 方式2：Docker部署
```bash
# 1. 配置环境
# cp .env.example .env
# 编辑.env文件

# 2. 构建镜像
npm run docker:build

# 3. 启动容器
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

---

## 📊 方案对比

### 开发体验

| 特性 | Cloudflare Workers | VPS |
|-----|-------------------|-----|
| 本地开发 | `wrangler dev` | `tsx watch` |
| 热重载 | ✅ 内置 | ✅ 支持 |
| 调试 | DevTools | Node.js调试器 |
| 日志 | Workers Logs | PM2/文件日志 |

### 运行时性能

| 指标 | Cloudflare Workers | VPS (2核2G) |
|-----|-------------------|------------|
| 冷启动 | < 10ms | - |
| 请求处理 | 边缘节点 | 单服务器 |
| 并发能力 | 自动扩缩容 | 依赖服务器配置 |
| 全球延迟 | < 50ms | 取决于服务器位置 |

### 成本对比（月活1万用户）

| 方案 | 费用 | 备注 |
|-----|------|------|
| **Cloudflare Workers** | ￥0-50 | 免费额度充足 |
| **VPS（最低配）** | ￥30-50 | 1核1G |
| **VPS（推荐）** | ￥80-150 | 2核2G |
| **VPS + CDN** | ￥130-200 | 含CDN费用 |

---

## 💡 最佳实践

### 1. 统一代码仓库

```bash
# 目录结构
src/
├── adapters/           # 适配器（数据库、存储等）
│   ├── database.interface.ts
│   ├── d1.adapter.ts
│   └── sqlite.adapter.ts
├── config/
│   └── environment.ts  # 环境配置
├── services/           # 业务服务
├── routes/             # 路由
└── index.ts           # 入口

# 配置文件
├── wrangler.toml      # Cloudflare配置
├── .env.example       # VPS环境模板
├── Dockerfile         # Docker配置
└── docker-compose.yml
```

### 2. 开发流程

```bash
# 开发阶段（Cloudflare）
npm run dev:cf

# 开发阶段（VPS）
npm run dev:vps

# 测试阶段
# 同时部署到两个环境进行测试

# 生产部署
# 根据需求选择部署目标
```

### 3. 环境检测

```typescript
// 在代码中检测当前环境
export function getDeploymentInfo() {
  const isCloudflare = typeof (globalThis as any).caches !== 'undefined' && 
                       typeof (globalThis as any).caches.default !== 'undefined';

  return {
    isCloudflare,
    isVPS: !isCloudflare,
    environment: isCloudflare ? 'cloudflare' : 'vps',
    database: config.DB_TYPE,
  };
}
```

### 4. CI/CD配置

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-cf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy

  deploy-vps:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[deploy-vps]')
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        uses: easingthemes/ssh-deploy@v2
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
          REMOTE_HOST: ${{ secrets.VPS_HOST }}
          REMOTE_USER: ${{ secrets.VPS_USER }}
          SOURCE: "dist/"
          TARGET: "/app/"
```

---

## 🎉 总结

### 双部署架构的优势

✅ **代码复用**：一套代码，两处部署
✅ **灵活选择**：根据需求选择部署方式
✅ **成本优化**：小规模用CF，大规模用VPS
✅ **风险分散**：双平台备份
✅ **数据可控**：VPS版本完全控制数据

### 实施建议

1. **改造优先级**：
   - 高：数据库适配器（必需）
   - 中：环境配置管理器（必需）
   - 低：存储适配器（可选）

2. **开发顺序**：
   - 先实现接口
   - 再实现D1适配器（保持现有功能）
   - 最后实现SQLite适配器（新增支持）

3. **测试策略**：
   - 每个适配器单独测试
   - 双环境集成测试
   - 性能对比测试

4. **上线策略**：
   - 保持CF Workers主环境稳定
   - VPS作为备选方案测试
   - 逐步迁移（如需）

---

## 📚 相关文档

- [README.md](./README.md) - 项目主文档
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署方案对比
- [CF Workers文档](https://developers.cloudflare.com/workers/)
- [Hono框架](https://hono.dev/)
- [SQLite Node.js](https://github.com/TryGhost/node-sqlite3)
