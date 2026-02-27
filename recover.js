import fs from 'fs';
import path from 'path';

const logDir = 'C:/Users/hwdem/.gemini/antigravity/brain/b7abd064-06e9-43da-9cf6-b72904df5323/.system_generated/logs';
const files = fs.readdirSync(logDir);

let recovered = false;
for (const file of files) {
    if (!file.endsWith('.txt')) continue;
    const p = path.join(logDir, file);
    try {
        const content = fs.readFileSync(p, 'utf8');
        if (content.includes('Total Bytes: 37646') && content.includes('Showing lines 1 to 2')) {
            console.log('Found full HTML in log file:', file);
            // Find the starting line marker from view_file tool output
            const marker = '1: export const adminHtml = "';
            const startIdx = content.indexOf(marker);
            if (startIdx !== -1) {
                const bodyStart = startIdx + marker.length - 1; // point it to the opening quotation mark "
                const endMarker = '";\n2: ';
                const endIdx = content.indexOf(endMarker, bodyStart);
                if (endIdx !== -1) {
                    const jsonStr = content.substring(bodyStart, endIdx + 1); // include the end quotation mark "
                    try {
                        const rawHtml = JSON.parse(jsonStr);
                        fs.writeFileSync('src/static/admin.html', rawHtml, 'utf8');
                        console.log('Successfully recovered original 800-line HTML to src/static/admin.html');

                        // To make adminHtml.ts perfectly readable AND safe from double escaping,
                        // we use a template string but escape backslashes and backticks.
                        // When using \n inside `` javascript evaluates it to newline byte.
                        // If rawHtml has a literal backslash n, we escape it to \\n.
                        // But we actually DO NOT want to mess with that anymore! 
                        // In fact, using JSON serialize gives a safe single string (though less readable).
                        // Since readability broke everything, let's just use stringification!
                        const safeString = JSON.stringify(rawHtml);
                        fs.writeFileSync('src/static/adminHtml.ts', `export const adminHtml = ${safeString};\n`, 'utf8');
                        console.log('Successfully regenerated adminHtml.ts');
                        recovered = true;
                    } catch (pe) {
                        console.error('JSON parse error during recovery: ', pe);
                    }
                    break;
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}
if (!recovered) console.log('Could not recover');
