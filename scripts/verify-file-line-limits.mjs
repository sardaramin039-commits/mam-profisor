import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src';
const LIMIT = 500;
const EXTENSIONS = new Set(['.ts','.tsx','.js','.mjs','.html','.css','.scss']);
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf('.')).toLowerCase())) {
      const lineCount = readFileSync(full, 'utf8').split(/\r?\n/).length;
      if (lineCount > LIMIT) offenders.push({ file: relative(process.cwd(), full), lineCount });
    }
  }
}

walk(ROOT);
offenders.sort((a,b) => b.lineCount - a.lineCount);
if (offenders.length) {
  console.error(`File line limit exceeded (> ${LIMIT} lines):`);
  for (const item of offenders) console.error(`- ${item.lineCount}: ${item.file}`);
  process.exit(1);
}
console.log(`Line-limit check passed: all tracked source/template files are <= ${LIMIT} lines.`);
