import { spawn, spawnSync } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve, relative } from 'node:path';

const outputRoot = resolve('dist/app');
if (!existsSync(outputRoot) || !statSync(outputRoot).isDirectory()) {
  console.error('Production smoke check failed: dist/app does not exist. Build production first.');
  process.exit(1);
}

const browserRoot = join(outputRoot, 'browser');
const serverRoot = join(outputRoot, 'server');
const serverEntry = join(serverRoot, 'server.mjs');
const files = [];

function walk(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(fullPath);
  }
}

walk(outputRoot);

if (!existsSync(serverEntry) || !statSync(serverEntry).isFile()) {
  console.error('Production smoke check failed: expected SSR server entry dist/app/server/server.mjs is missing.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
if (!manifest.scripts?.start?.includes('dist/app/server/server.mjs')) {
  console.error('Production smoke check failed: npm start does not target the built SSR server entry.');
  process.exit(1);
}

const serverSyntax = spawnSync(process.execPath, ['--check', serverEntry], { encoding: 'utf8' });
if (serverSyntax.error || serverSyntax.status !== 0) {
  console.error('Production smoke check failed: the SSR server entry is not valid Node.js syntax.');
  if (serverSyntax.error) console.error(serverSyntax.error.message);
  if (serverSyntax.stderr) console.error(serverSyntax.stderr.trim());
  process.exit(1);
}

// In Angular SSR outputMode=server, the canonical browser directory contains JS/CSS
// bundles; HTML shells may live only in prerendered-routes rather than browser/index.html.
const assetRoot = existsSync(browserRoot) ? browserRoot : outputRoot;
const directIndex = [join(browserRoot, 'index.html'), join(outputRoot, 'index.html')]
  .find(path => existsSync(path));
const indexFile = directIndex ?? files.find(path =>
  basename(path) === 'index.html' &&
  !path.startsWith(serverRoot + '/')
);

if (!indexFile) {
  console.error('Production smoke check failed: no browser or prerendered index.html was emitted.');
  process.exit(1);
}

const html = readFileSync(indexFile, 'utf8');
if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
  console.error(`Production smoke check failed: ${relative(outputRoot, indexFile)} is not a valid HTML shell.`);
  process.exit(1);
}

const localRefs = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["'][^>]*>/gi)].map(match => match[1])
].filter(ref => !/^(?:https?:)?\/\//i.test(ref) && !ref.startsWith('data:'));

const missingAssets = localRefs.filter(ref => {
  let clean;
  try {
    clean = decodeURIComponent(ref.split('?')[0]).replace(/^\.\//, '').replace(/^\/+/, '');
  } catch {
    return true;
  }
  // Refuse path traversal; root-relative local assets are resolved within the browser output.
  if (clean.split('/').includes('..')) return true;
  return !existsSync(resolve(assetRoot, clean));
});

if (missingAssets.length) {
  console.error(`Production smoke check failed: assets referenced by ${relative(outputRoot, indexFile)} are missing in ${relative(outputRoot, assetRoot)}:`);
  for (const asset of missingAssets) console.error(`- ${asset}`);
  process.exit(1);
}

const browserFiles = files.filter(file => file.startsWith(assetRoot + '/') && !file.startsWith(serverRoot + '/'));
if (!browserFiles.some(file => /\.(?:m?js)$/i.test(file))) {
  console.error(`Production smoke check failed: no JavaScript bundle found under ${relative(outputRoot, assetRoot)}.`);
  process.exit(1);
}


function reserveLoopbackPort() {
  return new Promise((resolvePort, reject) => {
    const probe = createNetServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close(() => reject(new Error('Could not reserve a TCP port for the server smoke test.')));
        return;
      }
      const port = address.port;
      probe.close(error => error ? reject(error) : resolvePort(port));
    });
  });
}

async function stopServerProcess(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolveExit => {
    const timer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }, 2500);
    child.once('exit', () => {
      clearTimeout(timer);
      resolveExit();
    });
    child.kill('SIGTERM');
  });
}

async function verifyLiveServer() {
  const port = await reserveLoopbackPort();
  // When invoked by npm run release:smoke, start through npm itself so the
  // prestart artifact guard and the production start command are tested too.
  const npmCli = process.env['npm_execpath'];
  const startArgs = npmCli ? [npmCli, 'start'] : [serverEntry];
  const child = spawn(process.execPath, startArgs, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      TRUST_PROXY: 'false'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  let spawnError;
  const appendOutput = chunk => {
    output = (output + chunk.toString()).slice(-6000);
  };
  child.stdout.on('data', appendOutput);
  child.stderr.on('data', appendOutput);
  child.on('error', error => {
    spawnError = error;
  });

  try {
    const deadline = Date.now() + 15000;
    let lastError = 'server did not become healthy before the deadline';

    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) break;

      try {
        const response = await fetch('http://127.0.0.1:' + port + '/healthz', {
          signal: AbortSignal.timeout(1200)
        });
        if (response.ok) {
          const body = await response.json();
          if (body?.status !== 'ok') {
            throw new Error('The health endpoint returned an unexpected response body.');
          }
          console.log('Live SSR server smoke check passed: /healthz returned HTTP ' + response.status + '.');
          return;
        }
        lastError = 'health endpoint returned HTTP ' + response.status;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      await new Promise(resolveDelay => setTimeout(resolveDelay, 200));
    }

    throw new Error(
      'Live SSR server smoke check failed: ' + lastError +
      (output ? '\nLast server output:\n' + output : '')
    );
  } finally {
    await stopServerProcess(child);
  }
}

await verifyLiveServer();

console.log(`Production smoke check passed: SSR entry ${relative(outputRoot, serverEntry)} syntax valid; ${relative(outputRoot, indexFile)}; ${browserFiles.length} browser artifact(s); ${localRefs.length} local bundle references resolved.`);
