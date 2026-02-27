const fs = require('fs');
const path = require('path');

try {
    const debugPath = './src/static/adminHtml_debug.cjs';
    console.log('Loading debug file via require...');
    let html = require(debugPath);

    // Deep unescape: if it's still a double-stringified mess
    let passes = 0;
    while (typeof html === 'string' && (html.includes('\\n') || html.includes('\\"')) && passes < 3) {
        console.log(`Unescape pass ${passes + 1}...`);
        try {
            // If it's a raw string with literal \n and \", wrapping it in quotes and parsing might work
            // But if it's already a clean string, this might fail.
            // Let's try the wrapped JSON approach.
            const wrapped = '"' + html.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
            const parsed = JSON.parse(wrapped);
            if (parsed === html) break; // No change
            html = parsed;
        } catch (e) {
            console.log('Manual replacement fall-back...');
            html = html.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        passes++;
    }

    if (typeof html !== 'string') {
        throw new Error('Export is not a string');
    }

    console.log(`Original HTML loaded. Length: ${html.length}`);

    // Save to admin.html for reference
    fs.writeFileSync('./src/static/admin.html', html, 'utf8');

    // Convert to TS safe string
    const safeHtml = html
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');

    fs.writeFileSync('./src/static/adminHtml.ts', `export const adminHtml = \`${safeHtml}\`;\n`, 'utf8');
    console.log('Successfully synchronized to adminHtml.ts');

} catch (err) {
    console.error('Failed to load or save HTML:', err);
    process.exit(1);
}
