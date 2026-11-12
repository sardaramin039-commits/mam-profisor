import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOTS = ['src', 'app/applet/src'];
const LIMIT = 500;
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.html', '.css', '.scss']);
const offenders = [];
let checked = 0;

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;

    checked += 1;
    const lineCount = readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
    if (lineCount > LIMIT) {
      offenders.push({ path: relative(process.cwd(), fullPath), lineCount });
    }
  }
}

for (const root of ROOTS) {
  if (existsSync(root)) walk(root);
}

if (checked === 0) {
  console.error('Line-limit audit found no source files to inspect.');
  process.exit(1);
}

if (offenders.length) {
  console.error(`Line-limit audit failed: ${offenders.length} file(s) exceed ${LIMIT} lines.`);
  for (const file of offenders) console.error(`- ${file.path}: ${file.lineCount} lines`);
  process.exit(1);
}

console.log(`Line-limit audit passed: ${checked} source files are at or below ${LIMIT} lines.`);
