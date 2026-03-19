import { Context, Next } from 'hono';
import { Env } from '../types';
import { verifyPassword } from '../utils/crypto-helper';

export const adminAuthMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');

    // 提取客户端提供的密码
    const clientPassword = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!clientPassword) {
        return c.json({ success: false, msg: '拒绝访问：缺少认证凭据' }, 401);
    }

    // 优先从数据库读取密码哈希，若未设置则回退到环境变量
    let storedPassword: string | undefined;
    try {
        const dbPwd = await c.env.DB.prepare('SELECT value FROM SystemConfig WHERE key = ?').bind('admin_password').first<{ value: string }>();
        if (dbPwd?.value) {
            storedPassword = dbPwd.value;
        }
    } catch (_) {
        // 数据库读取失败时静默回退到环境变量
    }

    // 如果没有数据库密码，使用环境变量
    if (!storedPassword) {
        storedPassword = c.env.ADMIN_SECRET;
    }

    if (!storedPassword) {
        console.error('[AUTH_ERROR] 未配置管理员密码');
        return c.json({ success: false, msg: '服务器配置错误' }, 500);
    }

    // 验证密码
    const isValid = await verifyPassword(clientPassword, storedPassword);

    if (!isValid) {
        return c.json({ success: false, msg: '拒绝访问：管理员鉴权拦截验证失败' }, 401);
    }

    await next();
};
