const fs = require('fs');
const filePath = 'src/static/adminHtml.ts';

// ---------------------------------------------------------
// 1. 定义我们的目标块 (使用普通字符串防止插值错误)
// ---------------------------------------------------------
const newSettingsPanelHtml = [
    '    <!--Tab: Settings-->',
    '    <div id=\\"sec-settings\\" class=\\"section\\">',
    '        <div class=\\"card\\">',
    '          <div class=\\"settings-header\\" style=\\"display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px;\\">',
    '            <h2 style=\\"margin:0; font-size:20px; display:flex; align-items:center; gap:12px;\\">',
    '              <span style=\\"font-size:24px;\\">⚙️</span> 系统后台全局配置',
    '            </h2>',
    '            <button class=\\"primary\\" onclick=\\"saveSettings()\\" style=\\"padding: 10px 24px; font-weight:600; box-shadow: 0 4px 12px rgba(78, 127, 250, 0.3);\\">',
    '              <span class=\\"icon\\">💾</span> 立即保存所有更改',
    '            </button>',
    '          </div>',
    '',
    '          <div class=\\"settings-grid\\">',
    '            <div class=\\"settings-card settings-group\\">',
    '              <h3><span class=\\"icon\\">🔐</span> 安全与账户</h3>',
    '              <div class=\\"form-group\\">',
    '                <label>管理员登录密钥 (Admin Secret)</label>',
    '                <div style=\\"display: flex; gap: 10px; align-items: stretch;\\">',
    '                  <input type=\\"password\\" value=\\"********\\" readonly style=\\"flex: 1; background:rgba(30,39,58,0.4); color:#888; cursor:not-allowed;\\">',
    '                  <button class=\\"secondary\\" style=\\"white-space: nowrap; padding: 0 16px;\\" onclick=\\"changePassword()\\">修改密码</button>',
    '                </div>',
    '                <p class=\\"help-text\\" style=\\"margin-top:8px; opacity:0.6; font-size:12px;\\">更改后，旧密钥将立即失效且需重新登录。</p>',
    '              </div>',
    '            </div>',
    '',
    '            <div class=\\"settings-card settings-group\\">',
    '              <h3><span class=\\"icon\\">🛡️</span> 风控参数</h3>',
    '              <div class=\\"form-group\\" style=\\"margin-bottom:16px;\\">',
    '                <label>每月解绑次数限制 (Unbind Limit)</label>',
    '                <input type=\\"number\\" id=\\"set_unbind_limit\\" placeholder=\\"3\\">',
    '                <p class=\\"help-text\\" style=\\"margin-top:6px; opacity:0.6; font-size:12px;\\">控制前台用户每月允许自助解绑的次数。</p>',
    '              </div>',
    '              <div class=\\"form-group\\">',
    '                <label>JWT 离线天数 (天)</label>',
    '                <input type=\\"number\\" id=\\"set_jwt_validity\\" placeholder=\\"30\\">',
    '                <p class=\\"help-text\\" style=\\"margin-top:6px; opacity:0.6; font-size:12px;\\">客户端最长可持续脱机使用的天数。</p>',
    '              </div>',
    '            </div>',
    '',
    '            <div class=\\"settings-card settings-group\\">',
    '              <h3><span class=\\"icon\\">🏷️</span> 业务默认值</h3>',
    '              <div class=\\"form-group\\">',
    '                <label>默认设备配额 (Default Devices)</label>',
    '                <input type=\\"number\\" id=\\"set_default_devices\\" placeholder=\\"2\\">',
    '                <p class=\\"help-text\\" style=\\"margin-top:6px; opacity:0.6; font-size:12px;\\">生卡页面默认填入的设备授权数量。</p>',
    '              </div>',
    '            </div>',
    '',
    '            <div class=\\"settings-card settings-group portal-custom-group\\" style=\\"grid-column: 1 / -1;\\">',
    '              <h3><span class=\\"icon\\">🎨</span> 门户品牌定制 (Portal Styling)</h3>',
    '              <div class=\\"portal-grid\\" style=\\"display:grid; grid-template-columns: 1fr 1fr; gap:20px;\\">',
    '                <div class=\\"form-group\\">',
    '                  <label>门户大标题 (Title)</label>',
    '                  <input type=\\"text\\" id=\\"set_portal_title\\" placeholder=\\"设备解绑中心\\">',
    '                </div>',
    '                <div class=\\"form-group\\">',
    '                  <label>门户副标题 (Subtitle)</label>',
    '                  <input type=\\"text\\" id=\\"set_portal_subtitle\\" placeholder=\\"自助更换绑定设备\\">',
    '                </div>',
    '                <div class=\\"form-group portal-full-width\\" style=\\"grid-column: 1 / -1;\\">',
    '                  <label>公告面板内容 (Support Tips)</label>',
    '                  <textarea id=\\"set_portal_tips\\" rows=\\"4\\" style=\\"width:100%; border-radius:8px; resize:vertical; background:#0d1117; color:white; border:1px solid var(--border-color); padding:10px;\\" placeholder=\\"请输入公告内容...\\"></textarea>',
    '                </div>',
    '              </div>',
    '            </div>',
    '          </div>',
    '        </div>',
    '    </div>'
].join('\\n');

const newShowModalLogic = [
    '        const inputsDiv = document.getElementById(\\'modalInputs\\');',
    '        inputsDiv.innerHTML = \\'\\';',
    '        if (options.inputs) {',
    '          inputsDiv.style.display = \\'grid\\';',
    '          let htmlInputs = \\'\\';',
    '          options.inputs.forEach((inp, i) => {',
    '            if (inp.type === \\'password\\') {',
    '              htmlInputs += \\' < div class=\\\\"form-group\\\\" ><label>\\' + inp.label + \\'</label><div class=\\\\"pwd-input-wrapper\\\\" > <input type=\\\\"password\\\\" id =\\\\"modalInp\\' + i + \\'\\\\" value =\\\\"\\' + (inp.value || \\'\\') + \\'\\\\" placeholder =\\\\"\\' + (inp.placeholder || \\'\\') + \\'\\\\" > <span class=\\\\"pwd-toggle\\\\" onclick =\\\\"const inp=this.previousElementSibling; inp.type=inp.type===\\\\\\'password\\\\\\\'?\\\\\\\'text\\\\\\\' : \\\\\\\'password\\\\\\\'; this.innerText=inp.type===\\\\\\'password\\\\\\\'?\\\\\\\'👁️\\\\\\\' : \\\\\\\'🙈\\\\\\\';\\\\" >👁️</span ></div ></div >\\';',
    '            } else {',
    '              htmlInputs += \\' < div class=\\\\"form-group\\\\" ><label>\\' + inp.label + \\'</label><input type=\\\\"\\' + (inp.type || \\'text\\') + \\'\\\\" id =\\\\"modalInp\\' + i + \\'\\\\" value =\\\\"\\' + (inp.value || \\'\\') + \\'\\\\" placeholder =\\\\"\\' + (inp.placeholder || \\'\\') + \\'\\\\" ></div >\\';',
    '            }',
    '          });',
    '          inputsDiv.innerHTML = htmlInputs;',
    '        } else {',
    '          inputsDiv.style.display = \\'none\\';',
    '        }'
].join('\\n');

// ---------------------------------------------------------
// 2. 读取并替换
// ---------------------------------------------------------
let content = fs.readFileSync(filePath, 'utf-8');

// 替换 Settings
const sStart = '<!--Tab: Settings-->';
const sEnd = '<!-- 批量操作悬浮条 -->';
const si = content.indexOf(sStart);
const ei = content.indexOf(sEnd);
if (si !== -1 && ei !== -1) {
    content = content.substring(0, si) + newSettingsPanelHtml + '\\n  ' + content.substring(ei);
}

// 替换 showModal
const mStart = 'const inputsDiv = document.getElementById(\\'modalInputs\\');';
const mEnd = 'modalResolve = resolve;';
const mi = content.indexOf(mStart);
const mei = content.indexOf(mEnd);
if (mi !== -1 && mei !== -1) {
    content = content.substring(0, mi) + newShowModalLogic + '\\n        ' + content.substring(mei);
}

// 替换文案
content = content.replace(
    /inputs:\\s*\\[\\s*\\{ label: \\'请输入当前旧密钥\\', type: \\'password\\', placeholder: \\'Old Secret\\' \\},\\s*\\{ label: \\'设置新的登录密钥\\', type: \\'password\\', placeholder: \\'New Secret\\' \\}\\s*\\]/g,
    `inputs: [{ label: '🔐 请输入当前管理员密钥 (身份验证)', type: 'password', placeholder: 'Current Secret Password' }, { label: '🆕 设置新的登录密钥 (请务必记牢)', type: 'password', placeholder: 'New Secret Password' }]`
);

// 标准化
content = content.replace(/\\r?\\n/g, '\\n');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ UI Injection completed robustly.');
