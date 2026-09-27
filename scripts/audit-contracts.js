import fs from 'fs';
import path from 'path';

function walkDir(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath, filter));
    } else if (filter(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

const appFiles = walkDir('src/app', p => p.endsWith('.ts') || p.endsWith('.html'));
const frontendCalls = [];

const apiRegex = /['"`](\/api\/[a-zA-Z0-9_\-\/]+)['"`]/g;

appFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = apiRegex.exec(content)) !== null) {
    frontendCalls.push({
      endpoint: match[1],
      file: file
    });
  }
});

console.log(`Found ${frontendCalls.length} frontend /api/ calls:`);
const uniqueEndpoints = [...new Set(frontendCalls.map(c => c.endpoint))].sort();
uniqueEndpoints.forEach(ep => {
  const callers = frontendCalls.filter(c => c.endpoint === ep).map(c => path.relative('src/app', c.file));
  console.log(`- ${ep} (called in: ${callers.join(', ')})`);
});
