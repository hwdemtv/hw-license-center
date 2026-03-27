const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'static', 'adminHtml.ts');
let raw = fs.readFileSync(srcPath, 'utf8');

// 修复 AI 格式化引入的 "< !DOCTYPE html>" 问题
raw = raw.replace(/< !DOCTYPE html>/g, '<!DOCTYPE html>');

const start = raw.indexOf('<!DOCTYPE html>');
if (start === -1) {
    console.error('ERROR: Cannot find <!DOCTYPE html>');
    process.exit(1);
}
const end = raw.lastIndexOf('</html>');
if (end === -1) {
    console.error('ERROR: Cannot find </html>');
    process.exit(1);
}

let html = raw.substring(start, end + 7);

// 修复 CSS 中因 AI 格式化引入的破坏性空格
// 1. 修复 CSS 变量名: "--bg - color" → "--bg-color"
html = html.replace(/--([a-zA-Z]+) - ([a-zA-Z]+)/g, '--$1-$2');
// 2. 修复普通 CSS 属性名: "border - radius" → "border-radius"
html = html.replace(/([a-z]+) - ([a-z]+)/g, '$1-$2');
// 3. 修复百分号: "100 %" → "100%"
html = html.replace(/(\d+) %/g, '$1%');
// 4. 修复伪元素: "::-webkit" 不常见情况
html = html.replace(/::\s+-/g, '::-');
// 5. 修复 HTML 标签空格: "< div" → "<div", "</ div>" → "</div>"
html = html.replace(/< !/g, '<!');
html = html.replace(/< \//g, '</');
html = html.replace(/< ([a-zA-Z])/g, '<$1');
// 6. 修复属性格式: 'content = "..."' → 'content="..."', "value = '...'" → "value='...'"
html = html.replace(/(\w+)\s*=\s*"([^"]*)"/g, '$1="$2"');
html = html.replace(/(\w+)\s*=\s*'([^']*)'/g, "$1='$2'");
// 7. 修复标签内多余的空格: "<div >" → "<div>"
html = html.replace(/<([a-zA-Z][^>]*?) >/g, '<$1>');

// 使用 JSON.stringify 完全安全地序列化
const safeHtml = JSON.stringify(html);
const output = `export const adminHtml: string = ${safeHtml};\n`;

fs.writeFileSync(srcPath, output, 'utf8');
console.log('SUCCESS: adminHtml.ts rebuilt!');
console.log('HTML length:', html.length, 'chars');
console.log('Output size:', output.length, 'chars');
