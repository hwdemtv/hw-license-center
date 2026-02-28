import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';

describe('设备管理专项业务测试', () => {
    let db: any;
    let d1: any;

    beforeAll(async () => {
        db = new Database(':memory:');
        const schema = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
        db.exec(schema);

        // 确保字段存在
        try {
            db.exec("ALTER TABLE Licenses ADD COLUMN unbind_count INTEGER DEFAULT 0;");
            db.exec("ALTER TABLE Licenses ADD COLUMN last_unbind_period TEXT;");
        } catch (e) { }

        d1 = createD1Mock(db);

        // 插入测试数据
        db.prepare("INSERT INTO Licenses (license_key, unbind_count, last_unbind_period) VALUES (?, ?, ?)")
            .run('UNBIND-TEST-001', 0, '2020-01');
    });

    it('自助解绑逻辑 - 基础路径测试', async () => {
        // 先手动增加一个设备以便解绑
        db.prepare("INSERT INTO Devices (license_key, device_id, device_name) VALUES (?, ?, ?)")
            .run('UNBIND-TEST-001', 'DEV-TO-REMOVE', '测试设备');

        const res = await app.request('/api/v1/auth/unbind', {
            method: 'POST',
            body: JSON.stringify({
                license_key: 'UNBIND-TEST-001',
                device_id: 'DEV-TO-REMOVE'
            }),
            headers: { 'Content-Type': 'application/json' }
        }, {
            DB: d1,
            JWT_SECRET: 'test'
        });

        const data: any = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);

        // 检查数据库是否真的解绑了
        const devCount = db.prepare("SELECT count(*) as cnt FROM Devices WHERE license_key = ?").get('UNBIND-TEST-001').cnt;
        expect(devCount).toBe(0);
    });
});
