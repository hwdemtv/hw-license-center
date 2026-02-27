const fs = require('fs');
const path = require('path');

async function restore() {
    console.log('Starting restoration...');

    // 1. Read the debug CJS file
    const debugPath = path.join(__dirname, 'src', 'static', 'adminHtml_debug.cjs');
    if (!fs.existsSync(debugPath)) {
        throw new Error(`Debug file not found: ${debugPath}`);
    }
    const content = fs.readFileSync(debugPath, 'utf8').trim();

    // 2. Extract the escaped string
    const firstQuote = content.indexOf('"');
    const lastQuote = content.lastIndexOf('"');
    if (firstQuote === -1 || lastQuote === -1) {
        throw new Error('Could not find quotes in debug file');
    }
    const escapedString = content.substring(firstQuote, lastQuote + 1);

    // 3. Deep unescape until it's clean
    let html = JSON.parse(escapedString);
    let passes = 1;
    // We check for \" and \n as literal strings in the result
    while ((html.includes('\\"') || html.includes('\\n')) && passes < 5) {
        console.log(`Pass ${passes}: Unescaping further...`);
        try {
            // If it's still double escaped, JSON.parse will unescape it
            // We wrap it in quotes to make it a valid JSON string for parsing
            const wrapped = '"' + html.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
            html = JSON.parse(wrapped);
        } catch (e) {
            // Fallback to simple replacement if JSON.parse fails
            html = html.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
        }
        passes++;
    }

    const adminHtmlPath = path.join(__dirname, 'src', 'static', 'admin.html');
    fs.writeFileSync(adminHtmlPath, html, 'utf8');
    console.log(`Successfully restored ${adminHtmlPath} (Length: ${html.length})`);

    // 4. Convert to TS template literal
    // We only need to escape characters that interfere with TS template strings: `, \, and ${
    const safeHtmlForTs = html
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');

    const tsPath = path.join(__dirname, 'src', 'static', 'adminHtml.ts');
    fs.writeFileSync(tsPath, `export const adminHtml = \`${safeHtmlForTs}\`;\n`, 'utf8');
    console.log(`Successfully rebuilt ${tsPath}`);
}

restore().catch(err => {
    console.error('Restoration failed:', err);
    process.exit(1);
});
