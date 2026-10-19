import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'angular.json',
  'tsconfig.json',
  'tsconfig.app.json',
  '.github/workflows/ci.yml',
  'scripts/anti-hallucination-audit.mjs',
  'scripts/verify-file-line-limits.mjs',
  'scripts/release-smoke-check.mjs',
  'src/app/features/advanced-research/services/research-api-client.service.ts'
];

const errors = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) errors.push(`missing required release file: ${file}`);
}

if (errors.length) {
  console.error('Release readiness check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
if (lock.lockfileVersion !== 3) errors.push(`expected npm lockfile version 3, found ${lock.lockfileVersion}`);

const lockedRoot = lock.packages?.[''];
if (!lockedRoot) {
  errors.push('package-lock.json is missing the root package metadata');
} else {
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const expected = manifest[group] || {};
    const actual = lockedRoot[group] || {};
    for (const [name, version] of Object.entries(expected)) {
      if (actual[name] !== version) errors.push(`package-lock mismatch for ${group}.${name}: manifest=${version}, lock=${actual[name] ?? 'missing'}`);
    }
    for (const name of Object.keys(actual)) {
      if (!(name in expected)) errors.push(`stale locked root dependency ${group}.${name}`);
    }
  }
}

if (!manifest.scripts?.build || !manifest.scripts?.typecheck) {
  errors.push('required npm scripts "build" and "typecheck" must exist');
}

for (const [name, command] of Object.entries(manifest.scripts || {})) {
  const matches = [...command.matchAll(/(?:^|\s)node\s+(scripts\/[^\s;&|]+)/g)];
  for (const match of matches) {
    const target = match[1].replace(/^['"]|['"]$/g, '');
    if (!existsSync(join(process.cwd(), target))) errors.push(`npm script "${name}" references missing file ${target}`);
  }
}

if (errors.length) {
  console.error('Release readiness check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Release readiness check passed: required files and npm lockfile metadata are consistent.');
