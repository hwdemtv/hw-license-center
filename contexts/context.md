# 项目核心上下文 (Project Context)

## 1. 项目定位
`hw-license-center`（互为卡密中心）是一个全栈卡密管理系统，专为轻量级软件授权、设备绑定和自主解绑量身定制。它采用双栖架构设计，可无缝运行在 **Cloudflare Workers (D1)** 和 **私有 VPS (better-sqlite3)** 环境中。

## 2. 核心架构
- **后端框架**: Hono (极轻量，原生支持 Service Worker 与 Node.js)。
- **存储方案**: 
  - 生产环境 (CF): Cloudflare D1 (全球分布)。
  - 私有环境 (Node.js): SQLite + WAL (极致 I/O 调优)。
- **鉴权体系**: 
  - 设备端: JWT (HS256) 签名验证。
  - 管理端: Bearer Token (静态密钥) + Web 通信自适应鉴权。
- **UI 风格**: Glassmorphism + Dark Mode 现代极简设计，原生 Vanilla JS 实现。

## 3. 关键业务逻辑
- **设备绑定 (Verify)**: 设备通过 UUID、机器码等指纹进行卡密绑定。支持单码多设备配额。
- **自主解绑 (Portal)**: C 端用户可凭卡密登录门户查看绑定的设备（脱敏显示），并消耗每月配额进行自助强制取消授权。
- **离线特权 (Offline Privilege)**: 支持对特定卡密下发长效 JWT，允许设备在数年内无需联网即可运行（适于 Obsidian 插件等场景）。
- **动态配置 (Dynamic Config)**: 管理后台可动态调整系统参数（如 Webhook 密钥、限流次数、门户风格等），即刻生效无需重启。

## 4. 安全规范 (Security)
- **多级防刷**: 内置 Rate Limiter 中间件，支持基于 `setInterval` 的定时主动 GC。
- **XSS 防护**: 严格执行 API 脱敏 + 前端 `escapeHTML` 转义，重点保护设备名等外部输入。
- **环境隔离**: 生产环境下自动阻断所有非白名单 CORS 来源。

## 5. 项目状态与演进 (v22+)
- [x] Webhook 发卡全自动化。
- [x] 服务端游标级分页。
- [x] 边缘 D1 & 本地 SQLite 兼容适配器。
- [x] 第一阶段代码质量与安全审计修复。
- [ ] 中长期目标: 自动化容灾备份，SaaS 化多租户改造。
