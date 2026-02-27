# hw-license-center (互为卡密中心)

这是一个基于 **Cloudflare Workers** + **Hono** + **D1 Database** 构建的轻量级、安全且易于部署的软件激活码（卡密）管理系统。

---

## 🌟 功能特性

- **多产品支持**：支持为不同产品线动态生成卡密前缀。
- **设备绑定限制**：支持设置单码最大授权设备数。
- **C端自助解绑门户**：提供无需密码的 `/portal` 页面，前端用户可凭卡密自助查阅设备分配状态，并一键安全跨端解绑。内置 IP 频控防滥用与设备名打星脱敏机制。
- **可视化管理后台**：
  - **身份验证**：支持管理员密钥（带明/密文切换功能）。
  - **极速生卡**：支持批量生成、自定义配额和用户备注。
  - **实时管理**：状态修改（活跃/吊销）、设备详情穿透、强制踢出、彻底删除。
  - **资产导入导出**：支持跨端迁移卡密池，支持导出适合 Excel 阅读的分析报表。
- **安全验证**：基于设备唯一标识的纯 JWT (HS256) 验证与时钟校频机制。

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
3. 在「卡密管理」页签监控和干预各个设备的使用状况。

---

## 🌐 自助查询门户

面向普通客户端用户（C端）开放的轻体验自助设备管理节点：

访问地址：`https://<your-worker-url>/portal`

1. 仅需输入已购的 **激活码（License Key）**。
2. 可视化查看该卡密允许的最大设备配额与当前所绑设备清单（名称安全脱敏）。
3. 自由点击一键断开（解绑）旧设备的授权（具有防刷限流机制保护）。

---

## 📄 API 说明

## 📄 API 说明

- `POST /api/v1/auth/verify`: 设备端发起验证/绑定。
- `POST /api/v1/auth/unbind`: 设备端解除绑定。
- `GET /api/v1/auth/portal/devices`: 前台门户查询指定卡密的脱敏设备列表。
- `GET /api/v1/auth/admin/licenses`: 管理员获取卡密与数据聚合体。
- `GET /api/v1/auth/admin/licenses/:key/devices`: 管理员查询持卡人的关联物理机名册。
- `POST /api/v1/auth/admin/generate`: 管理员批量制卡并在库注水。

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

---

## 📅 Roadmap (未来规划)

- [ ] **卡密在线分发 Webhook**：计划通过新增安全的 `/api/v1/auth/webhook/pay` 接口，结合 HMAC 安全验签与订单防重放拦截，全自动对接第三方个人发卡网或聚合支付网关（如独角兽、知宇等），实现“客户打款 -> 回调入库产卡 -> 原路回传提卡”的 0 人工干预自动售卡闭环。
- [ ] **更精细的风控系统**：基于设备指纹演化更严格的滥防探测机制，对异常频繁上下线的卡密执行降权预警。
