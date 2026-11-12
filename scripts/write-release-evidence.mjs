import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const evidenceDir = resolve('release-evidence');
mkdirSync(evidenceDir, { recursive: true });

const evidence = {
  schemaVersion: 1,
  project: packageJson.name,
  version: packageJson.version,
  commit: git(['rev-parse', 'HEAD']),
  ref: process.env.GITHUB_REF || git(['branch', '--show-current']),
  event: process.env.GITHUB_EVENT_NAME || 'local',
  generatedAt: new Date().toISOString(),
  runtime: {
    node: process.version,
    npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim()
  },
  verifiedChecks: [
    'npm ci',
    'npm run phase3:preserve',
    'npm run release:check',
    'npm run line-limit',
    'npm run integrity:audit',
    'npm run test:server',
    'npm run typecheck',
    'npm run build -- --configuration production',
    'npm run release:smoke'
  ],
  interpretation: 'These checks passed in the release-verification workflow. This manifest is not proof of production deployment, live provider credentials, database connectivity, or a complete manual end-to-end acceptance test.'
};

writeFileSync(resolve(evidenceDir, 'verification.json'), JSON.stringify(evidence, null, 2) + '\n');

const markdown = [
  '# Mam Professor release verification evidence',
  '',
  `- **Version:** ${evidence.version}`,
  `- **Commit:** ${evidence.commit}`,
  `- **Ref:** ${evidence.ref}`,
  `- **Workflow event:** ${evidence.event}`,
  `- **Generated:** ${evidence.generatedAt}`,
  `- **Node:** ${evidence.runtime.node}`,
  `- **npm:** ${evidence.runtime.npm}`,
  '',
  '## Checks passed',
  ...evidence.verifiedChecks.map(check => `- [x] ${check}`),
  '',
  '## Limitations',
  '',
  evidence.interpretation,
  ''
].join('\n');

writeFileSync(resolve(evidenceDir, 'verification.md'), markdown);
console.log(`Release evidence written to ${evidenceDir}`);
