import { Hono } from 'hono';
import { Env } from '../types';
import { sign } from 'hono/jwt';

const app = new Hono<{ Bindings: Env }>();

app.post('/verify', async (c) => {
  try {
    const { license_key, device_id, device_name, product_id } = await c.req.json();

    if (!license_key || !device_id) {
      return c.json({ success: false, msg: '缺少激活码或设备标识' }, 400);
    }

    // 防御性拦截：保护核心检索字段不超长，防止恶意攻击查库
    if (String(license_key).length > 128 || String(device_id).length > 128) {
      return c.json({ success: false, msg: '验证失败：核心参数长度超限' }, 400);
    }

    // 防御性温和截断：对非检索展示字段仅截取有效部分，兼容各种旧版客户端
    const safeDeviceName = device_name ? String(device_name).substring(0, 128) : '未命名设备';

    // 1. 查询激活码是否有效（不再限制必须与请求产品的初始所属权一致，实现“一卡跑全产品”跨界）
    const { results: licenses } = await c.env.DB.prepare(
      `SELECT * FROM Licenses WHERE license_key = ? `
    ).bind(license_key).all();

    if (licenses.length === 0) {
      return c.json({ success: false, msg: '激活码无效或未注册' }, 404);
    }

    const license: any = licenses[0];

    if (license.status === 'revoked') {
      return c.json({ success: false, msg: '此激活码已被官方停用' }, 403);
    }

    // --- 新增：查询该激活码下的所有产品订阅 ---
    const { results: subs } = await c.env.DB.prepare(
      `SELECT product_id, expires_at FROM Subscriptions WHERE license_key = ?`
    ).bind(license_key).all();

    const now = new Date();
    const products = subs.map((sub: any) => {
      let isExpired = false;
      if (sub.expires_at) {
        isExpired = new Date(sub.expires_at) < now;
      }
      return {
        product_id: sub.product_id,
        expires_at: sub.expires_at,
        status: isExpired ? 'expired' : 'active'
      };
    });

    // 如果没有任何有效订阅（虽然罕见），或者当前请求的特定 product_id 已明确过期，
    // 也能在这做强拦截。但为保持通用性，我们统一返回所有 products，由插件判定具体权限。

    if (license.status === 'inactive') {
      // 首次激活，更新状态
      await c.env.DB.prepare(
        `UPDATE Licenses SET status = 'active', activated_at = CURRENT_TIMESTAMP WHERE license_key = ?`
      ).bind(license_key).run();
    }

    // 2. 查询设备绑定情况
    const { results: devices } = await c.env.DB.prepare(
      `SELECT * FROM Devices WHERE license_key = ?`
    ).bind(license_key).all();

    const currentDevice = devices.find((d: any) => d.device_id === device_id);

    if (currentDevice) {
      // 已经是老设备，更新最后活跃时间
      await c.env.DB.prepare(
        `UPDATE Devices SET last_active = CURRENT_TIMESTAMP, device_name = ? WHERE license_key = ? AND device_id = ?`
      ).bind(device_name ? safeDeviceName : currentDevice.device_name, license_key, device_id).run();
    } else {
      // 3. 拦截：如果是新设备且达到数量上限
      if (devices.length >= license.max_devices) {
        return c.json({ success: false, msg: `激活失败。该激活码最多绑定 ${license.max_devices} 台设备。请先解绑其他设备。` }, 403);
      }

      // 4. 新设备绑定
      await c.env.DB.prepare(
        `INSERT INTO Devices(license_key, device_id, device_name) VALUES(?, ?, ?)`
      ).bind(license_key, device_id, safeDeviceName).run();
    }

    // --- 签发 JWT ---
    // 为了防止“时光机漏洞”，我们将服务端的标准时间签入 JWT。
    // 这里使用简单的 Base64 JSON 模拟 Token（实际项目中可替换为 `jsonwebtoken` 等库）。
    // 将有效期设为 30 天，强制插件在此期间内必须联网刷一次 Token。
    // --- 签发真实的 JWT ---
    const expTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const safePayload = {
      license_key,
      device_id,
      exp: expTime,
      server_time: new Date().toISOString()
    };

    // 强制验证是否配置了秘钥
    if (!c.env.JWT_SECRET) {
      return c.json({ success: false, msg: '服务器配置错误：未配置有效安全通讯秘钥(JWT_SECRET)' }, 500);
    }
    const trueToken = await sign(safePayload, c.env.JWT_SECRET);

    return c.json({
      success: true,
      msg: currentDevice ? '验证通过，设备已授权' : '新设备绑定成功，系统已授权',
      token: trueToken,
      products,  // 返回全部产品及其订阅状态
      server_time: new Date().toISOString()  // 额外返回当前服务器时间供插件对齐
    });

  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, msg: '验证服务遇到内部错误' }, 500);
  }
});

// API: 主动解绑当前设备
app.post('/unbind', async (c) => {
  try {
    const { license_key, device_id } = await c.req.json();

    if (!license_key || !device_id) {
      return c.json({ success: false, msg: '缺少参数' }, 400);
    }

    if (String(license_key).length > 128 || String(device_id).length > 128) {
      return c.json({ success: false, msg: '参数长度超限' }, 400);
    }

    const result = await c.env.DB.prepare(
      `DELETE FROM Devices WHERE license_key = ? AND device_id = ? `
    ).bind(license_key, device_id).run();

    if (result.meta.changes > 0) {
      return c.json({ success: true, msg: '设备已成功解绑' });
    } else {
      return c.json({ success: false, msg: '未找到该设备或卡密绑定记录' }, 404);
    }
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '解绑服务遇到内部错误' }, 500);
  }
});


export default app;