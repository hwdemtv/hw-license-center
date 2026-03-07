PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE Licenses (
    license_key TEXT PRIMARY KEY,
    product_id TEXT NOT NULL DEFAULT 'default', -- 区分不同软件/产品的标识符（保留前缀参考，但权限由 Subscriptions 决定）
    user_name TEXT,                             -- 绑定的用户名或备注（可选）
    status TEXT NOT NULL DEFAULT 'active',      -- 'active', 'inactive', 'revoked'
    max_devices INTEGER NOT NULL DEFAULT 2,     -- 最大允许绑定设备数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME
, unbind_count INTEGER NOT NULL DEFAULT 0, last_unbind_period TEXT, offline_days_override INTEGER DEFAULT NULL, risk_level INTEGER DEFAULT 0, ai_daily_quota INTEGER DEFAULT NULL, ai_used_today INTEGER DEFAULT 0, ai_last_reset_date TEXT DEFAULT NULL, ai_model_override TEXT DEFAULT NULL, ai_key_override TEXT DEFAULT NULL, ai_base_override TEXT DEFAULT NULL, risk_threshold INTEGER DEFAULT NULL);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('SMART-0GWR-5IMP-F15R','UNKNOWN','smartmptest-quota-user','active',2,'2026-02-28 11:07:32',NULL,0,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('TEST-QUOTA-NET','UNKNOWN',NULL,'active',1,'2026-02-28 11:07:32',NULL,0,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('SMART-YFVY-HI63-DQIR','UNKNOWN','hwdemtv','active',2,'2026-02-28 11:07:32',NULL,0,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('ZEN-VIP-JVX-HWDEMTV','UNKNOWN','ZEN-FREE','active',100,'2026-02-28 11:07:32',NULL,0,NULL,NULL,0,100,29,'2026-03-07',NULL,NULL,NULL,100);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('SMART-9VNM-VN2J-8WMN','smartmp','','active',3,'2026-02-28 11:10:15',NULL,0,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('SMART-AIXG-9D7P-LQNY','default','知乎','active',100,'2026-03-04 10:46:04',NULL,0,NULL,NULL,0,100,0,'2026-03-06',NULL,NULL,NULL,100);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('SMART-9EVV-5RXV-2VHD','default','B站','active',100,'2026-03-04 11:09:04',NULL,0,NULL,NULL,0,100,10,'2026-03-04',NULL,NULL,NULL,100);
INSERT INTO "Licenses" ("license_key","product_id","user_name","status","max_devices","created_at","activated_at","unbind_count","last_unbind_period","offline_days_override","risk_level","ai_daily_quota","ai_used_today","ai_last_reset_date","ai_model_override","ai_key_override","ai_base_override","risk_threshold") VALUES('ZENCL-O6IT-VTIO-HW33','zenclean','郝利铭/52破解','active',100,'2026-03-05 03:23:49',NULL,0,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE Subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT NOT NULL,
    product_id TEXT NOT NULL,                   -- 订阅的产品标识，如 'smartmp', 'token-server'
    expires_at TEXT DEFAULT NULL,               -- 到期时间戳(ISO)。NULL 表示永久有效（买断制）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(license_key) REFERENCES Licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, product_id)
);
INSERT INTO "Subscriptions" ("id","license_key","product_id","expires_at","created_at") VALUES(322,'SMART-9VNM-VN2J-8WMN','smartmp',NULL,'2026-02-28 11:10:15');
INSERT INTO "Subscriptions" ("id","license_key","product_id","expires_at","created_at") VALUES(324,'ZEN-VIP-JVX-HWDEMTV','zenclean','2027-03-30T12:05:24.157Z','2026-02-28 12:05:24');
INSERT INTO "Subscriptions" ("id","license_key","product_id","expires_at","created_at") VALUES(325,'ZEN-VIP-JVX-HWDEMTV','smartmp',NULL,'2026-02-28 15:27:41');
INSERT INTO "Subscriptions" ("id","license_key","product_id","expires_at","created_at") VALUES(330,'SMART-9EVV-5RXV-2VHD','zenclean','2027-03-04T11:22:01.093Z','2026-03-04 11:22:01');
INSERT INTO "Subscriptions" ("id","license_key","product_id","expires_at","created_at") VALUES(331,'SMART-AIXG-9D7P-LQNY','zenclean','2027-03-04T11:22:07.118Z','2026-03-04 11:22:07');
INSERT INTO "Subscriptions" ("id","license_key","product_id","expires_at","created_at") VALUES(332,'ZENCL-O6IT-VTIO-HW33','zenclean','2027-03-05T03:23:49.429Z','2026-03-05 03:23:49');
CREATE TABLE Devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP, fingerprint TEXT,
    FOREIGN KEY(license_key) REFERENCES Licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, device_id)
);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(10,'SMART-9VNM-VN2J-8WMN','0ceb34054906a8e346610757a616ffd742279db8b67799f55b1ebd74f13f81e1','Redmi14Pro (win32)','2026-02-28 11:11:01',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(35,'ZEN-VIP-JVX-HWDEMTV','07eec92c-c509-4df3-81b5-0e1a7d219c51','DESKTOP-SNTS8IN','2026-03-04 14:56:02',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(36,'ZEN-VIP-JVX-HWDEMTV','af2b8140-7dcd-4ee8-830d-14bfa4253241','DESKTOP-IPSGJMB','2026-03-05 00:04:33',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(37,'ZEN-VIP-JVX-HWDEMTV','c46e9a7a-aa34-48e7-9fb1-c6812d37f343','中控','2026-03-05 07:13:36',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(38,'ZEN-VIP-JVX-HWDEMTV','7a7c857c-1091-4b83-a16a-2fe5b63f11c2','DESKTOP-VE1JC1A','2026-03-05 08:14:04',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(39,'ZEN-VIP-JVX-HWDEMTV','0751e9f5-9c76-4faf-a10f-6ddb4204927f','DESKTOP-FJF90K0','2026-03-05 08:48:23',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(40,'ZEN-VIP-JVX-HWDEMTV','82e2f25f-f615-44fa-8b20-c400e1f21b9c','DESKTOP-GS7VF7B','2026-03-06 16:18:07',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(41,'SMART-AIXG-9D7P-LQNY','6510adb4-e69f-4bd7-891e-63dfaf0796a1','DESKTOP-4BO4TC9','2026-03-06 01:36:58',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(42,'ZENCL-O6IT-VTIO-HW33','f440f8a2-5578-4cb2-be09-604640314ddd','HAO','2026-03-06 02:54:16',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(43,'ZEN-VIP-JVX-HWDEMTV','a9b10eb4-f9dc-405a-8e12-497fa2d1737f','Redmi14Pro','2026-03-07 13:25:26',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(44,'ZEN-VIP-JVX-HWDEMTV','80cd36d6-0770-482e-ae9b-4ee4d5c3dad9','LiuCan','2026-03-06 06:37:55',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(45,'ZEN-VIP-JVX-HWDEMTV','84b1394a-e824-4c10-a7aa-293b27c61df1','WIN-4VF1LGUM8VJ','2026-03-06 06:59:43',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(46,'ZEN-VIP-JVX-HWDEMTV','73bd80fd-6548-4228-9786-2a3efc059e2f','LAPTOP-6LN81LT6','2026-03-06 08:37:21',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(47,'SMART-AIXG-9D7P-LQNY','5c3932e1-db4b-49cf-8227-709576f554f1','DESKTOP-NB','2026-03-06 10:27:25',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(48,'ZEN-VIP-JVX-HWDEMTV','3f945133-a62e-4680-89a0-a95804b41bfb','DESKTOP-U39Q2T5','2026-03-06 10:29:10',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(49,'ZEN-VIP-JVX-HWDEMTV','017de287-5621-4862-904f-47310ebc92e8','SKY-20210421SGB','2026-03-06 11:15:18',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(50,'ZEN-VIP-JVX-HWDEMTV','777b1438-8eb2-42ad-9be0-13879b0e97c3','PS2023QCXKDDAY','2026-03-06 14:21:01',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(51,'ZEN-VIP-JVX-HWDEMTV','5e36ac2d-ef92-4189-8fe0-87f9800b6b9a','DESKTOP-EOVE99R','2026-03-07 01:42:56',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(52,'ZEN-VIP-JVX-HWDEMTV','5070CF8F-2514-4652-83E7-59F7308001AE','DESKTOP-P42U364','2026-03-07 05:38:02',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(53,'ZEN-VIP-JVX-HWDEMTV','3a7cefce-5c10-4b86-a6ef-181f6609cb4f','DESKTOP-M1UM22O','2026-03-07 10:50:42',NULL);
INSERT INTO "Devices" ("id","license_key","device_id","device_name","last_active","fingerprint") VALUES(54,'ZEN-VIP-JVX-HWDEMTV','b4d8cf0b-ab59-484d-830b-f558df5ff91c','PC-20251212JHAP','2026-03-07 11:30:55',NULL);
CREATE TABLE SystemConfig (key TEXT PRIMARY KEY, value TEXT NOT NULL, label TEXT, category TEXT);
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('admin_password','','Admin Login Pwd','security');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('jwt_offline_days','30','JWT Offline Days','security');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('max_unbind_per_month','3','Monthly Unbind Limit','risk');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('default_max_devices','3','Default Max Devices','business');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('expiry_warning_days','7','Expiry Warning Days','business');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('default_product_id','smartmp','Default Product ID','business');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('portal_title','设备解绑查询门户','Portal Title','portal');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('portal_subtitle','在线强制释出与卡密关联的失效或闲置物理设备','Portal Subtitle','portal');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('portal_tips','1. 为了保障账户安全，每个激活码每月仅支持有限次数的自主换绑。\n2. 解绑名额将在每月 1 号凌晨自动重置。\n3. 若额度耗尽且确需更换设备，请联系管理员处理。','Portal Tips','portal');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('admin_contact','微信:hwdemtv','Admin Contact','portal');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('ai_api_base','https://api.hwdemtv.com/v1','AI 服务 Base URL','ai');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('ai_api_key','sk-4vUcz9hKDUNhYNi7619926Fa254a454cBfD9Ad545e00C9B2','AI 接口秘钥','ai');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('ai_default_model','glm-4-flash','默认模型名称','ai');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('ai_default_daily_quota','50','默认每日AI调用额度','ai');
INSERT INTO "SystemConfig" ("key","value","label","category") VALUES('ai_enabled','true','AI代理网关总开关','ai');
CREATE TABLE Notifications (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, action_url TEXT, type TEXT NOT NULL DEFAULT 'info', status TEXT NOT NULL DEFAULT 'draft', target_rules TEXT, is_force INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('Subscriptions',333);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('Devices',54);
CREATE INDEX idx_devices_license_key ON Devices(license_key);
CREATE INDEX idx_devices_device_id ON Devices(device_id);
CREATE INDEX idx_subs_license_key ON Subscriptions(license_key);
CREATE INDEX idx_subs_product_id ON Subscriptions(product_id);
CREATE INDEX idx_subs_expires_at ON Subscriptions(expires_at);
CREATE INDEX idx_licenses_status ON Licenses(status);
