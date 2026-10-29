import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'angular.json',
  'tsconfig.json',
  'tsconfig.app.json',
  '.github/workflows/ci.yml',
  '.github/workflows/phase-3-preservation.yml',
  'PHASE_3_IRONCLAD_PRESERVATION.md',
  'scripts/phase-3-preservation-gate.mjs',
  'scripts/anti-hallucination-audit.mjs',
  'scripts/verify-file-line-limits.mjs',
  'scripts/release-smoke-check.mjs',
  'scripts/verify-server-artifacts.mjs',
  'src/server/server-runtime.ts',
  'src/server/server-runtime.spec.ts',
  'src/app/features/advanced-research/services/research-api-client.service.ts'
];

const errors = [];
const forbiddenLockNames = new Set([
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'yarn.lock',
  '.pnp.cjs',
  '.pnp.loader.mjs'
]);
const alternativeCommandPattern = /\b(?:pnpm|yarn)\s+(?:install|run|exec|dlx|build|test|lint|dev|start|add|remove|update)\b/i;
const ignoredDirectories = new Set([
  '.git', 'node_modules', 'dist', '.angular', 'coverage', 'out-tsc', 'tmp',
  'playwright-report', 'test-results', 'blob-report', '.firebase', '.vercel'
]);

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...collectFiles(join(directory, entry.name)));
    } else if (entry.isFile()) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

function relativePath(file) {
  return relative(root, file).split(sep).join('/');
}

for (const file of requiredFiles) {
  if (!existsSync(file)) errors.push('missing required release file: ' + file);
}

if (errors.length) {
  console.error('Release readiness check failed:');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

for (const absolutePath of collectFiles(root)) {
  const file = relativePath(absolutePath);
  const name = file.split('/').at(-1).toLowerCase();

  if (forbiddenLockNames.has(name)) {
    errors.push('unsupported package-manager lock/config file: ' + file);
  }
  if (name !== 'package-lock.json' && /(?:^|[-.])lock(?:b)?(?:\.|$)/i.test(name)) {
    errors.push('unsupported alternate lockfile; keep the root npm lockfile only: ' + file);
  }
  if (name === 'package-lock.json' && file !== 'package-lock.json') {
    errors.push('nested npm lockfile is not allowed; keep only the root lockfile: ' + file);
  }

  let source;
  try {
    source = readFileSync(absolutePath, 'utf8');
  } catch {
    continue;
  }
  if (source.includes('\u0000')) continue;

  if (
    (name === 'package.json' ||
      file.startsWith('.github/') ||
      /(^|\/)(?:Dockerfile|Makefile|Procfile|render\.yaml|fly\.toml|railway\.json|vercel\.json|netlify\.toml|firebase\.json|\.npmrc)$/i.test(file)) &&
    alternativeCommandPattern.test(source)
  ) {
    errors.push('non-npm package-manager command found in build configuration: ' + file);
  }

  if (name === 'package.json') {
    try {
      const nestedManifest = JSON.parse(source);
      if (nestedManifest.packageManager && !nestedManifest.packageManager.startsWith('npm@')) {
        errors.push('package manifest selects a non-npm package manager: ' + file);
      }
    } catch {
      errors.push('invalid JSON in package manifest: ' + file);
    }
  }
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));

if (manifest.packageManager !== 'npm@10.9.8') {
  errors.push('expected packageManager "npm@10.9.8", found ' + JSON.stringify(manifest.packageManager ?? null));
}
if (lock.lockfileVersion !== 3) errors.push('expected npm lockfile version 3, found ' + lock.lockfileVersion);

const lockedRoot = lock.packages?.[''];
if (!lockedRoot) {
  errors.push('package-lock.json is missing the root package metadata');
} else {
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const expected = manifest[group] || {};
    const actual = lockedRoot[group] || {};
    for (const [name, version] of Object.entries(expected)) {
      if (actual[name] !== version) {
        errors.push('package-lock mismatch for ' + group + '.' + name + ': manifest=' + version + ', lock=' + (actual[name] ?? 'missing'));
      }
    }
    for (const name of Object.keys(actual)) {
      if (!(name in expected)) errors.push('stale locked root dependency ' + group + '.' + name);
    }
  }
}

if (!manifest.scripts?.build || !manifest.scripts?.typecheck) {
  errors.push('required npm scripts "build" and "typecheck" must exist');
}
if (
  !manifest.scripts?.['build:prod'] ||
  !manifest.scripts?.prestart ||
  !manifest.scripts?.start ||
  !manifest.scripts?.['start:prod']
) {
  errors.push('required npm production scripts "build:prod", "prestart", "start", and "start:prod" must exist');
}
if (manifest.engines?.node !== '>=22.22.2' || manifest.engines?.npm !== '>=10.9.0') {
  errors.push('unsupported runtime range; expected Node.js >=22.22.2 and npm >=10.9.0');
}
if (!existsSync('.npmrc') || !readFileSync('.npmrc', 'utf8').split(/\r?\n/u).includes('engine-strict=true')) {
  errors.push('.npmrc must enforce the Node.js and npm engine ranges');
}

for (const [name, command] of Object.entries(manifest.scripts || {})) {
  const matches = [...command.matchAll(/(?:^|\s)node\s+(scripts\/[^\s;&|]+)/g)];
  for (const match of matches) {
    const target = match[1].replace(/^['"]|['"]$/g, '');
    if (!existsSync(join(root, target))) errors.push('npm script "' + name + '" references missing file ' + target);
  }
}

if (errors.length) {
  console.error('Release readiness check failed:');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

console.log('Release readiness passed: npm-only project, source/config scan, root lockfile, and lock metadata are consistent.');
