const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'static', 'portal.html');
const destPath = path.join(__dirname, 'src', 'static', 'portalHtml.ts');

try {
    const rawHtml = fs.readFileSync(srcPath, 'utf8');

    // 安全转义处理：反斜杠 -> 双反斜杠、反引号 -> 转义反引号、美元符 -> 转义美元符
    const escapedHtml = rawHtml
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    const tsContent = `export const portalHtml = \`\n${escapedHtml}\n\`;\n`;

    fs.writeFileSync(destPath, tsContent, 'utf8');
    console.log('✅ portalHtml.ts has been successfully generated and escaped.');
} catch (error) {
    console.error('❌ Failed to build portalHtml.ts:', error);
}
