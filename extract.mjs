import fs from 'fs';

fs.mkdirSync('src/routes', { recursive: true });
fs.mkdirSync('src/middleware', { recursive: true });
fs.mkdirSync('src/static', { recursive: true });

const code = fs.readFileSync('src/index.ts', 'utf8');

// Extraction for public API
const publicStart = code.indexOf("app.post('/api/v1/auth/verify'");
const publicEnd = code.indexOf("// API: (管理员) 自动生成新激活码");
let publicCode = code.substring(publicStart, publicEnd);
publicCode = publicCode.replace(/app\.post\('\/api\/v1\/auth\//g, "app.post('/");

const tPublic = `import { Hono } from 'hono';
import { Env } from '../types';
import { sign } from 'hono/jwt';

const app = new Hono<{ Bindings: Env }>();

${publicCode}
export default app;`;
fs.writeFileSync('src/routes/public.ts', tPublic);

// Extraction for admin API
const adminStart1 = code.indexOf("// API: (管理员) 自动生成新激活码");
const adminEnd1 = code.indexOf("// API: Web 后台页面 (核心管理控制台)");
let adminCode1 = code.substring(adminStart1, adminEnd1);

const adminStart2 = code.indexOf("// ==========================================\n// API: (管理员) 一码多产品订阅管理");
// admin ends just before `export default app;`
const adminEnd2 = code.indexOf("export default app;");
let adminCode2 = code.substring(adminStart2, adminEnd2 !== -1 ? adminEnd2 : undefined);

// Merge admin codes and replace path prefixes
let finalAdminCode = adminCode1 + "\n" + adminCode2;
finalAdminCode = finalAdminCode.replace(/app\.(post|get|delete)\('\/api\/v1\/auth\/admin\//g, "app.$1('/");

const tAdmin = `import { Hono } from 'hono';
import { Env, generateLicenseKey } from '../types';

const app = new Hono<{ Bindings: Env }>();

${finalAdminCode}
export default app;`;
fs.writeFileSync('src/routes/admin.ts', tAdmin);

// Extraction for HTML
const htmlMatch = code.match(/<!DOCTYPE html>[\s\S]*?<\/html>/);
if (htmlMatch) {
    // escaping backticks, backslashes, and template variables because we will wrap it in another template literal.
    const escapedHtml = htmlMatch[0].replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$/g, '\\$');
    fs.writeFileSync('src/static/adminHtml.ts', `export const adminHtml = \`\n${escapedHtml}\n\`;\n`);
    console.log('Successfully created static HTML module.');
} else {
    console.log('Failed to find HTML bounds.');
}

console.log('Successfully generated public.ts and admin.ts router files.');
