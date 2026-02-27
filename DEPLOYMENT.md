# 部署方案指南

本文档说明如何将本卡密管理系统部署到不同环境中。

---

## 📋 目录

- [方案一：Cloudflare Workers（推荐）](#方案一cloudflare-workers推荐)
- [方案二：VPS部署（需要代码改造）](#方案二vps部署需要代码改造)
- [部署对比](#部署对比)
- [常见问题](#常见问题)

---

## 方案一：Cloudflare Workers（推荐）

### 架构
```
Cloudflare Workers (全球边缘节点)
    ↓
D1 Database (Serverless SQLite)
    ↓
KV/Cache (边缘缓存)
```

### 部署步骤

1. **准备环境**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **创建数据库**
   ```bash
   npx wrangler d1 create your-db-name
   npx wrangler d1 execute your-db-name --file=./schema.sql
   ```

3. **配置密钥**
   ```bash
   npx wrangler secret put ADMIN_SECRET
   npx wrangler secret put JWT_SECRET
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **访问**
   - 管理后台：`https://your-worker.workers.dev/admin`
   - 用户门户：`https://your-worker.workers.dev/portal`

### 费用
- **免费额度**：10万次请求/天
- **适合**：初创项目、个人项目、日活<1000用户

---

## 方案二：VPS部署（需要代码改造）

### 重要提示

⚠️ **本项目原生为Cloudflare Workers设计，直接部署到VPS需要代码改造**。

### 架构
```
VPS服务器
    ├─ Nginx (反向代理 + SSL)
    ├─ Node.js应用
    ├─ SQLite/PostgreSQL数据库
    └─ PM2 (进程管理)
```

### 改造要点

#### 1. 数据库层（必需）

当前代码：
```typescript
const result = await c.env.DB.prepare('SELECT * FROM licenses').all();
```

需要改为适配器模式：
```typescript
// 创建数据库适配器接口
export interface DatabaseAdapter {
  query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  run(sql: string, params?: any[]): Promise<{ success: boolean; changes?: number }>;
}

// 实现D1适配器（Cloudflare）
export class D1Adapter implements DatabaseAdapter { /* ... */ }

// 实现SQLite适配器（VPS）
export class SQLiteAdapter implements DatabaseAdapter { /* ... */ }
```

**预估工时**：2-3天

#### 2. 环境变量（必需）

当前代码：
```typescript
const secret = c.env.ADMIN_SECRET;
```

需要改为：
```typescript
// 创建配置管理器
export function loadConfig(c?: any): EnvConfig {
  if (c?.env) {
    // Cloudflare环境
    return { /* ... */ };
  } else {
    // VPS环境（使用dotenv）
    require('dotenv').config();
    return { /* ... */ };
  }
}
```

**预估工时**：1天

#### 3. 存储层（可选，如使用R2）

如需使用文件存储功能：
```typescript
export interface StorageAdapter {
  put(key: string, data: ArrayBuffer): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
}

// 实现R2适配器（Cloudflare）
export class R2Adapter implements StorageAdapter { /* ... */ }

// 实现本地文件适配器（VPS）
export class LocalFsAdapter implements StorageAdapter { /* ... */ }
```

**预估工时**：1天

#### 4. 入口文件（必需）

修改入口文件支持两种启动方式：
```typescript
// Cloudflare Workers
export default app;

// VPS (Node.js)
if (require.main === module) {
  const { serve } = require('@hono/node-server');
  serve({ fetch: app.fetch, port: process.env.PORT || 3000 });
}
```

**预估工时**：0.5天

### VPS配置要求

#### 最低配置
- **CPU**：1核
- **内存**：512MB
- **硬盘**：10GB SSD
- **带宽**：1Mbps
- **系统**：Ubuntu 20.04+
- **Node.js**：18.x+

#### 推荐配置
- **CPU**：2核
- **内存**：1GB
- **硬盘**：20GB SSD
- **带宽**：5Mbps
- **系统**：Ubuntu 22.04 LTS

### 部署步骤

#### 1. 环境准备
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx

npm install -g pm2
```

#### 2. 项目配置
```bash
# 克隆项目（需使用改造后的版本）
git clone <your-repo>
cd hw-license-center

# 安装依赖
npm install

# 安装数据库驱动（如SQLite）
npm install sqlite3

# 配置环境变量
cp .env.example .env
# 编辑.env文件
```

#### 3. 启动服务
```bash
# 使用PM2启动
pm2 start dist/index.js --name license-center

# 保存PM2配置
pm2 save
pm2 startup
```

#### 4. Nginx配置
```nginx
# /etc/nginx/sites-available/license-center
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 5. SSL证书
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Docker部署（推荐）

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_TYPE=sqlite
      - DB_PATH=./data/license.db
      - ADMIN_SECRET=your-secret
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

```bash
# 启动
docker-compose up -d
```

---

## 部署对比

| 维度 | Cloudflare Workers | VPS |
|-----|-------------------|-----|
| **部署难度** | ⭐ 极低 | ⭐⭐⭐⭐ 高 |
| **运维成本** | ⭐ 零 | ⭐⭐⭐⭐ 高 |
| **费用** | 免费/低 | ¥50-150/月 |
| **扩展性** | 自动 | 手动 |
| **全球加速** | 内置 | 需配置CDN |
| **数据控制** | 托管 | 完全控制 |
| **改造工时** | 0天 | 7-10天 |

---

## 常见问题

### Q: 能否不改代码直接部署到VPS？
A: **不能**。项目深度依赖Cloudflare Workers运行时（如D1数据库、KV、环境变量访问方式等），必须改造。

### Q: 改造后还能用Cloudflare部署吗？
A: **可以**。通过适配器模式，可以同时支持两种部署方式，只需配置不同的适配器实现。

### Q: 改造工作量有多大？
A: 预估**7-10个工作日**，主要包括：
- 数据库适配层：2-3天
- 环境变量管理：1天
- 存储适配（如需）：1天
- 测试和调优：3-5天

### Q: 数据能迁移吗？
A: **可以**。D1数据库可以导出为SQL文件，然后导入到SQLite/PostgreSQL。

```bash
# 导出D1数据
npx wrangler d1 export your-db --output ./backup.sql

# 导入到SQLite
sqlite3 license.db < backup.sql
```

### Q: 生产环境应该选哪个？
A: **推荐Cloudflare Workers**，除非：
- 数据合规要求必须自有服务器
- 日请求量>1000万次，CF费用过高
- 需要Workers不支持的功能（如WebSocket长连接）

---

## 总结

| 场景 | 推荐方案 | 理由 |
|-----|---------|------|
| 快速启动、测试 | Cloudflare Workers | 零成本、零运维 |
| 生产环境、日活<1万 | Cloudflare Workers | 免费额度充足 |
| 数据敏感、合规要求 | VPS | 完全控制数据 |
| 高并发>1000万次/天 | VPS | 成本可控 |
| 需要长连接/Worker不支持功能 | VPS | 功能不受限 |

**默认推荐**：继续使用Cloudflare Workers，无需改造。

**需要VPS**：请预留充足时间进行代码改造和测试。
