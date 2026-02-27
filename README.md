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
  - **高性能管理**：**全面实施服务端游标分页**，支持万级卡密秒开不卡顿。
  - **多维检索**：支持按用户名、卡密、产品 ID、状态（活跃/吊销/临期）及多种排序规则。
  - **资产导入导出**：支持 CSV/JSON 双格式导出，支持 Excel 报表智能逆向导入。
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
- `Licenses` - 卡密主表（存储激活码、状态、配额等）
- `Devices` - 设备绑定表（存储设备 ID、名称、最后活跃时间）
- `Subscriptions` - 订阅详情表（存储卡密对应的各产品有效期）

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

> 💡 正常用户几乎不会触发此限制。如遇限制，请更换网络环境（切换IP）后重试。

---

## ⚖️ 开源协议
MIT

---

- [x] **高性能分页重构**：已完成服务端 D1 游标分页，支持万级数据秒开。
- [x] **智能 CSV 逆向导入**：已支持直接导入 Excel 报表并自动解构维度。
- [ ] **卡密在线分发 Webhook**：计划通过新增安全的 `/api/v1/auth/webhook/pay` 接口，全自动对接第三方个人发卡网或聚合支付网关（如独角兽、知宇等），实现自动售卡闭环。
- [ ] **更精细的风控系统**：基于设备指纹演化更严格的滥防探测机制，对异常频繁上下线的卡密执行降权预警。
