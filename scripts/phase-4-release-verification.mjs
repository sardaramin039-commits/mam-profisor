import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const failures = [];
const warnings = [];

function read(path) {
  const full = join(ROOT, path);
  if (!existsSync(full)) {
    failures.push(`Missing required file: ${path}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireText(path, content, snippets) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      failures.push(`Release contract missing in ${path}: ${snippet}`);
    }
  }
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const packageJson = read('package.json');
const packageLock = read('package-lock.json');

if (packageJson) {
  try {
    const pkg = JSON.parse(packageJson);
    if (!String(pkg.packageManager || '').startsWith('npm@')) {
      failures.push('packageManager must use npm.');
    }
    if (!pkg.scripts?.build) failures.push('package.json is missing build script.');
    if (!pkg.scripts?.typecheck) failures.push('package.json is missing typecheck script.');
    if (!pkg.scripts?.lint) failures.push('package.json is missing lint script.');
    if (!pkg.scripts?.line-limit) failures.push('package.json is missing line-limit script.');
    if (!pkg.scripts?.release:check) failures.push('package.json is missing release:check script.');
    if (!pkg.scripts?.release:smoke) failures.push('package.json is missing release:smoke script.');
  } catch {
    failures.push('package.json is not valid JSON.');
  }
}

if (packageLock) {
  try {
    const lock = JSON.parse(packageLock);
    if (lock.lockfileVersion !== 3) failures.push('package-lock.json must use lockfileVersion 3.');
    if (!lock.packages?.['']) failures.push('package-lock.json is missing its root package record.');
  } catch {
    failures.push('package-lock.json is not valid JSON.');
  }
}

for (const bunLock of ['bun.lock', 'bun.lockb']) {
  if (existsSync(join(ROOT, bunLock))) {
    failures.push(`Bun lockfile detected: ${bunLock}`);
  }
}

const workflows = [
  '.github/workflows/quality-gate.yml',
  '.github/workflows/quality.yml',
  '.github/workflows/academic-integrity-ci.yml',
  '.github/workflows/browser-e2e.yml',
  '.github/workflows/phase-3-preservation.yml'
];

for (const workflow of workflows) {
  const content = read(workflow);
  if (!content) continue;
  requireText(workflow, content, [
    'permissions:',
    'contents: read',
    'timeout-minutes:',
    'actions/checkout@v4',
    'actions/setup-node@v4',
    'node-version: 22.22.2'
  ]);
  if (!content.includes('cache-dependency-path: package-lock.json') &&
      workflow !== '.github/workflows/quality.yml') {
    warnings.push(`Workflow does not explicitly pin npm cache dependency to package-lock.json: ${workflow}`);
  }
}

const canonicalQuality = read('.github/workflows/quality.yml');
requireText('.github/workflows/quality.yml', canonicalQuality, [
  'npm ci',
  'npm run line-limit',
  'npm run release:check',
  'npm run typecheck',
  'npm test',
  'npm run lint',
  'npm run build',
  'npm run e2e:ci',
  'npm run release:smoke',
  'npm audit --omit=dev --audit-level=high'
]);

const phase3 = read('scripts/phase-3-preservation-gate.mjs');
requireText('scripts/phase-3-preservation-gate.mjs', phase3, [
  'LINE_LIMIT = 500',
  'Truncation marker detected',
  'Bun lockfile detected',
  '[ui-approved]',
  '[deletion-approved]'
]);

const releaseCheck = read('scripts/release-readiness-check.mjs');
requireText('scripts/release-readiness-check.mjs', releaseCheck, [
  'package-lock.json',
  'scanSourceDirectory',
  'API CORS does not explicitly allow PATCH'
]);

const requiredDocs = [
  'PRODUCTION_RELEASE_CHECKLIST.md',
  'PHASE_2_COMPARATIVE_MATRIX.md',
  'PHASE_3_IRONCLAD_PRESERVATION.md',
  'P5_EVIDENCE_INTELLIGENCE.md',
  'P6_MULTI_AGENT_ORCHESTRATION.md'
];

for (const doc of requiredDocs) read(doc);

const head = git(['rev-parse', 'HEAD']);
const parent = git(['rev-parse', 'HEAD^']);
if (!head || !parent) {
  warnings.push('Git history is unavailable; changed-file checks are skipped.');
} else {
  const changed = git(['diff', '--name-status', parent, head])
    .split(/\r?\n/u)
    .filter(Boolean);
  const sourceDeletes = changed.filter(line => /^D\s+src\//u.test(line));
  if (sourceDeletes.length && !process.env.GITHUB_COMMIT_MESSAGE?.includes('[deletion-approved]')) {
    failures.push('Release verification detected source deletion without [deletion-approved].');
  }
}

const report = {
  gate: 'phase-4-release-verification',
  status: failures.length ? 'FAIL' : 'PASS',
  failures,
  warnings,
  commit: head || null,
  checkedAt: new Date().toISOString()
};

console.log(JSON.stringify(report, null, 2));

if (warnings.length) {
  console.warn(`Phase 4 warnings: ${warnings.length}`);
}
if (failures.length) {
  console.error(`Phase 4 release verification failed: ${failures.length} contract violation(s).`);
  process.exit(1);
}

console.log('Phase 4 release verification passed.');
