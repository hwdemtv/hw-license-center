const Database = require('better-sqlite3');
const dbPath = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
const db = new Database(dbPath);

db.prepare("INSERT OR IGNORE INTO Licenses(license_key, product_id, unbind_count, last_unbind_period, max_devices, status) VALUES('TEST-1234', 'default', 1, '2026-02', 2, 'active')").run();
db.prepare("INSERT OR IGNORE INTO Devices(device_id, device_name, license_key, last_active) VALUES('dev-001', 'Test Desktop PC', 'TEST-1234', datetime('now'))").run();

console.log('Test data inserted');
