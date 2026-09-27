import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const secretPatterns = [
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
];

const excluded = new Set([
  '.env.example',
  'scripts/security-secret-audit.mjs',
]);

const findings = [];

for (const file of trackedFiles) {
  if (excluded.has(file)) continue;

  let text;
  try {
    text = await import('node:fs/promises').then(fs => fs.readFile(file, 'utf8'));
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    if (secretPatterns.some(pattern => pattern.test(lines[index]))) {
      findings.push({ file, line: index + 1 });
    }
  }
}

if (findings.length > 0) {
  console.error('Potential hardcoded credentials detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}`);
  }
  process.exit(1);
}

console.log('Secret audit passed.');
