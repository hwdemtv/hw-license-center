const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src', 'static', 'adminHtml.ts');
const intermediatePath = path.join(__dirname, 'src', 'static', 'adminHtml_extractor.cjs');
const outputPath = inputPath;

try {
    // 1. 读取当前损坏的文件
    let tsContent = fs.readFileSync(inputPath, 'utf8');

    // 2. 将其转为 CommonJS 以便提取字符串
    let cjsContent = tsContent.replace(/^export const adminHtml: string = /, 'module.exports = { adminHtml: ') + ' };';
    fs.writeFileSync(intermediatePath, cjsContent, 'utf8');

    // 3. 引入并读取真正的 HTML 字符串 (此时 Node 会自动处理转义)
    const { adminHtml } = require(intermediatePath);
    console.log('Successfully extracted raw HTML. Length:', adminHtml.length);

    // 4. 将 HTML 字符串安全地封装回模板字符串 (backticks)
    // 需要转义其中的反引号 ` 和美元符号 ${
    const escapedHtml = adminHtml
        .replace(/\\/g, '\\\\') // 先处理反斜杠
        .replace(/`/g, '\\`')   // 转义反引号
        .replace(/\${/g, '\\${'); // 转义模板占位符

    const finalTs = `export const adminHtml = \`${escapedHtml}\`;\n`;

    // 5. 写回文件
    fs.writeFileSync(outputPath, finalTs, 'utf8');
    console.log('Successfully rebuilt adminHtml.ts using template literals.');

    // 6. 清理临时文件
    if (fs.existsSync(intermediatePath)) fs.unlinkSync(intermediatePath);

} catch (e) {
    console.error('Final repair failed:', e);
    process.exit(1);
}
