import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src', 'app/applet/src'];
const LIMIT = 500;
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.html', '.css', '.scss']);
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (EXTENSIONS.has(full.slice(full.lastIndexOf('.')).toLowerCase())) {
      const source = readFileSync(full, 'utf8');
      const lineCount = source.length === 0
        ? 0
        : source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
      if (lineCount > LIMIT) {
        offenders.push({ file: relative(process.cwd(), full), lineCount });
      }
    }
  }
}

for (const root of ROOTS) {
  if (existsSync(root)) walk(root);
}

offenders.sort((a, b) => b.lineCount - a.lineCount);
if (offenders.length) {
  console.error(`File line limit exceeded (> ${LIMIT} lines):`);
  for (const item of offenders) console.error(`- ${item.lineCount}: ${item.file}`);
  process.exit(1);
}

console.log(`Line-limit check passed: all source/template files under ${ROOTS.filter(existsSync).join(', ')} are <= ${LIMIT} lines.`);
