import fs from 'fs';

try {
    const pureHtml = fs.readFileSync('src/static/admin.html', 'utf8');

    // By using JSON.stringify, we get a single-line string with proper escaping
    // for all quotes, backslashes, and newlines \n. It is 100% immune to template literal bugs.
    // We don't care about it being a single line, because it WORKS and it is SAFE.
    const serialized = JSON.stringify(pureHtml);

    const tsContent = `export const adminHtml: string = ${serialized};\n`;
    fs.writeFileSync('src/static/adminHtml.ts', tsContent, 'utf8');

    console.log('Successfully embedded admin.html securely into adminHtml.ts');
} catch (e) {
    console.error(e);
}
