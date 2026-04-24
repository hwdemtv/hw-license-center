# 客户案例：TiebaMecha (Python/Flet 桌面端) 接入指南

本指南展示了 **TiebaMecha (贴吧机甲)** 项目如何接入 `hw-license-center` 授权体系。这是一个基于 Python 和 Flet 框架的自动化办公工具，具有多节点容灾、硬件指纹识别及系统广播同步等核心特性。

---

## 1. 核心配置信息

在 TiebaMecha 的接入逻辑中，使用了以下预设参数：

| 映射项 | 配置值 | 说明 |
| :--- | :--- | :--- |
| **Product ID** | `tieba_mecha` | 所有的卡密必须包含此产品订阅 |
| **User-Agent** | `TiebaMecha-Client/2.0` | 建议在 Header 中携带，方便后端日志审计 |
| **API Endpoint** | `/api/v1/auth/verify` | 核心校验路径 |
| **默认服务器** | `km.hwdemtv.com` | 系统内置了三条容灾线路 |

## 2. 硬件指纹 (HWID) 实现

TiebaMecha 采用以下逻辑生成唯一的设备指纹，确保单机授权：

```python
import hashlib
import subprocess

def get_hwid():
    # 提取主板序列号和 CPU ID
    cmd_board = 'powershell -Command "Get-CimInstance Win32_BaseBoard | Select-Object -ExpandProperty SerialNumber"'
    cmd_cpu = 'powershell -Command "Get-CimInstance Win32_Processor | Select-Object -ExpandProperty ProcessorId"'
    
    # 执行并截取输出...
    raw_id = f"{res_board}-{res_cpu}"
    
    # 使用 SHA256 混淆并截取前 32 位
    return hashlib.sha256(raw_id.encode()).hexdigest()[:32].upper()
```

## 3. 请求策略

### A. 授权验证 (Active Mode)
用户在 UI 界面手动点击“立即验证”时触发。此模式下，如果卡密是首次在该机器使用，服务端将执行设备绑定。

```json
{
  "license_key": "XXXX-XXXX",
  "device_id": "HWID_32_CHARS",
  "product_id": "tieba_mecha",
  "mode": "active" 
}
```

### B. 系统广播同步 (Silent Mode)
后台守护进程每小时执行一次。使用 `mode: silent` 确保请求是“只读”的，不会因为设备未绑定而报错（如果未激活），主要用于获取返回对象中的 `notification` 字段。

```json
{
  "license_key": "", // 可为空，获取全局广播
  "device_id": "HWID_32_CHARS",
  "mode": "silent"
}
```

## 4. 多产品订阅解析 (API Response)

由于后端返回的是 `products` 数组，TiebaMecha 采用以下方式判定 Pro 权限：

```python
def is_pro_active(response_data):
    products = response_data.get("products", [])
    # 遍历订阅列表，寻找匹配且激活的项
    for p in products:
        if p.get("product_id") == "tieba_mecha" and p.get("status") == "active":
            return True
    return False
```

## 5. 容灾探测逻辑

TiebaMecha 实现了多路径探测，代码逻辑如下：
1. **用户自定义 URL**（若设置页面填写了私有服务器）。
2. **边缘节点 (Workers)**：`hw-license-center.hwdemtv.workers.dev`。
3. **主控节点**：`km.hwdemtv.com`。

这种设计保证了即使主域名被墙或解析异常，软件依然能通过 Workers 完成授权校验。

## 6. 技术踩坑与最佳实践

### A. Cloudflare Bot 防护 (Error 1010)
如果后端部署在 Cloudflare 上，原生连接类库（如 Python 的 `aiohttp` 或 `urllib`）的默认 User-Agent 会被识别为恶意爬虫并直接被边缘节点拦截。
- **解决方案**：在请求头中伪装浏览器身份。
```python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json"
}
# 在创建 session 时统一挂载
async with aiohttp.ClientSession(headers=headers) as session:
    ...
```

### B. 404 状态码的业务处理
本系统的后端将“查无此激活码”定义为 `HTTP 404`。
- **注意**：客户端不应看到 404 就直接报错“服务器挂了”。
- **正确做法**：判断响应的 `Content-Type` 是否为 `application/json`。如果是，则解析其中的 `msg` 字段（如返回“激活码无效”），并向用户展示真实的业务反馈。
