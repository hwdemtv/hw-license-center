import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';

describe('增量合并逻辑测试', () => {
    let db: any;
    let d1: any;

    beforeAll(async () => {
        db = new Database(':memory:');
        const schema = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
        db.exec(schema);

        // 初始化数据：卡密同时有 P1 和 P2 两个产品
        db.prepare("INSERT INTO Licenses (license_key, product_id, status) VALUES (?, ?, ?)")
            .run('MERGE-KEY', 'P1', 'active');

        db.prepare("INSERT INTO Subscriptions (license_key, product_id, expires_at) VALUES (?, ?, ?)")
            .run('MERGE-KEY', 'P1', '2025-01-01');
        db.prepare("INSERT INTO Subscriptions (license_key, product_id, expires_at) VALUES (?, ?, ?)")
            .run('MERGE-KEY', 'P2', '2025-01-01');

        d1 = createD1Mock(db);
    });

    it('导入应实现增量合并 (Merge) 而非覆盖 (Wipe)', async () => {
        const payload = {
            licenses: [{
                license_key: 'MERGE-KEY',
                subscriptions: [
                    { product_id: 'P1', expires_at: '2099-12-31' }, // 更新 P1
                    { product_id: 'P3', expires_at: null }          // 新增 P3
                    // 注意：未提及 P2
                ]
            }]
        };

        const res = await app.request('/api/v1/auth/admin/licenses/import', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-secret'
            }
        }, { DB: d1, ADMIN_SECRET: 'admin-secret' });

        expect(res.status).toBe(200);

        const subs = db.prepare("SELECT product_id, expires_at FROM Subscriptions WHERE license_key = ? ORDER BY product_id ASC").all('MERGE-KEY');

        // 预期结果：P1 更新了日期，P2 被保留，P3 新增了
        expect(subs).toHaveLength(3);

        expect(subs[0].product_id).toBe('P1');
        expect(subs[0].expires_at).toBe('2099-12-31');

        expect(subs[1].product_id).toBe('P2');
        expect(subs[1].expires_at).toBe('2025-01-01'); // P2 必须还在！

        expect(subs[2].product_id).toBe('P3');
    });
});
