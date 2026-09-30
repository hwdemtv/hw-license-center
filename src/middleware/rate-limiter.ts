import { MiddlewareHandler, Context } from 'hono';
import { Env } from '../types';

export interface RateLimitConfig {
    max: number;      // 窗口期内最大请求次数
    window: number;   // 时间窗口（秒）
    keyFn?: (c: Context<{ Bindings: Env }>) => string;  // 自定义限流 Key 生成逻辑
}

/**
 * 将客户端 IP 归一为稳定的限流桶：
 * - IPv6: 取 /64 前缀。客户端（如 Windows 隐私临时地址）会按连接轮换 IPv6 后 64 位，
 *   若用完整地址做键，同一用户每个连接都是新键，限流失效且存储无限膨胀。
 * - IPv4-mapped IPv6 (::ffff:x.x.x.x) 与 IPv4: 使用完整地址。
 */
function getClientBucket(ip: string): string {
    let addr = ip.replace(/%.*$/, '').replace(/^\[/, '').replace(/\]$/, '');
    if (!addr.includes(':')) return addr; // IPv4
    if (addr.toLowerCase().startsWith('::ffff:')) {
        const v4 = addr.slice(7);
        return v4.includes('.') ? v4 : addr;
    }
    // 展开 '::' 缩写为完整 8 组
    if (addr.includes('::')) {
        const parts = addr.split('::');
        const head = parts[0] ? parts[0].split(':') : [];
        const tail = parts[1] ? parts[1].split(':') : [];
        const missing = Math.max(0, 8 - head.length - tail.length);
        addr = [...head, ...Array(missing).fill('0'), ...tail].join(':');
    }
    const groups = addr.split(':');
    return groups.length >= 4 ? groups.slice(0, 4).join(':') : addr;
}

/**
 * 使用 D1 的原子限流检查（UPSERT + RETURNING 单语句完成计数）
 * D1 免费额度(10万行写入/天)与 KV(1000写/天)配额相互独立，作为主路径可大幅降低 KV 消耗。
 */
async function checkWithD1(
    db: D1Database,
    key: string,
    max: number,
    window: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Math.floor(Date.now() / 1000);
    const resetTime = now + window;

    const row = await db.prepare(
        `INSERT INTO RateLimit(key, count, reset_at) VALUES(?1, 1, ?2)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN reset_at <= ?3 THEN 1 ELSE count + 1 END,
           reset_at = CASE WHEN reset_at <= ?3 THEN ?2 ELSE reset_at END
         RETURNING count as cnt`
    ).bind(key, resetTime, now).first<{ cnt: number }>();

    const count = row?.cnt || 0;

    // 惰性清理：约 1% 的请求顺带清扫一小时前的过期行，防止表无限膨胀
    if (Math.random() < 0.01) {
        db.prepare(`DELETE FROM RateLimit WHERE reset_at < ?`).bind(now - 3600).run()
            .catch((e: any) => console.error('[RateLimiter] 清理过期记录失败:', e));
    }

    return { allowed: count <= max, remaining: Math.max(0, max - count), resetTime };
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
        // 默认按照 CF 的源 IP 进行限流（IPv6 归一 /64 网段，防隐私地址轮换绕过）
        const clientKey = config.keyFn
            ? config.keyFn(c)
            : getClientBucket(c.req.header('CF-Connecting-IP') || 'unknown-ip');

        // 完整的限流键（包含路由信息）
        const rateLimitKey = `ratelimit:${clientKey}:${c.req.path}`;

        let result: { allowed: boolean; remaining: number; resetTime: number } | null = null;

        // ---------- 第 1 层：D1 原子计数（配额独立于 KV，单语句 UPSERT） ----------
        if (c.env.DB) {
            try {
                result = await checkWithD1(c.env.DB, rateLimitKey, config.max, config.window);
            } catch (error) {
                // D1 不可用或缺表（如未迁移的旧库）时降级，不阻断业务
                console.error('[RateLimiter] D1 tier error, falling back:', error);
            }
        }

        if (!result) {
            // ---------- 第 2 层：KV 存储 ----------
            if (c.env.RATE_LIMITER) {
                result = await checkWithKV(c.env.RATE_LIMITER, rateLimitKey, config.max, config.window);
            } else {
                // ---------- 第 3 层：内存存储（Node.js 本地环境） ----------
                result = checkWithMemory(rateLimitKey, config.max, config.window);
            }
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
