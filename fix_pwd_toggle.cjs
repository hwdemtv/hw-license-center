const fs = require('fs');
const filePath = 'src/static/adminHtml.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. 在 <style> 中加入切换密码可见性的样式
const pwdStyle = `
    .pwd-input-wrapper {
      position: relative;
      width: 100%;
    }
    .pwd-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      opacity: 0.5;
      font-size: 16px;
      user-select: none;
      z-index: 10;
    }
    .pwd-toggle:hover {
      opacity: 1;
    }
`;

if (!content.includes('.pwd-toggle {')) {
    content = content.replace('</style>', pwdStyle.replace(/\n/g, '\\\\n') + '\\\\n  </style>');
}

// 2. 升级 showModal 以支持密码显示切换
// 找到 options.inputs.map 渲染部分
const oldInputRender = `return \\\`<div class=\\\\\\"modal-field\\\\\\">\\\\n              <label>\${input.label}</label>\\\\n              <input type=\\\\\\"\${input.type}\\\\\\" placeholder=\\\\\\"\${input.placeholder}\\\\\\" value=\\\\\\"\${input.value || ''}\\\\\\">\\\\n            </div>\\\`;`;

const newInputRender = `if (input.type === 'password') {\\\\n              return \\\`<div class=\\\\\\"modal-field\\\\\\">\\\\n                <label>\${input.label}</label>\\\\n                <div class=\\\\\\"pwd-input-wrapper\\\\\\">\\\\n                  <input type=\\\\\\"password\\\\\\" placeholder=\\\\\\"\${input.placeholder}\\\\\\" value=\\\\\\"\${input.value || ''}\\\\\\">\\\\n                  <span class=\\\\\\"pwd-toggle\\\\\\" onclick=\\\\\\"this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'; this.textContent = this.previousElementSibling.type === 'password' ? '👁️' : '🕶️';\\\\\\">👁️</span>\\\\n                </div>\\\\n              </div>\\\`;\\\\n            }\\\\n            return \\\`<div class=\\\\\\"modal-field\\\\\\">\\\\n              <label>\${input.label}</label>\\\\n              <input type=\\\\\\"\${input.type}\\\\\\" placeholder=\\\\\\"\${input.placeholder}\\\\\\" value=\\\\\\"\${input.value || ''}\\\\\\">\\\\n            </div>\\\`;`;

content = content.replace(oldInputRender, newInputRender);

// 3. 优化 changePassword 的文案和标题
content = content.replace(
    `{ label: '请输入当前旧密钥', type: 'password', placeholder: 'Old Secret' },\\n          { label: '设置新的登录密钥', type: 'password', placeholder: 'New Secret' }`,
    `{ label: '🔐 请输入当前管理员密钥 (身份验证)', type: 'password', placeholder: 'Current Secret' },\\n          { label: '🆕 设置新的登录密钥 (请务必记牢)', type: 'password', placeholder: 'New Secret Password' }`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ adminHtml.ts password toggle support added.');
