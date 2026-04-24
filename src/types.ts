export interface Env {
    DB: D1Database;
    ADMIN_SECRET: string;
    JWT_SECRET: string;
    ALLOWED_ORIGINS?: string;
    WEBHOOK_SECRET?: string;
    NODE_ENV?: string;
    RATE_LIMITER?: KVNamespace; // 限流器 KV 存储（可选，推荐生产环境启用）
    [key: string]: any;
}

// ==================== 数据库模型类型定义 ====================

/**
 * 激活码/卡密
 */
export interface License {
    license_key: string;
    product_id: string | null;
    user_name: string | null;
    status: 'active' | 'inactive' | 'revoked';
    max_devices: number;
    created_at: string;
    activated_at: string | null;
    unbind_count: number;
    last_unbind_period: string | null;
    offline_days_override: number | null;
    prebound_device_id: string | null;  // 预绑定设备ID（离线激活专用）
    risk_level: number;
    risk_threshold: number | null;
    ai_daily_quota: number | null;
    ai_used_today: number;
    ai_last_reset_date: string | null;
    ai_model_override: string | null;
    ai_key_override: string | null;
    ai_base_override: string | null;
}

/**
 * 设备绑定
 */
export interface Device {
    license_key: string;
    device_id: string;
    device_name: string;
    first_bind: string;
    last_active: string;
}

/**
 * 产品订阅
 */
export interface Subscription {
    license_key: string;
    product_id: string;
    expires_at: string | null;
    duration_days?: number | null;
}

/**
 * 系统配置
 */
export interface SystemConfig {
    key: string;
    value: string;
    label: string | null;
    category: string | null;
}

/**
 * 广播通知
 */
export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error';
    title: string;
    content: string;
    action_url: string | null;
    status: 'draft' | 'published' | 'offline';
    is_force: number;
    target_rules: string | null;
    created_at: string;
    updated_at: string;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
    success: boolean;
    msg: string;
    data?: T;
    code?: string;
}

// ==================== 辅助函数 ====================

// 辅助函数：生成随机卡密，支持传入指定前缀
export function generateLicenseKey(prefix = 'KEY'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const getChunk = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix.toUpperCase().slice(0, 5)}-${getChunk()}-${getChunk()}-${getChunk()}`;
}

// 辅助函数：生成离线激活码（长码格式: OFF-XXXX-XXXX-XXXX-XXXX）
export function generateOfflineLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const getChunk = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `OFF-${getChunk()}-${getChunk()}-${getChunk()}-${getChunk()}`;
}

// ==================== 离线激活相关 ====================

/**
 * 离线激活码数据结构
 */
export interface OfflineActivationData {
    license_key: string;      // 激活码
    device_id: string;        // 预绑定设备ID
    product_id: string;       // 产品ID
    expires_at: string | null; // 到期时间
    max_devices: number;      // 最大设备数
    offline_days: number;     // 离线天数
    generated_at: string;     // 生成时间
}

/**
 * 离线激活响应
 */
export interface OfflineActivationResponse {
    success: boolean;
    msg: string;
    license_key?: string;     // 激活码
    device_id?: string;       // 预绑定设备ID
    product_id?: string;      // 产品ID
    expires_at?: string;      // 到期时间
}
