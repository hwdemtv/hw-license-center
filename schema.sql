DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS Licenses;

-- 激活码登记表
CREATE TABLE IF NOT EXISTS Licenses (
    license_key TEXT PRIMARY KEY,
    product_id TEXT NOT NULL DEFAULT 'default', -- 区分不同软件/产品的标识符（保留前缀参考，但权限由 Subscriptions 决定）
    user_name TEXT,                             -- 绑定的用户名或备注（可选）
    status TEXT NOT NULL DEFAULT 'active',      -- 'active', 'inactive', 'revoked'
    max_devices INTEGER NOT NULL DEFAULT 2,     -- 最大允许绑定设备数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME
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
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(license_key) REFERENCES Licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, device_id)
);

-- 以下为可选的初始化测试数据（导入时执行）
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('DEFAU-TEST-KEY-1', 'default', '张三', 'active', 2);
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('DEFAU-TEST-KEY-2', 'default', '李四', 'active', 2);
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('DEFAU-TEST-KEY-3', 'default', '黑名单用户', 'revoked', 2);
INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES ('OTHER-TEST-KEY-1', 'othertool', '王五', 'active', 1);
