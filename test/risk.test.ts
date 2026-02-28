import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';

describe('异常行为降权风控测试', () => {
    let db: any;
    let d1: any;

    beforeAll(async () => {
        db = new Database(':memory:');
        const schema = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
        db.exec(schema);

        // 确保风控字段存在
        try { db.exec("ALTER TABLE Licenses ADD COLUMN risk_level INTEGER DEFAULT 0;"); } catch (_) { }

        d1 = createD1Mock(db);

        // 插入一个高限额的测试卡密（允许绑定 10 台设备以测试风控而非设备上限）
        db.prepare("INSERT INTO Licenses (license_key, product_id, status, max_devices, risk_level) VALUES (?, ?, ?, ?, ?)")
            .run('RISK-TEST-001', 'default', 'active', 10, 0);

        db.prepare("INSERT INTO Subscriptions (license_key, product_id) VALUES (?, ?)")
            .run('RISK-TEST-001', 'default');
    });

    it('风控等级 ≥ 3 时应阻断新设备绑定', async () => {
        // 直接设置风控等级为 3
        db.prepare("UPDATE Licenses SET risk_level = 3 WHERE license_key = ?")
            .run('RISK-TEST-001');

        const res = await app.request('/api/v1/auth/verify', {
            method: 'POST',
            body: JSON.stringify({
                license_key: 'RISK-TEST-001',
                device_id: 'blocked-device',
                product_id: 'default'
            }),
            headers: { 'Content-Type': 'application/json' }
        }, { DB: d1, JWT_SECRET: 'test' });

        const data: any = await res.json();
        expect(res.status).toBe(403);
        expect(data.code).toBe('RISK_BLOCKED');
    });

    it('正常风控等级下允许绑定', async () => {
        // 重置风控等级
        db.prepare("UPDATE Licenses SET risk_level = 0 WHERE license_key = ?")
            .run('RISK-TEST-001');

        const res = await app.request('/api/v1/auth/verify', {
            method: 'POST',
            body: JSON.stringify({
                license_key: 'RISK-TEST-001',
                device_id: 'normal-device',
                product_id: 'default'
            }),
            headers: { 'Content-Type': 'application/json' }
        }, { DB: d1, JWT_SECRET: 'test' });

        const data: any = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
});
