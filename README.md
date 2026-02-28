# hw-license-center (互为卡密中心)

这是一个基于 **Cloudflare Workers** + **Hono** + **D1 Database** 构建的轻量级、安全且易于部署的软件激活码（卡密）管理系统。

---

## 🌟 功能特性

- **多产品支持**：支持为不同产品线动态生成卡密前缀。
- **设备绑定限制**：支持设置单码最大授权设备数。
- **C端自助解绑门户**：提供无需密码的 `/portal` 页面，前端用户可凭卡密自助查阅设备分配状态，并一键安全跨端解绑。内置 IP 频控防滥用、设备名打星脱敏机制及**动态品牌展示（包含管理员客服联系方式指引）**。
  - **可视化管理后台**：
  - **身份验证与安全防御**：支持动态管理员密钥验证与密码在线轮换，自动封存恶意刷单攻击。
  - **全局系统配置中心**：内置可视化 `System Settings` 面板，支持在网页端零界限动态调节“最大解绑次数限制”、“离线 Token 有效期”、“设备/产品初始化业务预设值”及门户前端的标题/公告板，所有变更实时存入边缘 D1 云数据库。
  - **极简大运力生卡**：支持万级批量生成、自定义配额和带历史记忆的产品线选择。
  - **高性能管理引擎**：**全面实施服务端游标分页**，支持极速翻页秒开。
  - **多维聚合检索与零动画 UI**：支持按用户名、卡密、产品、状态进行沉浸式过滤；剔除了一切花里胡哨的渲染动画，让大规模操作回归绝对干脆。
  - **批量与原子级悬浮操作**：独家首创非阻挡式底部悬浮批量控制栏（Batch Bar），支持对资产跨屏进行：批量强杀、锁定吊销、跨产品续费扩容与剥夺等 10 余种动作。
  - **资产双向流转导入导出**：支持 CSV/JSON 互导，涵盖智能正则解构 Excel 报表，完美闭环资产全链条生命周期。
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
确保已安装 Node.js 并在终端安全登录 Cloudflare 边缘账号：
```bash
npx wrangler login
```

### 2. 核心配置文件初始化
本项目提供了一份抽离了敏感 ID 的标准开箱即用模板，请执行：
```bash
cp wrangler.example.toml wrangler.toml
```

### 3. 创建智能边缘数据库 (D1)
执行以下命令创建 SQLite 的边缘分发版本，**并记得将控制台输出的 `database_id` 填入刚刚拷贝的 `wrangler.toml` 内**：
```bash
npx wrangler d1 create smart-mp-db
```

### 4. 写入业务表结构数据
执行内置的架构感知脚本，将其同步至本地研发与远程产线：
```bash
npx wrangler d1 execute smart-mp-db --local --file=./schema.sql
npx wrangler d1 execute smart-mp-db --remote --file=./schema.sql
```

**数据库基石结构：**
- `Licenses` - 卡密主表（存储激活码、风控属性等）
- `Devices` - 设备指纹表（记录多端授权挂载状态）
- `Subscriptions` - 多产品订阅表（精细化时间控制与降级容灾）

### 5. 本地联调与预览
```bash
npm install
npm run dev
```

### 6. 发射到外太空 (生产部署)
所有测试完成后，无需管理服务器，一键发布至全球 300+ 边缘节点：
```bash
npx wrangler deploy
```

> 📘 **更多部署方案**：如需部署到VPS或了解其他部署方式，请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 文档。
>
> 🎯 **双部署架构**：如需让代码同时支持Cloudflare Workers和VPS部署，请查看 [DUAL_DEPLOYMENT.md](./DUAL_DEPLOYMENT.md) 文档。

### 5. 部署验证
部署完成后，访问 `https://your-worker-url/admin`，输入配置的 `ADMIN_SECRET` 验证是否能正常登录管理后台。

**验证清单：**
- ✅ 能正常打开 `/admin` 管理页面
- ✅ 使用 `ADMIN_SECRET` 能成功登录
- ✅ 能在「极速生卡」页面生成测试卡密
- ✅ 访问 `/portal` 页面，输入测试卡密能查询设备状态

---

## 🔐 管理员配置

### 环境变量配置
在部署时或 `wrangler.toml` 中配置：

#### `wrangler.toml` 示例
```toml
name = "hw-license-center"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"

# 管理员密钥（必须修改！）
[vars]
ADMIN_SECRET = "your-secure-admin-secret-key"
JWT_SECRET = "your-jwt-secret-key-for-device-auth"
```

**必需变量：**
- `ADMIN_SECRET`: 管理员后台登录及 API 鉴权的 Bearer Token（建议32位以上随机字符串）

**可选变量：**
- `JWT_SECRET`: 用于设备验证 Token 的加密密钥（如不设置，系统会自动生成）
- `WEBHOOK_SECRET`: 用于支付回调自动发卡的专属鉴权密钥。接入发卡平台时请务必配置，防止恶意刷单。

---

### 🌱 方式二：部署到传统 VPS / Node.js (推荐环境独立团队)

本中心底层采用了 **抽象数据访问层 (DBAdapter)**，不仅原生支持 Cloudflare D1，也完美兼容传统 Node.js 环境下的 `better-sqlite3`。你可以将本项目零修改地运行在任意带 Node 环境的服务器上。

#### 步骤 1：准备环境与配置
确保你的服务器已安装 `Node.js (v18+)`。
```bash
# 1. 克隆并进入目录
git clone https://github.com/hwdemtv/hw-license-center.git
cd hw-license-center

# 2. 安装全部全栈依赖
npm install

# 3. 配置安全密钥 (将生成两个环境变量)
# 复制出 wrangler.example.toml 里提到的通信 JWT_SECRET 和后台访问 ADMIN_SECRET
echo "JWT_SECRET=你自己的长随机验证密钥" > .env
echo "ADMIN_SECRET=你自己的控制台登录密钥" >> .env
```

#### 步骤 2：初始化本地 SQLite 数据库
由于脱离了 Cloudflare，我们需要在本地创建一个 SQLite 文件来承载数据。
使用项目内置的 `schema.sql` 直接生成本地本地数据库库：
```bash
# 安装 sqlite3 命令行工具 (Ubuntu: apt install sqlite3 / CentOS: yum install sqlite)
mkdir -p .wrangler/state/v3/d1/miniflare-D1DatabaseObject/
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite < schema.sql
```

#### 步骤 3：原生启动服务 / PM2 守护
项目内置了由 `tsx` 和 `@hono/node-server` 驱动的本地双栖入口 `src/server.node.ts`。

**开发测试模式：**
```bash
npm run dev:node
# 默认将在本地 3000 端口启动：http://localhost:3000
```

**生产编译部署 (使用 PM2 守护)：**
```bash
# 1. ESBuild 打包为单文件后端
npm run build:node

# 2. 启动 PM2 守护独立服务
npm install -g pm2
pm2 start dist/server.js --name "hw-license-center"
```
完成部署后，你可以使用 Nginx 反向代理将你的 `km.yourdomain.com` 代理到本地的 `3000` 端口。

---

## 🖥️ 管理后台

访问地址：`https://<your-worker-url>/admin`

1. 输入管理员密钥（**默认：`hwdemtv`**，部署后务必修改！）。
2. 在「极速生卡」页签批量制卡。
3. 在「卡密管理」页签监控和干预各个设备的使用状况。

> ⚠️ **安全警告**：默认密码仅用于测试，生产环境必须立即修改！详见下方的 [🔒 安全建议] 章节。 

---

## 🌐 自助查询门户

面向普通客户端用户（C端）开放的轻体验自助设备管理节点：

访问地址：`https://<your-worker-url>/portal`

### 功能说明
1. 仅需输入已购的 **激活码（License Key）** 。
2. 可视化查看该卡密允许的最大设备配额与当前所绑设备清单（名称安全脱敏）。
3. 自由点击一键断开（解绑）旧设备的授权。

### C端用户解绑限制

为保护用户权益和防止恶意操作，系统对C端自助解绑设置了以下限制：

**周期额度方案 (硬核防护)：**
- **解绑限额**：每个激活码每月最多允许自助解绑 **3 次**。
- **重置机制**：基于服务器时间，跨月后的首次解绑会自动重置计数器。
- **触发后果**：达到上限后 UI 将提示额度用尽，需联系管理员处理。

> 💡 **温馨提示**：正常用户极少会触发这些限制，如频繁触发请检查是否有异常操作。

---

## 📄 API 说明

### 核心端点

**设备端接口：**
- `POST /api/v1/auth/verify` - 设备验证与绑定
  - 请求体：`{ license_key, device_id, device_name }`
  - 响应：`{ success, token, message }`

- `POST /api/v1/auth/unbind` - 设备自助解绑
  - 请求体：`{ license_key, device_id }`
  - 响应：`{ success, message }`

**C端门户接口：**
- `GET /api/v1/auth/portal/devices?license_key={key}` - 查询设备列表（脱敏）
  - 响应：`{ success, data: [{device_id, device_name, last_active}] }`

**管理后台接口：**
- `GET /api/v1/auth/admin/licenses` - 获取卡密分页列表
  - Headers: `Authorization: Bearer {ADMIN_SECRET}`
  - 参数：`page`, `limit`, `search`, `status`, `product_id`, `sort`
  - 响应：`{ success, data: [...], pagination: { total, total_pages }, stats: { active, expiring... } }`

- `GET /api/v1/auth/admin/licenses/:key/devices` - 查询指定卡密的设备详情
  - Headers: `Authorization: Bearer {ADMIN_SECRET}`
  - 响应：`{ success, data: [...] }`

- `POST /api/v1/auth/admin/generate` - 批量生成卡密
  - Headers: `Authorization: Bearer {ADMIN_SECRET}`
  - 请求体：`{ count, max_devices, duration_days, product_id, user_name }`
  - 响应：`{ success, keys: [...] }`

**支付/发卡 Webhook 接口 (M2M)：**
- `POST /api/v1/auth/webhook/pay` - 第三方支付回调自动发卡
  - 鉴权：支持 `Authorization: Bearer {WEBHOOK_SECRET}` 或 URL 参数 `?token={WEBHOOK_SECRET}`
  - 参数：`{ product_id, count, max_devices, duration_days, out_trade_no }`
  - 响应：`{ success, keys: ["KEY-1", "KEY-2"], text_result: "KEY-1\nKEY-2" }`

详细参数请参考 `src/app.ts` 源码。

---

## 🔗 域名访问

| 地址 | 用途 |
|---|---|
| `https://your-worker-name.your-subdomain.workers.dev` | Cloudflare Workers 原始地址 |
| `https://your-domain.com` | 自定义域名（Cloudflare 托管） |
| `https://your-backup-domain.com` | 备用自定义域名 |

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
    "https://your-domain.com/api/v1/auth",
    "https://your-backup-domain.com/api/v1/auth",
    "https://your-worker-name.your-subdomain.workers.dev/api/v1/auth",
];
```

> ⚠️ 修改域名后，需要同时更新 Cloudflare Worker 的自定义域名配置（Workers 设置 → 域和路由）以及 `wrangler.toml` 中的 `[[routes]]`。

---

## 🔒 安全建议

### 生产环境部署注意事项

#### 第一步：立即修改默认密码（⚠️ 关键）

**修改 `wrangler.toml`：**
```toml
[vars]
ADMIN_SECRET = "your-secure-admin-secret-key"  # 替换默认值 hwdemtv
JWT_SECRET = "your-jwt-secret-key-for-device-auth"
```

**生成强密码（推荐）：**
```bash
# 生成32位随机字符串
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**重新部署：**
```bash
npx wrangler deploy src/index.ts
```

#### 其他安全措施
1. **启用 HTTPS**：Cloudflare Workers 默认启用，确保自定义域名也开启 SSL
2. **定期轮换密钥**：建议每3-6个月更换一次 `ADMIN_SECRET`
3. **限制访问来源**：在 Cloudflare Workers 设置中配置访问规则，限制 `/admin` 路径的访问 IP
4. **监控异常登录**：定期检查访问日志，发现异常登录及时处理

### 数据备份
定期导出卡密数据：
```bash
# 在管理后台使用「导出」功能，或调用 API
GET /api/v1/auth/admin/licenses/export
Headers: Authorization: Bearer {ADMIN_SECRET}
```

---

## ❓ 常见问题

### Q: 部署后访问 /admin 显示 404？
A: 检查 `wrangler.toml` 中的路由配置是否正确，确保 Workers 已正确绑定域名。

### Q: 登录时提示"密钥无效"？
A: 确认 `ADMIN_SECRET` 环境变量已正确配置，且登录时输入的密钥与配置完全一致。注意默认密码是 `hwdemtv`（测试环境）。

### Q: 如何修改管理员密码？
A: 修改 `wrangler.toml` 中的 `ADMIN_SECRET` 变量，然后重新部署：`npx wrangler deploy src/index.ts`

### Q: 忘记管理员密码怎么办？
A: 由于密码存储在 Cloudflare Workers 环境变量中，无法直接找回。请按以下步骤重置：

**方案一：查看配置文件**
```bash
# 查看项目根目录的 wrangler.toml
cat wrangler.toml | grep ADMIN_SECRET
```

**方案二：重置密码并重新部署（推荐）**
```bash
# 1. 生成新密码
openssl rand -base64 32

# 2. 编辑 wrangler.toml，修改 ADMIN_SECRET
[vars]
ADMIN_SECRET = "your-new-secure-password"

# 3. 重新部署
npx wrangler deploy src/index.ts

# 4. 使用新密码登录
```

> ⚠️ **注意**：如果同时忘记了 `wrangler.toml` 中的密码且无法找回，只能通过重置密码的方式恢复访问。

### Q: 如何迁移到新的 Workers 实例？
A: 使用管理后台的「导出」功能导出所有卡密，然后在新实例中使用「导入」功能导入数据。

### Q: C端用户无法解绑设备？
A: 检查 `/portal` 页面的 IP 频控设置，确认用户未触发防滥用机制。

> 💡 正常用户几乎不会触发此限制。如遇限制，请更换网络环境（切换IP）后重试。

---

## ⚖️ 开源协议
MIT

---

- [x] **高性能分页重构**：已完成服务端 D1 游标分页，支持万级数据秒开。
- [x] **智能 CSV 逆向导入**：已支持直接导入 Excel 报表并自动解构维度。
- [x] **卡密在线分发 Webhook**：已全自动对接第三方个人发卡网或聚合支付网关，内置纯文本返回引擎，实现发卡网对接零门槛。
- [x] **边缘动态配置树**：后台彻底抛弃了 `.env` 硬编码魔咒，现在可以在浏览器内直接操作配置中心动态拨配 `SystemConfig`，实现配置的热拔插加载！
- [x] **安全与性能加固补丁 (Phase 19 已完成)**：完成了前后台潜在 XSS 漏洞的深度排雷（HTML 安全转义）；并为系统级的防刷限流器 (Rate Limiter) 引入了惰性清理回收机制，解决极端高并发下的内存隐患。
- [x] **定制化风控与单卡特权 (Phase 20 已完成)**：新增基于 JWT 签发维度的单卡专属脱机免联特权设置，支持随时在管理端一键下发长达数年的离线授权 Ticket。
- [x] **基础设施与可观测性升级 (Phase 21 - 已完成)**：架构底层全面跃升。
  - **极致性能**：在 Node 环境下强制注入 WAL 模式及高性能 PRAGMA (Synchronous, CacheSize)，极大提升高并发承载能力。
  - **安全加固 (CORS)**：实现自适应防御，生产环境下未授权跨域请求自动阻断，预防 CSRF 攻击。
  - **质量保障 (Vitest)**：引入冒烟测试框架，建立 `/verify` 与 `/unbind` 核心逻辑回归测试套件，确保业务稳定性。
  - **异常监控**：实装 `error-reporter` 全局中间件，捕获未捕获异常并输出结构化日志。
- [x] **Webhook 全动态化 & 精细化风控 (Phase 22 - 已完成)**：
  - **密钥热轮换**：Webhook 密钥已迁移至 `SystemConfig`，支持后台零重启动态更新，兼容 `.env` 回退。
  - **行为降权风控**：实装 24h 高频设备切换监测逻辑，对异常行为自动递增 `risk_level` 并实施拦截。
  - **设备指纹增强 (Alpha)**：已在 `schema.sql` 预留指纹字段，并输出 [设备指纹开发指南](file:///d:/Obsidian%E6%8F%92%E4%BB%B6/hw-license-center/docs/device-fingerprint-guide.md)。
- [ ] **多租户与组织管理架构 (Phase 23 - 待定)**：探索支持多软件/多团队独立管理的隔离方案，为 SASS 化做准备。
