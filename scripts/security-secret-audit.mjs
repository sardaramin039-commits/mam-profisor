import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const patterns = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];

const excluded = new Set(['.env.example', 'scripts/security-secret-audit.mjs']);
const findings = [];

for (const file of trackedFiles) {
  if (excluded.has(file)) continue;
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isPublicFirebaseWebConfig =
      (file === 'firebase-applet-config.json' || file === 'src/app/firebase.ts') &&
      /(?:^|[\s"'`])apiKey[\s"'`]*[:=][\s"'`]*AIza[0-9A-Za-z_-]{20,}/.test(line);

    if (patterns.some(pattern => pattern.test(line)) && !isPublicFirebaseWebConfig) {
      findings.push({ file, line: index + 1 });
    }
  }
}

if (findings.length) {
  console.error('Potential hardcoded credentials detected:');
  findings.forEach(item => console.error(`- ${item.file}:${item.line}`));
  process.exit(1);
}

console.log(`Secret audit passed across ${trackedFiles.length} tracked files.`);
