import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';

describe('限流器三层架构测试 (D1 → KV → 内存)', () => {
    let d1: any;
    let d1NoRateTable: any;

    beforeAll(() => {
        const db = new Database(':memory:');
        db.exec(fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8'));
        d1 = createD1Mock(db);

        // 模拟未迁移 RateLimit 表的旧库：D1 层抛错后应降级到内存层
        const db2 = new Database(':memory:');
        db2.exec(fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8'));
        db2.exec('DROP TABLE RateLimit');
        d1NoRateTable = createD1Mock(db2);
    });

    const hitVerify = (env: any, ip = '1.2.3.4') => app.request('/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
        body: JSON.stringify({ license_key: 'NO-SUCH-KEY', device_id: 'dev' })
    }, env);

    it('第 1 层：D1 原子计数达到上限后拦截，且带标准限流响应头', async () => {
        const statuses: number[] = [];
        let lastHeaders: any;
        // verify 限流 15 次/60s：前 15 次放行（业务 404），第 16 次 429
        for (let i = 0; i < 16; i++) {
            const res = await hitVerify({ DB: d1, JWT_SECRET: 'test' }, '7.7.7.7');
            statuses.push(res.status);
            lastHeaders = res.headers;
        }
        expect(statuses.filter(s => s === 404).length).toBe(15);
        expect(statuses.filter(s => s === 429).length).toBe(1);
        expect(lastHeaders.get('X-RateLimit-Limit')).toBe('15');
        expect(lastHeaders.get('Retry-After')).toBe('60');

        // 不同 IP 不受彼此计数影响
        const other = await hitVerify({ DB: d1, JWT_SECRET: 'test' }, '8.8.8.8');
        expect(other.status).toBe(404);
    });

    it('429 响应体包含可读信息', async () => {
        const res = await hitVerify({ DB: d1, JWT_SECRET: 'test' }, '6.6.6.6');
        expect(res.status).toBe(404); // 首次放行
        for (let i = 0; i < 15; i++) {
            await hitVerify({ DB: d1, JWT_SECRET: 'test' }, '6.6.6.6');
        }
        const blocked = await hitVerify({ DB: d1, JWT_SECRET: 'test' }, '6.6.6.6');
        expect(blocked.status).toBe(429);
        const data: any = await blocked.json();
        expect(data.success).toBe(false);
        expect(data.retry_after).toBe(60);
    });

    it('降级：D1 缺 RateLimit 表时自动落到内存层，限流仍然生效', async () => {
        const statuses: number[] = [];
        for (let i = 0; i < 16; i++) {
            const res = await hitVerify({ DB: d1NoRateTable, JWT_SECRET: 'test' }, '5.5.5.5');
            statuses.push(res.status);
        }
        expect(statuses.filter(s => s === 429).length).toBe(1);
    });

    it('IPv6 隐私地址轮换：同 /64 网段的不同地址共享同一限流桶', async () => {
        // 模拟 Windows 临时地址轮换：每个连接换后 64 位，前缀相同
        const statuses: number[] = [];
        for (let i = 0; i < 16; i++) {
            const rotatingIp = `2602:feda:f396:fc02:1111:2222:3333:${(1000 + i).toString(16)}`;
            const res = await hitVerify({ DB: d1, JWT_SECRET: 'test' }, rotatingIp);
            statuses.push(res.status);
        }
        expect(statuses.filter(s => s === 404).length).toBe(15);
        expect(statuses.filter(s => s === 429).length).toBe(1);
        // 不同 /64 网段不受影响
        const otherNet = await hitVerify({ DB: d1, JWT_SECRET: 'test' }, '2001:db8:abcd:12::99');
        expect(otherNet.status).toBe(404);
    });
});
