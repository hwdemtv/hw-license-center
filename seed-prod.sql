INSERT OR REPLACE INTO Licenses (license_key, product_id, unbind_count, last_unbind_period, max_devices, status) 
VALUES ('TEST-QUOTA-NET', 'default', 1, strftime('%Y-%m', 'now'), 1, 'active');

INSERT OR REPLACE INTO Devices (device_id, device_name, license_key, last_active) 
VALUES ('test-device-net', 'Remote Demo PC', 'TEST-QUOTA-NET', datetime('now'));
