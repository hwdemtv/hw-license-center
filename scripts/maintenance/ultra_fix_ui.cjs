const fs = require('fs');
const filePath = 'src/static/adminHtml.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. 强力修复 HTML 结构
// 我们寻找包含 "系统全局配置" 的那个区块，并整体重写。
// 由于转义级别可能混乱，我们用非贪婪匹配。

const newHtmlBlock = `<div id=\\"sec-settings\\" class=\\"section\\">\\n          <div class=\\"settings-header\\">\\n            <h2 style=\\"margin:0; font-size:20px; display:flex; align-items:center; gap:12px;\\">\\n              <span style=\\"font-size:24px;\\">⚙️</span> 系统后台全局配置\\n            </h2>\\n            <button class=\\"btn-primary\\" onclick=\\"saveSettings()\\" style=\\"padding: 10px 24px; font-weight:600; box-shadow: 0 4px 12px rgba(78, 127, 250, 0.3);\\">\\n              <span class=\\"icon\\">💾</span> 立即保存所有更改\\n            </button>\\n          </div>\\n\\n          <div class=\\"sec-content\\">\\n            <div class=\\"settings-grid\\">\\n              <!-- 安全与账户卡片 -->\\n              <div class=\\"settings-card settings-group\\">\\n                <h3><span class=\\"icon\\">🔐</span> 安全与账户</h3>\\n                <div class=\\"form-group\\">\\n                  <label>管理员登录密钥 (Admin Secret)</label>\\n                  <div style=\\"display: flex; gap: 10px; align-items: stretch;\\">\\n                    <input type=\\"password\\" value=\\"********\\" readonly style=\\"flex: 1; background:rgba(30,39,58,0.4); color:#888; cursor:not-allowed;\\">\\n                    <button class=\\"btn-primary\\" style=\\"white-space: nowrap; padding: 0 16px;\\" onclick=\\"changePassword()\\">修改密码</button>\\n                  </div>\\n                  <p class=\\"help-text\\" style=\\"margin-top:8px; opacity:0.6; font-size:12px;\\">更改后，旧密钥将立即失效且需重新登录。</p>\\n                </div>\\n              </div>\\n\\n              <!-- 风控参数卡片 -->\\n              <div class\"settings-card settings-group\\">\\n                <h3><span class=\\"icon\\">🛡️</span> 风控参数</h3>\\n                <div class=\\"form-group\\">\\n                  <label>每月解绑次数限制 (Unbind Limit)</label>\\n                  <input type=\\"number\\" id=\\"set_unbind_limit\\" placeholder=\\"3\\">\\n                  <p class=\\"help-text\\" style=\\"margin-top:6px; opacity:0.6; font-size:12px;\\">控制前台用户每月允许自助解绑的次数。</p>\\n                </div>\\n                <div class=\\"form-group\\">\\n                  <label>JWT 离线天数 (天)</label>\\n                  <input type=\\"number\\" id=\\"set_jwt_validity\\" placeholder=\\"30\\">\\n                  <p class=\\"help-text\\" style=\\"margin-top:6px; opacity:0.6; font-size:12px;\\">客户端最长可持续脱机使用的天数。</p>\\n                </div>\\n              </div>\\n\\n              <!-- 业务默认值卡片 -->\\n              <div class=\\"settings-card settings-group\\">\\n                <h3><span class=\\"icon\\">🏷️</span> 业务默认值</h3>\\n                <div class=\\"form-group\\">\\n                  <label>默认设备配额 (Default Devices)</label>\\n                  <input type=\\"number\\" id=\\"set_default_devices\\" placeholder=\\"2\\">\\n                  <p class=\\"help-text\\" style=\\"margin-top:6px; opacity:0.6; font-size:12px;\\">生卡页面默认填入的设备授权数量。</p>\\n                </div>\\n              </div>\\n\\n              <!-- 门户页面定制 (占满一行) -->\\n              <div class=\\"settings-card settings-group portal-custom-group\\">\\n                <h3><span class=\\"icon\\">🎨</span> 门户品牌定制 (Portal Styling)</h3>\\n                <div class=\\"portal-grid\\">\\n                  <div class=\\"form-group\\">\\n                    <label>门户大标题 (Title)</label>\\n                    <input type=\\"text\\" id=\\"set_portal_title\\" placeholder=\\"设备解绑中心\\">\\n                  </div>\\n                  <div class=\\"form-group\\">\\n                    <label>门户副标题 (Subtitle)</label>\\n                    <input type=\\"text\\" id=\\"set_portal_subtitle\\" placeholder=\\"自助更换绑定设备\\">\\n                  </div>\\n                  <div class=\\"form-group portal-full-width\\">\\n                    <label>公告面板内容 (Support Tips)</label>\\n                    <textarea id=\\"set_portal_tips\\" rows=\\"4\\" style=\\"width:100%; border-radius:8px; resize:vertical;\\" placeholder=\\"请输入公告内容，支持HTML标签...\\"></textarea>\\n                  </div>\\n                </div>\\n              </div>\\n            </div>\\n          </div>\\n        </div>`;

// 找到原本的设置面板 ID="sec-settings" 到其结束 </div>
// 由于 adminHtml 是单行，换行符被转义成 \n。
// 我们的匹配模式需要包含这些。

// 先尝试匹配最外层的 sec-settings
const oldBlockMatch = content.match(/<div id=\\\\"sec-settings\\\\" class=\\\\"section\\\\">([\s\S]*?)<div id=\\\\"sec-list\\\\"/);
if (oldBlockMatch) {
    // 替换内容，注意我们要带上开始标签，并且保留 sec-list 的开始。
    content = content.replace(oldBlockMatch[0], `${newHtmlBlock}\\n        <div id=\\"sec-list\\\\"`);
} else {
    // 降级匹配
    console.log('⚠️ Could not match sec-settings block precisely, trying fuzzy match...');
    content = content.replace(/<div id=\\\\"sec-settings\\\\"[\\s\\S]*?<div id=\\\\"sec-list\\\\"/, `${newHtmlBlock}\\n        <div id=\\"sec-list\\\\"`);
}

// 2. 强力修复 showModal 中的密码切换逻辑
// 我们直接重写整个 showModal 的 HTML 模板部分。
const showModalRegex = /return `[\\s\\S]*?<div class=\\\\"modal-content\\\\">[\\s\\S]*?<\/div>`;/i;
// 查找 input.map 部分
content = content.replace(
    /\${options\.inputs\.map\(input => \{[\\s\\S]*?\}\)\.join\(''\)\}/,
    `\${options.inputs.map(input => {\\n            if (input.type === 'password') {\\n              return \\\`<div class=\\\\"modal-field\\\\">\\\\n                <label>\${input.label}</label>\\\\n                <div class=\\\\"pwd-input-wrapper\\\\">\\\\n                  <input type=\\\\"password\\\\" placeholder=\\\\"\${input.placeholder}\\\\" value=\\\\"\${input.value || ''}\\\\">\\\\n                  <span class=\\\\"pwd-toggle\\\\" onclick=\\\\"this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'; this.textContent = this.previousElementSibling.type === 'password' ? '👁️' : '🕶️';\\\\">👁️</span>\\\\n                </div>\\\\n              </div>\\\`;\\n            }\\n            return \\\`<div class=\\\\"modal-field\\\\">\\\\n              <label>\${input.label}</label>\\\\n              <input type=\\\\"\${input.type}\\\\" placeholder=\\\\"\${input.placeholder}\\\\" value=\\\\"\${input.value || ''}\\\\">\\\\n            </div>\\\`;\\n          }).join('')}`
);

// 3. 再次确保密码修改弹窗的文案正确
content = content.replace(
    /\{ label: '[^']*', type: 'password', placeholder: '[^']*' \},\s*\{ label: '[^']*', type: 'password', placeholder: '[^']*' \}/g,
    `{ label: '🔐 请输入当前管理员密钥 (身份验证)', type: 'password', placeholder: 'Current Secret' },\\n          { label: '🆕 设置新的登录密钥 (请务必记牢)', type: 'password', placeholder: 'New Secret Password' }`
);

// 4. 清理可能破坏语法的引号转义 (确保类名等使用 \")
// 脚本完成后我会运行 final_syntax_fix.cjs 统一。

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ UI & Password Toggle depth-fix applied.');
