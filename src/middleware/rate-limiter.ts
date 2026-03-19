import { MiddlewareHandler, Context } from 'hono';
import { Env } from '../types';

export interface RateLimitConfig {
    max: number;      // 窗口期内最大请求次数
    window: number;   // 时间窗口（秒）
    keyFn?: (c: Context<{ Bindings: Env }>) => string;  // 自定义限流 Key 生成逻辑
}

// 内存存储：用于 Node.js 环境或未配置 KV 时的降级方案
// 注意：在 Cloudflare Workers 多实例环境下无法全局生效
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 清理过期的内存记录
 */
function cleanupExpiredRecords(): void {
    const now = Math.floor(Date.now() / 1000);
    const keysToDelete: string[] = [];
    for (const [k, v] of memoryStore.entries()) {
        if (v.resetTime < now) {
            keysToDelete.push(k);
        }
    }
    for (const k of keysToDelete) {
        memoryStore.delete(k);
    }
}

/**
 * 使用 KV 存储的限流检查
 */
async function checkWithKV(
    kv: KVNamespace,
    key: string,
    max: number,
    window: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Math.floor(Date.now() / 1000);
    const resetTime = now + window;

    try {
        // 获取当前计数
        const stored = await kv.get(key);
        let count = stored ? parseInt(stored, 10) : 0;

        // 检查是否过期（KV TTL 会自动清理，但这里做双重检查）
        if (count >= max) {
            return { allowed: false, remaining: 0, resetTime };
        }

        // 递增计数
        count++;
        await kv.put(key, String(count), { expirationTtl: window });

        return { allowed: true, remaining: max - count, resetTime };
    } catch (error) {
        console.error('[RateLimiter] KV error:', error);
        // KV 失败时允许请求通过（降级策略）
        return { allowed: true, remaining: max - 1, resetTime };
    }
}

/**
 * 使用内存存储的限流检查
 */
function checkWithMemory(
    key: string,
    max: number,
    window: number
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Math.floor(Date.now() / 1000);
    const resetTime = now + window;

    // 惰性清理过期记录
    cleanupExpiredRecords();

    let record = memoryStore.get(key);

    // 初始化或过期重置
    if (!record || record.resetTime < now) {
        record = { count: 0, resetTime };
        memoryStore.set(key, record);
    }

    // 检查是否超出限流
    if (record.count >= max) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // 计数 +1
    record.count++;
    memoryStore.set(key, record);

    return { allowed: true, remaining: max - record.count, resetTime: record.resetTime };
}

export const rateLimiter = (config: RateLimitConfig): MiddlewareHandler<{ Bindings: Env }> => {
    return async (c, next) => {
        // 默认按照 CF 的源 IP 进行限流
        const key = config.keyFn
            ? config.keyFn(c)
            : c.req.header('CF-Connecting-IP') || 'unknown-ip';

        // 完整的限流键（包含路由信息）
        const rateLimitKey = `ratelimit:${key}:${c.req.path}`;

        let result: { allowed: boolean; remaining: number; resetTime: number };

        // 优先使用 KV（推荐生产环境）
        if (c.env.RATE_LIMITER) {
            result = await checkWithKV(c.env.RATE_LIMITER, rateLimitKey, config.max, config.window);
        } else {
            // 降级到内存存储
            // 在 Cloudflare Workers 环境下，每个实例独立，无法全局限流
            if (typeof globalThis !== 'undefined' && !(globalThis as any).process?.env?.WORKER) {
                // Node.js 环境：内存限流可以工作
            } else {
                // Workers 环境：仅记录警告，不阻断
                console.warn('[RateLimiter] 未配置 KV 存储，限流仅在单实例内生效。建议启用 RATE_LIMITER KV 绑定。');
            }
            result = checkWithMemory(rateLimitKey, config.max, config.window);
        }

        // 设置响应头（RFC 标准格式）
        c.header('X-RateLimit-Limit', String(config.max));
        c.header('X-RateLimit-Remaining', String(result.remaining));
        c.header('X-RateLimit-Reset', String(result.resetTime));

        if (!result.allowed) {
            c.header('Retry-After', String(config.window));
            return c.json({
                success: false,
                msg: '请求过于频繁，请稍后重试',
                retry_after: config.window
            }, 429);
        }

        await next();
    };
};
