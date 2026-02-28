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
      `SELECT *, offline_days_override FROM Licenses WHERE license_key = ? `
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
    // 将有效期设为可配置天数，强制插件在此期间内必须联网刷一次 Token。
    // --- 签发真实的 JWT ---
    let jwtDays = 30; // 全局默认控制
    if (license.offline_days_override !== null && license.offline_days_override !== undefined) {
      // 若设订单卡专属离线特权，优先采纳此天数
      jwtDays = Number(license.offline_days_override);
    } else {
      // 未单独配置的走系统全局提取机制
      try {
        const cfg = await c.env.DB.prepare('SELECT value FROM SystemConfig WHERE key = ?').bind('jwt_offline_days').first<{ value: string }>();
        if (cfg?.value) jwtDays = parseInt(cfg.value) || 30;
      } catch (_) { }
    }

    // 如果专属天数配了0，过期时间就设为恰好满足验证当次的短期票据 (如1分钟内)
    const expTime = jwtDays <= 0
      ? Math.floor(Date.now() / 1000) + 60
      : Math.floor(Date.now() / 1000) + (jwtDays * 24 * 60 * 60);
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

    // --- Phase 12: C 端解绑额度风控逻辑 ---
    // 1. 查询激活码当前风控状态
    const licenseResult = await c.env.DB.prepare(
      `SELECT unbind_count, last_unbind_period FROM Licenses WHERE license_key = ?`
    ).bind(license_key).first();

    if (!licenseResult) {
      return c.json({ success: false, msg: '无效激活码' }, 404);
    }

    const now = new Date();
    // 格式化为 YYYY-MM 周期标识 (东八区简单处理)
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let unbindCount = licenseResult.unbind_count as number || 0;
    const lastPeriod = licenseResult.last_unbind_period as string;

    // 2. 跨月重置判定
    if (lastPeriod !== currentPeriod) {
      unbindCount = 0;
    }

    // 3. 额度校验 (从数据库读取，默认每月 3 次)
    let MAX_UNBIND_PER_MONTH = 3;
    try {
      const cfg = await c.env.DB.prepare('SELECT value FROM SystemConfig WHERE key = ?').bind('max_unbind_per_month').first<{ value: string }>();
      if (cfg?.value) MAX_UNBIND_PER_MONTH = parseInt(cfg.value) || 3;
    } catch (_) { }
    if (unbindCount >= MAX_UNBIND_PER_MONTH) {
      return c.json({
        success: false,
        msg: `解绑失败。该激活码本月自主解绑额度(${MAX_UNBIND_PER_MONTH}次)已用尽，请联系管理员或下月重试。`,
        code: 'LIMIT_EXCEEDED'
      }, 403);
    }

    // 4. 执行删除设备并原子递增计数器 (利用事务或连续操作)
    // 注意：D1 目前 batch 比较安全
    const batchResult = await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM Devices WHERE license_key = ? AND device_id = ?`).bind(license_key, device_id),
      c.env.DB.prepare(`UPDATE Licenses SET unbind_count = ?, last_unbind_period = ? WHERE license_key = ?`)
        .bind(unbindCount + 1, currentPeriod, license_key)
    ]);

    const deleteChanges = (batchResult[0].meta as any).changes;

    if (deleteChanges > 0) {
      return c.json({
        success: true,
        msg: '设备已成功解绑',
        remaining_count: MAX_UNBIND_PER_MONTH - (unbindCount + 1)
      });
    } else {
      return c.json({ success: false, msg: '未找到该设备或卡密绑定记录' }, 404);
    }
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '解绑服务遇到内部错误' }, 500);
  }
});

// API: (C端自助查询门户) 获取指定卡密的设备清单
app.get('/portal/devices', async (c) => {
  try {
    const key = c.req.query('key');
    if (!key) return c.json({ success: false, msg: '缺少激活码' }, 400);

    if (String(key).length > 128) {
      return c.json({ success: false, msg: '参数长度超限' }, 400);
    }

    // 查询该卡是否合法
    const { results: licenses } = await c.env.DB.prepare(
      `SELECT * FROM Licenses WHERE license_key = ?`
    ).bind(key).all();

    if (licenses.length === 0) {
      // 模糊提示防枚举
      return c.json({ success: false, msg: '找不到有效授权或已过期' }, 404);
    }

    const license: any = licenses[0];
    if (license.status === 'revoked') {
      return c.json({ success: false, msg: '找不到有效授权或已过期' }, 404);
    }

    // 查设备
    const { results: devices } = await c.env.DB.prepare(
      `SELECT device_id, device_name, last_active FROM Devices WHERE license_key = ? ORDER BY last_active DESC`
    ).bind(key).all();

    // 简单掩模部分设备名，保护隐私，同时回传完整 device_id 供解绑使用
    const safeDevices = devices.map((d: any) => {
      const n = String(d.device_name || '未命名设备');
      const maskedName = n.length > 3 ? n.substring(0, 3) + '***' : n + '***';
      return {
        device_id: d.device_id,
        device_name: maskedName,
        last_active: d.last_active
      };
    });

    // 计算剩余解绑额度 (从数据库读取，默认上限 3)
    let MAX_UNBIND_PER_MONTH = 3;
    try {
      const cfg = await c.env.DB.prepare('SELECT value FROM SystemConfig WHERE key = ?').bind('max_unbind_per_month').first<{ value: string }>();
      if (cfg?.value) MAX_UNBIND_PER_MONTH = parseInt(cfg.value) || 3;
    } catch (_) { }
    const now = new Date();
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    let remainingUnbinds = MAX_UNBIND_PER_MONTH;

    if (license.last_unbind_period === currentPeriod) {
      remainingUnbinds = Math.max(0, MAX_UNBIND_PER_MONTH - (license.unbind_count || 0));
    }

    return c.json({
      success: true,
      max_devices: license.max_devices,
      current_devices: safeDevices.length,
      remaining_unbinds: remainingUnbinds,
      devices: safeDevices
    });

  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '查询服务遇到内部错误' }, 500);
  }
});


export default app;