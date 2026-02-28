import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';

describe('Webhook 密钥动态化测试', () => {
    let db: any;
    let d1: any;

    beforeAll(async () => {
        db = new Database(':memory:');
        const schema = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
        db.exec(schema);

        // 创建 SystemConfig 表
        db.exec(`CREATE TABLE IF NOT EXISTS SystemConfig (
            key TEXT PRIMARY KEY,
            value TEXT,
            label TEXT,
            category TEXT
        )`);

        // 插入动态密钥
        db.prepare("INSERT INTO SystemConfig (key, value, label, category) VALUES (?, ?, ?, ?)")
            .run('webhook_secret', 'dynamic-test-secret', 'Webhook 发卡密钥', 'webhook');

        d1 = createD1Mock(db);
    });

    it('使用 SystemConfig 中的动态密钥通过鉴权', async () => {
        const res = await app.request('/api/v1/auth/webhook/pay', {
            method: 'POST',
            body: JSON.stringify({ product_id: 'test', count: 1 }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dynamic-test-secret'
            }
        }, { DB: d1, JWT_SECRET: 'test' });

        const data: any = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.keys).toHaveLength(1);
    });

    it('错误密钥应被拒绝', async () => {
        const res = await app.request('/api/v1/auth/webhook/pay', {
            method: 'POST',
            body: JSON.stringify({ product_id: 'test', count: 1 }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer wrong-secret'
            }
        }, { DB: d1, JWT_SECRET: 'test' });

        expect(res.status).toBe(401);
    });
});
