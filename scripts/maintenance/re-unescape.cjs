const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'static', 'adminHtml.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The file looks like: export const adminHtml: string = "...";
// We need to extract the part between the first and last double quotes
const match = content.match(/=\s*"([\s\S]*)"\s*;/);
if (!match) {
    console.error('Could not find the string in adminHtml.ts');
    process.exit(1);
}

const escapedString = match[1];

// We need to unescape it. 
// Since it's double escaped, the literal string contains things like \" and \n
// But wait, if it was written with JSON.stringify, then reading it with fs gives us the escaped characters.
// To unescape it safely, we can wrap it back into a JSON object and parse it.
try {
    const rawContent = JSON.parse('"' + escapedString + '"');

    // Now rawContent should be the HTML with single escapes (or no escapes)
    // Let's check if it still contains things like \"
    // If it does, we parse it AGAIN.
    let finalHtml = rawContent;
    if (finalHtml.includes('\\"')) {
        console.log('Detected second layer of escaping, unescaping again...');
        finalHtml = JSON.parse('"' + finalHtml.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"');
    }

    // Write it back correctly using a single JSON.stringify
    const finalFileContent = `export const adminHtml: string = ${JSON.stringify(finalHtml)};\n`;
    fs.writeFileSync(filePath, finalFileContent, 'utf8');
    console.log('Successfully unescaped adminHtml.ts');
} catch (e) {
    console.error('Failed to unescape:', e.message);
    process.exit(1);
}
