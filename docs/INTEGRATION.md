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

## 四、离线免联架构下的解绑延迟与静默降级处理

这个问题的根本原因是：**本地按权有效期免联网运行机制（也就是离线 JWT 校验） 与云端动态解绑/禁用等状态变更之间产生了数据不同步。** 

以下是针对这个问题的完整处理思路与方法总结，强烈建议所有采用离线验证策略的客户端开发者参考。

### 1. 现象分析

*   **原有逻辑：** 客户端在“VIP 激活”功能中，当首次校验激活码通过后，只会把服务器下发的 JWT Token 凭证缓存到本地。
*   **启动时校验：** 每次启动程序时，单纯依靠 `check_local_auth_status()` 等类似方法读取本地 JWT Token，解析其携带的有效时间 (`exp`) 和设备信息。只要本地校验期内是有效的且设备 ID 匹配，直接将应用设定为 VIP 激活状态。
*   **导致的问题：** 当管理员或用户在云端后台强制“解绑”某台设备、或封禁某个激活码时，由于旧版逻辑只做本地签名时间的有效验证，并不发起网络校验，客户端无法及时感知到状态变更，变成“断网式白嫖”，继续维持 VIP 状态。

### 2. 结论建议：双管齐下的“柔性降级”组合拳 (最佳实践)

为了在支持“断网依然能正常享受本地特权”的同时又能处理“设备被解绑/踢下线”的情况，我们推荐采用以下这套**双管齐下**的最佳实践方案：

#### 方案 A：宏观兜底 (慢速心跳轮询)
*   **做法**：在客户端后台开启一个极低频率的定时器（推荐每 30~60 分钟一次）。
*   **目的**：解决用户长时间挂机不关软件导致的 UI 状态滞留问题。即使不操作任何功能，最多在 1 小时内，客户端会通过后台探活识别到吊销状态并主动销毁本地缓存，确保界面最终状态的准确性。

#### 方案 B：微观拦截 (智能事件驱动探活)
*   **做法**：在任何消耗云端资源或 VIP 特权的“关键动作”按钮点击处（如“开始 AI 扫描”、“执行云端清理”），前置执行一次轻量化校验，或者直接利用业务接口本身的 403 报错返回值。
*   **目的**：这是真正的“脱马甲时刻”。不依赖定时器，在用户尝试使用收费/特权功能的那一毫秒，系统会瞬间识别到身份失效，当场中止操作并触发降级，从而坚决捍卫核心资产不被白嫖。

### 3. 具体改造步骤

*   **第一步：补充和持久化缓存 `license_key`**
    仅仅靠 JWT Token 无法主动向服务器查询激活码自身是否仍然有效。所以需要修改本地令牌读写方法（如 `_save_local_token` 和 `_load_local_token`），将用户输入的 `license_key` 跟随 Token 一并加密存储到本地配置文件中。

*   **第二步：判定降级与反馈拦截 (防破窗判别)**
    针对 `/verify` 探活返回，务必区分失败原因。只有**明确的业务拒绝**（如服务端返回 403 停用、404 不存在等）才触发强力降级；网络波动等技术故障应由客户端离线策略进行容错保活。

    > [!IMPORTANT]
    > **⚠️ 解绑与封禁的区别**：由于系统支持“自动无感绑定”，在后台仅仅点击“解绑”设备可能导致旧设备在探活时被当作新用户自动重新激活。要真正彻底踢人下线，请务必在后台将激活码状态设为**【停用 / 吊销 / 封禁】**。

*   **第三步：补充异常链清理 (防解构破窗)**
    注意全链路兼容。如果底层方法返回值由 2 个增加到 3 个，请一并检查如 `cloud_engine.py` 等下游消费模块，使用 `token, _, _` 等方式安全解构，防止程序崩溃导致授权逻辑产生副作用。

*   **第四步：补充异常链清理 (防代码破窗)**
    *注意重构基础依赖时的连锁反应*。以 Python 为例，因为修改了基础层的返回值由 `(token, backend_expires_at)` 2 个变为了 `(token, backend_expires_at, license_key)` 3 个，这极易触发依赖它的其他下游模块（例如负责拦截的 `cloud_engine.py`）解包报错（如 `ValueError: too many values to unpack`）。
    因此，修改了底层核心返回值后，顺带需要把全链路所有读取该缓存的方法调用处的返回值解构进行补齐（例如将下游接收处改为 `token, _, _` 忽略未使用的尾部参数）。

### 3. 主动解除绑定 (客户端自行换机解绑)

如果用户需要重装系统或主动换电脑，应当在原电脑提供一个入口，调起 `unbind` 接口释放该激活码绑定的当前设备。

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
> **注意：** 客户端在收到主动解绑成功的响应后，**必须同步立即清除自身本地缓存的所有授权文件**，恢复为未激活状态，否则同样会陷入未发起网络校验而出现的“本地伪激活”假象。

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

### 2. Chat Completions 请求 (原生 HTTP)

本网关**完全兼容 OpenAI 标准协议**。如果您是直接发起原生 HTTP 请求（如使用 `fetch`、`requests`），请注意真实的完整端点路径包含 `/chat/completions` 后缀：

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

# ⚠️ 注意后缀的区别！对于 OpenAI 官方 SDK：
# SDK 会自动在末尾帮你补全 "/chat/completions"
# 所以这里的 base_url 只需要填到 "/ai" 即可，千万不要多写！
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

