# hw-license-center (互为卡密中心)

这是一个基于 **Cloudflare Workers** + **Hono** + **D1 Database** 构建的轻量级、安全且易于部署的软件激活码（卡密）管理系统。

---

## 🌟 功能特性

- **多产品支持**：支持为不同产品线动态生成卡密前缀。
- **设备绑定限制**：支持设置单码最大授权设备数。
- **可视化管理后台**：
  - **身份验证**：支持管理员密钥（带明/密文切换功能）。
  - **极速生卡**：支持批量生成、自定义配额和用户备注。
  - **实时管理**：状态修改（活跃/吊销）、备注编辑、彻底删除。
- **安全验证**：基于设备唯一标识的 JWT 验证机制。

---

## 🛠️ 技术栈

- **框架**: [Hono](https://hono.dev/)
- **运行环境**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **部署工具**: Wrangler

---

## 🚀 快速开始

### 1. 准备工作
确保已安装 Node.js 并在终端登录 Cloudflare：
```bash
npx wrangler login
```

### 2. 初始化数据库
执行仓库中的 `schema.sql`：
```bash
npx wrangler d1 execute smart-mp-db --file=./schema.sql
```

### 3. 本地开发
```bash
npm install
npm run dev
```

### 4. 生产部署
```bash
npx wrangler deploy src/index.ts
```

---

## 🔐 管理员配置

### 环境变量
在部署时或 `wrangler.toml` 中配置：
- `ADMIN_SECRET`: 管理员后台登录及 API 鉴权的 Bearer Token。
- `JWT_SECRET`: (可选) 用于设备验证 Token 的加密密钥。

---

## 🖥️ 管理后台

访问地址：`https://<your-worker-url>/admin`

1. 输入管理员密钥（默认：`super-secret-admin-key-2026`）。
2. 在「极速生卡」页签批量制卡。
3. 在「卡密管理」页签监控使用情况。

---

## 📄 API 说明

- `POST /api/v1/auth/verify`: 设备端发起验证/绑定。
- `POST /api/v1/auth/unbind`: 设备端解除绑定。
- `GET /api/v1/auth/admin/licenses`: 管理员获取列表。
- `POST /api/v1/auth/admin/generate`: 管理员生成卡密。

详细参数请参考 `src/index.ts` 源码。

---

## 🔗 域名访问

| 地址 | 用途 |
|---|---|
| `https://hw-license-center.hwdemtv.workers.dev` | Cloudflare Workers 原始地址 |
| `https://km.hwdemtv.com` | 自定义域名（Cloudflare 托管） |
| `https://kami.hwdemtv.com` | 备用自定义域名 |

管理后台入口：在上述任意地址后加 `/admin`

---

## 📍 认证地址配置速查

如需更换服务域名，需要同步修改以下位置：

### 服务端 (hw-license-center)

| 文件 | 行号 | 说明 |
|---|---|---|
| `wrangler.toml` | L16-17 | `ADMIN_SECRET` 管理员密钥 |
| `src/index.ts` | L127 | 管理员密钥回退默认值 |

### 插件端 (smart-mp)

| 文件 | 行号 | 说明 |
|---|---|---|
| `src/services/auth-service.ts` | L10-14 | `AUTH_API_URLS` 多域名容灾列表 |

当前值（依次尝试，任一成功即返回）：
```typescript
// smart-mp/src/services/auth-service.ts:10-14
private readonly AUTH_API_URLS = [
    "https://km.hwdemtv.com/api/v1/auth",
    "https://kami.hwdemtv.com/api/v1/auth",
    "https://hw-license-center.hwdemtv.workers.dev/api/v1/auth",
];
```

> ⚠️ 修改域名后，需要同时更新 Cloudflare Worker 的自定义域名配置（Workers 设置 → 域和路由）以及 `wrangler.toml` 中的 `[[routes]]`。

---

## ⚖️ 开源协议
MIT
