# Webhook 自动发卡网关对接指南

## 1. 概述
本系统的 Webhook 接口 (`/api/v1/auth/webhook/pay`) 旨在实现与第三方支付平台或发卡网的自动化闭环。当外部系统触发支付成功回调时，本接口可实时生成卡密并存入数据库。

---

## 2. 兼容平台类型
本接口采用通用 JSON 协议，理论上支持所有具备“自定义 Webhook”功能的平台：

- **发卡系统**：独角数卡 (Duojiaoka)、ZFAKA、琪琪发卡等主流开源/商业系统。
- **支付平台**：易支付 (Epay)、码支付、虎皮椒、彩虹易支付等支持异步回调的网关。
- **自动化工具**：Telegram Bot, Discord Webhook, 宝塔定时任务等。

---

## 3. 接口规范

### **端点地址**
`POST https://<your-domain>/api/v1/auth/webhook/pay`

### **身份验证**
支持两种方式（密钥在管理后台 `System Settings` 中设置）：
1. **Header**: `Authorization: Bearer <WEBHOOK_SECRET>`
2. **Query**: `?token=<WEBHOOK_SECRET>`

### **请求参数 (JSON Body)**
| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `product_id` | String | 是 | 对应 Licenses 表中的产品标识 |
| `count` | Number | 否 | 生卡数量 (默认 1, 上限 50) |
| `max_devices` | Number | 否 | 单卡允许的最大设备数 (默认 2) |
| `duration_days`| Number | 否 | 授权天数 (不传则为永久有效) |
| `out_trade_no` | String | 否 | 外部订单号 (将作为 user_name 记录在库中) |

---

## 4. 响应适配

### **标准 JSON 返回**
```json
{
  "success": true,
  "msg": "success",
  "order_no": "EXTERNAL_ORDER_123",
  "keys": ["KEY-AAAA", "KEY-BBBB"],
  "text_result": "KEY-AAAA\nKEY-BBBB"
}
```

- **`text_result`**: 专门适配某些仅能提取单一文本字段或要求换行格式的传统发卡网。

---

## 5. 对接小技巧
1. **测试模式**：建议先使用 Postman 或 API 调试工具携带 `token` 测试联通性。
2. **格式转换**：如果你的支付平台仅支持 `form-data` 格式，建议使用一个简单的中转脚本或修改 `src/routes/webhook.ts` 中的解析逻辑。
3. **安全性**：请务必在生成环境使用 32 位以上的复杂随机字符串作为 `WEBHOOK_SECRET`。
