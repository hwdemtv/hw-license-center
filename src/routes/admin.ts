import { Hono } from 'hono';
import { Env, generateLicenseKey } from '../types';

const app = new Hono<{ Bindings: Env }>();

// API: (管理员) 自动生成新激活码
app.post('/generate', async (c) => {
  try {

    const { max_devices = 2, count = 1, product_id = 'default', user_name = '', duration_days } = await c.req.json().catch(() => ({}));
    const generatedKeys: string[] = [];
    const statements: D1PreparedStatement[] = [];

    // 计算到期时间（如果有传入 duration_days）
    let expiresAt: string | null = null;
    if (duration_days && typeof duration_days === 'number' && duration_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + duration_days);
      expiresAt = date.toISOString();
    }

    // 批量生成卡密并构建语句
    for (let i = 0; i < count; i++) {
      const newKey = generateLicenseKey(product_id || 'KEY');
      generatedKeys.push(newKey);

      // 1. 插入 Licenses 表
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO Licenses(license_key, product_id, user_name, status, max_devices) VALUES(?, ?, ?, 'active', ?)`
        ).bind(newKey, product_id, user_name, max_devices)
      );

      // 2. 插入对应的 Subscriptions 记录
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO Subscriptions(license_key, product_id, expires_at) VALUES(?, ?, ?)`
        ).bind(newKey, product_id, expiresAt)
      );
    }

    // 使用 D1 batch 批量执行，性能远优于逐条插入
    await c.env.DB.batch(statements);

    return c.json({
      success: true,
      msg: `成功生成 ${count} 个激活码`,
      keys: generatedKeys
    });

  } catch (error: any) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, msg: '卡密生成冲突，请重试' }, 500);
    }
    console.error('API Error:', error.message, error.stack);
    return c.json({ success: false, msg: '生成卡密时遇到内部错误' }, 500);
  }
});



// API: (管理员) 服务端分页专用查询接口 (Phase 11.5)
app.get('/licenses', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1') || 1;
    const limit = parseInt(c.req.query('limit') || '20') || 20;
    const search = (c.req.query('search') || '').trim();
    const productId = c.req.query('product_id') || '';
    const status = c.req.query('status') || 'all';
    const sort = c.req.query('sort') || 'created_desc';

    const offset = (page - 1) * limit;

    // 1. 构建基础 WHERE 条件
    let whereClauses: string[] = ['1=1'];
    let params: any[] = [];

    if (productId) {
      whereClauses.push('l.product_id = ?');
      params.push(productId);
    }

    if (search) {
      whereClauses.push('(l.license_key LIKE ? OR l.user_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // 状态过滤 (复刻原有前端逻辑)
    if (status === 'active') {
      whereClauses.push('l.status = ?');
      params.push('active');
    } else if (status === 'revoked') {
      whereClauses.push('l.status = ?');
      params.push('revoked');
    } else if (status === 'expiring') {
      // 临期判定：关联 Subscriptions 查找7天内过期的
      whereClauses.push(`
        EXISTS (
          SELECT 1 FROM Subscriptions s 
          WHERE s.license_key = l.license_key 
            AND s.expires_at IS NOT NULL 
            AND datetime(s.expires_at) > datetime('now')
            AND datetime(s.expires_at) <= datetime('now', '+7 days')
        )
      `);
    }

    const whereSql = whereClauses.join(' AND ');

    // 2. 聚合统计看板快照 (全局，忽略当前分页但是带WHERE过滤)
    // 但为了不改变用户预期，看板统计通常需要基于无检索状态下的全局快照。
    // 这里我们返回一个经过筛选的 total 数，以及全局无检索状态下的四个看板数
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM Licenses) as global_total,
        (SELECT COUNT(*) FROM Licenses WHERE status = 'active') as global_active,
        (SELECT COUNT(*) FROM Licenses WHERE status = 'revoked') as global_revoked,
        (SELECT COUNT(DISTINCT l.license_key) FROM Licenses l 
         INNER JOIN Subscriptions s ON l.license_key = s.license_key 
         WHERE s.expires_at IS NOT NULL 
           AND datetime(s.expires_at) > datetime('now') 
           AND datetime(s.expires_at) <= datetime('now', '+7 days')
        ) as global_expiring,
        (SELECT COUNT(*) FROM Licenses l WHERE ${whereSql}) as current_filter_total
    `;

    // 执行看板统计和当前过滤条件下的总数查询
    const statsResult = await c.env.DB.prepare(statsQuery).bind(...params).first();
    const filterTotal = (statsResult?.current_filter_total as number) || 0;

    // 3. 构建排序规则
    let orderSql = 'ORDER BY l.created_at DESC';
    if (sort === 'created_asc') orderSql = 'ORDER BY l.created_at ASC';
    else if (sort === 'devices_desc') orderSql = 'ORDER BY current_devices DESC';

    // 4. 拉取当前页数据
    const dataQuery = `
      SELECT 
        l.*, 
        (SELECT COUNT(*) FROM Devices d WHERE d.license_key = l.license_key) as current_devices,
        (
          SELECT json_group_array(
            json_object('product_id', s.product_id, 'expires_at', s.expires_at)
          )
          FROM Subscriptions s 
          WHERE s.license_key = l.license_key
        ) as subs_json
      FROM Licenses l
      WHERE ${whereSql}
      ${orderSql}
      LIMIT ? OFFSET ?
    `;

    // params 后面追加 limit 和 offset
    const { results } = await c.env.DB.prepare(dataQuery).bind(...params, limit, offset).all();

    const formattedResults = results.map((row: any) => ({
      ...row,
      subscriptions: row.subs_json ? JSON.parse(row.subs_json) : []
    }));

    return c.json({
      success: true,
      data: formattedResults,
      pagination: {
        total: filterTotal,
        current_page: page,
        limit: limit,
        total_pages: Math.ceil(filterTotal / limit)
      },
      stats: {
        total: statsResult?.global_total || 0,
        active: statsResult?.global_active || 0,
        revoked: statsResult?.global_revoked || 0,
        expiring: statsResult?.global_expiring || 0
      }
    });

  } catch (error) {
    console.error('Paged API Error:', error);
    return c.json({ success: false, msg: '获取分页数据失败' }, 500);
  }
});

// API: (管理员) 获取特定卡密的绑定设备明细列表
app.get('/licenses/:key/devices', async (c) => {
  try {
    const licenseKey = c.req.param('key');
    if (!licenseKey) return c.json({ success: false, msg: '未提供卡密' }, 400);

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM Devices WHERE license_key = ? ORDER BY last_active DESC`
    ).bind(licenseKey).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('获取设备列表出错', error);
    return c.json({ success: false, msg: '获取设备明细失败' }, 500);
  }
});

// API: (管理员) 单兵剔除/强行解绑特定设备
app.delete('/licenses/:key/devices/:deviceId', async (c) => {
  try {
    const licenseKey = c.req.param('key');
    const deviceId = c.req.param('deviceId');
    if (!licenseKey || !deviceId) return c.json({ success: false, msg: '参数不全' }, 400);

    const result = await c.env.DB.prepare(
      `DELETE FROM Devices WHERE license_key = ? AND device_id = ?`
    ).bind(licenseKey, deviceId).run();

    if (result.meta?.changes > 0) {
      return c.json({ success: true, msg: '该设备已被强制剔除' });
    } else {
      return c.json({ success: false, msg: '未找到该设备记录' }, 404);
    }
  } catch (error) {
    console.error('单兵解绑失败', error);
    return c.json({ success: false, msg: '解绑操作遇到错误' }, 500);
  }
});

// API: (管理员) 修改卡密状态 (例如封禁、解封)
app.post('/licenses/status', async (c) => {
  try {

    const { license_key, status } = await c.req.json();
    if (!license_key || !['active', 'inactive', 'revoked'].includes(status)) {
      return c.json({ success: false, msg: '参数不合法' }, 400);
    }

    const result = await c.env.DB.prepare(
      `UPDATE Licenses SET status = ? WHERE license_key = ? `
    ).bind(status, license_key).run();

    if (result.meta?.changes > 0) {
      return c.json({ success: true, msg: `状态已更新为 ${status} ` });
    } else {
      return c.json({ success: false, msg: '找不到对应激活码' }, 404);
    }
  } catch (error) {
    return c.json({ success: false, msg: '更新状态失败' }, 500);
  }
});

// API: (管理员) 修改用户备注
app.post('/licenses/user', async (c) => {
  try {

    const { license_key, user_name } = await c.req.json();
    if (!license_key) {
      return c.json({ success: false, msg: '参数不合法' }, 400);
    }

    const result = await c.env.DB.prepare(
      `UPDATE Licenses SET user_name = ? WHERE license_key = ? `
    ).bind(user_name, license_key).run();

    if (result.meta?.changes > 0) {
      return c.json({ success: true, msg: '备注已更新' });
    } else {
      return c.json({ success: false, msg: '找不到对应激活码' }, 404);
    }
  } catch (error) {
    return c.json({ success: false, msg: '更新备注失败' }, 500);
  }
});

// API: (管理员) 彻底删除卡密及其所有设备数据
app.delete('/licenses', async (c) => {
  try {

    const { license_key } = await c.req.json();
    if (!license_key) {
      return c.json({ success: false, msg: '参数缺失' }, 400);
    }

    // 利用批处理事务保证原子性：先删设备，再删主许可证
    const batch = await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM Devices WHERE license_key = ? `).bind(license_key),
      c.env.DB.prepare(`DELETE FROM Licenses WHERE license_key = ? `).bind(license_key)
    ]);

    // batch 返回的结果是一个数组，第二个是对 Licenses 的操作结果
    if (batch[1].meta?.changes > 0) {
      return c.json({ success: true, msg: '激活码及关联数据已销毁' });
    } else {
      return c.json({ success: false, msg: '找不到对应激活码' }, 404);
    }
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '销毁数据失败' }, 500);
  }
});


// API: (管理员) 批量导入激活码数据
app.post('/licenses/import', async (c) => {
  try {

    const { licenses } = await c.req.json();
    if (!Array.isArray(licenses)) {
      return c.json({ success: false, msg: '数据格式错误，期望一个包含 licenses 数组的 JSON' }, 400);
    }

    // 防御：单次导入数量限制
    if (licenses.length > 2000) {
      return c.json({ success: false, msg: '单次导入不得超过 2000 条数据，防止资源耗尽' }, 400);
    }

    const statements: any[] = []; // D1PreparedStatement

    for (const lic of licenses) {
      if (!lic.license_key) continue;
      // 超长卡密跳过，防撑爆
      if (String(lic.license_key).length > 100) continue;

      // 1. Upsert 到 Licenses 表 (使用 INSERT OR REPLACE)
      statements.push(
        c.env.DB.prepare(
          `INSERT OR REPLACE INTO Licenses (license_key, product_id, max_devices, user_name, status, created_at)
           VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`
        ).bind(
          lic.license_key,
          lic.product_id || 'UNKNOWN',
          lic.max_devices || 1,
          lic.user_name || null,
          lic.status || 'active',
          lic.created_at || null
        )
      );

      // 2. 清理可能已存在的旧订阅
      statements.push(
        c.env.DB.prepare(`DELETE FROM Subscriptions WHERE license_key = ?`).bind(lic.license_key)
      );

      // 3. 插入新的订阅列表
      if (Array.isArray(lic.subscriptions)) {
        for (const sub of lic.subscriptions) {
          if (!sub.product_id) continue;
          statements.push(
            c.env.DB.prepare(
              `INSERT INTO Subscriptions (license_key, product_id, expires_at) VALUES (?, ?, ?)`
            ).bind(lic.license_key, sub.product_id, sub.expires_at || null)
          );
        }
      }
    }

    if (statements.length > 0) {
      // D1 的 batch 有单次上限限制，分块处理更稳妥
      const BATCH_SIZE = 50;
      for (let i = 0; i < statements.length; i += BATCH_SIZE) {
        const chunk = statements.slice(i, i + BATCH_SIZE);
        await c.env.DB.batch(chunk);
      }
    }

    return c.json({ success: true, msg: `成功导入/覆盖了 ${licenses.length} 个激活码资产` });
  } catch (error: any) {
    console.error('Import Error:', error);
    return c.json({ success: false, msg: '导入时遇到错误：' + error.message }, 500);
  }
});


// ==========================================
// API: (管理员) 一码多产品订阅管理 (Subscriptions)
// ==========================================

// 1. 添加/续费产品订阅 (Upsert 逻辑：若已有则时间累加，若无则新建)
app.post('/subscriptions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader !== `Bearer \${ c.env.ADMIN_SECRET } `) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

    const { license_key, product_id, duration_days } = await c.req.json();
    if (!license_key || !product_id) {
      return c.json({ success: false, msg: '缺少必备参数' }, 400);
    }

    // 防御：参数超长拦截
    if (String(license_key).length > 100 || String(product_id).length > 100) {
      return c.json({ success: false, msg: '参数长度超出上限' }, 400);
    }

    // 查询该卡密是否已存在此产品的订阅
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM Subscriptions WHERE license_key = ? AND product_id = ? `
    ).bind(license_key, product_id).all();

    let newExpiresAt: string | null = null;
    const now = new Date();

    if (duration_days && typeof duration_days === 'number') {
      if (results.length > 0 && results[0].expires_at) {
        // 已有记录且非永久：在其原到期日和今天之间取较大者，再累加天数 (无缝续费)
        const currentExp = new Date(results[0].expires_at as string);
        const baseDate = currentExp > now ? currentExp : now;
        baseDate.setDate(baseDate.getDate() + duration_days);
        newExpiresAt = baseDate.toISOString();
      } else if (results.length > 0 && !results[0].expires_at) {
        // 已经是永久买断了，无需续费
        return c.json({ success: false, msg: '该产品已经是永久有效，无需续费' }, 400);
      } else {
        // 全新订阅
        now.setDate(now.getDate() + duration_days);
        newExpiresAt = now.toISOString();
      }
    }

    if (results.length > 0) {
      // 执行 UPDATE (续期)
      await c.env.DB.prepare(
        `UPDATE Subscriptions SET expires_at = ? WHERE license_key = ? AND product_id = ? `
      ).bind(newExpiresAt, license_key, product_id).run();
    } else {
      // 执行 INSERT (新增)
      await c.env.DB.prepare(
        `INSERT INTO Subscriptions(license_key, product_id, expires_at) VALUES(?, ?, ?)`
      ).bind(license_key, product_id, newExpiresAt).run();
    }

    return c.json({ success: true, msg: '产品订阅已成功更新', expires_at: newExpiresAt });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '订阅管理遇到错误' }, 500);
  }
});

// 2. 移除指定产品的订阅
app.delete('/subscriptions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader !== `Bearer \${ c.env.ADMIN_SECRET } `) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

    const { license_key, product_id } = await c.req.json();
    const result = await c.env.DB.prepare(
      `DELETE FROM Subscriptions WHERE license_key = ? AND product_id = ? `
    ).bind(license_key, product_id).run();

    if (result.meta.changes > 0) {
      return c.json({ success: true, msg: '产品订阅已移除' });
    } else {
      return c.json({ success: false, msg: '未找到该产品的订阅记录' }, 404);
    }
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '移除订阅失败' }, 500);
  }
});


// ==========================================
// API: (管理员) 通用批量操作接口
// ==========================================
app.post('/licenses/batch', async (c) => {
  try {
    const { keys, action, params } = await c.req.json();

    // 基本参数校验
    if (!Array.isArray(keys) || keys.length === 0) {
      return c.json({ success: false, msg: '未选择任何卡密' }, 400);
    }
    if (!action || typeof action !== 'string') {
      return c.json({ success: false, msg: '缺少操作类型' }, 400);
    }

    // 安全上限：单次最多操作 500 条
    if (keys.length > 500) {
      return c.json({ success: false, msg: '单次批量操作不能超过 500 条' }, 400);
    }

    // 安全检查：仅允许白名单内置操作
    const validActions = ['revoke', 'restore', 'delete', 'unbind', 'set_max_devices', 'set_user_name', 'add_subscription', 'remove_subscription'];
    if (!validActions.includes(action)) {
      return c.json({ success: false, msg: '非法或尚未支持的批量操作指令' }, 400);
    }

    const statements: D1PreparedStatement[] = [];
    let successMsg = '';

    switch (action) {
      // 1. 批量吊销
      case 'revoke':
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`UPDATE Licenses SET status = 'revoked' WHERE license_key = ?`).bind(key)
          );
        });
        successMsg = `已吊销 ${keys.length} 个卡密`;
        break;

      // 2. 批量恢复
      case 'restore':
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`UPDATE Licenses SET status = 'active' WHERE license_key = ?`).bind(key)
          );
        });
        successMsg = `已恢复 ${keys.length} 个卡密`;
        break;

      // 3. 批量删除（级联删除设备 + 订阅 + 主记录）
      case 'delete':
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`DELETE FROM Devices WHERE license_key = ?`).bind(key),
            c.env.DB.prepare(`DELETE FROM Subscriptions WHERE license_key = ?`).bind(key),
            c.env.DB.prepare(`DELETE FROM Licenses WHERE license_key = ?`).bind(key)
          );
        });
        successMsg = `已彻底销毁 ${keys.length} 个卡密及其所有关联数据`;
        break;

      // 4. 批量解绑设备
      case 'unbind':
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`DELETE FROM Devices WHERE license_key = ?`).bind(key)
          );
        });
        successMsg = `已清空 ${keys.length} 个卡密的所有设备绑定`;
        break;

      // 5. 批量修改设备上限
      case 'set_max_devices': {
        const maxDevices = parseInt(params?.max_devices);
        if (!maxDevices || maxDevices < 1 || maxDevices > 100) {
          return c.json({ success: false, msg: '设备上限必须在 1-100 之间' }, 400);
        }
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`UPDATE Licenses SET max_devices = ? WHERE license_key = ?`).bind(maxDevices, key)
          );
        });
        successMsg = `已将 ${keys.length} 个卡密的设备上限统一调整为 ${maxDevices} 台`;
        break;
      }

      // 6. 批量修改备注
      case 'set_user_name': {
        // 温和截断防爆
        const userName = params?.user_name ? String(params.user_name).substring(0, 150) : '';
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`UPDATE Licenses SET user_name = ? WHERE license_key = ?`).bind(userName, key)
          );
        });
        successMsg = `已将 ${keys.length} 个卡密的备注统一设置为 "${userName || '(空)'}"`;
        break;
      }

      // 7. 批量续费/添加产品订阅
      case 'add_subscription': {
        const productId = params?.product_id;
        const durationDays = parseInt(params?.duration_days);
        if (!productId) {
          return c.json({ success: false, msg: '缺少产品 ID' }, 400);
        }
        let expiresAt: string | null = null;
        if (durationDays && durationDays > 0) {
          const date = new Date();
          date.setDate(date.getDate() + durationDays);
          expiresAt = date.toISOString();
        }
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(
              `INSERT INTO Subscriptions (license_key, product_id, expires_at)
               VALUES (?, ?, ?)
               ON CONFLICT(license_key, product_id)
               DO UPDATE SET expires_at = excluded.expires_at`
            ).bind(key, productId, expiresAt)
          );
        });
        const dateLabel = expiresAt ? new Date(expiresAt).toLocaleDateString() : '永久';
        successMsg = `已为 ${keys.length} 个卡密添加 [${productId}] 产品权限 (${dateLabel})`;
        break;
      }

      // 8. 批量移除产品订阅
      case 'remove_subscription': {
        const rmProductId = params?.product_id;
        if (!rmProductId) {
          return c.json({ success: false, msg: '缺少要移除的产品 ID' }, 400);
        }
        keys.forEach((key: string) => {
          statements.push(
            c.env.DB.prepare(`DELETE FROM Subscriptions WHERE license_key = ? AND product_id = ?`).bind(key, rmProductId)
          );
        });
        successMsg = `已从 ${keys.length} 个卡密中移除 [${rmProductId}] 产品权限`;
        break;
      }

      default:
        return c.json({ success: false, msg: '不支持的操作类型: ' + action }, 400);
    }

    // 使用 D1 batch 分片执行，每批最多 50 条语句
    if (statements.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < statements.length; i += BATCH_SIZE) {
        const chunk = statements.slice(i, i + BATCH_SIZE);
        await c.env.DB.batch(chunk);
      }
    }

    return c.json({ success: true, msg: successMsg });
  } catch (error: any) {
    console.error('Batch Error:', error);
    return c.json({ success: false, msg: '批量操作失败: ' + (error.message || '未知错误') }, 500);
  }
});


// ===================== 系统设置 API =====================

// 读取全部配置
app.get('/settings', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT key, value, label, category FROM SystemConfig ORDER BY category, key').all();
    // 密码字段不返回明文给前端
    const settings = (result.results || []).map((r: any) => ({
      ...r,
      value: r.key === 'admin_password' ? (r.value ? '••••••••' : '') : r.value
    }));
    return c.json({ success: true, settings });
  } catch (e: any) {
    return c.json({ success: false, msg: '读取配置失败: ' + e.message }, 500);
  }
});

// 批量更新配置
app.put('/settings', async (c) => {
  try {
    const body = await c.req.json();
    const { updates, old_password } = body; // updates: { key: value, ... }

    if (!updates || typeof updates !== 'object') {
      return c.json({ success: false, msg: '参数格式错误' }, 400);
    }

    // 若修改密码，需校验旧密码
    if ('admin_password' in updates && updates.admin_password) {
      if (!old_password) {
        return c.json({ success: false, msg: '修改密码必须提供旧密码' }, 400);
      }
      // 先从 DB 读取当前密码
      const current = await c.env.DB.prepare('SELECT value FROM SystemConfig WHERE key = ?').bind('admin_password').first<{ value: string }>();
      const currentPwd = current?.value || c.env.ADMIN_SECRET || '';
      if (old_password !== currentPwd) {
        return c.json({ success: false, msg: '旧密码验证失败' }, 403);
      }
    }

    // 构建批量 UPSERT 语句
    const stmts = Object.entries(updates).map(([key, value]) =>
      c.env.DB.prepare('INSERT OR REPLACE INTO SystemConfig (key, value, label, category) VALUES (?, ?, (SELECT label FROM SystemConfig WHERE key = ?), (SELECT category FROM SystemConfig WHERE key = ?))').bind(key, String(value), key, key)
    );

    if (stmts.length > 0) {
      await c.env.DB.batch(stmts);
    }

    return c.json({ success: true, msg: `已成功更新 ${stmts.length} 项配置` });
  } catch (e: any) {
    return c.json({ success: false, msg: '更新配置失败: ' + e.message }, 500);
  }
});

export default app;