import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';

describe('Verify API 核心逻辑测试', () => {
    let db: any;
    let d1: any;

    beforeAll(async () => {
        db = new Database(':memory:');
        const schema = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
        db.exec(schema);

        db.prepare("INSERT INTO Licenses (license_key, product_id, user_name, status, max_devices) VALUES (?, ?, ?, ?, ?)")
            .run('TEST-KEY-001', 'smartmp', '测试用户', 'active', 2);

        db.prepare("INSERT INTO Subscriptions (license_key, product_id) VALUES (?, ?)")
            .run('TEST-KEY-001', 'smartmp');

        d1 = createD1Mock(db);
    });

    it('正常验证并获取有效 JWT', async () => {
        const payload = {
            license_key: 'TEST-KEY-001',
            device_id: 'device-001',
            device_name: '我的电脑',
            product_id: 'smartmp'
        };

        const res = await app.request('/api/v1/auth/verify', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        }, {
            DB: d1,
            JWT_SECRET: 'test-secret',
            ADMIN_SECRET: 'admin-secret'
        });

        const data: any = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.token).toBeDefined();
        expect(data.products).toHaveLength(1);
        expect(data.products[0].product_id).toBe('smartmp');
    });

    it('超出设备上限应被拦截', async () => {
        const bindDevice = async (id: string) => {
            return await app.request('/api/v1/auth/verify', {
                method: 'POST',
                body: JSON.stringify({
                    license_key: 'TEST-KEY-001',
                    device_id: id,
                    device_name: '设备' + id,
                    product_id: 'smartmp'
                }),
                headers: { 'Content-Type': 'application/json' }
            }, { DB: d1, JWT_SECRET: 'test-secret' });
        };

        const res2 = await bindDevice('device-002');
        expect(res2.status).toBe(200);

        const res3 = await bindDevice('device-003');
        expect(res3.status).toBe(403);
        const data: any = await res3.json();
        expect(data.msg).toContain('绑定');
    });

    it('无效激活码应返回 404', async () => {
        const res = await app.request('/api/v1/auth/verify', {
            method: 'POST',
            body: JSON.stringify({
                license_key: 'INVALID-KEY',
                device_id: 'any',
                product_id: 'smartmp'
            }),
            headers: { 'Content-Type': 'application/json' }
        }, { DB: d1, JWT_SECRET: 'test-secret' });

        expect(res.status).toBe(404);
    });
});
