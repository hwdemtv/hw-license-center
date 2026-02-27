-- 为解决批量查询和外键关联引起的全表扫描问题，建立以下关键索引

CREATE INDEX IF NOT EXISTS idx_devices_license_key ON Devices(license_key);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON Devices(device_id);

CREATE INDEX IF NOT EXISTS idx_subs_license_key ON Subscriptions(license_key);
CREATE INDEX IF NOT EXISTS idx_subs_product_id ON Subscriptions(product_id);

CREATE INDEX IF NOT EXISTS idx_licenses_status ON Licenses(status);
