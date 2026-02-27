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

**数据库结构：**
- `licenses` - 卡密主表（存储激活码、状态、配额等）
- `license_devices` - 设备绑定表（存储设备ID、名称、最后活跃时间）
- `products` - 产品配置表（存储产品ID、名称、卡密前缀）

完整表结构见项目根目录的 `schema.sql` 文件。

### 3. 本地开发
```bash
npm install
npm run dev
```

### 4. 生产部署
```bash
npx wrangler deploy src/index.ts
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

#### 1. **频率限制**（核心防护）

系统采用**固定窗口计数器**限流机制，基于**IP地址**独立计算（非激活码级别）：

**每分钟限制（严格）：**
- **查询限制**：每个IP每60秒最多查询5次设备列表
- **解绑限制**：每个IP每60秒最多解绑5台设备
- **触发后果**：超过限制后需等待60秒冷却时间

**重要说明：**
- ⚠️ 限制基于**IP地址**，不是**激活码**
- ✅ 同一IP使用不同激活码解绑，共享5次/分钟的额度
- ✅ 不同IP使用同一激活码解绑，各自拥有5次/分钟的额度
- ✅ **无月度累计限制** - 限制仅按每分钟独立计算

**激活码级限制（防滥用）：**
- 每个激活码每月最多解绑10次（防止无限轮换设备）
- 达到上限后需联系管理员或等待下月重置

**举例说明：**
- 场景1（同一IP）：
  - IP `192.168.1.1`用激活码A解绑5台 → 需等待60秒才能继续解绑
  - 期间用激活码B解绑 → 也会触发限制（共享IP额度）

- 场景2（不同IP）：
  - IP `192.168.1.1`用激活码A解绑5台 → 需等待60秒
  - IP `192.168.1.2`用激活码A解绑5台 → 可立即解绑（不同IP独立计算）

- 场景3（等待重置）：
  - 13:00:00-13:01:00 解绑5台 → 13:01:00后可继续解绑
  - 13:01:00-13:02:00 再解绑5台 → 以此类推

#### 2. **设备名称脱敏**
- 设备名称自动打星号处理（如：`My-iPhone` → `My-*****`）
- 防止敏感信息泄露，保护用户隐私

#### 3. **卡密状态校验**
- 仅 `active`（活跃）状态的卡密可查询和解绑
- `revoked`（已吊销）卡密无法使用门户功能

#### 4. **无密码设计**
- 无需账户密码，仅凭卡密即可访问
- 降低使用门槛，方便C端用户操作

#### 5. **IP级防护**
- 限制基于IP地址计算，防止单用户恶意刷接口
- 不同IP有独立的限制计数器

> 💡 **温馨提示**：正常用户很少会超过这些限制，如频繁触发限制请检查是否有异常操作或联系管理员。

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
- `GET /api/v1/auth/admin/licenses` - 获取所有卡密列表
  - Headers: `Authorization: Bearer {ADMIN_SECRET}`
  - 响应：`{ success, data: [...] }`

- `GET /api/v1/auth/admin/licenses/:key/devices` - 查询指定卡密的设备详情
  - Headers: `Authorization: Bearer {ADMIN_SECRET}`
  - 响应：`{ success, data: [...] }`

- `POST /api/v1/auth/admin/generate` - 批量生成卡密
  - Headers: `Authorization: Bearer {ADMIN_SECRET}`
  - 请求体：`{ count, max_devices, duration_days, product_id, user_name }`
  - 响应：`{ success, keys: [...] }`

详细参数请参考 `src/index.ts` 源码。

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

### Q: C端用户1个月内可以解绑几次设备？
A: **无月度累计限制**，但有基于IP的频率限制：

**重要前提：限制基于IP地址，不是激活码**
- 同一IP使用不同激活码解绑，共享5次/分钟的额度
- 不同IP使用同一激活码解绑，各自拥有5次/分钟的额度

**限制规则：**
- **时间窗口**：每60秒（1分钟）独立计算
- **解绑上限**：每个IP每60秒最多解绑5台设备
- **重置机制**：60秒窗口结束后自动恢复5次额度

**实际场景：**
- 场景1（同一IP）：IP `192.168.1.1`用激活码A解绑5台 → 需等待60秒才能继续（即使换激活码B也受限制）
- 场景2（不同IP）：IP `192.168.1.1`解绑5台后，IP `192.168.1.2`可立即解绑5台（不同IP独立计算）
- 场景3（正常用户）：每月解绑1-3次，完全不会触发限制

**为什么会有这个限制？**
- 防止恶意用户通过单个IP批量解绑设备
- 保护系统不被滥用
- 防止接口被恶意刷流量

> 💡 正常用户几乎不会触发此限制。如遇限制，请检查是否有异常操作，或更换网络环境（切换IP）后重试。

---

## ⚖️ 开源协议
MIT

---

## 📅 Roadmap (未来规划)

- [ ] **卡密在线分发 Webhook**：计划通过新增安全的 `/api/v1/auth/webhook/pay` 接口，结合 HMAC 安全验签与订单防重放拦截，全自动对接第三方个人发卡网或聚合支付网关（如独角兽、知宇等），实现“客户打款 -> 回调入库产卡 -> 原路回传提卡”的 0 人工干预自动售卡闭环。
- [ ] **更精细的风控系统**：基于设备指纹演化更严格的滥防探测机制，对异常频繁上下线的卡密执行降权预警。
