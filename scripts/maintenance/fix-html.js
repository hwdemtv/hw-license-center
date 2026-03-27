import fs from 'fs';

let content = fs.readFileSync('src/static/adminHtml.ts', 'utf8');

const prefix = 'export const adminHtml = `\n';
const suffix = '\n`;\n';

if (content.startsWith(prefix)) {
    let inner = content.slice(prefix.length, -suffix.length);

    // 1. Undo the over-escapes from my extract.mjs script:
    // .replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$/g, '\\$')
    inner = inner.replace(/\\\$/g, '$');
    inner = inner.replace(/\\`/g, '`');
    inner = inner.replace(/\\\\/g, '\\');

    // Now `inner` is identical to the raw string in the original index.ts.

    // 2. Simulate what the TypeScript template literal evaluator did
    // The original index.ts had \` which evaluates to `
    inner = inner.replace(/\\`/g, '`');
    // The original index.ts had \${ which evaluates to ${
    inner = inner.replace(/\\\$/g, '$');
    // The original index.ts had \\n which evaluates to \n, and \\ufeff which evaluates to \ufeff
    inner = inner.replace(/\\\\/g, '\\');

    // 3. Save it cleanly using JSON.stringify
    const finalContent = 'export const adminHtml = ' + JSON.stringify(inner) + ';\n';
    fs.writeFileSync('src/static/adminHtml.ts', finalContent);
    console.log('Restored HTML properly');
}
