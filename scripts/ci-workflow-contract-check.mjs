import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];

const contracts = [
  ['.github/workflows/quality.yml', [
    'pull_request:',
    'node-version: 22.22.2',
    'run: npm ci',
    'node scripts/p7-p10-research-chain-test.mjs',
    'node scripts/p11-p15-publication-chain-test.mjs',
    'node scripts/p16-p20-submission-chain-test.mjs',
    'run: npm run build',
    'run: npm run e2e:ci',
    'run: npm run release:smoke',
    'run: npm audit --omit=dev --audit-level=high'
  ]],
  ['.github/workflows/quality-gate.yml', [
    'pull_request:',
    'node scripts/p7-p10-research-chain-test.mjs',
    'node scripts/p11-p15-publication-chain-test.mjs',
    'node scripts/p16-p20-submission-chain-test.mjs',
    'run: npm run build'
  ]],
  ['.github/workflows/academic-integrity-ci.yml', [
    'pull_request:',
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

if (errors.length) {
  for (const error of errors) console.error(`CI WORKFLOW CHECK: ${error}`);
  process.exit(1);
}

console.log('CI workflow contract check passed: canonical quality, integrity, release and runner-diagnostic workflows retain required gates.');
