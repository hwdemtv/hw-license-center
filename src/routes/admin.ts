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
    console.error('API Error:', error);
    return c.json({ success: false, msg: '生成卡密时遇到内部错误' }, 500);
  }
});

// API: (管理员) 获取卡密列表与绑定状态
app.get('/licenses', async (c) => {
  try {

    // 支持按产品筛选，不传则查全部
    const productId = c.req.query('product_id');

    // 联合查询出许可证本身、绑定的设备数、以及该证照下的所有有效产品订阅（聚合为 JSON）
    let query = `
      SELECT 
        l.*, 
        COUNT(DISTINCT d.id) as current_devices,
        (
          SELECT json_group_array(
            json_object('product_id', s.product_id, 'expires_at', s.expires_at)
          )
          FROM Subscriptions s 
          WHERE s.license_key = l.license_key
        ) as subs_json
      FROM Licenses l
      LEFT JOIN Devices d ON l.license_key = d.license_key
    `;
    const params: string[] = [];

    if (productId) {
      query += ` WHERE l.product_id = ?`;
      params.push(productId);
    }

    query += ` GROUP BY l.license_key ORDER BY l.created_at DESC`;

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    // 将 subs_json 解析为真实数组返回给前端
    const formattedResults = results.map((row: any) => ({
      ...row,
      subscriptions: row.subs_json ? JSON.parse(row.subs_json) : []
    }));

    return c.json({ success: true, data: formattedResults });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '获取列表失败' }, 500);
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

// API: (管理员) 添加或续费产品订阅 (Upsert)
app.post('/subscriptions', async (c) => {
  try {

    const { license_key, product_id, duration_days } = await c.req.json();
    if (!license_key || !product_id) {
      return c.json({ success: false, msg: '缺少必要参数 (license_key, product_id)' }, 400);
    }

    // 拦截清除指令：如果输入的天数 <= 0，则视为删除此产品的订阅记录
    if (duration_days !== undefined && typeof duration_days === 'number' && duration_days <= 0) {
      const delResult = await c.env.DB.prepare(
        `DELETE FROM Subscriptions WHERE license_key = ? AND product_id = ?`
      ).bind(license_key, product_id).run();

      if (delResult.meta?.changes > 0) {
        return c.json({ success: true, msg: `已清除此卡密下的 [${product_id}] 产品权限`, deleted: true });
      } else {
        return c.json({ success: false, msg: `未找到 [${product_id}] 产品权限，无法清除` }, 404);
      }
    }

    // 计算到期时间
    let expiresAt: string | null = null;
    if (duration_days && typeof duration_days === 'number' && duration_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + duration_days);
      expiresAt = date.toISOString();
    }

    // 针对指定卡密、产品记录执行 Upsert：如果存在就更新到期时间，否则插入
    await c.env.DB.prepare(
      `INSERT INTO Subscriptions (license_key, product_id, expires_at)
       VALUES (?, ?, ?)
       ON CONFLICT(license_key, product_id)
       DO UPDATE SET expires_at = excluded.expires_at`
    ).bind(license_key, product_id, expiresAt).run();

    let readableDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : '永久有效';
    return c.json({ success: true, msg: '订阅配置更新成功', expires_at: readableDate });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, msg: '添加订阅失败，检查卡密是否存在' }, 500);
  }
});

// API: (管理员) 批量导入激活码数据
app.post('/licenses/import', async (c) => {
  try {

    const { licenses } = await c.req.json();
    if (!Array.isArray(licenses)) {
      return c.json({ success: false, msg: '数据格式错误，期望一个包含 licenses 数组的 JSON' }, 400);
    }

    const statements: any[] = []; // D1PreparedStatement

    for (const lic of licenses) {
      if (!lic.license_key) continue;

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


export default app;