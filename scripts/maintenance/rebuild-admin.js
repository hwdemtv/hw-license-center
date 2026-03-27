const fs = require('fs');
const path = require('path');

// 读取当前损坏的 adminHtml.ts
const srcPath = path.join(__dirname, 'src', 'static', 'adminHtml.ts');
let raw = fs.readFileSync(srcPath, 'utf8');

// 方案：find the HTML portion between <!DOCTYPE html> and </html>
// 先去掉外面的包裹（找到第一个 <!DOCTYPE 的位置）
const htmlStart = raw.indexOf('<!DOCTYPE html>');
if (htmlStart === -1) {
    // 尝试 "< !DOCTYPE html>" (AI 格式化加了空格)
    const altStart = raw.indexOf('< !DOCTYPE html>');
    if (altStart === -1) {
        console.error('❌ 找不到 HTML 起始标签！');
        process.exit(1);
    }
    // 尝试修复这个奇怪的空格问题
    raw = raw.replace(/< !DOCTYPE html>/g, '<!DOCTYPE html>');
    console.log('✅ 修复了 < !DOCTYPE html> → <!DOCTYPE html>');
}

// 重新找
const start = raw.indexOf('<!DOCTYPE html>');
let end = raw.lastIndexOf('</html>');
if (end === -1) {
    end = raw.lastIndexOf('</ html >');
    if (end !== -1) {
        raw = raw.replace(/<\/ html >/g, '</html>');
        end = raw.lastIndexOf('</html>');
    }
}
if (start === -1 || end === -1) {
    console.error('❌ 无法定位完整的 HTML 内容边界！ start:', start, 'end:', end);
    process.exit(1);
}

let htmlContent = raw.substring(start, end + '</html>'.length);

// 修复 AI 格式化引入的 CSS 语法问题（如 "--bg - color" → "--bg-color"）
// 在 <style> 内，CSS 属性名中的 " - " 变成了 "-"
// 这个只在 </style> 标签之前的区域做处理
const styleStart = htmlContent.indexOf('<style>');
const styleEnd = htmlContent.indexOf('</style>');
if (styleStart !== -1 && styleEnd !== -1) {
    let styleBlock = htmlContent.substring(styleStart, styleEnd + '</style>'.length);
    // 修复 CSS 变量名中的 " - " → "-"
    // e.g. --bg - color → --bg-color
    styleBlock = styleBlock.replace(/--(\S+?) - (\S+?)/g, '--$1-$2');
    // 修复 CSS 属性名 e.g. "border - radius" → "border-radius"
    styleBlock = styleBlock.replace(/([a-z]) - ([a-z])/g, '$1-$2');
    // 修复百分号 "100 %" → "100%"
    styleBlock = styleBlock.replace(/(\d+) %/g, '$1%');
    // 修复 calc(100 % + ...) → calc(100% + ...)
    styleBlock = styleBlock.replace(/calc\((\d+) %/g, 'calc($1%');
    // 修复 ::-webkit-scrollbar (被错误改成 ":: -webkit...")
    styleBlock = styleBlock.replace(/:: -/g, '::-');
    htmlContent = htmlContent.substring(0, styleStart) + styleBlock + htmlContent.substring(styleEnd + '</style>'.length);
}

// 修复 HTML 标签格式问题（AI 格式化加了多余的空格）
// 例如 "< div" → "<div", "< !--" → "<!--" 
htmlContent = htmlContent.replace(/< !/g, '<!');
htmlContent = htmlContent.replace(/< \//g, '</');
htmlContent = htmlContent.replace(/< ([a-zA-Z])/g, '<$1');

// 移除内嵌的 <body> 标签对（因为HTML里应该只有一个body）
// 修复 "<body >" 格式问题
htmlContent = htmlContent.replace(/< body >/g, '<body>');

// 使用 JSON.stringify 进行安全序列化，彻底避免模板字符串转义问题
const safeHtml = JSON.stringify(htmlContent);

const output = `export const adminHtml: string = ${safeHtml};\n`;

fs.writeFileSync(srcPath, output, 'utf8');
console.log('✅ adminHtml.ts 已重建成功！');
console.log('📊 HTML 内容长度:', htmlContent.length, '字符');
console.log('📊 输出文件大小:', output.length, '字符');
