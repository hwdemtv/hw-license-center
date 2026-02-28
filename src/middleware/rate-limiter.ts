import { MiddlewareHandler } from 'hono';

export interface RateLimitConfig {
    max: number;      // 窗口期内心最大请求次数
    window: number;   // 时间窗口（秒）
    keyFn?: (c: any) => string;  // 自定义限流 Key 生成逻辑
}

// 内存存储：Worker 重启会清空，但不影响防刷大局
const store = new Map<string, { count: number; resetTime: number }>();

// 主动垃圾回收：在支持 Timer 的环境下（如 Node.js VPS）定时清理过期条目
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        let cleaned = 0;
        for (const [k, v] of store.entries()) {
            if (v.resetTime < now) {
                store.delete(k);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`[RateLimiter] Active GC cleaned ${cleaned} expired records.`);
        }
    }, 60000); // 每 60 秒检查一次
}

export const rateLimiter = (config: RateLimitConfig): MiddlewareHandler => {
    return async (c, next) => {
        // 默认按照 CF 的源 IP 进行限流
        const key = config.keyFn ? config.keyFn(c) : c.req.header('CF-Connecting-IP') || 'unknown-ip';
        const now = Math.floor(Date.now() / 1000);

        // 冗余清理：防止在极端高并发下（定时器周期未到前）的 Map 内存溢出
        if (store.size > 2000) {
            let limit = 500; // 单词最多清理 500 条避免阻塞 Event Loop
            for (const [k, v] of store.entries()) {
                if (v.resetTime < now) {
                    store.delete(k);
                    if (--limit <= 0) break;
                }
            }
        }

        let record = store.get(key);

        // 初始化或过期重置
        if (!record || record.resetTime < now) {
            record = { count: 0, resetTime: now + config.window };
            store.set(key, record);
        }

        // 检查是否超出限流
        if (record.count >= config.max) {
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
