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

## ⚖️ 开源协议
MIT
