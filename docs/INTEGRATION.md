# 互为卡密中心 - 开发者接入指南

## 一、概述

“互为卡密中心 (hw-license-center)” 是一套极致轻量、通用化的 **一码多产品 (All-in-One)** 鉴权系统。

无论你是开发 **桌面软件**、**Obsidian 插件**、**Web 网站** 还是 **App**，都无需在服务端进行任何配置修改。你只需要在你的客户端工程中，发送 HTTP 请求对返回数据进行校验即可。

---

## 二、基础接入流程 (API 校验)

### 1. 明确你的「产品 ID」
不需要在数据库预先注册，前端生成卡密时可以直接填入，例如：
* `my-desktop-app`
* `obsidian-plugin-pro`

### 2. 客户端构造 `/verify` 请求

你需要从用户处获取**激活码 (License Key)**，并自动提取/生成**设备标识 (Device ID)**。
设备标识可是：MAC地址、主板序列号，或首次运行生成的随机 UUID。

### 请求格式

```http
POST https://your-worker-domain.workers.dev/api/v1/auth/verify
Content-Type: application/json

{
  "license_key": "YOUR-LICENSE-KEY",
  "device_id": "UNIQUE-HARDWARE-ID",
  "device_name": "DESKTOP-PC-NAME" // 可选，建议上报如 platform.node() 获取的计算机名，方便在后台查看和管理
}
```

### 3. JavaScript / TypeScript 代码示例 (基础版)

```typescript
const LICENSE_SERVER = "https://your-worker-domain.workers.dev";
const MY_PRODUCT_ID = "my-awesome-app"; // 你为当前软件设定的专有产品标识

async function verifyLicense(key: string, deviceId: string) {
  try {
    const res = await fetch(`${LICENSE_SERVER}/api/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key, device_id: deviceId }),
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 1. 查找数组中是否包含我这个软件的授权
      const myProduct = data.products?.find((p: any) => p.product_id === MY_PRODUCT_ID);
      
      if (myProduct && myProduct.status === 'active') {
        // ✅ 授权通过！
        console.log("软件已激活！");
        
        // （可选）如果不是永久版，提醒用户到期时间
        if (myProduct.expires_at) {
          const expireDate = new Date(myProduct.expires_at);
          console.log(`有效期至: ${expireDate.toLocaleDateString()}`);
        }
        
        return true; 
      } else {
        // ❌ 卡密有效，但当前产品不在可用订阅期内
        console.warn("未购买本产品的订阅或订阅已过期");
        return false;
      }
    } else {
      // ❌ 卡密失效/封禁/设备超限等
      console.warn("验证失败: " + data.msg);
      return false;
    }
  } catch (err) {
    console.error("网络错误", err);
    return false;
  }
}
```

---

## 三、高级安全防篡改 (Offline Jwt 效验)

为了防止破解者通过修改本地 HOSTS 或抓包篡改 HTTP 请求（将 `{"success": false}` 改成 `{"success": true}`），**强烈建议在本地执行轻量级的 JWT (JSON Web Token) 校验**。

接口返回的 Payload 包含：
```json
{
  "success": true,
  "msg": "验证通过...",
  "products": [...],
  "token": "eyJhbGciOi...", 
  "server_time": "2026-02-23T15:00:00.000Z"
}
```

### 客户端响应处理与安全建议

1.  **缓存 Token**：服务端返回的 `token` 是一段带有短期有效期的 JWT，仅包含核心身份信息（如 `license_key`, `device_id`, `exp` 等）。由于没有 Secret，客户端只需通过 base64 解析验证其 `exp`（是否在保活期内）和 `device_id`（防直接拷贝配置文件篡改）。
2.  **区别双重失效期**
    *   **临时保活期（JWT 的 `exp`）**：这是设备允许离线运行的最长宽限期（例如 30 天）。即使产品的包年权限还有十年，离线断网 30 天后也会强制要求联网刷新 Token。
    *   **产品长期授权（`products[i].expires_at`）**：这是用户真正购买的产品到期时间（UI展示用）。客户端在联网激活成功时，应将本产品的 `expires_at` 和服务端的 `server_time` 随同 Token 一并落盘缓存，以便后续离线断网时也能向用户展示准确的总订阅到期日期。
3.  **防倒推篡改**：不要在客户端写入任何硬编码的校验逻辑，只验证这枚缓存票据的有效性。建议客户端同时对比一次线上 NTP 时间或 API 刚返回的 `server_time`。
4.  **一码通多产品**：您可以指定产品代码（如：`zenclean`）。`/verify` 返回的 `products` 数组内记录了各产品的到期日。通过过滤此数组对应的 `product_id` 及其 `status === 'active'` 即表示具备指定软件使用权限。

### 2. Node.js / Obsidian 防篡改示例

由于 JWT 严重依赖 Secret Key，如果要在防篡改方面进一步增强，推荐使用**非对称加密 (RSA/ECDSA)**，即：后端持有私钥签名，客户端内置公钥仅验签。（目前系统使用的是极简的 MockSignature，如果是高商业价值软件，请通过 `jwt-verify` 等工具增强这一环节逻辑）。

---

## 四、解除绑定 (解绑设备)

如果用户重装系统或换电脑，需要在原电脑调起 `unbind` 接口释放设备数量。

**请求格式：**
```http
POST https://your-worker-domain.workers.dev/api/v1/auth/unbind
Content-Type: application/json

{
  "license_key": "YOUR-USER-KEY",
  "device_id": "DEVICE-UNIQUE-ID"
}
```

**响应：**
```json
{
  "success": true,
  "msg": "设备解绑成功"
}
```
解绑成功后，应同步清除客户端本地缓存的 Token 等越发鉴权信息。

---

## 五、AI 代理网关接入 (BFF AI Proxy)

### 1. 架构说明

互为卡密中心内置了一套 **AI 后端转发网关 (Backend for Frontend)**。客户端无需持有任何大模型 API Key，只需复用已激活时获得的 **JWT Token** 作为凭证，即可安全地通过本网关调用大模型服务。

**核心流程：**
```
客户端 (ZenClean等)
  │  携带 JWT Token
  ▼
hw-license-center 网关 (/api/v1/ai)
  ├── 1. JWT 鉴权校验
  ├── 2. 每日额度检查 & 跨日自动重置
  ├── 3. 注入隐藏的 API Key，转发至大模型
  ├── 4. SSE 流式透传响应
  └── 5. 原子扣减当日已用额度
```

**安全优势：**
- 客户端永远拿不到真正的大模型 API Key
- 每个卡密有独立的每日调用额度上限
- 管理员可随时在后台关闭网关总开关

### 2. Chat Completions 请求

本网关**完全兼容 OpenAI SDK 协议**，客户端只需替换 Base URL 和 Authorization：

```http
POST https://your-worker-domain.workers.dev/api/v1/ai/chat/completions
Content-Type: application/json
Authorization: Bearer <激活时获得的 JWT Token>

{
  "model": "glm-4-flash",
  "messages": [
    {"role": "system", "content": "你是一个有用的助手。"},
    {"role": "user", "content": "你好，请介绍一下自己。"}
  ],
  "stream": true
}
```

> **注意：** `model` 字段可省略，此时自动使用管理员在后台设置的默认模型。

**成功响应（非流式）：**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [{ "message": { "role": "assistant", "content": "你好！..." } }]
}
```

**成功响应（流式 SSE）：** 逐帧透传大模型的 `data: {...}` 事件流。

**额度用尽响应 (429)：**
```json
{
  "success": false,
  "msg": "今日 AI 调用额度已用完 (50/50)，请明日再试",
  "code": "QUOTA_EXCEEDED"
}
```

响应头中会附带 `X-AI-Quota-Remaining` 字段，表示本次请求后的剩余额度。

### 3. 查询剩余额度

```http
GET https://your-worker-domain.workers.dev/api/v1/ai/quota
Authorization: Bearer <JWT Token>
```

**响应：**
```json
{
  "success": true,
  "quota": {
    "daily_limit": 50,
    "used_today": 12,
    "remaining": 38
  }
}
```

### 4. Python 客户端代码示例

由于网关完全兼容 OpenAI SDK，Python 客户端的改动极其简单：

```python
from openai import OpenAI

# 只需替换两个参数
client = OpenAI(
    base_url="https://your-worker-domain.workers.dev/api/v1/ai",
    api_key="<本地缓存的 JWT Token>",  # 直接用激活时拿到的 Token
)

response = client.chat.completions.create(
    model="glm-4-flash",  # 可省略，默认使用后台配置
    messages=[
        {"role": "user", "content": "帮我分析一下系统里的垃圾文件"}
    ],
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### 5. 额度管理

| 配置层级 | 说明 | 操作位置 |
|----------|------|----------|
| **全局默认** | 所有卡密共享的默认每日额度 | 后台 → ⚙️ 系统设置 → 🤖 大模型 AI 代理网关 |
| **单卡专属** | 为VIP用户单独配置更高额度 | 后台 → 🛠️ 资产管理 → 勾选卡密 → 🤖 配置专属 AI 额度 |

**优先级：** 单卡专属额度 > 全局默认额度。留空单卡配置则自动退化为全局值。

