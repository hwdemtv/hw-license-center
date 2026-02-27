import { Context, Next } from 'hono';

export const loggerMiddleware = async (c: Context, next: Next) => {
    const start = Date.now();
    await next();
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} - ${Date.now() - start}ms`);
};
