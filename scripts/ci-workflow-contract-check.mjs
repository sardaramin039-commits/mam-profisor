import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];

const contracts = [
  ['.github/workflows/quality.yml', [
    'pull_request:',
    "      - 'app/applet/**'",
    "      - 'public/**'",
    "      - 'firestore.rules'",
    "      - 'firebase.json'",
    "      - 'playwright.config.ts'",
    "      - 'vitest.config.*'",
    'node-version: 22.22.2',
    'run: npm ci',
    'run: npm run release:check',
    'run: npm run integrity:audit',
    'node scripts/p5-evidence-intelligence-test.mjs',
    'node scripts/p6-multi-agent-orchestration-test.mjs',
    'node scripts/p7-p10-research-chain-test.mjs',
    'node scripts/p11-p15-publication-chain-test.mjs',
    'node scripts/p16-p20-submission-chain-test.mjs',
    'node scripts/library-integrity-audit.mjs',
    'node scripts/security-secret-audit.mjs',
    'run: npm run build',
    'run: npm run e2e:ci',
    'run: npm run release:smoke',
    'run: npm audit --omit=dev --audit-level=high'
  ]],
  ['.github/workflows/quality-gate.yml', [
    'workflow_dispatch:',
    'node scripts/p7-p10-research-chain-test.mjs',
    'node scripts/p11-p15-publication-chain-test.mjs',
    'node scripts/p16-p20-submission-chain-test.mjs',
    'run: npm run build'
  ]],
  ['.github/workflows/academic-integrity-ci.yml', [
    'workflow_dispatch:',
    'node scripts/p6-multi-agent-orchestration-test.mjs',
    'node scripts/p7-p10-research-chain-test.mjs',
    'node scripts/p11-p15-publication-chain-test.mjs',
    'node scripts/p16-p20-submission-chain-test.mjs',
    'run: npm run typecheck',
    'run: npm run lint'
  ]],
  ['.github/workflows/ci-runner-diagnostic.yml', [
    'workflow_dispatch:',
    'node-version: 22.22.2',
    'run: npm ci --ignore-scripts --no-audit --no-fund'
  ]],
  ['.github/workflows/sync-lockfile.yml', [
    'gh workflow run quality.yml --ref main'
  ]]
];

for (const [relativePath, requiredSnippets] of contracts) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    errors.push(`Workflow missing: ${relativePath}`);
    continue;
  }
  const source = readFileSync(filePath, 'utf8');
  for (const snippet of requiredSnippets) {
    if (!source.includes(snippet)) {
      errors.push(`Workflow contract missing in ${relativePath}: ${snippet}`);
    }
  }
}

for (const relativePath of [
  '.github/workflows/quality-gate.yml',
  '.github/workflows/academic-integrity-ci.yml'
]) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) continue;
  const source = readFileSync(filePath, 'utf8');
  if (/^\s{2}pull_request:/mu.test(source) || /^\s{2}push:/mu.test(source)) {
    errors.push(`Duplicate workflow must remain manual-only: ${relativePath}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`CI WORKFLOW CHECK: ${error}`);
  process.exit(1);
}

console.log('CI workflow contract check passed: one canonical automated quality gate, manual duplicate gates, and runner diagnostics are configured.');
