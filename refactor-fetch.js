const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Match fetch("/api/...") or fetch('/api/...')
            content = content.replace(/fetch\(\s*['"](\/api\/[^'"]*)['"]/g, 'fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}$1`');

            // Match fetch(`/api/...`)
            content = content.replace(/fetch\(\s*`(\/api\/[^`]*)`/g, 'fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}$1`');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'app'));
processDir(path.join(__dirname, 'components'));
