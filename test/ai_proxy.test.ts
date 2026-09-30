import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { app } from '../src/app';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { createD1Mock } from './helpers';
import { sign } from 'hono/jwt';

describe('AI 代理网关测试', () => {
    let db: any;
    let d1: any;
    let token: string;
    const origFetch = globalThis.fetch;

    // 与 ai_proxy.ts 的 getTodayDateStr 一致：UTC+8 的 YYYY-MM-DD
    const todayStr = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

    // 假 KV：get 永远抛错 → 限流器走降级放行，避免测试自身被限流
    const fakeKV = {
        get: async () => { throw new Error('no kv in test'); },
        put: async () => { throw new Error('no kv in test'); }
    };
    const env = () => ({ DB: d1, JWT_SECRET: 'test-secret', RATE_LIMITER: fakeKV as any });

    beforeAll(async () => {
        db = new Database(':memory:');
        db.exec(fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8'));
        d1 = createD1Mock(db);

        db.prepare("INSERT INTO Licenses (license_key, product_id, status, max_devices) VALUES (?, ?, 'active', 2)")
            .run('AI-TEST-001', 'smartmp');
        db.prepare("UPDATE SystemConfig SET value = 'https://fake-upstream.test/v1' WHERE key = 'ai_api_base'").run();
        db.prepare("UPDATE SystemConfig SET value = 'sk-global-key' WHERE key = 'ai_api_key'").run();

        token = await sign(
            { license_key: 'AI-TEST-001', device_id: 'dev-1', exp: Math.floor(Date.now() / 1000) + 3600 },
            'test-secret'
        );
    });

    afterEach(() => {
        globalThis.fetch = origFetch;
        // 还原单卡覆盖与额度，隔离用例间影响
        db.prepare("UPDATE Licenses SET ai_daily_quota = NULL, ai_used_today = 0, ai_last_reset_date = NULL, ai_model_override = NULL, ai_key_override = NULL, ai_base_override = NULL WHERE license_key = 'AI-TEST-001'").run();
        db.prepare("UPDATE SystemConfig SET value = 'true' WHERE key = 'ai_enabled'").run();
    });

    it('缺少令牌应返回 401', async () => {
        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [] })
        }, env());
        expect(res.status).toBe(401);
    });

    it('无效令牌应返回 401', async () => {
        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer bad.token.here', 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [] })
        }, env());
        expect(res.status).toBe(401);
    });

    it('令牌指向的激活码不存在应返回 404', async () => {
        const ghostToken = await sign(
            { license_key: 'AI-GHOST', device_id: 'dev-1', exp: Math.floor(Date.now() / 1000) + 3600 },
            'test-secret'
        );
        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + ghostToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [] })
        }, env());
        expect(res.status).toBe(404);
    });

    it('AI 总开关关闭时应返回 503', async () => {
        db.prepare("UPDATE SystemConfig SET value = 'false' WHERE key = 'ai_enabled'").run();
        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [] })
        }, env());
        expect(res.status).toBe(503);
    });

    it('今日额度用尽应返回 429 且不扣减', async () => {
        db.prepare("UPDATE Licenses SET ai_daily_quota = 2, ai_used_today = 2, ai_last_reset_date = ? WHERE license_key = 'AI-TEST-001'")
            .run(todayStr());
        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [] })
        }, env());
        expect(res.status).toBe(429);
        const data: any = await res.json();
        expect(data.code).toBe('QUOTA_EXCEEDED');
        const used = db.prepare("SELECT ai_used_today AS v FROM Licenses WHERE license_key = 'AI-TEST-001'").get().v;
        expect(used).toBe(2);
    });

    it('正常转发：强制覆盖客户端模型、透传全局密钥、扣减额度', async () => {
        let captured: any = {};
        globalThis.fetch = (async (url: any, init: any) => {
            captured = { url, headers: init.headers, body: JSON.parse(init.body) };
            return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }) as any;

        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4-expensive', messages: [{ role: 'user', content: 'hi' }] })
        }, env());

        expect(res.status).toBe(200);
        // 客户端请求的天价模型被强制覆盖为配置模型
        expect(captured.body.model).toBe('glm-4-flash');
        expect(captured.headers.Authorization).toBe('Bearer sk-global-key');
        expect(captured.url).toBe('https://fake-upstream.test/v1/chat/completions');
        expect(res.headers.get('X-AI-Quota-Remaining')).toBe('49');
        // 非流式请求同步扣减额度
        const used = db.prepare("SELECT ai_used_today AS v FROM Licenses WHERE license_key = 'AI-TEST-001'").get().v;
        expect(used).toBe(1);
    });

    it('单卡专属模型与密钥覆盖优先于全局配置', async () => {
        db.prepare("UPDATE Licenses SET ai_model_override = 'glm-4-plus', ai_key_override = 'sk-vip', ai_base_override = 'https://vip-upstream.test/v1' WHERE license_key = 'AI-TEST-001'").run();
        let captured: any = {};
        globalThis.fetch = (async (url: any, init: any) => {
            captured = { url, headers: init.headers, body: JSON.parse(init.body) };
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }) as any;

        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'whatever', messages: [{ role: 'user', content: 'hi' }] })
        }, env());

        expect(res.status).toBe(200);
        expect(captured.body.model).toBe('glm-4-plus');
        expect(captured.headers.Authorization).toBe('Bearer sk-vip');
        expect(captured.url).toBe('https://vip-upstream.test/v1/chat/completions');
    });

    it('额度查询端点：跨日自动重置并返回剩余额度', async () => {
        db.prepare("UPDATE Licenses SET ai_daily_quota = 10, ai_used_today = 5, ai_last_reset_date = '2000-01-01' WHERE license_key = 'AI-TEST-001'").run();
        const res = await app.request('/api/v1/ai/quota', {
            headers: { 'Authorization': 'Bearer ' + token }
        }, env());
        const data: any = await res.json();
        expect(data.success).toBe(true);
        expect(data.quota.daily_limit).toBe(10);
        expect(data.quota.used_today).toBe(0);
        expect(data.quota.remaining).toBe(10);
    });

    it('上游返回错误时应透传状态且不扣减额度', async () => {
        globalThis.fetch = (async () => {
            return new Response(JSON.stringify({ error: { message: 'invalid api key' } }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }) as any;

        const res = await app.request('/api/v1/ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
        }, env());

        expect(res.status).toBe(401);
        const used = db.prepare("SELECT ai_used_today AS v FROM Licenses WHERE license_key = 'AI-TEST-001'").get().v;
        expect(used).toBe(0);
    });
});
