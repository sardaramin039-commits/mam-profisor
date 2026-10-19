import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const LINE_LIMIT = 500;
const SOURCE_ROOTS = ['src', 'app/applet/src'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.html', '.css', '.scss']);

const UI_PATH_PATTERNS = [
  /^src\/.*\.(?:html|css|scss)$/u,
  /^src\/.*\.(?:component|page|layout)\.ts$/u,
  /^app\/applet\/src\/.*\.(?:html|css|scss)$/u,
  /^app\/applet\/src\/.*\.(?:component|page|layout)\.ts$/u
];

const FORBIDDEN_TRUNCATION_MARKERS = [
  /\/\/\s*\.\.\.\s*(?:rest of (?:the )?code|remaining code|code as before)/iu,
  /\/\*\s*\.\.\.\s*(?:rest of (?:the )?code|remaining code|code as before)/iu,
  /<!--\s*\.\.\.\s*(?:rest of (?:the )?code|remaining code|code as before)\s*-->/iu,
  /\/\/\s*(?:کۆدەکەی پێشوو|بەشی پاشماوە)/iu
];

function gitRaw(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function gitText(args) {
  return gitRaw(args).trim();
}

function normalizePath(value) {
  return value.replace(/\\/gu, '/');
}

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else files.push(fullPath);
  }
  return files;
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function resolveComparison() {
  const head = (process.env.PRESERVATION_HEAD_SHA || gitText(['rev-parse', 'HEAD'])).trim();
  let base = (process.env.PRESERVATION_BASE_SHA || '').trim();

  if (!base || /^0+$/u.test(base)) {
    try {
      base = gitText(['rev-parse', `${head}^`]);
    } catch {
      base = '';
    }
  }

  return { base, head };
}

function parseNameStatus(output) {
  const fields = output.split('\0').filter(Boolean);
  const changes = [];
  for (let index = 0; index + 1 < fields.length; index += 2) {
    changes.push({
      status: fields[index],
      path: normalizePath(fields[index + 1])
    });
  }
  return changes;
}

function changedFiles(base, head) {
  if (!base || !head) return [];
  return parseNameStatus(gitRaw([
    'diff', '--name-status', '--no-renames', '-z', base, head
  ]));
}

function commitMessagesForPath(base, head, filePath, deletionOnly = false) {
  if (!base || !head) return [];
  const args = ['log'];
  if (deletionOnly) args.push('--diff-filter=D');
  args.push('--format=%B%x1e', `${base}..${head}`, '--', filePath);
  return gitRaw(args)
    .split('\x1e')
    .map(message => message.trim())
    .filter(Boolean);
}

function everyCommitIncludesApproval(messages, token) {
  return messages.length > 0 && messages.every(message => message.toLowerCase().includes(token));
}

function checkSourceIntegrity(violations) {
  if (!existsSync(join(ROOT, 'src'))) {
    violations.push('Required source directory src/ is missing.');
  }

  for (const sourceRoot of SOURCE_ROOTS) {
    for (const fullPath of walk(join(ROOT, sourceRoot))) {
      if (!isSourceFile(fullPath)) continue;

      const content = readFileSync(fullPath, 'utf8');
      const relativePath = normalizePath(relative(ROOT, fullPath));
      const lineCount = content.split(/\r?\n/u).length;

      if (lineCount > LINE_LIMIT) {
        violations.push(`File exceeds ${LINE_LIMIT} lines: ${relativePath} (${lineCount}).`);
      }

      if (FORBIDDEN_TRUNCATION_MARKERS.some(pattern => pattern.test(content))) {
        violations.push(`Truncation placeholder detected: ${relativePath}.`);
      }
    }
  }
}

function checkNpmOnly(violations) {
  const tracked = gitText(['ls-files']).split(/\r?\n/u).filter(Boolean);
  const trackedBunLocks = tracked.filter(path => ['bun.lock', 'bun.lockb'].includes(basename(path)));
  const rootBunLocks = ['bun.lock', 'bun.lockb'].filter(path => existsSync(join(ROOT, path)));
  const bunLocks = [...new Set([...trackedBunLocks, ...rootBunLocks])];

  for (const lockFile of bunLocks) {
    violations.push(`Bun lockfile detected: ${lockFile}. This project must use npm/package-lock.json.`);
  }
}

function checkApprovalMarkers(changes, base, head, violations) {
  for (const item of changes) {
    const isSourcePath = item.path.startsWith('src/') || item.path.startsWith('app/applet/src/');

    if (item.status.startsWith('D') && isSourcePath) {
      const deletionMessages = commitMessagesForPath(base, head, item.path, true);
      if (!everyCommitIncludesApproval(deletionMessages, '[deletion-approved]')) {
        violations.push(`Source deletion requires [deletion-approved] in the deleting commit: ${item.path}`);
      }
    }

    if (UI_PATH_PATTERNS.some(pattern => pattern.test(item.path))) {
      const uiMessages = commitMessagesForPath(base, head, item.path);
      if (!everyCommitIncludesApproval(uiMessages, '[ui-approved]')) {
        violations.push(`UI/template/style/component change requires [ui-approved] in every relevant commit: ${item.path}`);
      }
    }
  }
}

function main() {
  const violations = [];
  checkSourceIntegrity(violations);
  checkNpmOnly(violations);

  let comparison = { base: '', head: '' };
  let changes = [];
  try {
    comparison = resolveComparison();
    if (comparison.base) {
      changes = changedFiles(comparison.base, comparison.head);
    } else if (process.env.PRESERVATION_EVENT_NAME !== 'workflow_dispatch') {
      violations.push('Cannot determine a trustworthy base commit for approval-marker checks.');
    }
  } catch (error) {
    violations.push(`Could not inspect Git changes for approval-marker checks: ${error instanceof Error ? error.message : String(error)}`);
  }

  checkApprovalMarkers(changes, comparison.base, comparison.head, violations);

  if (violations.length) {
    console.error('Phase 3 Ironclad Preservation Gate FAILED.');
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log('Phase 3 Ironclad Preservation Gate PASSED.');
  console.log(`Checked source roots: ${SOURCE_ROOTS.filter(path => existsSync(join(ROOT, path))).join(', ')}.`);
  console.log(`Changed files reviewed for approval markers: ${changes.length}.`);
  console.log('This read-only gate never modifies, restores, or overwrites project files.');
}

main();
