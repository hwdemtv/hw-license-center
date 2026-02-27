import { Context, Next } from 'hono';
import { Env } from '../types';

export const adminAuthMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const expectedSecret = c.env.ADMIN_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
        return c.json({ success: false, msg: '拒绝访问：管理员鉴权拦截验证失败' }, 401);
    }

    await next();
};
