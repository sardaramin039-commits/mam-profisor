import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const outputRoot = resolve('dist/app');
const serverEntry = join(outputRoot, 'server', 'server.mjs');
const browserRoot = join(outputRoot, 'browser');
const errors = [];

if (!existsSync(serverEntry) || !statSync(serverEntry).isFile()) {
  errors.push('Missing dist/app/server/server.mjs. Run "npm ci" and then "npm run build:prod" before starting the server.');
}

if (!existsSync(browserRoot) || !statSync(browserRoot).isDirectory()) {
  errors.push('Missing dist/app/browser/. Run "npm ci" and then "npm run build:prod" before starting the server.');
}

function hasBrowserBundle(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory() && hasBrowserBundle(fullPath)) return true;
    if (entry.isFile() && /\.(?:m?js)$/iu.test(entry.name)) return true;
  }
  return false;
}

if (existsSync(browserRoot) && statSync(browserRoot).isDirectory() && !hasBrowserBundle(browserRoot)) {
  errors.push('No browser JavaScript bundle exists under dist/app/browser/. Rebuild the production application.');
}

if (errors.length) {
  console.error('Server preflight failed:');
  for (const error of errors) console.error('- ' + error);
  process.exitCode = 1;
} else {
  console.log('Server preflight passed: SSR entry and browser bundles are present.');
}
