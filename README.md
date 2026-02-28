# hw-license-center (互为卡密中心)

这是由 **hwdemtv** 团队精心打造的一套基于 **Cloudflare Workers (D1)** 与 **Node.js (Better-SQLite3)** 双栖架构的轻量级、高安全且易于部署的软件激活码（卡密）认证中控系统。

---

## 🌟 核心特性 (v22+)

### 🚀 极致性能
- **双栖架构部署**：原生支持边缘计算 (Serverless) 与私有 VPS (Node.js) 零代码变动迁移。
- **存储吞吐优化**：
  - **CF 边缘端**：基于 Cloudflare D1 分布式数据库，全球低延迟响应。
  - **私有 VPS 端**：深度调优 SQLite WAL 模式，注入 `Normal` 级同步与 64MB 页缓存，读写吞吐提升 300%。
- **服务端游标分页**：针对超大规模卡密资产，实现游标级服务端分页，告警数据秒级加载，杜绝内存阻塞。

### 🔐 严丝合缝的安全防御
- **安全加固 (Defense in Depth)**：
  - **XSS 彻底脱雷**：所有外部输入（如设备名）均经过 API 层脱敏（掩码显示）与前端层 `escapeHTML` 净化，彻底封死 XSS 注入路径。
  - **自适应限流器**：内置频率防御墙。Node 环境下支持基于 `setInterval` 的主动垃圾回收 (GC)，确保存储 Map 绝不产生内存泄漏。
  - **CORS 生产级拦截**：自适应环境识别。生产环境下未授权跨域请求自动全量阻断，从协议层防御 CSRF 风险。
- **JWT 原子校验**：基于 HS256 签名的设备 Token 验证。支持 **Offline Privilege (单码离线特权)**，支持一键下发长达数年的离线免联授权 Ticket。

### 📡 互联与动态控制
- **Webhook 发卡全动态化**：后台支持可视化配置 Webhook 密钥，实时热更新生效，完美适配第三方个人发卡网或聚合支付网关。
- **配置热拔插中心**：彻底告警 `.env` 重启魔咒。从解绑额度限制到门户页面标题、公告乃至客服联系方式，均可在「系统设置」面板秒级在线调整。
- **设备指纹识别 (Alpha)**：内置设备指纹存储字段，支持拦截 24h 内高频设备迁移行为并自动触发风控降权。

### 🛠️ 管理与 UX
- **沉浸式 Batch Bar**：独创底部悬浮批量控制栏，支持对数万资产进行一键锁定、强杀、扩容与吊销。
- **智能数据流转**：支持带有正则解构能力的 CSV 智能导入，完美闭环 Excel 报表资产迁移。
- **C端自助解绑门户**：提供极简风格的 `/portal` 门户，用户凭卡密即可自助断开旧机授权，释放配额。

---

## 🛠️ 技术栈
- **核心框架**: [Hono](https://hono.dev/)
- **逻辑层**: TypeScript
- **数据库隔离层**: 自研 **DBAdapter** (D1 / Better-SQLite3)
- **UI 引擎**: Vanilla JS + CSS Grid (零依赖、零由于)
- **部署工具**: Wrangler / PM2 / Docker

---

## 🚀 快速开始

### 情况 A：部署到 Cloudflare Workers (推荐)
1. 安装依赖：`npm install`
2. 初始化 D1：`npx wrangler d1 create hw-db`
3. 执行架构同步：`npx wrangler d1 execute hw-db --remote --file=./schema.sql`
4. 部署服务：`npx wrangler deploy`

### 情况 B：部署到私有服务器 (Node.js VPS)
1. 环境变量：配置 `.env` 包含 `ADMIN_SECRET` 与 `JWT_SECRET`。
2. 数据库：执行 `mkdir -p .wrangler/... && sqlite3 db.sqlite < schema.sql`。
3. 生产打包：`npm run build:node`。
4. 守护启动：`pm2 start dist/server.js --name "km-center"`。

> 📘 详细文档参考：[双栖部署指南 (DUAL_DEPLOYMENT.md)](./DUAL_DEPLOYMENT.md)

---

## 📄 API 生态概览

| 作用域 | 端点 | 说明 |
|---|---|---|
| **鉴权** | `POST /api/v1/auth/verify` | 设备首次验证与 Token 签发 |
| **门户** | `GET /api/v1/auth/portal/devices` | C端获取脱敏设备清单 |
| **解绑** | `POST /api/v1/auth/unbind` | 自助或管理员强制解绑 |
| **发卡** | `POST /api/v1/auth/webhook/pay` | 适配自动发卡网的入库 Webhook |
| **管理** | `GET /api/v1/auth/admin/licenses` | 管理后台分页获取全量资产 |

---

## 🛤️ 路线图 (Roadmap)
- [x] **Phase 1-20**: 核心功能原型、JWT 系统、动态配置、Webhook。
- [x] **Phase 21-25**: 基础设施升级 (WAL/Vitest/Error Reporter)、UI 重构、批量操作。
- [x] **Phase 26**: 代码全面审计与安全修复 (XSS & RateLimiter GC)。
- [ ] **Phase 27 (近期)**: 自动化容灾备份至 S3/R2，补全 API 审计日志。
- [ ] **Phase 28 (展望)**: 引入图表可视化分析大屏，多租户 SaaS 架构支持。

---

## ⚖️ 开源协议
MIT License - **hwdemtv** 荣誉出品。


