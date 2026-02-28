-- 全局 SystemConfig 初始化 (适配浏览器模板渲染与逻辑校验)
INSERT OR IGNORE INTO SystemConfig (key, value, label, category) VALUES ('admin_password', 'hwdemtv', '管理员登录密码', 'security');
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
