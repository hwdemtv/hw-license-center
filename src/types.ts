export interface Env {
    DB: D1Database;
    ADMIN_SECRET: string;
    JWT_SECRET: string;
    ALLOWED_ORIGINS?: string;
    WEBHOOK_SECRET?: string;
}

// 辅助函数：生成随机卡密，支持传入指定前缀
export function generateLicenseKey(prefix = 'KEY'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const getChunk = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix.toUpperCase().slice(0, 5)}-${getChunk()}-${getChunk()}-${getChunk()}`;
}
