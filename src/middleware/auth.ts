import { Context, Next } from 'hono';
import { Env } from '../types';

export const adminAuthMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');

    // 优先从数据库读取密码，若未设置则回退到环境变量
    let expectedSecret = c.env.ADMIN_SECRET;
    try {
        const dbPwd = await c.env.DB.prepare('SELECT value FROM SystemConfig WHERE key = ?').bind('admin_password').first<{ value: string }>();
        if (dbPwd?.value) {
            expectedSecret = dbPwd.value;
        }
    } catch (_) {
        // 数据库读取失败时静默回退到环境变量
    }

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
        return c.json({ success: false, msg: '拒绝访问：管理员鉴权拦截验证失败' }, 401);
    }

    await next();
};
