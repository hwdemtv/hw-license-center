import fs from 'fs';

let html = fs.readFileSync('src/static/admin.html', 'utf8');

// The original damage was done by:
// escapedHtml = htmlMatch[0].replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$/g, '\\$');
// So we must precisely undo this in reverse order:
html = html.replace(/\\\$/g, '$');   // 1. Restore $
html = html.replace(/\\`/g, '`');    // 2. Restore ` 
html = html.replace(/\\\\/g, '\\');  // 3. Restore \

// Save the clean, perfectly formatted HTML just for reference
fs.writeFileSync('src/static/admin.html', html, 'utf8');

// Now, serialize it to adminHtml.ts securely using JSON.stringify
const tsContent = `export const adminHtml: string = ${JSON.stringify(html)};\n`;
fs.writeFileSync('src/static/adminHtml.ts', tsContent, 'utf8');

console.log('Un-escaped the HTML and successfully rebuilt adminHtml.ts');
