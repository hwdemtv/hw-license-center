import { Hono } from 'hono';
import { Env, generateLicenseKey } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Webhook 鉴权中间件（密钥优先从 SystemConfig 动态获取，回退到 .env）
app.use('/pay', async (c, next) => {
    // 1. 优先尝试从 SystemConfig 获取最新密钥（支持热轮换）
    let secret = '';
    try {
        const cfg = await c.env.DB.prepare(
            "SELECT value FROM SystemConfig WHERE key = ?"
        ).bind('webhook_secret').first<{ value: string }>();
        if (cfg?.value) secret = cfg.value;
    } catch (_) { }

    // 2. 回退到环境变量（兼容未初始化 DB 的场景）
    if (!secret) secret = c.env.WEBHOOK_SECRET || '';

    if (!secret) {
        return c.json({ success: false, msg: '服务器未配置 Webhook 秘钥（请在管理后台 SystemConfig 或 .env 中设置）' }, 500);
    }

    // 支持从 Header (Bearer) 或 Query 参数中获取 token
    const authHeader = c.req.header('Authorization');
    const queryToken = c.req.query('token');

    let providedToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
        providedToken = authHeader.substring(7);
    } else if (queryToken) {
        providedToken = queryToken;
    }

    if (providedToken !== secret) {
        return c.json({ success: false, msg: 'Webhook 身份验证失败' }, 401);
    }

    await next();
});

/**
 * API: 支付成功回调发卡接口
 * 接收参数:
 * - product_id: 产品 ID
 * - count: 购卡数量 (1-50)
 * - max_devices: 单卡设备数
 * - duration_days: 订阅时长 (天)
 * - out_trade_no: 外部订单号 (用于填入 user_name 备注)
 */
app.post('/pay', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const {
            product_id = 'default',
            count = 1,
            max_devices = 2,
            duration_days,
            out_trade_no = 'webhook_auto'
        } = body;

        const safeCount = Math.min(50, Math.max(1, parseInt(count) || 1));
        const safeMaxDevices = Math.max(1, parseInt(max_devices) || 1);

        const generatedKeys: string[] = [];
        const statements: any[] = [];

        let expiresAt: string | null = null;
        if (duration_days && !isNaN(parseInt(duration_days)) && parseInt(duration_days) > 0) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(duration_days));
            expiresAt = date.toISOString();
        }

        for (let i = 0; i < safeCount; i++) {
            const newKey = generateLicenseKey(product_id);
            generatedKeys.push(newKey);

            statements.push(
                c.env.DB.prepare(`INSERT INTO Licenses(license_key, product_id, user_name, status, max_devices) VALUES(?, ?, ?, 'active', ?)`)
                    .bind(newKey, product_id, out_trade_no, safeMaxDevices)
            );

            statements.push(
                c.env.DB.prepare(`INSERT INTO Subscriptions(license_key, product_id, expires_at) VALUES(?, ?, ?)`)
                    .bind(newKey, product_id, expiresAt)
            );
        }

        // 使用 DBAdapter 的 batch 方法执行 (如果是 Node 环境会自动开启事务)
        await c.env.DB.batch(statements);

        // 返回适配发卡网的格式
        return c.json({
            success: true,
            msg: 'success',
            order_no: out_trade_no,
            keys: generatedKeys,
            // 额外返回一个纯文本拼接字符串，适配某些仅能提取单一文本字段的旧版发卡网
            text_result: generatedKeys.join('\n')
        });

    } catch (e: any) {
        console.error('Webhook Pay Error:', e);
        return c.json({ success: false, msg: '内部发卡失败', error: e.message }, 500);
    }
});

export default app;
