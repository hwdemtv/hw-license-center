import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
}

// 辅助函数：生成随机卡密，支持传入指定前缀
function generateLicenseKey(prefix = 'KEY'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const getChunk = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix.toUpperCase().slice(0, 5)}-${getChunk()}-${getChunk()}-${getChunk()}`;
}

const app = new Hono<{ Bindings: Env }>();

// 仅允许 Obsidian 插件和自有域名的跨域请求
app.use('/api/*', cors({
  origin: ['obsidian://', 'app://', 'https://km.hwdemtv.com', 'https://kami.hwdemtv.com', 'https://hw-license-center.hwdemtv.workers.dev'],
  allowMethods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
}));

// 简易请求日志
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} - ${Date.now() - start}ms`);
});

// 健康检查接口
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// API: 验证卡密并绑定设备
app.post('/api/v1/auth/verify', async (c) => {
  try {
    const { license_key, device_id, device_name, product_id } = await c.req.json();

    if (!license_key || !device_id) {
      return c.json({ success: false, msg: '缺少激活码或设备标识' }, 400);
    }

    // 1. 查询激活码是否有效，并且属于当前请求的产品
    const { results: licenses } = await c.env.DB.prepare(
      `SELECT * FROM Licenses WHERE license_key = ? AND product_id = ? `
    ).bind(license_key, product_id).all();

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
      ).bind(device_name || currentDevice.device_name, license_key, device_id).run();
    } else {
      // 3. 拦截：如果是新设备且达到数量上限
      if (devices.length >= license.max_devices) {
        return c.json({ success: false, msg: `激活失败。该激活码最多绑定 ${license.max_devices} 台设备。请先解绑其他设备。` }, 403);
      }

      // 4. 新设备绑定
      await c.env.DB.prepare(
        `INSERT INTO Devices(license_key, device_id, device_name) VALUES(?, ?, ?)`
      ).bind(license_key, device_id, device_name || '未命名设备').run();
    }

    // --- 签发 JWT ---
    // 为了防止“时光机漏洞”，我们将服务端的标准时间签入 JWT。
    // 这里使用简单的 Base64 JSON 模拟 Token（实际项目中可替换为 `jsonwebtoken` 等库）。
    // 将有效期设为 30 天，强制插件在此期间内必须联网刷一次 Token。
    const expTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const tokenPayload = btoa(JSON.stringify({
      license_key,
      device_id,
      exp: expTime,
      server_time: new Date().toISOString()
    }));
    // 格式：header.payload.signature_mock
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${tokenPayload}.mocksignature`;

    return c.json({
      success: true,
      msg: currentDevice ? '验证通过，设备已授权' : '新设备绑定成功，系统已授权',
      token: mockToken,
      products,  // 返回全部产品及其订阅状态
      server_time: new Date().toISOString()  // 额外返回当前服务器时间供插件对齐
    });

  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, msg: '验证服务遇到内部错误' }, 500);
  }
});

// API: 主动解绑当前设备
app.post('/api/v1/auth/unbind', async (c) => {
  try {
    const { license_key, device_id } = await c.req.json();

    if (!license_key || !device_id) {
      return c.json({ success: false, msg: '缺少参数' }, 400);
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

// API: (管理员) 自动生成新激活码
app.post('/api/v1/auth/admin/generate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const expectedSecret = c.env.ADMIN_SECRET;

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return c.json({ success: false, msg: '无权访问：管理员密钥错误' }, 401);
    }

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
app.get('/api/v1/auth/admin/licenses', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const expectedSecret = c.env.ADMIN_SECRET;
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

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
app.post('/api/v1/auth/admin/licenses/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const expectedSecret = c.env.ADMIN_SECRET;
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

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
app.post('/api/v1/auth/admin/licenses/user', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const expectedSecret = c.env.ADMIN_SECRET;
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

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
app.delete('/api/v1/auth/admin/licenses', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const expectedSecret = c.env.ADMIN_SECRET;
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

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

// API: Web 后台页面 (核心管理控制台)
app.get('/admin', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>互为卡密中心 - 开发者控制台</title>
  <style>
    :root {
      --bg-color: #0b0d11;
      --panel-bg: #15191e;
      --border-color: #2d333b;
      --text-main: #adbac7;
      --text-bright: #cdd9e5;
      --accent: #5385ff;
      --accent-glow: rgba(83, 133, 255, 0.3);
      --success: #57ab5a;
      --warning: #c69026;
      --danger: #e5534b;
      --active-bg: #1c2128;
    }
    body {
      margin: 0; font-family: -apple-system, system-ui, sans-serif;
      background: var(--bg-color); color: var(--text-main); line-height: 1.5;
    }
    .container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
    .header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; color: var(--text-bright); margin: 0; }
    
    .tabs { display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); }
    .tab {
      padding: 10px 20px; cursor: pointer; border-radius: 6px 6px 0 0;
      border: 1px solid transparent; margin-bottom: -1px; transition: 0.2s;
    }
    .tab:hover { color: var(--text-bright); background: var(--active-bg); }
    .tab.active {
      background: var(--panel-bg); color: var(--accent);
      border: 1px solid var(--border-color); border-bottom-color: var(--panel-bg);
      font-weight: 600;
    }

    .section { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 30px; display: none; }
    .section.active { display: block; }

    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 13px; margin-bottom: 8px; color: #768390; }
    input, select {
      width: 100%; padding: 12px; background: #010409; border: 1px solid var(--border-color);
      border-radius: 6px; color: var(--text-bright); outline: none; box-sizing: border-box;
    }
    input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    
    .row { display: flex; gap: 15px; }
    .row > * { flex: 1; }

    button {
      background: var(--accent); color: white; border: none; padding: 12px 24px;
      border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    button:hover { opacity: 0.9; transform: translateY(-1px); }
    button.secondary { background: #373e47; color: var(--text-bright); }
    button.danger { background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 6px 12px; font-size: 12px; }
    button.danger:hover { background: var(--danger); color: white; }
    button.action-btn { padding: 6px 12px; font-size: 12px; margin-right: 5px; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { text-align: left; padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-bright); }
    td { padding: 12px; border-bottom: 1px solid var(--border-color); }
    tr:hover { background: rgba(255, 255, 255, 0.02); }

    .status-pill { padding: 4px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .status-active { background: rgba(87, 171, 90, 0.15); color: var(--success); }
    .status-revoked { background: rgba(229, 83, 75, 0.15); color: var(--danger); }
    .status-inactive { background: rgba(198, 144, 38, 0.15); color: var(--warning); }

    .result-panel { margin-top: 25px; padding: 20px; background: #010409; border-radius: 8px; position: relative; }
    .code-area { font-family: monospace; white-space: pre-wrap; font-size: 13px; color: var(--success); }

    #adminAuth { position: fixed; inset: 0; background: var(--bg-color); display: flex; justify-content: center; align-items: center; z-index: 100; }
    .login-box { width: 320px; text-align: center; }
    .password-container { position: relative; width: 100%; }
    .toggle-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-main); font-size: 18px; user-select: none; }
    .toggle-password:hover { color: var(--accent); }
  </style>
<body>

<div id="adminAuth">
  <div class="login-box">
    <h2 style="color: var(--text-bright)">身份验证</h2>
    <div class="form-group">
      <div class="password-container">
        <input type="password" id="globalSecret" placeholder="默认密钥: super-secret-admin-key-2026" value="super-secret-admin-key-2026">
        <span class="toggle-password" id="eyeIcon" onclick="toggleSecret()">👁️</span>
      </div>
    </div>
    <button onclick="login()">进入控制台</button>
  </div>
</div>

<div class="container">
  <div class="header">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
    <h1>互为卡密中心</h1>
  </div>

  <div class="tabs">
    <div class="tab active" onclick="switchTab('generate')">🔥 极速生卡</div>
    <div class="tab" onclick="switchTab('manage')">📊 卡密管理</div>
  </div>

  <!-- Tab: Generate -->
  <div id="sec-generate" class="section active">
    <div class="row">
      <div class="form-group">
        <label>产品线标识(Product ID)</label>
        <input type="text" id="genProductId" value="default" placeholder="例如: 您的产品标识">
      </div>
      <div class="form-group">
        <label>绑定用户名 / 备注</label>
        <input type="text" id="genUserName" placeholder="例如: 客户微信名、订单号">
      </div>
    </div>
    <div class="row">
      <div class="form-group">
        <label>单码设备配额</label>
        <input type="number" id="genMaxDevices" value="2" min="1">
      </div>
      <div class="form-group">
        <label>有效期 (天数)</label>
        <input type="number" id="genDuration" placeholder="留空则永久有效，如 365">
      </div>
      <div class="form-group">
        <label>生成数量</label>
        <input type="number" id="genCount" value="1" min="1" max="100">
      </div>
    </div>
    <button id="btnDoGen" onclick="doGenerate()">✦ 立即自动制卡</button>

    <div id="genResult" class="result-panel" style="display:none">
      <div style="font-size:12px; color:#768390; margin-bottom:10px;">生成成功，请妥善保存：</div>
      <div id="genOutput" class="code-area"></div>
      <button class="secondary" style="margin-top:15px; width:100%" onclick="copyGenResult()">复制全部卡密</button>
    </div>
  </div>

  <!-- Tab: Manage -->
  <div id="sec-manage" class="section">
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px;">
      <div style="flex:1; max-width:300px;">
        <label>筛选产品</label>
        <input type="text" id="filterProductId" placeholder="输入 ID 筛选，留空查所有" oninput="loadLicenses()">
      </div>
      <button class="secondary" onclick="loadLicenses()">刷新列表</button>
    </div>

    <table id="licTable">
      <thead>
        <tr>
          <th>激活码(Key)</th>
          <th>产品 ID</th>
          <th>用户备注</th>
          <th>设备(用 / 总)</th>
          <th>状态</th>
          <th>管理</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<script>
  let ADMIN_SECRET = "";

  function login() {
    const secret = document.getElementById('globalSecret').value;
    if (!secret) return;
    ADMIN_SECRET = secret;
    document.getElementById('adminAuth').style.display = 'none';
    loadLicenses();
  }

  function toggleSecret() {
    const input = document.getElementById('globalSecret');
    const eye = document.getElementById('eyeIcon');
    if (input.type === 'password') {
      input.type = 'text';
      eye.innerText = '🙈';
    } else {
      input.type = 'password';
      eye.innerText = '👁️';
    }
  }

  function switchTab(tab) {
    const target = event.currentTarget || event.target;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    target.classList.add('active');
    document.getElementById('sec-' + tab).classList.add('active');
    if (tab === 'manage') loadLicenses();
  }

  async function doGenerate() {
    const btn = document.getElementById('btnDoGen');
    const productId = document.getElementById('genProductId').value;
    const userName = document.getElementById('genUserName').value;
    const count = document.getElementById('genCount').value;
    const maxDevices = document.getElementById('genMaxDevices').value;
    const durationStr = document.getElementById('genDuration').value;
    const durationDays = durationStr ? parseInt(durationStr) : null;

    btn.disabled = true; btn.innerText = "处理中...";

    try {
      const payload = {
        product_id: productId,
        user_name: userName,
        count: parseInt(count),
        max_devices: parseInt(maxDevices)
      };
      if (durationDays) payload.duration_days = durationDays;

      const res = await fetch('/api/v1/auth/admin/generate', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('genResult').style.display = 'block';
        document.getElementById('genOutput').innerText = data.keys.join('\\n');
      } else { alert(data.msg); }
    } catch (e) { alert("生成失败: " + e.message); }
    finally { btn.disabled = false; btn.innerText = "✦ 立即自动制卡"; }
  }

  async function loadLicenses() {
    const filter = document.getElementById('filterProductId').value;
    const tbody = document.querySelector('#licTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">正在加载数据流...</td></tr>';

    try {
      const res = await fetch('/api/v1/auth/admin/licenses?product_id=' + filter, {
        headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
      });
      const data = await res.json();
      tbody.innerHTML = '';
      if (!data.success) {
        tbody.innerHTML = \`<tr><td colspan="6" style="color:var(--danger)">\${data.msg}</td></tr>\`; 
        return; 
      }

      data.data.forEach(lic => {
        const tr = document.createElement('tr');
        const isRevoked = lic.status === 'revoked';
        const statusBtnText = isRevoked ? '恢复' : '吊销';
        const newStatus = isRevoked ? 'active' : 'revoked';
        const userName = lic.user_name || '-';
        const editNameArg = lic.user_name || '';

        // 渲染订阅标签
        let subsHtml = '';
        if (lic.subscriptions && lic.subscriptions.length > 0) {
          const now = new Date();
          subsHtml = lic.subscriptions.map(s => {
            if (!s.expires_at) {
              return \`<span class="status-pill status-active" style="margin:2px; display:inline-block">\${s.product_id}: 永久</span>\`;
            }
            const expDate = new Date(s.expires_at);
            const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysLeft < 0) {
              return \`<span class="status-pill status-revoked" style="margin:2px; display:inline-block">\${s.product_id}: 已过期</span>\`;
            } else if (daysLeft <= 7) {
              return \`<span class="status-pill status-inactive" style="margin:2px; display:inline-block">\${s.product_id}: 剩 \${daysLeft} 天</span>\`;
            } else {
              return \`<span class="status-pill status-active" style="margin:2px; display:inline-block">\${s.product_id}: 剩 \${daysLeft} 天</span>\`;
            }
          }).join('');
        } else {
          subsHtml = '<span style="color:#768390; font-size:12px;">无订阅</span>';
        }

        tr.innerHTML = \`
            <td style="font-family:monospace">\${lic.license_key}</td>
            <td>
              <div style="margin-bottom: 5px;">\${lic.product_id}</div>
              <div style="display:flex; flex-wrap:wrap; max-width: 200px;">\${subsHtml}</div>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:var(--text-bright)">\${userName}</span>
                    <button class="action-btn secondary" style="padding:2px 6px; font-size:10px;" onclick="editUserName('\${lic.license_key}', '\${editNameArg}')">改</button>
                </div>
            </td>
            <td>\${lic.current_devices} / \${lic.max_devices}</td>
            <td><span class="status-pill status-\${lic.status}">\${lic.status.toUpperCase()}</span></td>
            <td>
                <button class="action-btn" style="background:#238636; color:white; border:none;" onclick="addSub('\${lic.license_key}')">+ 续费</button>
                <button class="action-btn secondary" onclick="toggleStatus('\${lic.license_key}', '\${newStatus}')">
                    \${statusBtnText}
                </button>
                <button class="action-btn danger" onclick="deleteLic('\${lic.license_key}')">删</button>
            </td>
        \`;
        tbody.appendChild(tr);
      });
        } catch (e) { tbody.innerHTML = '<tr><td colspan="6">网络错误</td></tr>'; }
    }

  async function toggleStatus(key, status) {
    if (!confirm('确定要将 [' + key + '] 的状态更改为 ' + status + ' 吗？')) return;
    const res = await fetch('/api/v1/auth/admin/licenses/status', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key, status })
    });
    const data = await res.json();
    if (data.success) loadLicenses(); else alert(data.msg);
  }

  async function deleteLic(key) {
    if (!confirm('⚠️ 高危操作：确定要彻底删除卡密 [' + key + '] 吗？\\n这将同时清除所有已绑定的机器，且不可恢复！')) return;
    const res = await fetch('/api/v1/auth/admin/licenses', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key })
    });
    const data = await res.json();
    if (data.success) loadLicenses(); else alert(data.msg);
  }

  async function editUserName(key, currentName) {
    const newName = prompt('修改激活码 [' + key + '] 的备注信息：', currentName);
    if (newName === null) return;
    const res = await fetch('/api/v1/auth/admin/licenses/user', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key, user_name: newName })
    });
    const data = await res.json();
    if (data.success) loadLicenses(); else alert(data.msg);
  }

  function copyGenResult() {
    navigator.clipboard.writeText(document.getElementById('genOutput').innerText);
    alert('已复制到剪贴板！');
  }

  async function addSub(key) {
    const pId = prompt('请输入要添加或续费的产品 ID (例如: token-server):');
    if (!pId) return;
    
    const daysStr = prompt('请输入有效期天数 (留空为永久，输入数字则在原到期日上累加密延期):');
    const days = daysStr ? parseInt(daysStr) : null;

    const payload = { license_key: key, product_id: pId };
    if (days && !isNaN(days)) payload.duration_days = days;

    const res = await fetch('/api/v1/auth/admin/subscriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert('操作成功！新的到期日：' + (data.expires_at || '永久'));
      loadLicenses();
    } else {
      alert('失败: ' + data.msg);
    }
  }
</script>

</body>
</html>
  `;
  return c.html(html);
});

// ==========================================
// API: (管理员) 一码多产品订阅管理 (Subscriptions)
// ==========================================

// 1. 添加/续费产品订阅 (Upsert 逻辑：若已有则时间累加，若无则新建)
app.post('/api/v1/auth/admin/subscriptions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader !== `Bearer ${c.env.ADMIN_SECRET}`) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

    const { license_key, product_id, duration_days } = await c.req.json();
    if (!license_key || !product_id) {
      return c.json({ success: false, msg: '缺少必备参数' }, 400);
    }

    // 查询该卡密是否已存在此产品的订阅
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM Subscriptions WHERE license_key = ? AND product_id = ?`
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
        `UPDATE Subscriptions SET expires_at = ? WHERE license_key = ? AND product_id = ?`
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
app.delete('/api/v1/auth/admin/subscriptions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader !== `Bearer ${c.env.ADMIN_SECRET}`) {
      return c.json({ success: false, msg: '无权访问' }, 401);
    }

    const { license_key, product_id } = await c.req.json();
    const result = await c.env.DB.prepare(
      `DELETE FROM Subscriptions WHERE license_key = ? AND product_id = ?`
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
