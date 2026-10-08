import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const serverPath = join(root, 'dist', 'app', 'server', 'server.mjs');
if (!existsSync(serverPath)) {
  console.error('Release smoke check requires a production build at dist/app/server/server.mjs.');
  process.exit(1);
}

const port = Number(process.env['SMOKE_PORT'] || 4173);
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [serverPath], {
  cwd: root,
  env: { ...process.env, PORT: String(port), NODE_ENV: 'production', TRUST_PROXY: 'false' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverOutput = '';
child.stdout.on('data', chunk => { serverOutput += String(chunk); });
child.stderr.on('data', chunk => { serverOutput += String(chunk); });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${origin}/api/docs`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Production server did not become ready.');
}

async function assertRuntimeContract() {
  const docs = await fetch(`${origin}/api/docs`);
  if (docs.status !== 200) throw new Error(`API docs returned ${docs.status}.`);
  if (docs.headers.get('x-content-type-options') !== 'nosniff') {
    throw new Error('Security header X-Content-Type-Options is missing.');
  }

  const protectedEndpoint = await fetch(
    `${origin}/api/publication-submission-editorial/test-workspace/test-submission/decisions`
  );
  if (protectedEndpoint.status !== 401) {
    throw new Error(`Protected P20 endpoint expected 401 without auth, got ${protectedEndpoint.status}.`);
  }

  const preflight = await fetch(
    `${origin}/api/publication-submission-editorial/test-workspace/test-submission/revision/test-task`,
    { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PATCH' } }
  );
  if (preflight.status !== 204) throw new Error(`PATCH preflight returned ${preflight.status}.`);
  const methods = preflight.headers.get('access-control-allow-methods') || '';
  if (!methods.split(',').map(value => value.trim()).includes('PATCH')) {
    throw new Error('PATCH is not present in CORS allow-methods.');
  }
}

try {
  await waitForServer();
  await assertRuntimeContract();
  console.log('Release smoke check passed: production server boot, security headers, auth guard, and PATCH CORS are healthy.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (serverOutput.trim()) console.error(serverOutput.slice(-4000));
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
}
