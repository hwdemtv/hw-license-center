export const adminHtml = `<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>互为卡密中心 - 开发者控制台 </title>
  <style>
    :root {
      --bg-color: #0d1117;
      --panel-bg: #161b22;
      --card-bg: #21262d;
      --border-color: #30363d;
      --text-main: #8b949e;
      --text-bright: #c9d1d9;
      --accent: #58a6ff;
      --accent-glow: rgba(88, 166, 255, 0.15);
      --success: #3fb950;
      --warning: #d29922;
      --danger: #f85149;
      --indigo: #5385ff;
    }

    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: var(--bg-color);
      color: var(--text-bright);
      line-height: 1.6;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* Header & Stats */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title h1 {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      padding: 20px;
      border-radius: 12px;
    }

    .stat-label {
      font-size: 13px;
      color: var(--text-main);
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .tab {
      padding: 12px 20px;
      cursor: pointer;
      color: var(--text-main);
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: 0.2s;
      position: relative;
    }

    .tab:hover {
      color: var(--text-bright);
    }

    .tab.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .section {
      display: none;
    }

    .section.active {
      display: block;
    }

    /* Forms & Inputs */
    .card {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-main);
    }

    input,
    select {
      width: 100%;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-bright);
      outline: none;
      transition: 0.2s;
      box-sizing: border-box;
    }

    input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    button {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s;
      border: 1px solid transparent;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    button.primary {
      background: var(--indigo);
      color: white;
    }

    button.primary:hover {
      opacity: 0.9;
    }

    button.secondary {
      background: #21262d;
      border-color: var(--border-color);
      color: var(--text-bright);
    }

    button.secondary:hover {
      background: #30363d;
    }

    button.danger {
      background: transparent;
      color: var(--danger);
      border-color: var(--danger);
    }

    button.danger:hover {
      background: var(--danger);
      color: white;
    }

    /* List Layout for Licenses */
    .lic-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }

    .lic-row {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: 2fr 3fr 1fr 150px;
      gap: 16px;
      align-items: center;
      transition: 0.2s;
    }

    .lic-row:hover {
      border-color: var(--accent);
      background: #1c2128;
    }

    .lic-header {
      display: grid;
      grid-template-columns: 2fr 3fr 1fr 150px;
      gap: 16px;
      padding: 0 16px 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
    }

    @media(max-width: 800px) {
      .lic-row {
        grid-template-columns: 1fr;
        align-items: start;
      }

      .lic-header {
        display: none;
      }
    }

    .badge {
      padding: 2px 8px;
      border-radius: 2em;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success {
      background: rgba(63, 185, 80, 0.1);
      color: var(--success);
      border: 1px solid rgba(63, 185, 80, 0.2);
    }

    .badge-warning {
      background: rgba(210, 153, 34, 0.1);
      color: var(--warning);
      border: 1px solid rgba(210, 153, 34, 0.2);
    }

    .badge-danger {
      background: rgba(248, 81, 73, 0.1);
      color: var(--danger);
      border: 1px solid rgba(248, 81, 73, 0.2);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      backdrop-filter: blur(4px);
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-content {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      width: 400px;
      max-width: 90vw;
    }

    .modal-header {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-bright);
    }

    .modal-body {
      margin-bottom: 24px;
      color: var(--text-main);
      font-size: 14px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Auth Overlay */
    #adminAuth {
      position: fixed;
      inset: 0;
      background: var(--bg-color);
      display: flex;
      items-center: center;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .login-card {
      width: 340px;
      padding: 32px;
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      text-align: center;
    }

    /* Custom Dropdown */
    .dropdown-container {
      position: relative;
      width: 100%;
    }

    .custom-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      z-index: 100;
      max-height: 240px;
      overflow-y: auto;
      display: none;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .custom-dropdown.active {
      display: block;
      animation: dropDownFade 0.2s ease-out;
    }

    @keyframes dropDownFade {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-item {
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-size: 13px;
      transition: 0.2s;
    }

    .dropdown-item:hover {
      background: #1c2128;
      color: var(--accent);
    }

    .dropdown-item.remove-btn {
      opacity: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      color: var(--text-main);
      transition: 0.2s;
    }

    .dropdown-item: hover.remove-btn {
      opacity: 1;
    }

    .dropdown-item.remove-btn:hover {
      background: rgba(248, 81, 73, 0.1);
      color: var(--danger);
    }

    .custom-dropdown::-webkit-scrollbar {
      width: 6px;
    }

    .custom-dropdown::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 10px;
    }

    /* 分页控件样式 */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
      padding: 16px 0;
      border-top: 1px solid var(--border-color);
    }

    .pagination button {
      padding: 6px 14px;
      font-size: 13px;
    }

    .pagination .page-info {
      font-size: 13px;
      color: var(--text-main);
      background: var(--card-bg);
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }

    /* 批量操作悬浮条 */
    .batch-bar {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: flex;
      gap: 12px;
      align-items: center;
      transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      opacity: 0;
      pointer-events: none;
      z-index: 100;
    }

    .batch-bar.active {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .batch-bar button {
      padding: 6px 12px;
      font-size: 13px;
    }

    .batch-count {
      background: var(--accent);
      color: var(--bg-color);
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 10px;
      margin-right: 12px;
    }

    .custom-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  </style>

<body>

  <div id="appModal" class="modal-overlay">
    <div class="modal-content">
      <div id="modalTitle" class="modal-header"> 提示 </div>
      <div id="modalBody" class="modal-body"> </div>
      <div id="modalInputs" class="form-grid" style="display:none; margin-bottom: 20px;"> </div>
      <div class="modal-footer">
        <button class="secondary" id="modalBtnCancel" onclick="closeModal()"> 取消 </button>
        <button class="primary" id="modalBtnConfirm"> 确定 </button>
      </div>
    </div>
  </div>

  <div id="adminAuth">
    <div class="login-card">
      <h2 style="margin-top:0; color:var(--text-bright)">🔑 身份验证 </h2>
      <p style="color:var(--text-main); font-size:14px; margin-bottom:24px;"> 输入管理员密钥以进入控制台 </p>
      <div class="form-group" style="text-align:left; position:relative;">
        <input type="password" id="globalSecret" placeholder="输入 Admin Secret..." value="" style="padding-right: 40px;">
        <span
          onclick="const i=document.getElementById('globalSecret');if(i.type==='password'){i.type='text';this.innerText='🙈'}else{i.type='password';this.innerText='👁️'}"
          style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; opacity:0.6; user-select:none;">👁️</span>
      </div>
      <button class="primary" style="width:100%; margin-top:16px;" onclick="login()"> 进入控制台 </button>
    </div>
  </div>

  <div class="container">
    <div class="header">
      <div class="header-title">
        <div style="background:var(--indigo); padding:8px; border-radius:8px; display:flex;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1> 互为卡密中心 </h1>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="secondary" onclick="loadLicenses()">🔄 刷新列表 </button>
        <button class="secondary" onclick="logout()" style="color:var(--danger); border-color:rgba(255,100,100,0.3)">🚪
          退出登录 </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label"> 总卡密数(Keys) </div>
        <div class="stat-value" id="stat-total"> -</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"> 活跃中(Active) </div>
        <div class="stat-value" id="stat-active" style="color:var(--success)"> -</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"> 已吊销(Revoked) </div>
        <div class="stat-value" id="stat-revoked" style="color:var(--danger)"> -</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"> 临期 / 已过期(Sub) </div>
        <div class="stat-value" id="stat-expiring" style="color:var(--warning)"> -</div>
      </div>
    </div>

    <div class="tabs">
      <div class="tab active" onclick="switchTab('generate')">⚡ 极速生卡 </div>
      <div class="tab" onclick="switchTab('manage')">🛠️ 资产管理 </div>
    </div>

    <!--Tab: Generate-->
    <div id="sec-generate" class="section active">
      <div class="card">
        <div class="form-grid">
          <div class="form-group">
            <label>产品线标识(Product ID) </label>
            <div class="dropdown-container">
              <input type="text" id="genProductId" value="smartmp" placeholder="输入 ID 或点击选择历史记录" autocomplete="off"
                onfocus="showDropdown()" oninput="updateProductHelpers()">
              <div id="productDropdown" class="custom-dropdown"> </div>
            </div>
          </div>
          <div class="form-group">
            <label>绑定用户名 / 备注(可选) </label>
            <input type="text" id="genUserName" placeholder="例如: 客户名、内部订单号...">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>激活码设备配额(Max Devices) </label>
            <input type="number" id="genMaxDevices" value="2" min="1">
          </div>
          <div class="form-group">
            <label>初始订阅有效期(天数, 留空为永久) </label>
            <input type="number" id="genDuration" placeholder="例如: 365, 30...">
          </div>
          <div class="form-group">
            <label>批量生成数量 </label>
            <input type="number" id="genCount" value="1" min="1" max="100">
          </div>
        </div>
        <button class="primary" id="btnDoGen" onclick="doGenerate()" style="width:100%; margin-top:10px;">✨ 立即制卡并激活订阅
        </button>

        <div id="genResult"
          style="display:none; margin-top:24px; padding-top:24px; border-top:1px dashed var(--border-color);">
          <label style="color:var(--success); font-weight:600; margin-bottom:12px; display:block;">✅ 生成成功，请复制保存：</label>
          <div id="genOutput"
            style="background:#0d1117; padding:16px; border-radius:8px; font-family:monospace; font-size:13px; margin-bottom:16px; white-space:pre-wrap; border:1px solid var(--border-color); color:var(--success);">
          </div>
          <button class="secondary" style="width:100%" onclick="copyGenResult()">📋 复制全部卡密文本 </button>
        </div>
      </div>
    </div>

    <!--Tab: Manage-->
    <div id="sec-manage" class="section">
      <div class="search-bar">
        <div class="search-input-wrap">
          <input type="text" id="keywordSearch" placeholder="快速搜索激活码、用户名..." oninput="filterLocalList()">
        </div>
        <div style="width:200px">
          <select id="filterProductId" onchange="loadLicenses()">
            <option value=""> 所有产品线(Show All) </option>
          </select>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="secondary" onclick="exportExcel()" title="导出适合 Excel 阅读的明细表格">📊 导出 Excel </button>
          <button class="secondary" onclick="exportData()" title="导出 JSON 备份以用于跨端迁移">📤 备份 JSON </button>
          <button class="secondary" onclick="document.getElementById('importFile').click()" title="通过 JSON 恢复资产">📥 导入还原
          </button>
          <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
        </div>
      </div>

      <!--阶段一二过渡：暂时保留 table 容器名，以便 JS 还能填充数据，下一阶段将彻底改为网格卡片-->
      <div id="licListContainer">
        <div class="table-container">
          <table id="licTable">
            <thead>
              <tr>
                <th>激活码(Key) </th>
                <th> 基本信息 </th>
                <th> 当前订阅 </th>
                <th> 设备使用 </th>
                <th> 快捷操作 </th>
              </tr>
            </thead>
            <tbody> </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- 批量操作悬浮条 -->
  <div class="batch-bar" id="batchBar">
    <div class="batch-count" id="batchCountDisplay">0</div>
    <select id="batchActionSelect"
      style="background:#0d1117; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; padding:6px 12px; font-size:13px; outline:none;">
      <option value="" disabled selected>👉 选择批量动作...</option>
      <optgroup label="基础数据">
        <option value="revoke">🔒 批量吊销</option>
        <option value="restore">🔓 批量恢复</option>
        <option value="delete">🗑️ 批量彻底删除</option>
        <option value="set_user_name">📝 批量修改备注</option>
        <option value="copy_keys">📋 复制选中的激活码</option>
      </optgroup>
      <optgroup label="产品与订阅">
        <option value="add_subscription">🚀 批量续费 / 加产品</option>
        <option value="remove_subscription">❌ 批量移除产品权限</option>
      </optgroup>
      <optgroup label="设备">
        <option value="unbind">📱 批量释放所有设备</option>
        <option value="set_max_devices">🔢 批量修改设备上限</option>
      </optgroup>
    </select>
    <button class="primary" onclick="executeBatch()">🚀 确定执行</button>
    <button class="secondary" onclick="clearBatchSelection()">清空勾选</button>
  </div>

  <script>
    let ADMIN_SECRET = "";
    let ALL_LICENSES = []; // 本地数据缓存
    let SET_SELECTED_KEYS = new Set(); // 批量选中的 keys


    // 分页状态
    let currentPage = 1;
    const PAGE_SIZE = 20;

    let PRODUCT_HISTORY = new Set(['smartmp']);

    let modalResolve = null;

    function showModal(options) {
      return new Promise(resolve => {
        document.getElementById('modalTitle').innerText = options.title || '提示';
        document.getElementById('modalBody').innerHTML = options.message || '';

        const inputsDiv = document.getElementById('modalInputs');
        inputsDiv.innerHTML = '';
        if (options.inputs) {
          inputsDiv.style.display = 'grid';
          let htmlInputs = '';
          options.inputs.forEach((inp, i) => {
            htmlInputs += '<div class="form-group"><label>' + inp.label + '</label><input type="' + (inp.type || 'text') + '" id="modalInp' + i + '" value="' + (inp.value || '') + '" placeholder="' + (inp.placeholder || '') + '"></div>';
          });
          inputsDiv.innerHTML = htmlInputs;
        } else {
          inputsDiv.style.display = 'none';
        }

        const confirmBtn = document.getElementById('modalBtnConfirm');
        confirmBtn.className = options.danger ? 'danger' : 'primary';
        confirmBtn.innerText = options.confirmText || '确定';

        const cancelBtn = document.getElementById('modalBtnCancel');
        if (options.type === 'alert') {
          cancelBtn.style.display = 'none';
        } else {
          cancelBtn.style.display = 'inline-flex';
        }

        modalResolve = resolve;

        confirmBtn.onclick = () => {
          let result = true;
          if (options.inputs) {
            result = options.inputs.map((_, i) => document.getElementById('modalInp' + i).value);
          }
          closeModal(result);
        };

        document.getElementById('appModal').classList.add('active');
      });
    }

    function closeModal(result = false) {
      document.getElementById('appModal').classList.remove('active');
      if (modalResolve) modalResolve(result);
      modalResolve = null;
    }

    function login() {
      const s = document.getElementById('globalSecret').value;
      if (!s) return;
      ADMIN_SECRET = s;
      localStorage.setItem('hw_admin_secret', s);
      document.getElementById('adminAuth').style.display = 'none';
      loadLicenses();
    }

    function logout() {
      ADMIN_SECRET = "";
      localStorage.removeItem('hw_admin_secret');
      document.getElementById('globalSecret').value = '';
      document.getElementById('adminAuth').style.display = 'flex';
      document.getElementById('licListContainer').innerHTML = '';
      ALL_LICENSES = [];
      updateStats();
    }

    // 页面加载时自动尝试从本地缓存恢复会话
    window.addEventListener('DOMContentLoaded', () => {
      const savedSecret = localStorage.getItem('hw_admin_secret');
      if (savedSecret) {
        document.getElementById('globalSecret').value = savedSecret;
        login();
      }
    });

    // 回车快捷登录
    document.getElementById('globalSecret').onkeyup = (e) => { if (e.key === 'Enter') login(); };

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      const target = (event && event.target) ? event.target : document.querySelector('.tab[onclick*="' + tab + '"]');
      if (target) target.classList.add('active');
      document.getElementById('sec-' + tab).classList.add('active');
      if (tab === 'manage') loadLicenses();
    }

    // 计算并更新顶部统计指标
    function updateStats() {
      const total = ALL_LICENSES.length;
      const active = ALL_LICENSES.filter(l => l.status === 'active').length;
      const revoked = ALL_LICENSES.filter(l => l.status === 'revoked').length;

      // 临期订阅 (7天内过期)
      const now = new Date();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const expiring = ALL_LICENSES.filter(l => {
        if (!l.subscriptions) return false;
        return l.subscriptions.some(s => {
          if (!s.expires_at) return false;
          const diff = new Date(s.expires_at) - now;
          return diff > 0 && diff <= SEVEN_DAYS;
        });
      }).length;

      document.getElementById('stat-total').innerText = total;
      document.getElementById('stat-active').innerText = active;
      document.getElementById('stat-revoked').innerText = revoked;
      document.getElementById('stat-expiring').innerText = expiring;
    }

    // 显示/隐藏下拉框
    function showDropdown() {
      document.getElementById('productDropdown').classList.add('active');
      updateProductHelpers();
    }
    function hideDropdown() {
      setTimeout(() => {
        document.getElementById('productDropdown').classList.remove('active');
      }, 200); // 延迟关闭以便捕获点击
    }

    // 从历史记录中物理移除某个产品 ID
    function removeFromHistory(e, id) {
      if (e) e.stopPropagation(); // 防止触发选择
      if (confirm('确定从历史建议中移除 "' + id + '" 吗？')) {
        PRODUCT_HISTORY.delete(id);
        updateProductHelpers();
      }
    }

    // 生卡区选择产品 ID 的辅助函数
    function setGenProduct(val) {
      document.getElementById('genProductId').value = val;
      updateProductHelpers();
      hideDropdown();
    }

    // 更新产品辅助器（包括筛选下拉和自定义生卡下拉框）
    function updateProductHelpers() {
      const filterSelect = document.getElementById('filterProductId');
      const dropdown = document.getElementById('productDropdown');
      const genInput = document.getElementById('genProductId');

      // 1. 同步当前所有存量产品到历史库
      ALL_LICENSES.forEach(l => PRODUCT_HISTORY.add(l.product_id));

      // 2. 更新管理列表上方的“筛选”下拉框
      const currentFilter = filterSelect.value;
      filterSelect.innerHTML = '<option value="">所有产品线 (Show All)</option>';
      [...PRODUCT_HISTORY].sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p; opt.innerText = p;
        filterSelect.appendChild(opt);
      });
      filterSelect.value = currentFilter;

      // 3. 更新生卡区的“自定义搜索下拉框”
      const searchVal = genInput.value.toLowerCase();
      const matches = [...PRODUCT_HISTORY].filter(p => !searchVal || p.toLowerCase().includes(searchVal)).sort();

      if (matches.length === 0) {
        dropdown.innerHTML = '<div style="padding:12px; font-size:12px; color:var(--text-main); text-align:center;">未找到匹配的历史记录</div>';
      } else {
        let listHtml = '';
        matches.forEach(p => {
          // 使用更简洁的函数调用，并使用三级转义以防语法崩溃
          listHtml += '<div class="dropdown-item" onclick="setGenProduct(\\\\\\'' + p + '\\\\\\')">' +
            '<span>' + p + '</span>' +
            '<div class="remove-btn" onclick="removeFromHistory(event, \\\\\\'' + p + '\\\\\\')" title="从历史中移除">✕</div>' +
            '</div>';
        });
        dropdown.innerHTML = listHtml;
      }
    }

    // 点击外部自动关闭下拉
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-container')) {
        document.getElementById('productDropdown').classList.remove('active');
      }
    });

    // 接口加载数据
    async function loadLicenses() {
      const pId = document.getElementById('filterProductId').value;
      const container = document.getElementById('licListContainer');
      container.innerHTML = '<div style="text-align:center; padding:50px; color:var(--text-main)">🚀 正在同步边缘数据...</div>';

      try {
        const res = await fetch('/api/v1/auth/admin/licenses?product_id=' + pId, {
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await res.json();
        if (!data.success) {
          if (res.status === 401) {
            logout();
            showModal({ title: '会话失效', message: '密钥无效或已更改，请重新输入', type: 'alert' });
            return;
          }
          container.innerHTML = '<div style="padding:20px; color:var(--danger)">❌ 获取失败: ' + data.msg + '</div>';
          return;
        }

        ALL_LICENSES = data.data;
        currentPage = 1; // 重新拉取后重置为第一页
        updateStats();
        updateProductHelpers();
        renderCards(ALL_LICENSES);
      } catch (e) {
        container.innerHTML = '<div style="padding:20px; color:var(--danger)">⚠️ 无法连接服务器</div>';
      }
    }

    // 渲染列表视图布局
    function renderCards(list) {
      const container = document.getElementById('licListContainer');
      if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:50px; color:var(--text-main)">📭 暂无相关卡密数据</div>';
        return;
      }

      // 获取所有经过过滤后的卡密 ID，以便全选使用
      const currentFilteredKeys = list.map(l => l.license_key);

      // 检查是否在当前列表和集合中全选了
      const isAllChecked = list.length > 0 && list.every(l => SET_SELECTED_KEYS.has(l.license_key));

      let html = '<div class="lic-list">';
      html += \`
    <div class="lic-header" style="grid-template-columns: 30px 1.5fr 1.5fr 1fr 1fr;">
      <div><input type="checkbox" class="custom-checkbox" \${isAllChecked ? 'checked' : ''} onclick="toggleAllCheckboxes(this)" title="全选当前列表"></div>
      <div>授权标识 & 使用者</div>
      <div>产品权限与有效期</div>
      <div>在线设备</div>
      <div style="text-align:right">操作</div>
    </div>
  \`;

      const now = new Date();

      // 分页计算
      const totalItems = list.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
      // 防御性纠正
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
      const pagedList = list.slice(startIndex, endIndex);

      pagedList.forEach((lic) => {
        // 准备订阅状态 HTML
        let subHtml = '';
        if (lic.subscriptions && lic.subscriptions.length > 0) {
          subHtml = lic.subscriptions.map((s) => {
            let text = '永 久';
            let cls = 'badge-success';
            if (s.expires_at) {
              const days = Math.ceil((new Date(s.expires_at) - now) / (86400000));
              text = days > 0 ? '剩 ' + days + ' 天' : '已过期';
              cls = days > 7 ? 'badge-success' : (days > 0 ? 'badge-warning' : 'badge-danger');
            }
            return '<span class="badge ' + cls + '" style="margin-right:4px;">' + s.product_id + ': ' + text + '</span>';
          }).join('');
        } else {
          subHtml = '<span style="color:var(--text-main); font-size:11px; font-style:italic">暂无订阅产品</span>';
        }

        const isRevoked = lic.status === 'revoked';
        const devicePct = Math.min(100, (lic.current_devices / lic.max_devices) * 100);

        html += \`
      <div class="lic-row" style="grid-template-columns: 30px 1.5fr 1.5fr 1fr 1fr;">
        <!-- Col 0: Checkbox -->
        <div style="display:flex; align-items:center;">
          <input type="checkbox" class="custom-checkbox row-checkbox" value="\${lic.license_key}" \${SET_SELECTED_KEYS.has(lic.license_key) ? 'checked' : ''} onclick="toggleBatchItem('\${lic.license_key}', this.checked)">
        </div>
        
        <!-- Col 1: 基本信息 -->
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
          <div style="width:36px; height:36px; flex-shrink:0; background:#30363d; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:14px;">
            \${(lic.user_name || '?')[0].toUpperCase()}
          </div>
          <div style="min-width:0; overflow:hidden;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span style="font-weight:600; font-size:13px; color:var(--text-bright); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${lic.user_name || '<span style="color:var(--text-main); font-style:italic">未指定用户</span>'}</span>
              <span style="cursor:pointer; opacity:0.6; font-size:11px;" onclick="editUserName('\${lic.license_key}','\${lic.user_name || ""}')" title="修改用户备注">✏️</span>
              <span class="badge \${isRevoked ? 'badge-danger' : 'badge-success'}" style="transform: scale(0.85); transform-origin:left; margin-left:2px;">\${lic.status.toUpperCase()}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:monospace; font-size:12px; color:var(--accent);">\${lic.license_key}</span>
              <span style="cursor:pointer; opacity:0.6; font-size:12px;" onclick="copyText('\${lic.license_key}')" title="复制卡密">📋</span>
            </div>
          </div>
        </div>
        
        <!-- Col 2: 订阅标签 -->
        <div style="font-size:12px; display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
          \${subHtml}
          <span onclick="addSub('\${lic.license_key}')" style="color:var(--accent); cursor:pointer; font-weight:500; font-size:11px; margin-left:4px; padding:2px 6px; background:var(--accent-glow); border-radius:4px;">+ 续费管理</span>
        </div>

        <!-- Col 3: 设备占用 -->
        <div style="font-size:12px;">
          <div style="color:var(--text-bright); margin-bottom:4px; font-weight:500;">\${lic.current_devices} <span style="color:var(--text-main); font-weight:normal;">/ \${lic.max_devices} 台</span></div>
          <div style="height:4px; width:100%; max-width:80px; background:#30363d; border-radius:2px; overflow:hidden;">
            <div style="width:\${devicePct}%; height:100%; background:var(--accent);"></div>
          </div>
        </div>

        <!-- Col 4: 操作 -->
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button class="secondary" style="padding:4px 8px; font-size:12px;" onclick="toggleStatus('\${lic.license_key}', '\${isRevoked ? 'active' : 'revoked'}')">
            \${isRevoked ? '🔓 恢复' : '🔒 吊销'}
          </button>
          <button class="danger" style="padding:4px 8px; font-size:12px;" onclick="deleteLic('\${lic.license_key}')" title="彻底删除">🗑️</button>
        </div>
      </div>
    \`;
      });

      html += '</div>';

      // 添加分页导航栏
      if (totalItems > PAGE_SIZE) {
        html += \`
      <div class="pagination">
        <button class="secondary" onclick="goToPage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>← 上一页</button>
        <div class="page-info">第 <span style="color:var(--text-bright);font-weight:bold">\${currentPage}</span> / \${totalPages} 页 (共 \${totalItems} 条)</div>
        <button class="secondary" onclick="goToPage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>下一页 →</button>
      </div>
    \`;
      }

      container.innerHTML = html;
    }

    // 分页跳转函数
    function goToPage(page) {
      currentPage = page;
      // 获取当前的搜索状态，应用过滤并重新渲染当前页
      const kw = document.getElementById('keywordSearch').value.toLowerCase();
      if (kw) {
        const filtered = ALL_LICENSES.filter((l) =>
          l.license_key.toLowerCase().includes(kw) ||
          (l.user_name && l.user_name.toLowerCase().includes(kw))
        );
        renderCards(filtered);
      } else {
        renderCards(ALL_LICENSES);
      }
      // 滚动回列表顶部
      window.scrollTo({ top: document.getElementById('licListContainer').offsetTop - 60, behavior: 'smooth' });
    }

    // 搜索过滤
    function filterLocalList() {
      const kw = document.getElementById('keywordSearch').value.toLowerCase();
      const filtered = ALL_LICENSES.filter((l) =>
        l.license_key.toLowerCase().includes(kw) ||
        (l.user_name && l.user_name.toLowerCase().includes(kw))
      );
      currentPage = 1; // 搜索条件改变时，重置回第一页
      renderCards(filtered);
    }

    // 生卡逻辑
    async function doGenerate() {
      const btn = document.getElementById('btnDoGen');
      const pId = document.getElementById('genProductId').value;
      const uName = document.getElementById('genUserName').value;
      const cnt = parseInt(document.getElementById('genCount').value);
      const mD = parseInt(document.getElementById('genMaxDevices').value);
      const dur = document.getElementById('genDuration').value;

      btn.disabled = true; btn.innerText = "⚡ 正在炼制激活码...";

      try {
        const res = await fetch('/api/v1/auth/admin/generate', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: pId, user_name: uName, count: cnt, max_devices: mD, duration_days: dur ? parseInt(dur) : null })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('genResult').style.display = 'block';
          document.getElementById('genOutput').innerText = data.keys.join('\\n');
          renderCards([]); // 生卡后清空列表提示刷新
        } else { showModal({ title: '错误', message: data.msg, type: 'alert' }); }
      } catch (e) { showModal({ title: '通讯失败', message: e.message, type: 'alert' }); }
      finally { btn.disabled = false; btn.innerText = "✨ 立即制卡并激活订阅"; }
    }

    // API 交互函数
    async function toggleStatus(key, status) {
      const isRestore = status === 'active';
      const confirmed = await showModal({
        title: isRestore ? '🔓 恢复使用' : '🔒 吊销卡密',
        message: '确定要' + (isRestore ? '恢复' : '吊销') + '卡密[<span style="color:var(--accent)">' + key + '</span>]吗？',
        confirmText: '确定',
        danger: !isRestore
      });
      if (!confirmed) return;
      const res = await fetch('/api/v1/auth/admin/licenses/status', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key, status })
      });
      if ((await res.json()).success) loadLicenses();
    }

    async function deleteLic(key) {
      const confirmed = await showModal({
        title: '🗑️ 彻底停产',
        message: '⚠️ 危险: 确定删除卡密[<span style="color:var(--danger)">' + key + '</span>]吗？此操作不可逆！',
        confirmText: '确认删除',
        danger: true
      });
      if (!confirmed) return;
      const res = await fetch('/api/v1/auth/admin/licenses', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key })
      });
      if ((await res.json()).success) loadLicenses();
    }

    async function editUserName(key, cur) {
      const res = await showModal({
        title: '✏️ 修改用户备注',
        inputs: [{ label: '用户名或内部备注', value: cur, placeholder: '输入新备注' }],
        confirmText: '保存修改'
      });
      if (!res) return;
      const n = res[0];
      await fetch('/api/v1/auth/admin/licenses/user', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key, user_name: n })
      });
      loadLicenses();
    }
    // 添加产品续费管理
    async function addSub(key) {
      const res = await showModal({
        title: '➕ 添加订阅或续费',
        message: '正在为 <b>' + key + '</b> 配置权限。<br/><span style="color:var(--warning); font-size:12px;">注：如需清除误绑产品，请填入产品 ID 并将时长设为 0。</span>',
        inputs: [
          { label: '产品线标识 (Product ID)', value: 'smartmp', placeholder: '如 smartmp' },
          { label: '续费时长 (天数)', value: '365', placeholder: '填 365 即加一年，填 0 清除，留空永久' }
        ],
        confirmText: '确认办理'
      });

      if (!res) return;
      const pId = res[0] ? res[0].trim() : '';
      const dVal = res[1] ? res[1].trim() : '';
      if (!pId) return;

      let days = null;
      if (dVal !== '') {
        days = parseInt(dVal);
        if (isNaN(days)) return showModal({ title: '错误', message: '天数必须是纯数字', type: 'alert' });
      }

      try {
        const fRes = await fetch('/api/v1/auth/admin/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ADMIN_SECRET },
          body: JSON.stringify({ license_key: key, product_id: pId, duration_days: days })
        });
        const data = await fRes.json();

        if (data.success) {
          showModal({
            title: data.deleted ? '✅ 清理成功' : '🎉 订阅成功',
            message: data.deleted ? data.msg : '到期日: ' + (data.expires_at || '永久有效'),
            type: 'alert'
          }).then(() => loadLicenses());
        } else {
          showModal({ title: '操作失败', message: data.msg, type: 'alert' });
        }
      } catch (e) {
        showModal({ title: '发生错误', message: e.message, type: 'alert' });
      }
    }

    function copyText(t) {
      navigator.clipboard.writeText(t);
      const btn = window.event?.currentTarget;
      if (btn) {
        const old = btn.innerText;
        btn.innerText = '✅';
        setTimeout(() => { btn.innerText = old; }, 1000);
      }
    }
    async function copyGenResult() {
      const txt = document.getElementById('genOutput').innerText;
      await navigator.clipboard.writeText(txt);
      showModal({ title: '复制成功', message: '已将所有激活码存入剪贴板', type: 'alert' });
    }

    async function exportData() {
      if (ALL_LICENSES.length === 0) return showModal({ title: '提示', message: '当前没有可导出的数据', type: 'alert' });
      const dataStr = JSON.stringify(ALL_LICENSES, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hw-licenses-backup-' + Date.now() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // 导出为适合 Excel 打开的 CSV 格式表格
    async function exportExcel() {
      if (ALL_LICENSES.length === 0) return showModal({ title: '提示', message: '当前没有可导出的数据', type: 'alert' });

      // 1. 构建 CSV 表头
      let csvContent = '激活码标识,绑定用户/备注,状态,设备配额,已分配设备,包含产品数,订阅详情摘要,创建时间\\n';

      // 2. 遍历数据平铺降维
      ALL_LICENSES.forEach(lic => {
        // 处理可能包含逗号的字段，用引号包裹
        const safeStr = (str) => '"' + (str ? String(str).replace(/"/g, '""') : '') + '"';

        // 合并订阅详情为一个易读的字符串
        const subDigest = (lic.subscriptions || []).map(s => {
          const expStr = s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '永久';
          return '[' + s.product_id + ': ' + expStr + ']';
        }).join(' | ');

        const row = [
          safeStr(lic.license_key),
          safeStr(lic.user_name || '未配置'),
          lic.status === 'revoked' ? '已吊销' : '活跃',
          lic.max_devices,
          lic.current_devices,
          (lic.subscriptions || []).length,
          safeStr(subDigest),
          safeStr(new Date(lic.created_at).toLocaleString())
        ];
        csvContent += row.join(',') + '\\n';
      });

      // 3. 加上 UTF-8 BOM，防止 Windows 下 Excel 打开直接乱码
      const blob = new Blob(['\\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hw-licenses-report-' + Date.now() + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    async function importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      event.target.value = ''; // Reset input status

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonStr = e.target?.result;
          const licenses = JSON.parse(jsonStr);
          if (!Array.isArray(licenses)) throw new Error("文件格式错误：期望 JSON 数组");

          const confirmMsg = "即将导入 " + licenses.length + " 条数据，已存在的数据将会被融合覆盖。是否继续？";
          const res = await showModal({ title: '批量导入确认', message: confirmMsg, type: 'confirm' });
          if (!res) return;

          const fRes = await fetch('/api/v1/auth/admin/licenses/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ADMIN_SECRET },
            body: JSON.stringify({ licenses })
          });
          const data = await fRes.json();

          if (data.success) {
            showModal({ title: '✅ 导入成功', message: data.msg, type: 'alert' }).then(() => loadLicenses());
          } else {
            showModal({ title: '❌ 导入失败', message: data.msg, type: 'alert' });
          }
        } catch (err) {
          showModal({ title: '解析错误', message: err.message || err, type: 'alert' });
        }
      };
      reader.readAsText(file);
    }

    // ==========================================
    // 批量操作逻辑
    // ==========================================
    function updateBatchBar() {
      const bar = document.getElementById('batchBar');
      const countDisplay = document.getElementById('batchCountDisplay');
      if (!bar || !countDisplay) return;
      const count = SET_SELECTED_KEYS.size;
      countDisplay.innerText = count + ' 项选中';
      if (count > 0) {
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
      }
    }

    function toggleBatchItem(key, isChecked) {
      if (isChecked) {
        SET_SELECTED_KEYS.add(key);
      } else {
        SET_SELECTED_KEYS.delete(key);
      }
      updateBatchBar();
    }

    function toggleAllCheckboxes(checkboxElem) {
      const isChecked = checkboxElem.checked;
      document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.checked = isChecked;
        if (isChecked) {
          SET_SELECTED_KEYS.add(cb.value);
        } else {
          SET_SELECTED_KEYS.delete(cb.value);
        }
      });
      updateBatchBar();
    }

    function clearBatchSelection() {
      SET_SELECTED_KEYS.clear();
      document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
      const headerCb = document.querySelector('.lic-header .custom-checkbox');
      if (headerCb) headerCb.checked = false;
      updateBatchBar();
    }

    async function executeBatch() {
      const actionSelect = document.getElementById('batchActionSelect');
      const action = actionSelect ? actionSelect.value : '';
      if (!action) {
        return showModal({ title: '提示', message: '请先选择需要执行的操作类型', type: 'alert' });
      }

      const keys = Array.from(SET_SELECTED_KEYS);
      if (keys.length === 0) {
        return showModal({ title: '提示', message: '请先勾选至少一张卡密', type: 'alert' });
      }

      // 纯前端操作：批量复制卡密
      if (action === 'copy_keys') {
        try {
          await navigator.clipboard.writeText(keys.join('\\n'));
          showModal({ title: '✅ 复制成功', message: '已将 ' + keys.length + ' 个激活码复制到剪贴板！' });
          clearBatchSelection();
        } catch (e) {
          showModal({ title: '复制失败', message: '浏览器拒绝访问剪贴板，请手动处理', type: 'alert' });
        }
        return;
      }

      let params = {};
      const optionText = actionSelect.options[actionSelect.selectedIndex].text.replace(/^[\\u0000-\\uFFFF]{1,3}\\s/, '');

      // 需要额外参数的操作：弹窗收集
      if (action === 'set_user_name') {
        const u = await showModal({
          title: '✏️ 批量设置备注',
          message: '将 ' + keys.length + ' 个卡密的备注统一修改为：',
          inputs: [{ label: '备注内容', placeholder: '如: 2026春季活动批次' }]
        });
        if (u === false) return;
        params.user_name = u[0] || '';
      } else if (action === 'set_max_devices') {
        const d = await showModal({
          title: '🔢 批量调整设备上限',
          message: '为选中的 ' + keys.length + ' 个卡密设置新的最大设备数：',
          inputs: [{ label: '设备数量', type: 'number', placeholder: '1-100', value: '2' }]
        });
        if (d === false) return;
        params.max_devices = parseInt(d[0]);
      } else if (action === 'add_subscription') {
        const u = await showModal({
          title: '🚀 批量续费 / 添加产品',
          message: '为选中的 ' + keys.length + ' 个卡密统一添加指定产品权限：',
          inputs: [
            { label: '目标产品 ID', placeholder: '如: smartmp' },
            { label: '有效天数', type: 'number', placeholder: '留空表示永久有效' }
          ]
        });
        if (u === false) return;
        params.product_id = u[0];
        params.duration_days = u[1] ? parseInt(u[1]) : null;
      } else if (action === 'remove_subscription') {
        const u = await showModal({
          title: '❌ 批量移除产品权限',
          message: '从选中的卡密中剥夺指定产品的授权：',
          danger: true,
          inputs: [{ label: '要移除的产品 ID', placeholder: '如: smartmp' }]
        });
        if (u === false) return;
        params.product_id = u[0];
      } else {
        // 无额外参数的操作（吊销/恢复/删除/解绑）
        const isDanger = ['delete', 'revoke', 'unbind'].includes(action);
        const confirmed = await showModal({
          title: '⚠️ 批量操作确认',
          message: '即将对 <strong style="color:var(--accent)">' + keys.length + '</strong> 个卡密执行 <b>' + optionText + '</b> 操作。确定继续？',
          danger: isDanger,
          confirmText: isDanger ? '确认执行' : '确定'
        });
        if (!confirmed) return;
      }

      // 调用后端 /batch 接口
      try {
        const res = await fetch('/api/v1/auth/admin/licenses/batch', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + ADMIN_SECRET,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ keys, action, params })
        });
        const data = await res.json();
        if (data.success) {
          clearBatchSelection();
          showModal({ title: '✅ 执行成功', message: data.msg }).then ?
            showModal({ title: '✅ 执行成功', message: data.msg }).then(() => loadLicenses()) :
            (showModal({ title: '✅ 执行成功', message: data.msg }), loadLicenses());
        } else {
          showModal({ title: '❌ 批量操作失败', message: data.msg, type: 'alert' });
        }
      } catch (e) {
        showModal({ title: '🌐 网络异常', message: e.message, type: 'alert' });
      }
    }
  </script>
</body>

</html>`;
