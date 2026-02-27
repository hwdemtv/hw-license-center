import { MiddlewareHandler } from 'hono';

export interface RateLimitConfig {
    max: number;      // 窗口期内心最大请求次数
    window: number;   // 时间窗口（秒）
    keyFn?: (c: any) => string;  // 自定义限流 Key 生成逻辑
}

// 内存存储：Worker 重启会清空，但不影响防刷大局
const store = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (config: RateLimitConfig): MiddlewareHandler => {
    return async (c, next) => {
        // 默认按照 CF 的源 IP 进行限流
        const key = config.keyFn ? config.keyFn(c) : c.req.header('CF-Connecting-IP') || 'unknown-ip';
        const now = Math.floor(Date.now() / 1000);

        let record = store.get(key);

        // 初始化或过期重置
        if (!record || record.resetTime < now) {
            record = { count: 0, resetTime: now + config.window };
            store.set(key, record);
        }

        // 检查是否超出限流
        if (record.count >= config.max) {
            // 防止恶意访问无限制打日志，这里静默拦截或者只返回 429
            return c.json({
                success: false,
                msg: '请求过于频繁，请稍后重试'
            }, 429); // HTTP 429 Too Many Requests
        }

        // 计数 +1
        record.count++;
        store.set(key, record);

        await next();
    };
};
