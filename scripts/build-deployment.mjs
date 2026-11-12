import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const ngCliPath = path.join(ROOT, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

if (!fs.existsSync(ngCliPath)) {
  throw new Error('Angular CLI is missing. Install the project dependencies before building.');
}

execFileSync(process.execPath, [ngCliPath, 'build', '--configuration', 'production'], {
  cwd: ROOT,
  stdio: 'inherit'
});
