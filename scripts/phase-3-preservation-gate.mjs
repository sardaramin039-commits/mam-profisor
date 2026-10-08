import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const LINE_LIMIT = 500;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.html', '.css', '.scss']);
const UI_PATTERNS = [
  /^src\/.*\.(?:html|css|scss)$/u,
  /^src\/app\/.*\/.*\.component\.ts$/u
];

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function normalizePath(value) {
  return value.replaceAll('\\\\', '/');
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function isSourceFile(path) {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  return SOURCE_EXTENSIONS.has(ext);
}

function changedFiles() {
  const event = process.env.GITHUB_EVENT_NAME || '';
  try {
    if (event === 'pull_request') {
      const base = git(['rev-parse', 'HEAD^1']);
      return git(['diff', '--name-status', base, 'HEAD'])
        .split(/\r?\n/u)
        .filter(Boolean)
        .map(line => {
          const [status, ...parts] = line.split('\t');
          return { status, path: normalizePath(parts.at(-1) || '') };
        });
    }
    const parent = git(['rev-parse', 'HEAD^']);
    return git(['diff', '--name-status', parent, 'HEAD'])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map(line => {
        const [status, ...parts] = line.split('\t');
        return { status, path: normalizePath(parts.at(-1) || '') };
      });
  } catch {
    return [];
  }
}

const violations = [];
const changed = changedFiles();
const approvalText = [
  process.env.GITHUB_COMMIT_MESSAGE || '',
  process.env.GITHUB_EVENT_NAME || ''
].join(' ').toLowerCase();

const uiApproval = approvalText.includes('[ui-approved]');
const deletionApproval = approvalText.includes('[deletion-approved]');

if (!existsSync(join(ROOT, 'src'))) {
  violations.push('src/ directory is missing.');
} else {
  for (const full of walk(join(ROOT, 'src'))) {
    if (!isSourceFile(full)) continue;
    const content = readFileSync(full, 'utf8');
    const lineCount = content.split(/\r?\n/u).length;
    if (lineCount > LINE_LIMIT) {
      violations.push(`File exceeds ${LINE_LIMIT} lines: ${relative(ROOT, full)} (${lineCount}).`);
    }

    const forbiddenMarkers = [
      /\/\/\s*\.\.\.\s*(?:rest of the code|remaining code|code as before)/iu,
      /\/\/\s*کۆدەکەی پێشوو/iu,
      /\/\/\s*بەشی پاشماوە/iu
    ];

    for (const pattern of forbiddenMarkers) {
      if (pattern.test(content)) {
        violations.push(`Truncation marker detected: ${relative(ROOT, full)}.`);
        break;
      }
    }
  }
}

for (const file of ['bun.lock', 'bun.lockb']) {
  if (existsSync(join(ROOT, file))) {
    violations.push(`Bun lockfile detected: ${file}. Project is npm-only.`);
  }
}

for (const item of changed) {
  if (item.status.startsWith('D') && item.path.startsWith('src/') && !deletionApproval) {
    violations.push(`Source deletion requires [deletion-approved]: ${item.path}`);
  }

  if (UI_PATTERNS.some(pattern => pattern.test(item.path)) && !uiApproval) {
    violations.push(`UI change requires [ui-approved]: ${item.path}`);
  }
}

if (violations.length) {
  console.error('Phase 3 Ironclad Preservation Gate FAILED.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Phase 3 Ironclad Preservation Gate PASSED.');
