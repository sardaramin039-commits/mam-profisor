import { existsSync, readFileSync } from 'node:fs';
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
  'src/app/app-sections/publication-workflow-panel.component.html'
]) {
  if (!existsSync(join(root, requiredPath))) errors.push(`Required release file missing: ${requiredPath}`);
}

const lineCheck = spawnSync(process.execPath, [join(root, 'scripts/verify-file-line-limits.mjs')], { encoding: 'utf8' });
if (lineCheck.status !== 0) errors.push('Source/template line-limit check failed.');

if (errors.length) {
  for (const error of errors) console.error(`RELEASE CHECK: ${error}`);
  process.exit(1);
}
console.log('Release readiness check passed: npm lockfile, required P20 files, and line limits are consistent.');
