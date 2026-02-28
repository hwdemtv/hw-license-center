import { Context, Next } from 'hono';

export const errorReporter = async (c: Context, next: Next) => {
    try {
        await next();
    } catch (err: any) {
        const requestInfo = {
            method: c.req.method,
            url: c.req.url,
            ip: c.req.header('CF-Connecting-IP') || 'unknown',
            timestamp: new Date().toISOString(),
            message: err.message,
            stack: err.stack
        };

        // 在控制台输出结构化错误，方便检索
        console.error(`[CRITICAL_ERROR] ${JSON.stringify(requestInfo)}`);

        // 如果配置了 Sentry 等，可以在此处添加
        // if (c.env?.SENTRY_DSN) { ... }

        return c.json({
            success: false,
            msg: '服务器内部错误，请联系管理员',
            request_id: c.req.header('cf-ray') || 'local-debug'
        }, 500);
    }
};
