import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve, relative } from 'node:path';

const outputRoot = resolve('dist/app');
if (!existsSync(outputRoot) || !statSync(outputRoot).isDirectory()) {
  console.error('Production smoke check failed: dist/app does not exist. Build production first.');
  process.exit(1);
}

const browserRoot = join(outputRoot, 'browser');
const serverRoot = join(outputRoot, 'server');
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

console.log(`Production smoke check passed: ${relative(outputRoot, indexFile)}; ${browserFiles.length} browser artifact(s); ${localRefs.length} local bundle references resolved.`);
