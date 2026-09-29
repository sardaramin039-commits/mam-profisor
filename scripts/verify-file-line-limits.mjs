import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LIMIT = 500;
const EXCLUDED_FILES = new Set(['package-lock.json']);
const EXCLUDED_PREFIXES = [
  'node_modules/',
  'dist/',
  'coverage/',
  '.angular/',
  '.git/'
];
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.html', '.css', '.scss',
  '.json', '.yml', '.yaml',
  '.sql', '.md', '.txt'
]);

function shouldCheck(path) {
  if (EXCLUDED_FILES.has(path)) return false;
  if (EXCLUDED_PREFIXES.some(prefix => path.startsWith(prefix))) return false;
  const dot = path.lastIndexOf('.');
  return dot >= 0 && TEXT_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter(shouldCheck);

const offenders = [];
for (const file of files) {
  if (!existsSync(file)) continue;
  const lineCount = readFileSync(file, 'utf8').split(/\r\n|\n|\r/).length;
  if (lineCount > LIMIT) offenders.push({ file, lineCount });
}

offenders.sort((a, b) => b.lineCount - a.lineCount);

if (offenders.length) {
  console.error(`File line limit exceeded (> ${LIMIT} lines):`);
  for (const item of offenders) console.error(`- ${item.lineCount}: ${item.file}`);
  process.exit(1);
}

console.log(`Line-limit check passed: ${files.length} tracked text/config/document files are <= ${LIMIT} lines.`);
