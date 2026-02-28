DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS Licenses;

-- 激活码登记表
CREATE TABLE IF NOT EXISTS Licenses (
    license_key TEXT PRIMARY KEY,
    product_id TEXT NOT NULL DEFAULT 'default', -- 区分不同软件/产品的标识符（保留前缀参考，但权限由 Subscriptions 决定）
    user_name TEXT,                             -- 绑定的用户名或备注（可选）
    status TEXT NOT NULL DEFAULT 'active',      -- 'active', 'inactive', 'revoked'
    max_devices INTEGER NOT NULL DEFAULT 2,     -- 最大允许绑定设备数
    offline_days_override INTEGER DEFAULT NULL, -- 单卡专属离线特权天数（优先级高于全局配置）
    risk_level INTEGER DEFAULT 0,               -- 风控等级（0=正常, 1=注意, 2=警告, 3=降权）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME,
    -- AI 代理网关专属配置 (Phase 30)
    ai_daily_quota INTEGER DEFAULT NULL,        -- 专属每日额度上限
    ai_used_today INTEGER DEFAULT 0,            -- 今日已用额度
    ai_last_reset_date TEXT DEFAULT NULL,       -- 跨日重置凭证
    ai_model_override TEXT DEFAULT NULL,        -- 专属越权模型名称
    ai_key_override TEXT DEFAULT NULL,          -- 专属越权 API Key
    ai_base_override TEXT DEFAULT NULL          -- 专属越权 Base URL
);

-- 产品订阅表（一码多产品）
CREATE TABLE IF NOT EXISTS Subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT NOT NULL,
    product_id TEXT NOT NULL,                   -- 订阅的产品标识，如 'smartmp', 'token-server'
    expires_at TEXT DEFAULT NULL,               -- 到期时间戳(ISO)。NULL 表示永久有效（买断制）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(license_key) REFERENCES Licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, product_id)
);

CREATE TABLE IF NOT EXISTS Devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    fingerprint TEXT,                           -- 设备指纹哈希（Phase 22b 预留）
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(license_key) REFERENCES Licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, device_id)
);

-- 以下为可选的初始化测试数据（导入时执行）
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('DEFAU-TEST-KEY-1', 'default', '张三', 'active', 2);
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('DEFAU-TEST-KEY-2', 'default', '李四', 'active', 2);
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('DEFAU-TEST-KEY-3', 'default', '黑名单用户', 'revoked', 2);
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('OTHER-TEST-KEY-1', 'othertool', '王五', 'active', 1);

-- 显式索引：加速 /verify 中的高频查询
CREATE INDEX IF NOT EXISTS idx_devices_license_key ON Devices(license_key);
CREATE INDEX IF NOT EXISTS idx_subs_license_key ON Subscriptions(license_key);

-- 系统全局配置表 (Phase 17+)
CREATE TABLE IF NOT EXISTS SystemConfig (
    key TEXT PRIMARY KEY,
    value TEXT,
    label TEXT,
    category TEXT
);

-- ==========================================
-- AI 代理网关扩展 (Phase 30: BFF AI Proxy)
-- ==========================================

-- AI 系统全局配置初始值（首次部署时手动执行或通过后台 UI 设置）
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('ai_api_base', 'https://api.hwdemtv.com/v1', 'AI 服务 Base URL', 'ai');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('ai_api_key', '', 'AI 接口秘钥 (API Key)', 'ai');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('ai_default_model', 'glm-4-flash', '默认模型名称', 'ai');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('ai_default_daily_quota', '50', '默认每日 AI 调用额度', 'ai');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('ai_enabled', 'true', 'AI 代理网关总开关', 'ai');
