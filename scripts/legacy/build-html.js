import fs from 'fs';

// 编译 admin.html
const adminHtml = fs.readFileSync('src/static/admin.html', 'utf8');
fs.writeFileSync('src/static/adminHtml.ts', 'export const adminHtml = ' + JSON.stringify(adminHtml) + ';');
console.log('✅ Successfully generated adminHtml.ts');

// 编译 portal.html
if (fs.existsSync('src/static/portal.html')) {
    const portalHtml = fs.readFileSync('src/static/portal.html', 'utf8');
    fs.writeFileSync('src/static/portalHtml.ts', 'export const portalHtml = ' + JSON.stringify(portalHtml) + ';');
    console.log('✅ Successfully generated portalHtml.ts');
} else {
    // 防御性占位，避免首次编译时因为缺少 portal.html 而使 TS 本地构建报错阻断
    fs.writeFileSync('src/static/portalHtml.ts', 'export const portalHtml = "Portal not found. Build incomplete.";');
    console.log('⚠️ portal.html not found, generated fallback portalHtml.ts');
}
