/**
 * 终极修复脚本：
 * 1. 读取 admin.html
 * 2. 清除 JS 代码中残留的冗余反斜杠（\` -> `, \${ -> ${）
 * 3. 修复 dropdown onclick 中的过度转义
 * 4. 验证 JS 语法
 * 5. 生成正确的 adminHtml.ts
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'src/static/admin.html');
const tsPath = path.join(__dirname, 'src/static/adminHtml.ts');

let html = fs.readFileSync(htmlPath, 'utf8');

// 修复1: 将 \` 还原为 `（这些转义只在 TS 模板字符串中需要）
html = html.replace(/\\`/g, '`');

// 修复2: 将 \${ 还原为 ${（同理）
html = html.replace(/\\\${/g, '${');

// 修复3: 修复 dropdown 中的过度转义引号
// 当前: onclick="setGenProduct(\\\\'xxx\\\\')"
// 目标: onclick="setGenProduct('xxx')"
html = html.replace(/setGenProduct\(\\\\\\'([^']*?)\\\\\\'\)/g, "setGenProduct('$1')");
html = html.replace(/removeFromHistory\(event, \\\\\\'([^']*?)\\\\\\'\)/g, "removeFromHistory(event, '$1')");

// 如果上面的正则没匹配到，试试更宽松的版本
html = html.replace(/setGenProduct\(\\+'([^']*?)\\+'\)/g, "setGenProduct('$1')");
html = html.replace(/removeFromHistory\(event,\s*\\+'([^']*?)\\+'\)/g, "removeFromHistory(event, '$1')");

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Step 1: admin.html 清理完毕');

// 验证 JS 语法
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    try {
        new Function(scriptMatch[1]);
        console.log('Step 2: JS 语法验证通过 ✅');
    } catch (e) {
        console.error('Step 2: JS 语法错误 ❌');
        console.error('  Error:', e.message);

        // 尝试找到出错的行
        const lines = scriptMatch[1].split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('\\`') || lines[i].includes('\\${')) {
                console.error(`  可疑行 ${i + 1}: ${lines[i].trim().substring(0, 100)}`);
            }
        }
        process.exit(1);
    }
} else {
    console.error('未找到 <script> 标签！');
    process.exit(1);
}

// 生成 adminHtml.ts - 正确转义
const tsContent = html
    .replace(/\\/g, '\\\\')    // \ -> \\
    .replace(/`/g, '\\`')      // ` -> \`
    .replace(/\$\{/g, '\\${'); // ${ -> \${

fs.writeFileSync(tsPath, `export const adminHtml = \`${tsContent}\`;\n`, 'utf8');
console.log('Step 3: adminHtml.ts 生成完毕 ✅');
console.log('完成！请运行 npm run deploy 部署。');
