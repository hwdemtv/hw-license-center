const fs = require('fs');
const filePath = 'src/static/adminHtml.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// 首先，统一换行符
content = content.replace(/\r?\n/g, '\\n');

// 找到起始位置 (从 sec-settings 容器开始)
// 由于之前可能部分修改过，我们寻找 ID 为 sec-settings 的标签
const startSearch = 'sec-settings';
const endSearch = 'sec-list';

let startIndex = content.indexOf(startSearch);
// 我们要找之前的那个 <div id=\"
while (startIndex > 0 && content.substring(startIndex - 8, startIndex) !== '<div id=\\\\') {
    startIndex = content.indexOf(startSearch, startIndex + 1);
    if (startIndex === -1) break;
}

if (startIndex === -1) {
    console.log('❌ Could not find sec-settings HTML tag.');
    process.exit(1);
}

// 找到结束位置
let endIndex = content.indexOf(endSearch, startIndex);
// 我们要找之前的那个 <div id=\"
while (endIndex > 0 && content.substring(endIndex - 8, endIndex) !== '<div id=\\\\') {
    endIndex = content.indexOf(endSearch, endIndex + 1);
    if (endIndex === -1) break;
}

if (endIndex === -1) {
    console.log('❌ Could not find sec-list HTML tag.');
    process.exit(1);
}

// 回退到开始标签的起点
let realStart = startIndex - 9; // <div id=\"
let realEnd = endIndex - 9; // <div id=\"

// 定义我们要插入的新 HTML
const newInterior = `
          <div class=\\"settings-header\\">
            <h2 style=\\"margin:0; font-size:20px; display:flex; align-items:center; gap:12px;\\">
              <span style=\\"font-size:24px;\\">⚙️</span> 系统后台全局配置
            </h2>
            <button class=\\"btn-primary\\" onclick=\\"saveSettings()\\" style=\\"padding: 10px 24px; font-weight:600; box-shadow: 0 4px 12px rgba(78, 127, 250, 0.3);\\">
              <span class=\\"icon\\">💾</span> 立即保存所有更改
            </button>
          </div>
          <div class=\\"sec-content\\">
            <div class=\\"settings-grid\\">
              <div class=\\"settings-card settings-group\\">
                <h3><span class=\\"icon\\">🔐</span> 安全与账户</h3>
                <div class=\\"form-group\\">
                  <label>管理员登录密钥 (Admin Secret)</label>
                  <div style=\\"display: flex; gap: 10px; align-items: stretch;\\">
                    <input type=\\"password\\" value=\\"********\\" readonly style=\\"flex: 1; background:rgba(30,39,58,0.4); color:#888; cursor:not-allowed;\\">
                    <button class=\\"btn-primary\\" style=\\"white-space: nowrap; padding: 0 16px;\\" onclick=\\"changePassword()\\">修改密码</button>
                  </div>
                </div>
              </div>
              <div class=\\"settings-card settings-group\\">
                <h3><span class=\\"icon\\">🛡️</span> 风控参数</h3>
                <div class=\\"form-group\\">
                  <label>每月解绑次数限制</label>
                  <input type=\\"number\\" id=\\"set_unbind_limit\\" placeholder=\\"3\\">
                </div>
                <div class=\\"form-group\\">
                  <label>JWT 离线天数</label>
                  <input type=\\"number\\" id=\\"set_jwt_validity\\" placeholder=\\"30\\">
                </div>
              </div>
              <div class=\\"settings-card settings-group\\">
                <h3><span class=\\"icon\\">🏷️</span> 业务默认值</h3>
                <div class=\\"form-group\\">
                  <label>默认设备配额</label>
                  <input type=\\"number\\" id=\\"set_default_devices\\" placeholder=\\"2\\">
                </div>
              </div>
              <div class=\\"settings-card settings-group portal-custom-group\\">
                <h3><span class=\\"icon\\">🎨</span> 门户品牌定制</h3>
                <div style=\\"display:grid; grid-template-columns:1fr 1fr; gap:20px;\\">
                   <div class=\\"form-group\\"><label>标题</label><input type=\\"text\\" id=\\"set_portal_title\\"></div>
                   <div class=\\"form-group\\"><label>子标题</label><input type=\\"text\\" id=\\"set_portal_subtitle\\"></div>
                   <div style=\\"grid-column:1/-1\\"><label>公告</label><textarea id=\\"set_portal_tips\\" rows=\\"3\\" style=\\"width:100%;background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.1);color:#fff;\\"></textarea></div>
                </div>
              </div>
            </div>
          </div>`.replace(/\n/g, '\\n').replace(/\s+/g, ' ');

const finalHtml = `<div id=\\"sec-settings\\" class=\\"section\\">${newInterior}\\n        </div>\\n\\n        `;

// 执行替换
const newContent = content.substring(0, realStart) + finalHtml + content.substring(realEnd);

// 此时 newContent 可能还是有很多行，因为我只替换了一部分
// 我们再次运行标准化以确保安全

const finalMatch = newContent.match(/(export const adminHtml(?:\: string)?\s*=\s*")([\s\S]*)(";)/);
if (finalMatch) {
    let body = finalMatch[2].replace(/\r?\n/g, '\\n');
    fs.writeFileSync(filePath, finalMatch[1] + body + finalMatch[3], 'utf-8');
    console.log('✅ INDEX-BASED REPAIR SUCCESS.');
}
