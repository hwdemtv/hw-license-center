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
      --header-h: 290px; /* 初始占位 */
      --tools-h: 120px; /* 初始占位 */
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
      padding: 0 20px 40px 20px;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 200;
      background: var(--bg-color);
      padding-top: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    /* 当开始滚动时，增加底部分割线以显出层次感 */
    .sticky-header.scrolled {
       border-bottom-color: var(--border-color);
       box-shadow: 0 10px 20px rgba(0,0,0,0.3);
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

    .sticky-tools {
      position: sticky;
      top: var(--header-h); /* 动态占位 */
      z-index: 180;
      background: var(--bg-color);
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 0;
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
      margin-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-color);
      padding-top: 10px;
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

    .dropdown-item:hover .remove-btn {
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

    /* Toast */
    #toastContainer {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    /* System Settings 卡片布局 */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .settings-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      transition: 0.3s;
    }

    .settings-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .settings-group h3 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-bright);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }

    .settings-card .form-group {
      margin-bottom: 20px;
    }

    .settings-card .form-group:last-child {
      margin-bottom: 0;
    }

    .settings-card .help-text {
      color: var(--text-main);
      font-size: 12px;
      margin-top: 8px;
    }

    .pwd-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .pwd-input-wrapper input {
      padding-right: 40px;
    }

    .pwd-toggle {
      position: absolute;
      right: 12px;
      cursor: pointer;
      opacity: 0.6;
      user-select: none;
      font-size: 14px;
    }

    .pwd-toggle:hover {
      opacity: 1;
    }

    .portal-custom-group .portal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 600px) {
      .portal-custom-group .portal-grid {
        grid-template-columns: 1fr;
      }
    }

    .toast {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      color: var(--text-bright);
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      animation: toastIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
      pointer-events: auto;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toast.success {
      border-left: 4px solid var(--success);
    }

    .toast.error {
      border-left: 4px solid var(--danger);
    }

    .toast.warning {
      border-left: 4px solid var(--warning);
    }

    @keyframes toastIn {
      0% {
        transform: translateX(120%);
        opacity: 0;
      }

      100% {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes toastOut {
      0% {
        transform: translateX(0);
        opacity: 1;
      }

      100% {
        transform: translateX(120%);
        opacity: 0;
      }
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
    <div class="sticky-header" id="stickyHeader">
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
        <div class="tab" onclick="switchTab('notifications')">📢 广播通知 </div>
        <div class="tab" onclick="switchTab('settings')">⚙️ 系统设置 </div>
      </div>
    </div>

    <!--Tab: Generate-->
    <div id="sec-generate" class="section active">
      <div class="card">
        <div class="form-grid">
          <div class="form-group">
            <label>产品线标识(Product ID) </label>
            <div class="dropdown-container">
              <input type="text" id="genProductId" value="smartmp" placeholder="输入新产品 或 下拉选择已有产品" autocomplete="off"
                onfocus="loadAndShowProducts()" oninput="filterProducts(this.value)">
              <div id="productDropdown" class="custom-dropdown" style="max-height: 200px; overflow-y: auto;"> </div>
            </div>
            <p class="help-text" style="font-size:11px; color:var(--text-main); margin-top:4px;">
              💡 可直接输入新产品，或点击选择已有产品
            </p>
          </div>
          <div class="form-group">
            <label>绑定用户名 / 备注(可选) </label>
            <input type="text" id="genUserName" placeholder="例如: 客户名、内部订单号...">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>激活码设备配额(Max Devices) </label>
            <input type="number" id="genMaxDevices" value="2" min="1" oninput="updateGenInfo()">
          </div>
          <div class="form-group">
            <label>初始订阅有效期(天数, 留空为永久) </label>
            <input type="number" id="genDuration" placeholder="例如: 365, 30...">
          </div>
          <div class="form-group">
            <label>批量生成数量 </label>
            <div style="display:flex; gap:8px; margin-bottom:4px;">
              <input type="number" id="genCount" value="1" min="1" max="100" style="flex:1;" oninput="updateGenInfo()">
              <button class="secondary" onclick="setGenPreset(1,2,'')"
                style="padding:4px 8px; font-size:13px;">×1</button>
              <button class="secondary" onclick="setGenPreset(5,2,'365')"
                style="padding:4px 8px; font-size:13px;">×5/1年</button>
              <button class="secondary" onclick="setGenPreset(10,1,'365')"
                style="padding:4px 8px; font-size:13px;">×10/1年</button>
            </div>
            <div id="genInfo" style="font-size:12px; color:var(--text-main); margin-top:4px;">
              占用配额：2台 (1个卡密 × 2设备)
            </div>
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
          <div style="display:flex; gap:8px;">
            <button class="secondary" style="flex:2;" onclick="copyGenResult()">📋 复制纯卡密文本 </button>
            <button class="primary" style="flex:1;" onclick="switchTab('manage')">👀 查看管理列表 </button>
          </div>
        </div>
      </div>
    </div>

    <!--Tab: Manage-->
    <div id="sec-manage" class="section">
      <div class="sticky-tools">
        <div class="search-bar" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:12px;">
          <div class="search-input-wrap" style="flex:1; min-width:200px; max-width:300px;">
            <input type="text" id="keywordSearch" placeholder="搜索卡密、用户名 (Ctrl+K)" oninput="debounceSearch()">
          </div>

          <!-- 快速状态筛选 -->
          <div style="display:flex; gap:4px; margin-left:8px;" id="statusFilterGroup">
            <button class="secondary" onclick="filterStatus('all', this)"
              style="padding:4px 8px; font-size:12px; background:var(--accent); color:#fff;">全部</button>
            <button class="secondary" onclick="filterStatus('active', this)"
              style="padding:4px 8px; font-size:12px;">活跃</button>
            <button class="secondary" onclick="filterStatus('revoked', this)"
              style="padding:4px 8px; font-size:12px;">已吊销</button>
            <button class="secondary" id="btnFilterExpiring" onclick="filterStatus('expiring', this)"
              style="padding:4px 8px; font-size:12px;">临期/过期</button>
          </div>

          <div style="display:flex; gap:8px; margin-left:auto; align-items:center;">
            <!-- 排序 -->
            <select id="sortOrder" onchange="applySort()"
              style="padding:6px; font-size:12px; border-radius:6px; background:#0d1117; color:var(--text-bright); border:1px solid var(--border-color); width:auto;">
              <option value="created_desc">最新生成↓</option>
              <option value="created_asc">最早生成↑</option>
              <option value="devices_desc">配额最高↓</option>
            </select>

            <!-- 产品筛选 -->
            <select id="filterProductId" onchange="loadLicenses()"
              style="padding:6px; font-size:12px; border-radius:6px; background:#0d1117; color:var(--text-bright); border:1px solid var(--border-color); width:auto; max-width:180px;">
              <option value=""> 所有产品线(Show All) </option>
            </select>
          </div>
        </div>

        <div style="display:flex; width:100%; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; gap:8px;">
            <button class="secondary" onclick="exportData()" style="padding:4px 8px; font-size:12px;">📤 导出JSON</button>
            <button class="secondary" onclick="exportExcel()" style="padding:4px 8px; font-size:12px;">📊
              导出Excel(CSV)</button>
            <button class="secondary" onclick="document.getElementById('importFile').click()"
              style="padding:4px 8px; font-size:12px;">📥 导入配置/CSV</button>
            <input type="file" id="importFile" accept=".json,.csv" style="display:none" onchange="importData(event)">
          </div>
          <div id="topPagination"></div>
        </div>
      </div>

      <!--阶段一二过渡：暂时保留 table 容器名，以便 JS 还能填充数据，下一阶段将彻底改为网格卡片-->
      <div id="licListContainer" style="padding-bottom: 90px;">
        <div class="table-container">
          <table id="licTable">
            <thead style="position:sticky; top:calc(var(--header-h) + var(--tools-h)); z-index:170; background:var(--panel-bg);">
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

    <!--Tab: Notifications-->
    <div id="sec-notifications" class="section">
      <div class="sticky-tools">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="margin:0; font-size:18px;">💡 全域精准广播管理</h2>
          <button class="primary" onclick="editNotification()">✨ 新建公告通知</button>
        </div>
      </div>
      <div class="card" style="margin-top:20px;">
        <div id="notificationListContainer" style="min-height: 200px;">
          <div style="text-align:center; padding:50px; color:var(--text-main)">🚀 加载中...</div>
        </div>
      </div>
    </div>

    <!--Tab: Settings-->
    <div id="sec-settings" class="section">
      <div class="sticky-tools">
        <div class="settings-header"
          style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="margin:0; font-size:20px; display:flex; align-items:center; gap:12px;">
            <span style="font-size:24px;">⚙️</span> 系统后台全局配置
          </h2>
          <button class="primary" onclick="saveSettings()"
            style="padding: 10px 24px; font-weight:600; box-shadow: 0 4px 12px rgba(78, 127, 250, 0.3);">
            <span class="icon">💾</span> 立即保存所有更改
          </button>
        </div>
      </div>
      <div class="card" style="margin-top:20px;">
        <div class="settings-grid">
          <!-- 安全与账户卡片 -->
          <div class="settings-card settings-group">
            <h3><span class="icon">🔐</span> 安全与账户</h3>
            <div class="form-group">
              <label>管理员登录密钥 (Admin Secret)</label>
              <div style="display: flex; gap: 10px; align-items: stretch;">
                <input type="password" value="********" readonly
                  style="flex: 1; background:rgba(30,39,58,0.4); color:#888; cursor:not-allowed;">
                <button class="secondary" style="white-space: nowrap; padding: 0 16px;"
                  onclick="changePassword()">修改密码</button>
              </div>
              <p class="help-text">更改后，旧密钥将立即失效且需重新登录。</p>
            </div>
            <div class="form-group">
              <label>JWT 离线有效期 (天)</label>
              <input type="number" id="set_jwt_offline_days" placeholder="30">
              <p class="help-text">后台签发的 Token 最长可离线使用的天数。</p>
            </div>
          </div>

          <!-- 风控参数卡片 -->
          <div class="settings-card settings-group">
            <h3><span class="icon">🛡️</span> 风控参数</h3>
            <div class="form-group">
              <label>每月解绑次数限制 (Unbind Limit)</label>
              <input type="number" id="set_max_unbind_per_month" placeholder="3">
              <p class="help-text">控制前台用户每月允许自助解绑的次数。</p>
            </div>
            <div class="form-group">
              <label>临期预警天数 (Expiry Warning)</label>
              <input type="number" id="set_expiry_warning_days" placeholder="7">
            </div>
          </div>

          <!-- 业务默认值卡片 -->
          <div class="settings-card settings-group">
            <h3><span class="icon">🏷️</span> 业务默认值</h3>
            <div class="form-group">
              <label>初始化设备配额 (Default Devices)</label>
              <input type="number" id="set_default_max_devices" placeholder="2">
              <p class="help-text">生卡页面默认填入的设备授权数量。</p>
            </div>
            <div class="form-group">
              <label>默认产品 ID (Default ID)</label>
              <input type="text" id="set_default_product_id" placeholder="default">
            </div>
          </div>

          <!-- Webhook 发卡网关 -->
          <div class="settings-card settings-group" style="grid-column: 1 / -1;">
            <h3><span class="icon">🔗</span> Webhook 发卡网关回调配置</h3>
            <div class="form-group">
              <label>回调通信秘钥 (Webhook Secret)</label>
              <input type="text" id="set_webhook_secret" placeholder="若为空则自动读取环境变量 WEBHOOK_SECRET">
              <p class="help-text">用于自动发卡平台回调时的鉴权。配置后立即生效，直穿边缘节点进行验证。</p>
            </div>
          </div>

          <!-- AI 大模型代理设置 -->
          <div class="settings-card settings-group" style="grid-column: 1 / -1;">
            <h3><span class="icon">🤖</span> 大模型 AI 代理网关</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
              <div class="form-group">
                <label>AI 服务 Base URL</label>
                <input type="text" id="set_ai_api_base" placeholder="https://api.openai.com/v1">
                <p class="help-text">兼容 OpenAI SDK 的大模型服务地址（不含 /chat/completions）。</p>
              </div>
              <div class="form-group">
                <label>AI 接口秘钥 (API Key)</label>
                <div class="pwd-input-wrapper">
                  <input type="password" id="set_ai_api_key" placeholder="sk-...">
                  <span class="pwd-toggle" onclick="const i=document.getElementById('set_ai_api_key');if(i.type==='password'){i.type='text';this.innerText='🙈'}else{i.type='password';this.innerText='👁️'}">👁️</span>
                </div>
                <p class="help-text">真实的大模型 API Key，仅存储在服务器数据库中，不会暴露给客户端。</p>
              </div>
              <div class="form-group">
                <label>默认模型名称 (Model)</label>
                <input type="text" id="set_ai_default_model" placeholder="glm-4-flash">
                <p class="help-text">客户端未指定模型时使用的默认模型（如 glm-4-flash、gpt-4o-mini）。</p>
              </div>
              <div class="form-group">
                <label>默认每日 AI 调用额度</label>
                <input type="number" id="set_ai_default_daily_quota" placeholder="50">
                <p class="help-text">未单独为卡密配置额度时，每个激活码每天的默认 AI 调用次数上限。</p>
              </div>
            </div>
            <div class="form-group" style="margin-top:16px;">
              <label>AI 代理网关总开关</label>
              <select id="set_ai_enabled" style="width:auto; min-width:120px;">
                <option value="true">✅ 已启用</option>
                <option value="false">❌ 已关闭</option>
              </select>
              <p class="help-text">关闭后所有通过网关的 AI 请求将被拒绝。</p>
            </div>
          </div>

          <!-- 门户页面定制 -->
          <div class="settings-card settings-group portal-custom-group" style="grid-column: 1 / -1;">
            <h3><span class="icon">🎨</span> 门户品牌定制 (Portal Styling)</h3>
            <div class="portal-grid">
              <div class="form-group">
                <label>门户大标题 (Title)</label>
                <input type="text" id="set_portal_title" placeholder="设备解绑中心">
              </div>
              <div class="form-group">
                <label>门户副标题 (Subtitle)</label>
                <input type="text" id="set_portal_subtitle" placeholder="自助更换绑定设备">
              </div>
              <div class="form-group portal-full-width" style="grid-column: 1 / -1;">
                <label>公告面板内容 (Support Tips)</label>
                <textarea id="set_portal_tips" rows="4"
                  style="width:100%; border-radius:8px; resize:vertical; background:#0d1117; color:white; border:1px solid var(--border-color); padding:10px;"
                  placeholder="建议包含 HTML..."></textarea>
              </div>
              <div class="form-group portal-full-width" style="grid-column: 1 / -1;">
                <label>客服/联系方式 (Admin Contact)</label>
                <input type="text" id="set_admin_contact" placeholder="请联系管理员处理">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 批量操作悬浮条 -->
  <div class="batch-bar" id="batchBar" style="transition: none;">
    <div class="batch-count" id="batchCountDisplay">0</div>
    <select id="batchActionSelect"
      style="background:#0d1117; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; padding:6px 12px; font-size:13px; outline:none;">
      <option value="" disabled selected>👉 选择批量动作...</option>
      <optgroup label="基础数据">
        <option value="revoke">🔒 批量吊销</option>
        <option value="restore">🔓 批量恢复</option>
        <option value="delete">🗑️ 彻底删除</option>
        <option value="set_user_name">📝 修改备注</option>
        <option value="set_offline_privilege">⚡ 配置专属离线特权</option>
        <option value="copy_keys">📋 复制纯卡密文本</option>
      </optgroup>
      <optgroup label="产品与订阅">
        <option value="add_subscription">🚀 续费/加产品</option>
        <option value="remove_subscription">❌ 抽离特定产品</option>
      </optgroup>
      <optgroup label="设备管理">
        <option value="unbind">📱 强制踢出设备</option>
        <option value="set_max_devices">🔢 修改上线额度</option>
        <option value="set_risk_threshold">⏱️ 修改24h风控阈值</option>
        <option value="reset_risk_level">🛡️ 重置风控等级</option>
      </optgroup>
      <optgroup label="AI 管理">
        <option value="set_ai_quota">🤖 配置专属 AI 额度</option>
        <option value="set_ai_model">🧠 配置专属 AI 模型</option>
        <option value="set_ai_key">🔑 配置专属 API Key</option>
        <option value="set_ai_base">🔗 配置专属 Base URL</option>
      </optgroup>
    </select>
    <button class="primary" style="padding:6px 16px" onclick="executeBatch()">🚀 确定执行</button>
    <button class="secondary" style="padding:6px 12px" onclick="selectAllFiltered()">☑️ 全选下方</button>
    <button class="secondary" style="padding:6px 12px" onclick="clearBatchSelection()">清空框选</button>
  </div>

  <script>
    function escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    let ADMIN_SECRET = "";
    let ALL_LICENSES = []; // 本地数据缓存
    let SET_SELECTED_KEYS = new Set(); // 批量选中的 keys
    // 分页状态
    let currentPage = 1;
    let PAGE_SIZE = 20;  // 每页显示条数
    let PRODUCT_HISTORY = new Set(['smartmp']);

    let modalResolve = null;

    function showToast(message, type = 'success') {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
      }
      const toast = document.createElement('div');
      toast.className = \`toast \${type}\`;
      toast.innerHTML = message;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

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
            if (inp.type === 'password') {
              htmlInputs += '<div class="form-group"><label>' + inp.label + '</label><div class="pwd-input-wrapper"><input type="password" id="modalInp' + i + '" value="' + (inp.value || '') + '" placeholder="' + (inp.placeholder || '') + '"><span class="pwd-toggle" onclick="const inp=this.previousElementSibling; inp.type=inp.type===\\'password\\'?\\'text\\':\\'password\\'; this.innerText=inp.type===\\'password\\'?\\'👁️\\':\\'🙈\\';">👁️</span></div></div>';
            } else {
              htmlInputs += '<div class="form-group"><label>' + inp.label + '</label><input type="' + (inp.type || 'text') + '" id="modalInp' + i + '" value="' + (inp.value || '') + '" placeholder="' + (inp.placeholder || '') + '"></div>';
            }
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

    async function login() {
      const s = document.getElementById('globalSecret').value.trim();
      if (!s) {
        showToast('请输入密钥', 'warning');
        return;
      }

      const btn = document.querySelector('#adminAuth button');
      const originalText = btn.innerText;
      btn.disabled = true;
      btn.innerText = '验证中...';

      try {
        const res = await fetch('/api/v1/auth/admin/licenses?product_id=', {
          headers: { 'Authorization': 'Bearer ' + s }
        });

        if (!res.ok) {
          showToast('密钥无效，请检查', 'error');
          throw new Error();
        }

        ADMIN_SECRET = s;
        localStorage.setItem('hw_admin_secret', s);
        document.getElementById('adminAuth').style.display = 'none';
        loadLicenses();
        loadSettings(); // 并行加载全局配置并同步默认值到生卡面板
      } catch (e) {
        // 请求失败自动恢复按钮状态
        if (e.message !== '') {
          showToast('网络或连接异常: ' + e.message, 'error');
        } else {
          // 由 response.ok !== true 抛出的空 Error
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = originalText;
        }
      }
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
      if (tab === 'settings') loadSettings();
      if (tab === 'notifications') loadNotifications();
      // 在标签切换时同步更新底栏可见性，防全局遮挡
      if (typeof updateBatchBar === 'function') updateBatchBar();
      
      // 切换标签后，高度可能因不同面板的内容而变化，触发同步
      setTimeout(syncStickyHeights, 50);
    }

    function syncStickyHeights() {
      const header = document.getElementById('stickyHeader');
      const tools = document.querySelector('.sticky-tools');
      const root = document.documentElement;
      if (header) {
        root.style.setProperty('--header-h', header.offsetHeight + 'px');
      }
      if (tools && tools.offsetParent !== null) { // 仅当工具栏可见时更新其高度变量
        root.style.setProperty('--tools-h', tools.offsetHeight + 'px');
      }
    }

    let currentPagination = null;
    let currentStats = null;

    // 计算并更新顶部统计指标
    function updateStats(stats) {
      if (!stats) return;
      document.getElementById('stat-total').innerText = stats.total;
      document.getElementById('stat-active').innerText = stats.active;
      document.getElementById('stat-revoked').innerText = stats.revoked;
      document.getElementById('stat-expiring').innerText = stats.expiring;

      // 为临期看板绑定点击筛选能力 (仅绑定一次防重复)
      const expCard = document.getElementById('stat-expiring').parentElement;
      expCard.style.cursor = 'pointer';
      if (!expCard.dataset.bound) {
        expCard.onmouseenter = () => expCard.style.border = '1px solid var(--warning)';
        expCard.onmouseleave = () => expCard.style.border = '1px solid var(--border-color)';
        expCard.onclick = () => {
          //自动跳转至“资产管理”标签页视觉状态
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
          const manageTab = document.querySelector('.tab[onclick*="manage"]');
          if (manageTab) manageTab.classList.add('active');
          document.getElementById('sec-manage').classList.add('active');

          // 触发后端的条件筛选并重载页面
          filterStatus('expiring', document.getElementById('btnFilterExpiring'));
        };
        expCard.dataset.bound = 'true';
      }
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
      showModal({
        title: '移除记录',
        message: '确定从历史建议中移除 "' + id + '" 吗？',
        confirmText: '确定移除',
        danger: true
      }).then(confirmed => {
        if (confirmed) {
          PRODUCT_HISTORY.delete(id);
          updateProductHelpers();
        }
      });
    }

    // 生卡区选择产品 ID 的辅助函数
    function setGenProduct(val) {
      document.getElementById('genProductId').value = val;
      updateProductHelpers();
      hideDropdown();
    }

    // 从服务器加载所有产品并显示下拉框
    let ALL_PRODUCTS_CACHE = [];
    async function loadAndShowProducts() {
      const dropdown = document.getElementById('productDropdown');
      
      // 显示加载中
      dropdown.innerHTML = '<div style="padding:12px; font-size:12px; color:var(--text-main); text-align:center;">加载产品列表...</div>';
      dropdown.classList.add('active');
      
      try {
        // 如果缓存为空，从服务器获取
        if (ALL_PRODUCTS_CACHE.length === 0) {
          const res = await fetch('/api/v1/auth/admin/products', {
            headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
          });
          const data = await res.json();
          if (data.success && data.products) {
            ALL_PRODUCTS_CACHE = data.products;
          }
        }
        
        // 渲染产品列表
        renderProductDropdown(ALL_PRODUCTS_CACHE);
      } catch (e) {
        dropdown.innerHTML = '<div style="padding:12px; font-size:12px; color:var(--error); text-align:center;">加载失败，请重试</div>';
      }
    }
    
    // 根据输入过滤产品
    function filterProducts(searchVal) {
      const dropdown = document.getElementById('productDropdown');
      const search = searchVal.toLowerCase();
      
      // 如果输入的是新产品（不在列表中），显示提示
      const matches = ALL_PRODUCTS_CACHE.filter(p => p.toLowerCase().includes(search));
      
      if (matches.length === 0 && search) {
        // 输入的是新产品
        dropdown.innerHTML = \`
          <div style="padding:8px 12px; font-size:12px; color:var(--text-main); border-bottom:1px solid var(--border-color);">
            📝 将创建新产品: <b style="color:var(--accent);">\${searchVal}</b>
          </div>
          <div style="padding:8px 12px; font-size:11px; color:var(--success);">
            ✓ 点击其他地方确认输入
          </div>
        \`;
        dropdown.classList.add('active');
      } else {
        renderProductDropdown(matches);
      }
    }
    
    // 渲染产品下拉框
    function renderProductDropdown(products) {
      const dropdown = document.getElementById('productDropdown');
      const currentVal = document.getElementById('genProductId').value;
      
      if (products.length === 0) {
        dropdown.innerHTML = '<div style="padding:12px; font-size:12px; color:var(--text-main); text-align:center;">暂无产品，请输入新产品ID</div>';
      } else {
        let listHtml = '<div style="padding:6px 12px; font-size:11px; color:var(--text-main); background:var(--panel-bg); border-bottom:1px solid var(--border-color);">📦 已有产品（点击选择）</div>';
        products.forEach(p => {
          const isSelected = p === currentVal ? '✓ ' : '';
          listHtml += \`<div class="dropdown-item" onclick="setGenProduct('\${p}')" style="display:flex; justify-content:space-between; align-items:center;">
            <span>\${isSelected}\${p}</span>
          </div>\`;
        });
        dropdown.innerHTML = listHtml;
      }
      dropdown.classList.add('active');
    }

    // 更新产品辅助器（包括筛选下拉和自定义生卡下拉框）
    function updateProductHelpers() {
      const filterSelect = document.getElementById('filterProductId');
      const dropdown = document.getElementById('productDropdown');
      const genInput = document.getElementById('genProductId');

      // 1. 同步当前所有存量产品到历史库（包括主产品和订阅产品）
      ALL_LICENSES.forEach(l => {
        // 添加主产品
        PRODUCT_HISTORY.add(l.product_id);
        // 添加所有订阅产品
        if (l.subscriptions && Array.isArray(l.subscriptions)) {
          l.subscriptions.forEach(sub => {
            if (sub.product_id) PRODUCT_HISTORY.add(sub.product_id);
          });
        }
      });

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
          listHtml += \`<div class="dropdown-item" onclick="setGenProduct('\${p}')">\` +
            \`<span>\${p}</span>\` +
            \`<div class="remove-btn" onclick="removeFromHistory(event, '\${p}')" title="从历史中移除">✕</div>\` +
            \`</div>\`;
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

    // 后端游标加载数据
    async function loadLicenses() {
      const searchKw = document.getElementById('keywordSearch') ? document.getElementById('keywordSearch').value.trim() : '';
      const pId = document.getElementById('filterProductId') ? document.getElementById('filterProductId').value : '';
      const container = document.getElementById('licListContainer');

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchKw,
        product_id: pId,
        status: currentStatusFilter,
        sort: currentSort
      });

      // 零状态时给大占位符，有数据增量时使用轻微透明度保护乐观UI
      if (!document.querySelector('.lic-row')) {
        container.innerHTML = '<div style="text-align:center; padding:50px; color:var(--text-main)">🚀 正在同步边缘数据...</div>';
      } else {
        container.style.opacity = '0.6';
      }

      try {
        const res = await fetch('/api/v1/auth/admin/licenses?' + queryParams.toString(), {
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await res.json();

        container.style.opacity = '1';

        if (!data.success) {
          if (res.status === 401) {
            logout();
            showModal({ title: '会话失效', message: '密钥无效或已更改，请重新输入', type: 'alert' });
            return;
          }
          container.innerHTML = '<div style="padding:20px; color:var(--danger)">❌ 获取失败: ' + data.msg + '</div>';
          return;
        }

        ALL_LICENSES = data.data; // 降级为仅缓存当前页数组，用于热变更映射
        currentPagination = data.pagination;
        currentStats = data.stats;

        updateStats(currentStats);
        updateProductHelpers();
        renderCards(ALL_LICENSES, currentPagination);
        
        // 数据加载完成后，重新计算可能因内容长短影响的高度
        setTimeout(syncStickyHeights, 100);
      } catch (e) {
        container.style.opacity = '1';
        container.innerHTML = '<div style="padding:20px; color:var(--danger)">⚠️ 无法连接服务器</div>';
      }
    }

    // 乐观 UI 内部静默热渲染器，不引发闪烁与网络波动
    function reRenderCards() {
      renderCards(ALL_LICENSES, currentPagination);
    }

    // 渲染列表视图布局
    function renderCards(list, pagination = null) {
      const container = document.getElementById('licListContainer');
      if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:50px; color:var(--text-main)">📭 暂无相关卡密数据</div>';
        const topPag = document.getElementById('topPagination');
        if (topPag) topPag.innerHTML = '';
        return;
      }

      // 所有的 list 即为已从后端切片好的 pagedList
      const pagedList = list;

      // 获取所有当前页的卡密 ID，以便全选比较使用
      const currentFilteredKeys = pagedList.map(l => l.license_key);

      // 检查是否在当前列表和跨页集合中全选了
      const isAllChecked = pagedList.length > 0 && pagedList.every(l => SET_SELECTED_KEYS.has(l.license_key));

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

      // 同步分页元数据为组件作用域变量
      const totalPages = pagination ? pagination.total_pages : 1;
      const totalItems = pagination ? pagination.total : list.length;
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

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
              <span style="font-weight:600; font-size:13px; color:var(--text-bright); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${lic.user_name ? escapeHTML(lic.user_name) : '<span style="color:var(--text-main); font-style:italic">未指定用户</span>'}</span>
              <span style="cursor:pointer; opacity:0.6; font-size:11px;" onclick="editUserName('\${lic.license_key}','\${lic.user_name ? escapeHTML(lic.user_name.replace(/'/g, "\\\\'")) : ""}')" title="修改用户备注">✏️</span>
              <span class="badge \${isRevoked ? 'badge-danger' : 'badge-success'}" style="transform: scale(0.85); transform-origin:left; margin-left:2px;">\${lic.status.toUpperCase()}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-family:monospace; font-size:12px; color:var(--accent);">\${lic.license_key}</span>
              <span style="cursor:pointer; opacity:0.6; font-size:12px;" onclick="copyText('\${lic.license_key}')" title="复制卡密">📋</span>
            </div>
          </div>
        </div>
        
        <!-- Col 2: 订阅标签与特权 -->
        <div style="font-size:12px; display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
          \${subHtml}
          \${lic.offline_days_override !== null && lic.offline_days_override !== undefined
            ? \`<span class="badge" style="background:#6c5ce7; color:white; font-weight:bold" title="单卡脱机特权">⚡ 离线: \${lic.offline_days_override}天</span>\`
            : ''}
          \${(lic.ai_daily_quota != null && lic.ai_daily_quota != undefined && String(lic.ai_daily_quota).trim() !== '')
            ? \`<span class="badge" style="background:var(--accent-glow); color:var(--accent); border:1px solid var(--accent); font-weight:bold" title="专属 AI 额度 (今日已用 / 每日总配额)">🤖 AI 额度: \${Number(lic.ai_used_today) || 0} / \${Number(lic.ai_daily_quota)}</span>\`
            : ''}
          \${(lic.ai_model_override || lic.ai_base_override)
            ? \`<span class="badge" style="background:rgba(210, 153, 34, 0.1); color:var(--warning); border: 1px solid rgba(210, 153, 34, 0.2);" title="已重写专属大模型或代理专线">👑 专属模型</span>\`
            : ''}
          <span onclick="addSub('\${lic.license_key}')" style="color:var(--accent); cursor:pointer; font-weight:500; font-size:11px; margin-left:4px; padding:2px 6px; background:var(--accent-glow); border-radius:4px;">+ 续费管理</span>
        </div>

        <!-- Col 3: 设备占用 -->
        <div style="font-size:12px; display:flex; flex-direction:column; justify-content:center;">
          <div style="color:var(--text-bright); margin-bottom:4px; font-weight:500; display:flex; align-items:center;">
            <div style="flex-shrink:0;">\${lic.current_devices} <span style="color:var(--text-main); font-weight:normal;">/ \${lic.max_devices} 台</span></div>
            <button class="secondary" onclick="toggleDevicePanel('\${lic.license_key}')" style="margin-left:6px; padding:2px 6px; font-size:11px; height:auto; background:var(--panel-bg); border-color:#30363d; flex-shrink:0;" title="展开查看具体设备">🔍 详情</button>
          </div>
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
      <!-- 动态设备面板插槽 -->
      <div id="devicePanel_\${lic.license_key}" style="display:none; grid-column:1/-1; background:#0d1117; border-top:1px dashed #30363d; padding:12px 16px; max-height: 350px; overflow-y: auto;"></div>
    \`;
      });

      html += '</div>';

      html += '</div>';

      // ==========================================
      // 更新顶部及底部分页导航 (提取逻辑)
      // ==========================================
      const renderPagination = () => {
        if (totalItems === 0) return '';
        return \`
          <div style="display:flex; align-items:stretch; gap:8px;">
            <select style="padding:0 12px; font-size:14px; border-radius:6px; background:#21262d; color:var(--text-bright); border:1px solid var(--border-color); outline:none; cursor:pointer;" onchange="changePageSize(this.value)">
              <option value="10" \${PAGE_SIZE === 10 ? 'selected' : ''}>10条/页</option>
              <option value="20" \${PAGE_SIZE === 20 ? 'selected' : ''}>20条/页</option>
              <option value="50" \${PAGE_SIZE === 50 ? 'selected' : ''}>50条/页</option>
              <option value="100" \${PAGE_SIZE === 100 ? 'selected' : ''}>100条/页</option>
            </select>
            <button class="secondary" style="white-space:nowrap; flex-shrink:0;" onclick="goToPage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>← 上一页</button>
            <div style="display:flex; align-items:center; padding:0 12px; font-size:14px; color:var(--text-main); background:var(--card-bg); border-radius:6px; border:1px solid var(--border-color); white-space:nowrap; flex-shrink:0;">
              第 <input type="number" id="quickPageInput" value="\${currentPage}" 
                style="width: 40px; text-align: center; padding: 2px 0; margin: 0 6px; background: transparent; border: none; color: var(--accent); font-weight: bold; font-size: 14px; border-bottom: 1px dashed var(--border-color); border-radius: 0; outline: none; -moz-appearance: textfield;"
                title="输入页数后回车跳转"
                onkeypress="if(event.key==='Enter') quickJumpPage(this, \${totalPages})"> / <span style="margin-left:4px;">\${totalPages} 页</span>
            </div>
            <button class="secondary" style="white-space:nowrap; flex-shrink:0;" onclick="goToPage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>下一页 →</button>
          </div>
        \`;
      };

      const topPag = document.getElementById('topPagination');
      if (topPag) {
        topPag.innerHTML = renderPagination();
      }

      container.innerHTML = html;
    }

    // 切换分页大小
    function changePageSize(size) {
      PAGE_SIZE = parseInt(size);
      currentPage = 1;
      filterLocalList(false);
    }

    // 分页跳转函数
    function goToPage(page) {
      currentPage = page;
      filterLocalList(false);
      window.scrollTo({ top: document.getElementById('licListContainer').offsetTop - 60, behavior: 'smooth' });
    }

    // 快捷输入页码跳转
    function quickJumpPage(element, maxPage) {
      let val = parseInt(element.value);
      if (isNaN(val)) return;
      if (val < 1) val = 1;
      if (val > maxPage) val = maxPage;
      element.value = val;
      element.blur();
      goToPage(val);
    }

    // 防抖搜索（300ms延迟）
    let searchTimer = null;
    function debounceSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => filterLocalList(true), 300);
    }

    // 状态筛选
    let currentStatusFilter = 'all';
    function filterStatus(status, btnElement) {
      currentStatusFilter = status;
      document.querySelectorAll('#statusFilterGroup button').forEach(btn => {
        btn.style.background = '';
        btn.style.color = 'var(--text-bright)';
      });
      if (btnElement) {
        btnElement.style.background = 'var(--accent)';
        btnElement.style.color = '#fff';
      }
      filterLocalList(true);
    }

    // 排序
    let currentSort = 'created_desc';
    function applySort() {
      currentSort = document.getElementById('sortOrder').value;
      filterLocalList(true);
    }

    // 生卡辅助计算
    function updateGenInfo() {
      const count = parseInt(document.getElementById('genCount').value) || 1;
      const maxDevices = parseInt(document.getElementById('genMaxDevices').value) || 2;
      const totalDevices = count * maxDevices;
      document.getElementById('genInfo').innerText = \`占用整体配额：\${totalDevices}台 (\${count}张卡 × \${maxDevices}台)\`;
    }

    function setGenPreset(count, maxDevices, duration) {
      document.getElementById('genCount').value = count;
      document.getElementById('genMaxDevices').value = maxDevices;
      document.getElementById('genDuration').value = duration || '';
      updateGenInfo();
    }

    // 搜索过滤与多维排序核心
    function filterLocalList(resetPage = true) {
      if (resetPage) currentPage = 1;
      loadLicenses(); // 所有排序与过滤计算引擎下沉至后端
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
          showToast(\`成功生成 \${data.keys.length} 张卡密，已自动为您选中！\`, 'success');
          document.getElementById('genResult').style.display = 'block';
          document.getElementById('genOutput').innerText = data.keys.join('\\n');

          // 心智流转：重置列表视图属性
          clearBatchSelection();
          data.keys.forEach(k => SET_SELECTED_KEYS.add(k));
          document.getElementById('keywordSearch').value = '';
          document.getElementById('filterProductId').value = '';
          filterStatus('all', document.querySelector('#statusFilterGroup button'));

          // 跳转与执行
          switchTab('manage');
          // 因为 switchTab('manage') 内调用了不返回 Promise 的 loadLicenses()，
          // 用短延时或拦截去确保底部 batchBar 出现
          setTimeout(() => {
            updateBatchBar();
            document.getElementById('batchBar').classList.add('pulse-highlight');
            setTimeout(() => document.getElementById('batchBar').classList.remove('pulse-highlight'), 1000);
          }, 800);

        } else { showToast('错误: ' + data.msg, 'error'); }
      } catch (e) { showToast('通讯失败: ' + e.message, 'error'); }
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

      try {
        const res = await fetch('/api/v1/auth/admin/licenses/status', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: key, status })
        });
        const data = await res.json();
        if (data.success) {
          const lic = ALL_LICENSES.find(l => l.license_key === key);
          if (lic) {
            lic.status = status;
            if (currentStats) {
              if (status === 'active') { currentStats.active++; currentStats.revoked--; }
              else { currentStats.active--; currentStats.revoked++; }
            }
            updateStats(currentStats);
            reRenderCards(); // 高效静态重绘
          }
          showToast(data.msg || '状态已更新', 'success');
        } else {
          showToast(data.msg || '操作失败', 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
    }

    async function deleteLic(key) {
      const confirmed = await showModal({
        title: '🗑️ 彻底停产',
        message: '⚠️ 危险: 确定删除卡密[<span style="color:var(--danger)">' + key + '</span>]吗？此操作不可逆！',
        confirmText: '确认删除',
        danger: true
      });
      if (!confirmed) return;

      try {
        const res = await fetch('/api/v1/auth/admin/licenses', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: key })
        });
        const data = await res.json();
        if (data.success) {
          ALL_LICENSES = ALL_LICENSES.filter(l => l.license_key !== key);
          SET_SELECTED_KEYS.delete(key);
          updateBatchBar();

          if (currentStats && currentStats.total > 0) currentStats.total--;
          updateStats(currentStats);

          // 如果当前页被删空，且不是第一页，自动退一页拉取
          if (ALL_LICENSES.length === 0 && currentPage > 1) {
            currentPage--;
          }
          filterLocalList(false); // 物理删除必须让后端填补空位
          showToast('已彻底删除该卡密', 'success');
        } else {
          showToast(data.msg || '删除失败', 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
    }

    async function editUserName(key, cur) {
      const res = await showModal({
        title: '✏️ 修改用户备注',
        inputs: [{ label: '用户名或内部备注', value: cur, placeholder: '输入新备注' }],
        confirmText: '保存修改'
      });
      if (!res) return;
      const n = res[0];

      try {
        const fetchRes = await fetch('/api/v1/auth/admin/licenses/user', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: key, user_name: n })
        });
        const data = await fetchRes.json();
        if (data.success) {
          const lic = ALL_LICENSES.find(l => l.license_key === key);
          if (lic) {
            lic.user_name = n;
            reRenderCards(); // 文本热变更，零闪烁
          }
          showToast('备注已更新', 'success');
        } else {
          showToast(data.msg || '更新失败', 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
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
          showToast(data.deleted ? '权限配置已清理' : '订阅已续期更新成功', 'success');
          const lic = ALL_LICENSES.find(l => l.license_key === key);
          if (lic) {
            if (data.deleted) {
              lic.subscriptions = (lic.subscriptions || []).filter(s => s.product_id !== pId);
            } else {
              const subObj = { product_id: pId, expires_at: data.expires_at };
              lic.subscriptions = lic.subscriptions || [];
              const existIdx = lic.subscriptions.findIndex(s => s.product_id === pId);
              if (existIdx >= 0) {
                lic.subscriptions[existIdx] = subObj;
              } else {
                lic.subscriptions.push(subObj);
              }
            }
            updateProductHelpers();
            filterLocalList(false); // 局部热更新
          }
        } else {
          showToast(data.msg || '操作未生效', 'error');
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
      event.target.value = '';

      const isCSV = file.name.toLowerCase().endsWith('.csv');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const contentStr = e.target?.result;
          let licenses = [];

          if (isCSV) {
            // CSV 解析引擎
            const rows = [];
            let cur = '';
            let inQuote = false;
            for (let i = 0; i < contentStr.length; i++) {
              const c = contentStr[i];
              if (c === '"') {
                if (inQuote && contentStr[i + 1] === '"') {
                  cur += '"';
                  i++; // skip escaped quote
                } else {
                  inQuote = !inQuote;
                }
              } else if (c === ',' && !inQuote) {
                rows.push(cur);
                cur = '';
              } else if ((c === '\\n' || c === '\\r') && !inQuote) {
                if (c === '\\r' && contentStr[i + 1] === '\\n') i++; // CRLF
                rows.push(cur);
                if (rows.length > 1 || rows[0] !== '') {
                  // Skip header row if it contains '激活码标识'
                  if (!(rows.length > 0 && String(rows[0]).includes('激活码标识'))) {
                    // 逆向映射
                    const key = rows[0]?.trim();
                    if (key) {
                      const userName = rows[1]?.trim();
                      const status = rows[2]?.trim() === '已吊销' ? 'revoked' : 'active';
                      const maxDev = parseInt(rows[3]) || 2;

                      // 提取 subscriptions digest (列 6: e.g., "[smartmp: 2024/01/01] | [other: 永久]")
                      const subDigest = rows[6] || '';
                      const subs = [];
                      const subRegex = /\\\\[(.*?) ?: ?(.*?)\\\\]/g;
                      let match;
                      while ((match = subRegex.exec(subDigest)) !== null) {
                        const pId = match[1].trim();
                        const expVal = match[2].trim();
                        let expDate = null;
                        if (expVal !== '永久' && expVal !== '未知') {
                          const parsed = new Date(expVal);
                          if (!isNaN(parsed.getTime())) {
                            expDate = parsed.toISOString();
                          }
                        }
                        subs.push({ product_id: pId, expires_at: expDate });
                      }

                      licenses.push({
                        license_key: key,
                        user_name: userName === '未配置' ? '' : userName,
                        status: status,
                        max_devices: maxDev,
                        subscriptions: subs
                      });
                    }
                  }
                }
                rows.length = 0;
                cur = '';
              } else {
                cur += c;
              }
            }
            if (cur || rows.length) {
              rows.push(cur);
              if (rows.length > 0 && rows[0]?.trim() && !String(rows[0]).includes('激活码标识')) {
                // Copy pasted mapping
                const key = rows[0]?.trim();
                if (key) {
                  const userName = rows[1]?.trim();
                  const status = rows[2]?.trim() === '已吊销' ? 'revoked' : 'active';
                  const maxDev = parseInt(rows[3]) || 2;
                  const subDigest = rows[6] || '';
                  const subs = [];
                  const subRegex = /\\\\[(.*?) ?: ?(.*?)\\\\]/g;
                  let match;
                  while ((match = subRegex.exec(subDigest)) !== null) {
                    const pId = match[1].trim();
                    const expVal = match[2].trim();
                    let expDate = null;
                    if (expVal !== '永久' && expVal !== '未知') {
                      const parsed = new Date(expVal);
                      if (!isNaN(parsed.getTime())) {
                        expDate = parsed.toISOString();
                      }
                    }
                    subs.push({ product_id: pId, expires_at: expDate });
                  }
                  licenses.push({
                    license_key: key,
                    user_name: userName === '未配置' ? '' : userName,
                    status: status,
                    max_devices: maxDev,
                    subscriptions: subs
                  });
                }
              }
            }
            if (licenses.length === 0) throw new Error("CSV 数据为空或格式不正确");

          } else {
            // JSON 导入处理
            licenses = JSON.parse(contentStr);
            if (!Array.isArray(licenses)) throw new Error("格式错误，非 JSON 数组！");
          }

          const confirmed = await showModal({
            title: '批量导入确认',
            message: \`即将批量导入 \${licenses.length} 条数据，已存在的数据将会被融合覆盖。是否继续？\`,
            confirmText: '确认导入',
            danger: true
          });
          if (!confirmed) return;

          // 使用遮罩防止二次点击
          const btn = document.querySelector('.modal-footer .primary');
          if (btn) btn.innerText = "上传中...";

          const fRes = await fetch('/api/v1/auth/admin/licenses/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ADMIN_SECRET },
            body: JSON.stringify({ licenses })
          });

          const data = await fRes.json();
          if (data.success) {
            showToast('导入成功：' + data.msg, 'success');
            loadLicenses();
          } else {
            showToast('导入失败：' + data.msg, 'error');
          }
        } catch (err) {
          showToast('解析错误：' + err.message, 'error');
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

      // 判断是否在“资产管理”标签页 (\`sec-manage\`)
      const manageSection = document.getElementById('sec-manage');
      const isManageTabActive = manageSection && manageSection.classList.contains('active');

      const count = SET_SELECTED_KEYS.size;
      countDisplay.innerText = count + ' 项选中';

      // 只有在资产列表且选中项 > 0 时才弹出
      if (count > 0 && isManageTabActive) {
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

    // 全选当前筛选结果
    function selectAllFiltered() {
      const kw = document.getElementById('keywordSearch').value.toLowerCase();
      const pId = document.getElementById('filterProductId').value;

      let filtered = ALL_LICENSES.filter(l => {
        const matchKeyword = !kw ||
          l.license_key.toLowerCase().includes(kw) ||
          (l.user_name && l.user_name.toLowerCase().includes(kw));
        const matchProduct = !pId || l.product_id === pId;
        let matchStatus = true;
        if (currentStatusFilter === 'active') matchStatus = l.status === 'active';
        else if (currentStatusFilter === 'revoked') matchStatus = l.status === 'revoked';
        return matchKeyword && matchProduct && matchStatus;
      });

      filtered.forEach(l => SET_SELECTED_KEYS.add(l.license_key));
      filterLocalList(false); // 触发重新渲染以回显勾选
      updateBatchBar();
      showToast(\`已全选当前视图下的 \${filtered.length} 个结果。\`, 'success');
    }

    // 极简化的批量执行流程（零动画、无阻塞提示响应）
    async function executeBatch() {
      const actionSelect = document.getElementById('batchActionSelect');
      const action = actionSelect ? actionSelect.value : '';
      if (!action) {
        showToast('请先选择需要执行的批量动作', 'warning');
        return;
      }

      const keys = Array.from(SET_SELECTED_KEYS);
      if (keys.length === 0) {
        showToast('请先勾选至少一张卡密', 'warning');
        return;
      }

      // 前端纯文字提取
      if (action === 'copy_keys') {
        try {
          await navigator.clipboard.writeText(keys.join('\\n'));
          showToast(\`已复制 \${keys.length} 个激活码到剪贴板！\`, 'success');
          clearBatchSelection();
        } catch (e) {
          showToast('复制失败，您的浏览器可能阻拦了剪贴板访问。', 'error');
        }
        return;
      }

      const optionText = actionSelect.options[actionSelect.selectedIndex].text.replace(/^[\\u0000-\\uFFFF]{1,3}\\s/, '');
      const confirmed = await showModal({
        title: '批量操作确认',
        message: \`🚀 最终确认：是否对 \${keys.length} 个卡密执行 [\${optionText}] 操作？\`,
        confirmText: '确定执行',
        danger: true
      });
      if (!confirmed) return;

      let params = {};

      if (action === 'set_user_name') {
        const res = await showModal({
          title: '修改备注',
          inputs: [{ label: \`对 \${keys.length} 个卡密修改备注为：\`, value: '', placeholder: '输入新备注' }],
          confirmText: '确定'
        });
        if (!res) return;
        params.user_name = res[0] || '';
      } else if (action === 'set_offline_privilege') {
        const res = await showModal({
          title: '配置专属离线特权',
          inputs: [{ label: \`给 \${keys.length} 张卡密设置离线天数 (留空还原全局，0代表禁离线)：\`, value: '', type: 'number', placeholder: '如: 365' }],
          confirmText: '确定应用'
        });
        if (!res) return;
        params.offline_days_override = res[0] === '' ? '' : parseInt(res[0]);
      } else if (action === 'set_ai_quota') {
        const res = await showModal({
          title: '🤖 配置专属 AI 每日额度',
          inputs: [{ label: \`给 \${keys.length} 张卡密设置 AI 每日调用次数 (留空还原为全局默认)：\`, value: '', type: 'number', placeholder: '如: 100' }],
          confirmText: '确定应用'
        });
        if (!res) return;
        params.ai_daily_quota = res[0] === '' ? '' : parseInt(res[0]);
      } else if (action === 'set_ai_model') {
        const res = await showModal({
          title: '🧠 配置专属 AI 模型',
          inputs: [{ label: \`给 \${keys.length} 张卡密绑定特权大模型名称 (留空还原全局默认)：\`, value: '', placeholder: '如: gpt-4o' }],
          confirmText: '确定应用'
        });
        if (!res) return;
        params.ai_model_override = res[0];
      } else if (action === 'set_ai_key') {
        const res = await showModal({
          title: '🔑 配置专属 API Key',
          inputs: [{ label: \`给 \${keys.length} 张卡密配置私人 API Key (留空还原全局默认)：\`, value: '', placeholder: 'sk-...' }],
          confirmText: '确定应用'
        });
        if (!res) return;
        params.ai_key_override = res[0];
      } else if (action === 'set_ai_base') {
        const res = await showModal({
          title: '🔗 配置专属 Base URL',
          inputs: [{ label: \`给 \${keys.length} 张卡密配置代理或专线接口 (留空还原全局默认)：\`, value: '', placeholder: 'https://api...' }],
          confirmText: '确定应用'
        });
        if (!res) return;
        params.ai_base_override = res[0];
      } else if (action === 'set_max_devices') {
        const res = await showModal({
          title: '修改设备上限',
          inputs: [{ label: \`调整 \${keys.length} 个卡密的设备上限 (1-1000)：\`, value: '2', type: 'number' }],
          confirmText: '确定'
        });
        if (!res) return;
        params.max_devices = parseInt(res[0]) || 1;
      } else if (action === 'set_risk_threshold') {
        const res = await showModal({
          title: '修改24h风控阈值',
          inputs: [{ 
            label: \`设置 \${keys.length} 个卡密的24小时绑定阈值 (1-100，输入0表示自动计算)：\`, 
            value: '0', 
            type: 'number',
            placeholder: '0=自动, 10=固定10台'
          }],
          confirmText: '确定'
        });
        if (!res) return;
        params.risk_threshold = parseInt(res[0]) || 0;
      } else if (action === 'reset_risk_level') {
        const confirmed = await showModal({
          title: '🛡️ 重置风控等级',
          message: \`确定重置 \${keys.length} 个卡密的风控等级为 0（解除限制）吗？\`,
          confirmText: '确定重置',
          danger: true
        });
        if (!confirmed) return;
        // reset_risk_level 不需要额外参数
      } else if (action === 'add_subscription') {
        const res = await showModal({
          title: '续费/加产品',
          inputs: [
            { label: '产品识别 ID (例如 smartmp)：', value: '', placeholder: '如 smartmp' },
            { label: '有效天数 (留空表示永久)：', value: '365', type: 'number' }
          ],
          confirmText: '确定'
        });
        if (!res || !res[0]) return;
        params.product_id = res[0];
        params.duration_days = res[1] ? parseInt(res[1]) : null;
      } else if (action === 'remove_subscription') {
        const res = await showModal({
          title: '剥夺指定产品权限',
          inputs: [{ label: '要剥夺权限的产品 ID：', value: '', placeholder: '如 smartmp' }],
          confirmText: '确定',
          danger: true
        });
        if (!res || !res[0]) return;
        params.product_id = res[0];
      }

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
          showToast(data.msg, 'success');
          loadLicenses();
        } else {
          showToast('执行失败：' + data.msg, 'error');
        }
      } catch (err) {
        showToast('网络请求失败：' + (err.message || err), 'error');
      }
    }

    // ==========================================
    // 设备明细面板控制 (零动画精简版)
    // ==========================================
    async function toggleDevicePanel(key) {
      const panel = document.getElementById('devicePanel_' + key);
      if (!panel) return;

      if (panel.style.display === 'block') {
        panel.style.display = 'none';
        return;
      }

      panel.style.display = 'block';
      panel.innerHTML = '<div style="color:var(--text-main); font-size:12px; padding:10px;">⌛ 加载中...</div>';

      try {
        const res = await fetch('/api/v1/auth/admin/licenses/' + key + '/devices', {
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await res.json();

        if (!data.success) {
          panel.innerHTML = '<div style="color:var(--danger); font-size:12px;">❌ 加载失败: ' + data.msg + '</div>';
          return;
        }

        const devices = data.data;
        if (devices.length === 0) {
          panel.innerHTML = '<div style="color:var(--text-main); font-size:12px;">📭 暂无绑定设备。</div>';
          return;
        }

        // 超极简表格替代复杂的表格框架结构以降低节点量
        let html = \`<div style="padding:8px 12px; font-size:12px;"><strong>共计 \${devices.length} 台在线设备：</strong></div>\`;
        devices.forEach(d => {
          const lActive = d.last_active ? new Date(d.last_active + 'Z').toLocaleString('zh-CN') : '未知';
          const safeDeviceName = escapeHTML(d.device_name || '未命名设备');
          html += \`
            <div style="padding:8px 12px; border-top:1px solid #30363d; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="color:var(--text-bright); margin-bottom:4px;"><strong>\${safeDeviceName}</strong></div>
                <div style="font-family:monospace; color:var(--text-main); margin-bottom:2px;">\${d.device_id}</div>
                <div style="color:var(--text-main); font-size:11px;">最后在线: \${lActive}</div>
              </div>
              <button class="secondary" style="padding:6px 10px; font-size:12px; color:var(--danger);" onclick="removeSingleDevice('\${key}', '\${d.device_id}')">强制解绑</button>
            </div>
          \`;
        });

        panel.innerHTML = html;

      } catch (err) {
        panel.innerHTML = '<div style="color:var(--danger); font-size:12px;">❌ 无法存取设备数据</div>';
      }
    }

    async function removeSingleDevice(key, deviceId) {
      const confirmed = await showModal({
        title: '强制解绑设备',
        message: '确定要强制注销该设备吗？踢出后，特定客户端将失去授权网络。',
        confirmText: '确认注销',
        danger: true
      });
      if (!confirmed) return;

      try {
        const res = await fetch('/api/v1/auth/admin/licenses/' + key + '/devices/' + encodeURIComponent(deviceId), {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await res.json();
        if (data.success) {
          toggleDevicePanel(key);
          setTimeout(() => toggleDevicePanel(key), 300);
          loadLicenses();
        } else {
          showToast('操作失败: ' + data.msg, 'error');
        }
      } catch (err) {
        showToast('网络错误: ' + err.message, 'error');
      }
    }

    // ==========================================
    // 高级功能：键盘快捷键支持
    // ==========================================
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: 聚焦全局搜索
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('keywordSearch');
        if (searchInput) searchInput.focus();
      }

      // Ctrl/Cmd + R: 无动画静默刷新数据列表
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r' && !e.shiftKey) {
        e.preventDefault();
        loadLicenses();
      }

      // Esc: 收起目前打开的所有模态框/下拉面板
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    // ==========================================
    // 系统设置逻辑 (Phase 17)
    // ==========================================
    async function loadSettings() {
      try {
        const res = await fetch('/api/v1/auth/admin/settings', {
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await res.json();
        if (data.success && data.settings) {
          data.settings.forEach(item => {
            const el = document.getElementById('set_' + item.key);
            if (el) {
              // 密码字段特殊处理，不回显
              if (item.key === 'admin_password') return;
              el.value = item.value || '';
            }

            // 同步业务默认值到极速生卡面板
            if (item.key === 'default_max_devices') {
              const genMaxDev = document.getElementById('genMaxDevices');
              if (genMaxDev) {
                genMaxDev.value = item.value || '2';
                updateGenInfo();
              }
            }
            if (item.key === 'default_product_id') {
              const genProdId = document.getElementById('genProductId');
              if (genProdId && item.value) {
                genProdId.value = item.value;
                updateProductHelpers();
              }
            }
          });
        }
      } catch (e) {
        showToast('加载配置失败: ' + e.message, 'error');
      }
    }

    async function saveSettings() {
      const keys = ['jwt_offline_days', 'max_unbind_per_month', 'default_max_devices', 'expiry_warning_days', 'default_product_id', 'portal_title', 'portal_subtitle', 'portal_tips', 'admin_contact', 'webhook_secret', 'ai_api_base', 'ai_api_key', 'ai_default_model', 'ai_default_daily_quota', 'ai_enabled'];
      const updates = {};
      keys.forEach(k => {
        const el = document.getElementById('set_' + k);
        if (el) updates[k] = el.value;
      });

      try {
        const res = await fetch('/api/v1/auth/admin/settings', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.msg || '设置已保存', 'success');
        } else {
          showToast('操作失败: ' + data.msg, 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
    }

    async function changePassword() {
      const res = await showModal({
        title: '🔐 修改管理员密码',
        message: '极度重要：修改后请务必记牢。旧密钥将立即失效，系统将引导您重新登录。',
        inputs: [
          { label: '🔐 请输入当前管理员密钥 (身份验证)', type: 'password', placeholder: 'Current Secret' },
          { label: '🆕 设置新的登录密钥 (请务必记牢)', type: 'password', placeholder: 'New Secret Password' }
        ],
        confirmText: '确认修改并注销'
      });

      if (!res) return;
      const [oldSecret, newSecret] = res;
      if (!oldSecret || !newSecret) return showToast('参数不完整', 'warning');

      try {
        const response = await fetch('/api/v1/auth/admin/settings', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: { admin_password: newSecret }, old_password: oldSecret })
        });
        const data = await response.json();
        if (data.success) {
          showToast('密码修改成功，正在注销...', 'success');
          setTimeout(() => logout(), 1500);
        } else {
          showToast('修改失败: ' + data.msg, 'error');
        }
      } catch (e) {
        showToast('提交异常: ' + e.message, 'error');
      }
    }
      async function applySubConfig() {
      // 占位函数：前序旧代码遗留或扩展
      showToast('配置已应用', 'success');
    }

    // ==========================================
    // 📢 广播通知管理模块
    // ==========================================
    let ALL_NOTIFICATIONS = [];

    async function loadNotifications() {
      const container = document.getElementById('notificationListContainer');
      container.innerHTML = '<div style="text-align:center; padding:50px; color:var(--text-main)">🚀 正在拉取通知数据...</div>';
      try {
        const res = await fetch('/api/v1/auth/admin/notifications', {
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await res.json();
        if (data.success) {
          ALL_NOTIFICATIONS = data.data || [];
          renderNotifications();
        } else {
          container.innerHTML = '<div style="color:var(--danger)">❌ 失败: ' + data.msg + '</div>';
        }
      } catch (e) {
        container.innerHTML = '<div style="color:var(--danger)">⚠️ 无法连接服务器</div>';
      }
    }

    function renderNotifications() {
      const container = document.getElementById('notificationListContainer');
      if (ALL_NOTIFICATIONS.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:50px; color:var(--text-main)">📭 暂无任何广播公告，点击右上角新建。</div>';
        return;
      }
      
      let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
      ALL_NOTIFICATIONS.forEach(n => {
        let badgeCls = 'badge-success';
        let badgeTxt = '已发布';
        if (n.status === 'draft') { badgeCls = 'badge-warning'; badgeTxt = '草稿'; }
        if (n.status === 'offline') { badgeCls = 'badge-danger'; badgeTxt = '已下线'; }

        let typeBadge = '';
        if (n.type === 'update') typeBadge = '🔥 更新';
        else if (n.type === 'warning') typeBadge = '⚠️ 警告';
        else typeBadge = 'ℹ️ 消息';

        const dDate = new Date(n.created_at + 'Z').toLocaleString('zh-CN');

        html += '<div class="lic-row" style="grid-template-columns: 3fr 1fr 1.5fr;">' +
          '<div>' +
            '<div style="font-weight:bold; font-size:15px; margin-bottom:6px; display:flex; align-items:center; gap:8px;">' +
              '<span class="badge" style="background:var(--panel-bg); border:1px solid var(--border-color); color:var(--text-bright);">' + typeBadge + '</span>' +
              escapeHTML(n.title) +
              (n.is_force ? '<span class="badge badge-danger">强提醒</span>' : '') +
            '</div>' +
            '<div style="color:var(--text-main); font-size:13px; margin-bottom:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">' +
              escapeHTML(n.content) +
            '</div>' +
              '<div style="font-size:12px; color:var(--indigo); margin-bottom: 4px;">' +
                (n.action_url ? '🔗 ' + escapeHTML(n.action_url) : '') +
              '</div>' +
              '<div style="font-size:11px; color:var(--text-main); opacity: 0.8;">' +
                '🎯 受众产品: ' + (n.target_rules ? '<code style="background:var(--panel-bg); padding:2px 4px; border-radius:4px;">' + escapeHTML(n.target_rules) + '</code>' : '<span style="color:var(--success)">全域公开</span>') +
              '</div>' +
            '</div>' +
          '<div style="display:flex; flex-direction:column; justify-content:center; gap:4px; font-size:12px;">' +
            '<div>状态: <span class="badge ' + badgeCls + '">' + badgeTxt + '</span></div>' +
            '<div style="color:var(--text-main);">创建于 ' + dDate + '</div>' +
          '</div>' +
          '<div style="display:flex; gap:8px; justify-content:flex-end; align-items:center;">' +
            '<button class="secondary" style="padding:4px 8px; font-size:12px;" onclick="toggleNotificationStatus(\\'' + n.id + '\\', \\'' + n.status + '\\')">' +
              (n.status === 'published' ? '⬇️ 下线' : '🚀 发布') +
            '</button>' +
            '<button class="secondary" style="padding:4px 8px; font-size:12px;" onclick="editNotification(\\'' + n.id + '\\')">✏️ 编辑</button>' +
            '<button class="danger" style="padding:4px 8px; font-size:12px;" onclick="deleteNotification(\\'' + n.id + '\\')">🗑️</button>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
    }

    async function editNotification(id = null) {
      let isEdit = !!id;
      let target = isEdit ? ALL_NOTIFICATIONS.find(x => x.id === id) : { title: '', content: '', action_url: '', type: 'info', status: 'draft', is_force: 0, target_rules: '' };
      
      // 使用扩展版的 showModal
      const inputs = [
        { label: '公告标题 (Title)', value: target.title, placeholder: '输入引人注目的短语' },
        { label: '公告正文 (Content)', value: target.content, placeholder: '尽量使用纯文本' },
        { label: '跳转链接 (Action URL)', value: target.action_url || '', placeholder: '如: https://...' },
        { label: '公告类型 (update, info, warning)', value: target.type },
        { label: '受众产品 ID (多个用英文逗号分隔，留空则全放)', value: target.target_rules || '', placeholder: '如: ZenClean,ZenImage' },
        { label: '是否阻断强提醒 (1=是, 0=否)', value: String(target.is_force || 0), type: 'number' }
      ];

      const res = await showModal({
        title: isEdit ? '✏️ 修改广播公告' : '✨ 新建全域广播公告',
        inputs,
        confirmText: '保存数据'
      });

      if (!res) return;

      const title = res[0] ? res[0].trim() : '';
      const content = res[1] ? res[1].trim() : '';
      const action_url = res[2] ? res[2].trim() : '';
      const type = (res[3] || 'info').trim().toLowerCase();
      const target_rules = res[4] ? res[4].trim() : '';
      const is_force = parseInt(res[5]) || 0;

      if (!title || !content) {
        showToast('标题和正文为必填项！', 'warning');
        return;
      }

      try {
        const fetchRes = await fetch('/api/v1/auth/admin/notifications', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: isEdit ? id : undefined,
            title, content, action_url, type, is_force, target_rules,
            status: isEdit ? target.status : 'draft'  // 新建默认草稿
          })
        });
        const data = await fetchRes.json();
        if (data.success) {
          showToast(data.msg, 'success');
          loadNotifications();
        } else {
          showToast('保存失败: ' + data.msg, 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
    }

    async function toggleNotificationStatus(id, currentStatus) {
      const nextStatus = currentStatus === 'published' ? 'offline' : 'published';
      const actionTxt = nextStatus === 'published' ? '🚀 确定立即将此公告推送到全网客户端吗？' : '⬇️ 确定下线该公告吗？(下线后客户端将不再收到)';
      
      const confirmed = await showModal({
        title: '状态变更',
        message: actionTxt,
        confirmText: '确定执行',
        danger: nextStatus === 'published'
      });

      if (!confirmed) return;

      try {
        const fetchRes = await fetch('/api/v1/auth/admin/notifications/' + id + '/status', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        const data = await fetchRes.json();
        if (data.success) {
          showToast(data.msg, 'success');
          loadNotifications();
        } else {
          showToast('失败: ' + data.msg, 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
    }

    async function deleteNotification(id) {
      const confirmed = await showModal({
        title: '🗑️ 永久删除',
        message: '删除后无法恢复，确定移除该公告吗？',
        confirmText: '确定删除',
        danger: true
      });
      if (!confirmed) return;

      try {
        const fetchRes = await fetch('/api/v1/auth/admin/notifications/' + id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + ADMIN_SECRET }
        });
        const data = await fetchRes.json();
        if (data.success) {
          showToast('公告已移除', 'success');
          loadNotifications();
        } else {
          showToast('移除失败: ' + data.msg, 'error');
        }
      } catch (e) {
        showToast('网络错误: ' + e.message, 'error');
      }
    }


    // 滚动监听：处理顶部粘性样式的视觉增强
    window.addEventListener('scroll', () => {
      const header = document.getElementById('stickyHeader');
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // 初始化高度校准
    window.addEventListener('resize', syncStickyHeights);
    window.addEventListener('load', () => {
      setTimeout(syncStickyHeights, 500); // 留出资源加载余量
    });
  </script>
</body>

</html>`;