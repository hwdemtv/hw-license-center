import fs from 'fs';
const html = fs.readFileSync('src/static/admin.html', 'utf8');
// 使用 JSON.stringify 是将包含原始转义在内的任意文本嵌入为字符串常量的最稳妥方式
fs.writeFileSync('src/static/adminHtml.ts', 'export const adminHtml = ' + JSON.stringify(html) + ';');
console.log('Successfully generated adminHtml.ts using JSON.stringify');
