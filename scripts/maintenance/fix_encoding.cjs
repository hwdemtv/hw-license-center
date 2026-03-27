const fs = require('fs');
const path = require('path');

function deepUnescape(str) {
    let current = str;
    let prev = '';
    let passes = 0;

    // Continue unescaping if we still see patterns like \" or \n that shouldn't be there 
    // in a final HTML file (at least not for attributes)
    while (current !== prev && passes < 3) {
        prev = current;
        console.log(`Unescape pass ${passes + 1}...`);

        // Target literal escapes
        current = current
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');

        passes++;

        // If it starts with a quote and ends with a quote, it might be a double-stringified blob
        if (current.trim().startsWith('"') && current.trim().endsWith('"')) {
            try {
                current = JSON.parse(current.trim());
            } catch (e) {
                // Ignore parse errors
            }
        }
    }
    return current;
}

const htmlPath = path.join(__dirname, 'src', 'static', 'admin.html');
const rawHtml = fs.readFileSync(htmlPath, 'utf8');

const cleanHtml = deepUnescape(rawHtml);

fs.writeFileSync(htmlPath, cleanHtml, 'utf8');
console.log(`Cleaned HTML saved to ${htmlPath}. New length: ${cleanHtml.length}`);

// Rebuild adminHtml.ts
const safeHtmlForTs = cleanHtml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');

const tsPath = path.join(__dirname, 'src', 'static', 'adminHtml.ts');
fs.writeFileSync(tsPath, `export const adminHtml = \`${safeHtmlForTs}\`;\n`, 'utf8');
console.log(`Successfully rebuilt ${tsPath}`);
