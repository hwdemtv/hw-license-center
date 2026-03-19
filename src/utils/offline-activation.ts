/**
 * 离线激活码工具函数
 * 用于生成和验证离线激活码
 */

import { OfflineActivationData } from '../types';

/**
 * 生成签名
 * 使用 HMAC-SHA256 对离线激活数据进行签名
 */
export async function generateSignature(data: OfflineActivationData, secret: string): Promise<string> {
    const payload = JSON.stringify({
        license_key: data.license_key,
        device_id: data.device_id,
        product_id: data.product_id,
        expires_at: data.expires_at,
        max_devices: data.max_devices,
        offline_days: data.offline_days,
        generated_at: data.generated_at
    });

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    // 导入密钥
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // 生成签名
    const signature = await crypto.subtle.sign('HMAC', key, messageData);

    // 转换为 Base64
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * 验证签名
 */
export async function verifySignature(data: OfflineActivationData, signature: string, secret: string): Promise<boolean> {
    const expectedSignature = await generateSignature(data, secret);
    return expectedSignature === signature;
}

/**
 * 生成离线激活令牌
 * 将激活数据和签名打包成 Base64 令牌
 */
export async function generateOfflineToken(data: OfflineActivationData, secret: string): Promise<string> {
    const signature = await generateSignature(data, secret);
    const token = {
        ...data,
        signature
    };
    return btoa(JSON.stringify(token));
}

/**
 * 解析离线激活令牌
 */
export function parseOfflineToken(token: string): (OfflineActivationData & { signature: string }) | null {
    try {
        const decoded = atob(token);
        const data = JSON.parse(decoded);
        if (!data.license_key || !data.device_id || !data.signature) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

/**
 * 验证离线激活令牌
 */
export async function verifyOfflineToken(
    token: string,
    secret: string
): Promise<{ valid: boolean; data?: OfflineActivationData; error?: string }> {
    const parsed = parseOfflineToken(token);
    if (!parsed) {
        return { valid: false, error: '无效的激活令牌格式' };
    }

    const { signature, ...data } = parsed;

    // 检查是否过期
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, error: '激活令牌已过期' };
    }

    // 验证签名
    const isValid = await verifySignature(data, signature, secret);
    if (!isValid) {
        return { valid: false, error: '签名验证失败' };
    }

    return { valid: true, data };
}
