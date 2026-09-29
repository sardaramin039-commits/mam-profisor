import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const MAX_LINES = 500;
const EXCLUDED = new Set([
  'package-lock.json'
]);
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.html', '.css', '.scss',
  '.json', '.yml', '.yaml', '.sql',
  '.md', '.txt'
]);

function shouldCheck(path) {
  if (EXCLUDED.has(path)) return false;
  if (path.startsWith('dist/') || path.startsWith('coverage/') || path.startsWith('.angular/')) return false;
  const dot = path.lastIndexOf('.');
  return dot >= 0 && TEXT_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter(shouldCheck);

const violations = [];
for (const file of files) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\n|\r/).length;
  if (lines > MAX_LINES) violations.push({ file, lines });
}

if (violations.length > 0) {
  violations.sort((a, b) => b.lines - a.lines);
  console.error('Files above the 500-line source limit:');
  for (const item of violations) console.error(`${item.lines}\t${item.file}`);
  process.exit(1);
}

console.log(`Source line-limit audit passed: ${files.length} tracked text files checked; limit=${MAX_LINES}.`);
