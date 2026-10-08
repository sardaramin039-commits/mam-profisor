import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const pkgPath = join(root, 'package.json');
const lockPath = join(root, 'package-lock.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const rootPkg = lock.packages?.[''];
const errors = [];

if (!String(pkg.packageManager || '').startsWith('npm@')) errors.push('packageManager must be npm.');
if (existsSync(join(root, 'bun.lockb')) || existsSync(join(root, 'bun.lock'))) {
  errors.push('Bun lockfile detected; this project is npm-only.');
}
if (!rootPkg) {
  errors.push('package-lock.json is missing the root package record.');
} else {
  for (const section of ['dependencies', 'devDependencies']) {
    const expected = pkg[section] || {};
    const actual = rootPkg[section] || {};
    for (const [name, range] of Object.entries(expected)) {
      if (actual[name] !== range) errors.push(`Lockfile mismatch: ${section}.${name}`);
    }
    for (const name of Object.keys(actual)) {
      if (!Object.prototype.hasOwnProperty.call(expected, name)) {
        errors.push(`Lockfile has stale root dependency: ${section}.${name}`);
      }
    }
  }
}
for (const requiredPath of [
  'AGENTS.md',
  'package-lock.json',
  'src/server/services/publication-submission-editorial-decision.service.ts',
  'src/server/services/publication-submission-revision.policy.ts',
  'src/server/routes/publication-submission-editorial.routes.ts',
  'src/app/app-sections/publication-workflow-panel.component.ts',
  'src/app/app-sections/publication-workflow-panel.component.html',
  'playwright.config.ts',
  'e2e/mam-professor.spec.ts'
]) {
  if (!existsSync(join(root, requiredPath))) errors.push(`Required release file missing: ${requiredPath}`);
}

const serverSource = readFileSync(join(root, 'src/server.ts'), 'utf8');
const securitySource = readFileSync(join(root, 'src/server/middleware/security.middleware.ts'), 'utf8');
for (const route of [
  'createPublicationSubmissionRouter',
  'createPublicationSubmissionIntegrityRouter',
  'createPublicationSubmissionLifecycleRouter',
  'createPublicationSubmissionManifestRouter',
  'createPublicationSubmissionEditorialRouter'
]) {
  if (!serverSource.includes(route)) errors.push(`Server route registration missing: ${route}`);
}
if (!serverSource.includes("requireAuth, createPublicationSubmissionEditorialRouter()")) {
  errors.push('P20 editorial API is not mounted behind requireAuth.');
}
if (!securitySource.includes('GET, POST, PUT, PATCH, DELETE, OPTIONS')) {
  errors.push('API CORS does not explicitly allow PATCH.');
}

const suspiciousSecretPatterns = [
  /GEMINI_API_KEY\s*[:=]\s*['"][^'"]{12,}['"]/,
  /serviceAccount(?:Key)?\s*[:=]\s*['"][^'"]{20,}['"]/i,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/
];
function scanSourceDirectory(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) scanSourceDirectory(full);
    else if (/\.(ts|tsx|js|mjs)$/u.test(entry.name)) {
      const source = readFileSync(full, 'utf8');
      for (const pattern of suspiciousSecretPatterns) {
        if (pattern.test(source) && !full.endsWith('release-readiness-check.mjs')) {
          errors.push(`Potential hard-coded secret pattern in ${full}`);
          break;
        }
      }
    }
  }
}
scanSourceDirectory(join(root, 'src'));

const lineCheck = spawnSync(process.execPath, [join(root, 'scripts/verify-file-line-limits.mjs')], { encoding: 'utf8' });
if (lineCheck.status !== 0) errors.push('Source/template line-limit check failed.');

if (errors.length) {
  for (const error of errors) console.error(`RELEASE CHECK: ${error}`);
  process.exit(1);
}
console.log('Release readiness check passed: npm lockfile, E2E harness, required P20 files, and line limits are consistent.');
