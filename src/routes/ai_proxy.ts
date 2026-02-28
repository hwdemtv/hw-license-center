import { Hono } from 'hono';
import { Env } from '../types';
import { verify } from 'hono/jwt';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// AI 代理网关 (Phase 30: BFF AI Proxy)
// 功能：鉴权 → 额度检查 → 转发大模型请求 → 流式透传 → 扣减额度
// ==========================================

/**
 * 辅助函数：从 SystemConfig 读取 AI 相关全局配置
 */
async function getAiConfig(db: D1Database): Promise<{
    enabled: boolean;
    apiBase: string;
    apiKey: string;
    defaultModel: string;
    defaultDailyQuota: number;
}> {
    try {
        const { results } = await db.prepare(
            `SELECT key, value FROM SystemConfig WHERE category = 'ai'`
        ).all();

        const map: Record<string, string> = {};
        for (const row of results as any[]) {
            map[row.key] = row.value;
        }

        return {
            enabled: map['ai_enabled'] !== 'false',
            apiBase: map['ai_api_base'] || '',
            apiKey: map['ai_api_key'] || '',
            defaultModel: map['ai_default_model'] || 'glm-4-flash',
            defaultDailyQuota: parseInt(map['ai_default_daily_quota'] || '50') || 50,
        };
    } catch (e) {
        console.error('[AI_CONFIG] 读取 AI 配置失败:', e);
        return { enabled: false, apiBase: '', apiKey: '', defaultModel: 'glm-4-flash', defaultDailyQuota: 50 };
    }
}

/**
 * 辅助函数：获取今天的日期字符串 (YYYY-MM-DD, UTC+8)
 */
function getTodayDateStr(): string {
    const now = new Date();
    // 手动转至 UTC+8
    const utc8Offset = 8 * 60 * 60 * 1000;
    const d = new Date(now.getTime() + utc8Offset);
    return d.toISOString().slice(0, 10);
}

/**
 * 核心端点：透传 Chat Completions 请求
 * POST /chat/completions
 * 客户端使用已激活的 JWT Token 作为 Bearer Token 调用此接口
 */
app.post('/chat/completions', async (c) => {
    // --- Step 1: JWT 鉴权 ---
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, msg: '缺少授权令牌，请先激活软件' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
        payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    } catch (e) {
        return c.json({ success: false, msg: '授权令牌无效或已过期，请重新激活' }, 401);
    }

    const licenseKey = payload.license_key;
    if (!licenseKey) {
        return c.json({ success: false, msg: '令牌中缺少激活码信息' }, 401);
    }

    // --- Step 2: 读取后台配置 ---
    const aiConfig = await getAiConfig(c.env.DB);

    if (!aiConfig.enabled) {
        return c.json({ success: false, msg: 'AI 服务暂未开放，请联系管理员' }, 503);
    }

    // --- Step 3: 额度校验与跨日重置 ---
    const today = getTodayDateStr();

    // 查询该卡密是否存在且激活
    const license: any = await c.env.DB.prepare(
        `SELECT license_key, status, ai_daily_quota, ai_used_today, ai_last_reset_date, ai_model_override, ai_key_override, ai_base_override FROM Licenses WHERE license_key = ?`
    ).bind(licenseKey).first();

    if (!license) {
        return c.json({ success: false, msg: '关联的激活码不存在' }, 404);
    }
    if (license.status === 'revoked') {
        return c.json({ success: false, msg: '该激活码已被停用' }, 403);
    }

    // 确定最终生效的 API 配置（单卡专属覆盖全局）
    const activeApiBase = license.ai_base_override || aiConfig.apiBase;
    const activeApiKey = license.ai_key_override || aiConfig.apiKey;
    const activeModel = license.ai_model_override || aiConfig.defaultModel;

    if (!activeApiBase || !activeApiKey) {
        return c.json({ success: false, msg: '该激活码或系统尚未配置有效的 AI 服务参数' }, 503);
    }

    // 该用户的每日额度上限：有单卡配置则优先，否则退化为全局默认
    const dailyQuota = license.ai_daily_quota ?? aiConfig.defaultDailyQuota;
    let usedToday = license.ai_used_today || 0;
    const lastResetDate = license.ai_last_reset_date || '';

    // 跨日重置
    if (lastResetDate !== today) {
        usedToday = 0;
        await c.env.DB.prepare(
            `UPDATE Licenses SET ai_used_today = 0, ai_last_reset_date = ? WHERE license_key = ?`
        ).bind(today, licenseKey).run();
    }

    if (usedToday >= dailyQuota) {
        return c.json({
            success: false,
            msg: `今日 AI 调用额度已用完 (${usedToday}/${dailyQuota})，请明日再试`,
            code: 'QUOTA_EXCEEDED'
        }, 429);
    }

    // --- Step 4: 构造转发请求 ---
    let reqBody: any;
    try {
        reqBody = await c.req.json();
    } catch (e) {
        return c.json({ success: false, msg: '请求体格式错误' }, 400);
    }

    // 强制覆盖模型名（防止客户端恶意请求天价模型）
    if (!reqBody.model) {
        reqBody.model = activeModel;
    }

    const targetUrl = `${activeApiBase.replace(/\/+$/, '')}/chat/completions`;

    try {
        const upstreamRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeApiKey}`,
            },
            body: JSON.stringify(reqBody),
        });

        // 如果上游返回失败，直接透传错误（不扣额度）
        if (!upstreamRes.ok) {
            const errText = await upstreamRes.text();
            console.error(`[AI_PROXY] 上游返回错误 ${upstreamRes.status}: ${errText.substring(0, 200)}`);
            return new Response(errText, {
                status: upstreamRes.status,
                headers: { 'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json' },
            });
        }

        // --- Step 5: 扣减额度（请求成功即扣） ---
        // 使用 waitUntil 异步写入，不阻塞流响应
        const quotaUpdatePromise = c.env.DB.prepare(
            `UPDATE Licenses SET ai_used_today = ai_used_today + 1 WHERE license_key = ?`
        ).bind(licenseKey).run();

        // Cloudflare Workers 环境支持 ctx.waitUntil
        if ((c as any).executionCtx?.waitUntil) {
            (c as any).executionCtx.waitUntil(quotaUpdatePromise);
        } else {
            // Node.js 本地环境退化为 fire-and-forget
            quotaUpdatePromise.catch((e: any) => console.error('[AI_PROXY] 额度扣减失败:', e));
        }

        // --- Step 6: 流式透传响应 ---
        const isStream = reqBody.stream === true;

        if (isStream && upstreamRes.body) {
            // SSE 流式透传
            return new Response(upstreamRes.body, {
                status: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-AI-Quota-Remaining': String(Math.max(0, dailyQuota - usedToday - 1)),
                },
            });
        } else {
            // 非流式：直接透传 JSON
            const data = await upstreamRes.text();
            return new Response(data, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-AI-Quota-Remaining': String(Math.max(0, dailyQuota - usedToday - 1)),
                },
            });
        }

    } catch (fetchError: any) {
        console.error('[AI_PROXY] 转发请求失败:', fetchError);
        return c.json({ success: false, msg: '连接 AI 服务失败，请稍后重试: ' + fetchError.message }, 502);
    }
});

/**
 * 额度查询端点：让客户端能看到自己剩多少额度
 * GET /quota
 */
app.get('/quota', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, msg: '缺少授权令牌' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
        payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    } catch (e) {
        return c.json({ success: false, msg: '授权令牌无效或已过期' }, 401);
    }

    const licenseKey = payload.license_key;
    const aiConfig = await getAiConfig(c.env.DB);
    const today = getTodayDateStr();

    const license: any = await c.env.DB.prepare(
        `SELECT ai_daily_quota, ai_used_today, ai_last_reset_date FROM Licenses WHERE license_key = ?`
    ).bind(licenseKey).first();

    if (!license) {
        return c.json({ success: false, msg: '激活码不存在' }, 404);
    }

    const dailyQuota = license.ai_daily_quota ?? aiConfig.defaultDailyQuota;
    let usedToday = license.ai_used_today || 0;

    // 跨日自动归零
    if (license.ai_last_reset_date !== today) {
        usedToday = 0;
    }

    return c.json({
        success: true,
        quota: {
            daily_limit: dailyQuota,
            used_today: usedToday,
            remaining: Math.max(0, dailyQuota - usedToday),
        }
    });
});

export default app;
