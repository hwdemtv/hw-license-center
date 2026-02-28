# 设备指纹增强风险控制 (Phase 22b) 开发者指南

## 1. 背景与目标
当前系统仅依赖客户端生成的 `device_id` (UUID) 进行绑定。为防止用户手动清除缓存或伪造 UUID 绕过设备绑定限制，我们需要建立**服务端复合指纹校验**机制。

## 2. 客户端改造 (Obsidian 插件)
在调用 `/verify` 接口时，需在 Payload 中新增 `fingerprint_raw` 对象。

### 建议采集维度
- `platform`: 操作系统 (win32, darwin, linux)
- `arch`: 架构 (x64, arm64)
- `hostname`: 机器名称（建议进行前 3 字符脱敏）
- `cpu_cores`: CPU 逻辑核心数
- `os_ver`: 操作系统版本号
- `obsidian_ver`: Obsidian 软件版本

### 示例 Payload
```json
{
  "license_key": "xxx",
  "device_id": "uuid-v4",
  "fingerprint_raw": {
    "p": "win32",
    "a": "x64",
    "h": "LAP***",
    "c": 16,
    "ov": "10.0.19045",
    "av": "1.5.3"
  }
}
```

## 3. 服务端处理逻辑 (hw-license-center)

### 3.1 指纹生成 (Fingerprint Calculation)
服务端接收到 `fingerprint_raw` 后，按照 Key 排序并拼接为字符串，计算 SHA-256 哈希。

```typescript
function generateFingerprint(raw: Record<string, any>): string {
    const sortedString = Object.keys(raw).sort().map(k => `${k}:${raw[k]}`).join('|');
    return crypto.createHash('sha256').update(sortedString).digest('hex');
}
```

### 3.2 判定逻辑 (Risk Decision)
1. **首次绑定**：将计算出的哈希存入 `Devices` 表的 `fingerprint` 字段。
2. **续期验证**：
   - 比较当前计算的哈希与数据库存的哈希。
   - **完全匹配**：风险等级不增加。
   - **不匹配**：
     - 若 `device_id` 相同但指纹不同 $\rightarrow$ 疑似硬件更换或指纹伪造。
     - 增加 `risk_level`；连续 3 次不匹配则标记为“降权”状态。

## 4. 数据库结构参考
已在 Phase 22a 中预留字段：
- `Devices.fingerprint`: 存储 SHA-256 哈希值。
- `Licenses.risk_level`: 存储当前卡密的综合风险分数 (0-5)。

## 5. 安全建议
- **不要采集 MAC 地址**：隐私风险极高且在新版 OS 中经常被随机化。
- **脱敏处理**：`hostname` 仅保留前缀，`os_ver` 仅保留主版本号。
- **容错处理**：允许 1-2 个维度的微小漂移（例如软件升级导致的 `obsidian_ver` 变化），不应直接判定为非法设备。
