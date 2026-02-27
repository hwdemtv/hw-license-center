export const portalHtml = `
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>互为卡密自助换绑中心</title>
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
            --danger: #f85149;
        }

        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background: var(--bg-color);
            color: var(--text-bright);
            line-height: 1.6;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 480px;
            padding: 20px;
            box-sizing: border-box;
        }

        .card {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px auto;
            font-size: 20px;
        }

        h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
            text-align: center;
            color: white;
        }

        p.desc {
            font-size: 13px;
            color: var(--text-main);
            text-align: center;
            margin-bottom: 24px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        input {
            width: 100%;
            padding: 12px 16px;
            background: #0d1117;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-bright);
            font-size: 14px;
            box-sizing: border-box;
            transition: 0.2s;
        }

        input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-glow);
            outline: none;
        }

        input::placeholder {
            color: #484f58;
        }

        button {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: 0.2s;
            border: none;
        }

        button.primary {
            background: var(--accent);
            color: #0d1117;
        }

        button.primary:hover {
            opacity: 0.9;
        }

        button.primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        button.danger {
            background: rgba(248, 81, 73, 0.1);
            color: var(--danger);
            border: 1px solid rgba(248, 81, 73, 0.2);
        }

        button.danger:hover {
            background: var(--danger);
            color: white;
        }

        button.btn-aux {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-bright);
            padding: 4px 8px;
            font-size: 12px;
            width: auto;
        }

        button.btn-aux:hover {
            background: var(--border-color);
        }

        .result-area {
            margin-top: 24px;
            display: none;
            border-top: 1px dashed var(--border-color);
            padding-top: 24px;
        }

        .quota-info {
            font-size: 13px;
            color: var(--text-main);
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .device-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .device-item {
            background: #0d1117;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .dev-name {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 4px;
            color: var(--text-bright);
        }

        .dev-time {
            font-size: 11px;
            color: var(--text-main);
        }

        .msg {
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
            text-align: center;
        }

        .msg.error {
            background: rgba(248, 81, 73, 0.1);
            color: var(--danger);
            border: 1px solid rgba(248, 81, 73, 0.2);
            display: block;
        }

        .msg.success {
            background: rgba(63, 185, 80, 0.1);
            color: #3fb950;
            border: 1px solid rgba(63, 185, 80, 0.2);
            display: block;
        }

        .loading {
            opacity: 0.6;
            pointer-events: none;
        }

        /* Overlay and Modal */
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            width: 90%;
            max-width: 360px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.2s;
        }

        .overlay.active {
            display: flex;
        }

        .overlay.active .modal {
            transform: translateY(0);
            opacity: 1;
        }

        .modal-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: white;
        }

        .modal-body {
            font-size: 13px;
            color: var(--text-main);
            margin-bottom: 24px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .modal-actions {
            display: flex;
            gap: 12px;
        }
        .rule-tips {
            margin-top: 24px;
            padding: 16px;
            background: rgba(88, 166, 255, 0.05);
            border: 1px solid rgba(88, 166, 255, 0.1);
            border-radius: 8px;
            font-size: 12px;
            color: var(--text-main);
            line-height: 1.8;
        }

        .rule-tips-title {
            color: var(--accent);
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card">
            <div class="icon">💻</div>
            <h1>设备解绑查询门户</h1>
            <p class="desc">在线强制释出与卡密关联的失效或闲置物理设备</p>

            <div id="sysMsg" class="msg"></div>

            <div class="form-group" style="position:relative;">
                <input type="text" id="licenseKey" placeholder="输入完整的激活码凭证 (License Key)" autocomplete="off"
                    spellcheck="false" style="padding-right: 76px;" oninput="formatLicenseKey(this)" />
                <div style="position:absolute; right:8px; top:50%; transform:translateY(-50%); display:flex; gap:4px;">
                    <button class="secondary btn-aux" id="btnPaste" onclick="pasteKey()" title="一键粘贴">📋 粘贴</button>
                    <button class="secondary btn-aux" id="btnClear" onclick="clearKey()" title="清空"
                        style="display:none; color:var(--text-main);">✕</button>
                </div>
            </div>
            <button class="primary" id="btnQuery" onclick="queryDevices()">📡 检索配额状态</button>

            <div class="result-area" id="resultArea">
                <div class="quota-info" style="margin-bottom: 8px;">
                    <span>设备配额使用情况</span>
                    <strong id="quotaText" style="color:var(--text-bright)">- / -</strong>
                </div>
                <div class="quota-info">
                    <span>本月剩余解绑额度</span>
                    <strong id="unbindQuotaText" style="color:var(--text-bright)">- 次</strong>
                </div>
                <div class="device-list" id="deviceList">
                    <!-- devices inject here -->
                </div>
            </div>
            <div class="rule-tips">
                <div class="rule-tips-title">💡 温馨提示</div>
                1. 为了保障账户安全，每个激活码每月仅支持有限次数的自主换绑。<br/>
                2. 解绑名额将在每月 1 号凌晨自动重置。<br/>
                3. 若额度耗尽且确需更换设备，请联系管理员处理。
            </div>
        </div>
    </div>

    <div class="overlay" id="confirmOverlay">
        <div class="modal">
            <h3 class="modal-title">危险操作确认</h3>
            <div class="modal-body" id="confirmMsg"></div>
            <div class="modal-actions">
                <button class="secondary"
                    style="background:transparent; border:1px solid var(--border-color); color:var(--text-bright);"
                    id="btnCancelConfirm">取消</button>
                <button class="danger" id="btnOkConfirm">确定断开</button>
            </div>
        </div>
    </div>

    <script>
        let currentKey = '';

        function formatLicenseKey(el) {
            el.value = el.value.replace(/\\s+/g, '').toUpperCase();
            document.getElementById('btnClear').style.display = el.value ? 'block' : 'none';
            document.getElementById('btnPaste').style.display = el.value ? 'none' : 'block';
        }

        async function pasteKey() {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    const el = document.getElementById('licenseKey');
                    el.value = text;
                    formatLicenseKey(el);
                    // 可选：直接触发查询
                    // queryDevices();
                }
            } catch (err) {
                showMsg('无法访问剪贴板权限，请长按手动粘贴');
            }
        }

        function clearKey() {
            const el = document.getElementById('licenseKey');
            el.value = '';
            formatLicenseKey(el);
            el.focus();
            document.getElementById('resultArea').style.display = 'none';
        }

        function showConfirm(msg) {
            return new Promise(resolve => {
                const overlay = document.getElementById('confirmOverlay');
                const btnOk = document.getElementById('btnOkConfirm');
                const btnCancel = document.getElementById('btnCancelConfirm');

                document.getElementById('confirmMsg').innerText = msg;
                overlay.classList.add('active');

                const cleanup = () => {
                    overlay.classList.remove('active');
                    btnOk.onclick = null;
                    btnCancel.onclick = null;
                };

                btnOk.onclick = () => { cleanup(); resolve(true); };
                btnCancel.onclick = () => { cleanup(); resolve(false); };
            });
        }

        function showMsg(text, type = 'error') {
            const el = document.getElementById('sysMsg');
            el.className = 'msg ' + type;
            el.innerText = text;
            setTimeout(() => { el.style.display = 'none'; el.className = 'msg'; }, 5000);
        }

        async function queryDevices() {
            const key = document.getElementById('licenseKey').value.trim();
            if (!key) return showMsg('请您先输入有效的激活码凭证');

            const btn = document.getElementById('btnQuery');
            btn.classList.add('loading');
            btn.innerText = '正在检索节点数据...';
            document.getElementById('resultArea').style.display = 'none';

            try {
                const res = await fetch('/api/v1/auth/portal/devices?key=' + encodeURIComponent(key));
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.msg || (res.status === 429 ? '访问过于频繁，请防刷冷却后重试' : '检索失败，无法确认卡密有效性'));
                }

                currentKey = key;
                renderDevices(data);
            } catch (err) {
                showMsg(err.message);
            } finally {
                btn.classList.remove('loading');
                btn.innerText = '📡 检索配额状态';
            }
        }

        function renderDevices(data) {
            document.getElementById('resultArea').style.display = 'block';
            let qColor = 'var(--text-bright)';
            if (data.current_devices >= data.max_devices) qColor = 'var(--warning)';
            document.getElementById('quotaText').innerHTML = '<span style="color:' + qColor + '">' + data.current_devices + '</span> / ' + data.max_devices + ' 台';

            let uColor = data.remaining_unbinds > 0 ? 'var(--text-bright)' : 'var(--danger)';
            document.getElementById('unbindQuotaText').innerHTML = '<span style="color:' + uColor + '">' + data.remaining_unbinds + '</span> 次';

            const listEl = document.getElementById('deviceList');
            if (data.devices.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-main); font-size:12px;">✅ 当前激活码名下无任何物理设备绑定记录，额度充足。<br/><br/>您可以在任意机器上直接使用该卡密！</div>';
                return;
            }

            let html = '';
            data.devices.forEach(d => {
                const date = new Date(d.last_active).toLocaleString();
                const btnHtml = data.remaining_unbinds > 0
                    ? \`<button class="danger" style="width:auto; padding: 6px 12px; font-size: 12px; flex-shrink:0;" onclick="unbindDevice('\${d.device_id}')">断开授权</button>\`
                    : \`<button class="danger" style="width:auto; padding: 6px 12px; font-size: 12px; flex-shrink:0; opacity:0.5; cursor:not-allowed;" disabled title="本月剩余解绑次数已耗尽">次数耗尽</button>\`;
                html += \`<div class="device-item">
                    <div style="min-width:0; margin-right:8px;">
                    <div class="dev-name" title="为了保护隐私，已掩盖部分名称">\${d.device_name}</div>
                    <div class="dev-time">最近使用: \${date}</div>
                    </div>
                    \${btnHtml}
                        </div>\`;
            });
            listEl.innerHTML = html;
        }

        async function unbindDevice(deviceId) {
            const confirmed = await showConfirm('⚠️ 危险操作：\\n您确定要将这台设备从该激活码名下强制踢出吗？该设备原有的所有内部授权将立刻断开！');
            if (!confirmed) return;

            try {
                const res = await fetch('/api/v1/auth/unbind', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ license_key: currentKey, device_id: deviceId })
                });
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.msg || (res.status === 429 ? '解绑频率超限，防恶刷限制激活，请稍事休息。' : '解绑遇到异常拦截'));
                }

                showMsg('设备已成功断开链接并释出名额空间！', 'success');
                queryDevices(); // refresh the list to verify the vacancy
            } catch (err) {
                showMsg(err.message);
            }
        }
    </script>
</body>

</html>
`;
