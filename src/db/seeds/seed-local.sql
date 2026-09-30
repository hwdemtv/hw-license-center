-- 全局 SystemConfig 初始化 (适配浏览器模板渲染与逻辑校验)
-- 注意：admin_password 存储的是 PBKDF2 哈希 (格式: iterations$salt$hash)，对应明文密码: hwdemtv (仅限本地开发环境)
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('admin_password', '100000$ea957bec238f02ed2a1b98a454290ab8$4b1742fb1b1701f60257c3db8bc00e35e8bb8934ebb05532f38b5a376c1adbed1e933958f52a7da1a1a1a33bb3f87347431f36368a2384978251871fc7d1721b', '管理员登录密码', 'security');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('portal_title', '软件自助授权门户', '门户页面主标题', 'portal');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('portal_subtitle', 'HW License Verification Center', '门户页面副标题', 'portal');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('portal_notice', '提示：请输入您的 24 位激活码进行解绑或查询。单卡每月限自助解绑 3 次。', '门户温馨提示', 'portal');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('jwt_offline_days', '7', 'JWT 离线天数', 'business');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('max_unbind_per_month', '3', '每月解绑限制次数', 'business');
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('webhook_secret', 'test_webhook_key', 'Webhook 发卡密钥', 'webhook');

-- 插入一条测试卡密
INSERT OR IGNORE INTO Licenses (license_key, product_id, user_name, status, max_devices) 
VALUES ('TEST-KEY-BROWSER-001', 'default', '浏览器冒烟测试', 'active', 2);

INSERT OR IGNORE INTO Subscriptions (license_key, product_id, expires_at) 
VALUES ('TEST-KEY-BROWSER-001', 'default', '2099-12-31T23:59:59Z');
