/**
 * 密码哈希工具 - 兼容 Cloudflare Workers 和 Node.js
 * 使用 PBKDF2 + SHA-256 进行密码哈希
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 64; // 512 bits
const SALT_LENGTH = 16;

/**
 * 将 ArrayBuffer 转换为十六进制字符串
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将字符串转换为 ArrayBuffer
 */
function textToBuffer(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * 使用 PBKDF2 派生密钥
 */
async function pbkdf2(password: string, salt: Uint8Array, iterations: number, keyLength: number): Promise<ArrayBuffer> {
  // 获取密码密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textToBuffer(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // 派生密钥
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    keyLength * 8 // bits
  );
}

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 哈希后的密码 (格式: iterations$salt$hash)
 */
export async function hashPassword(password: string): Promise<string> {
  // 生成随机盐
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // 派生密钥
  const hash = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH);

  // 返回格式: iterations$hexSalt$hexHash
  return `${ITERATIONS}$${bufferToHex(salt)}$${bufferToHex(hash)}`;
}

/**
 * 验证密码
 * @param password 明文密码
 * @param storedHash 存储的哈希 (格式: iterations$salt$hash)
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // 解析存储的哈希
    const parts = storedHash.split('$');
    if (parts.length !== 3) {
      // 兼容旧版明文密码（迁移期间）
      console.warn('[SECURITY] 检测到明文密码格式，建议尽快更新');
      return password === storedHash;
    }

    const iterations = parseInt(parts[0], 10);
    const saltHex = parts[1];
    const expectedHashHex = parts[2];

    // 将十六进制转换为 Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const expectedHash = new Uint8Array(expectedHashHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    // 使用相同参数派生密钥
    const actualHash = await pbkdf2(password, salt, iterations, KEY_LENGTH);
    const actualHashArray = new Uint8Array(actualHash);

    // 常量时间比较，防止计时攻击
    if (actualHashArray.length !== expectedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < actualHashArray.length; i++) {
      result |= actualHashArray[i] ^ expectedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('[CRYPTO_ERROR] 密码验证失败:', error);
    return false;
  }
}

/**
 * 检查密码是否已加密
 */
export function isHashedPassword(stored: string): boolean {
  return stored.includes('$') && stored.split('$').length === 3;
}
