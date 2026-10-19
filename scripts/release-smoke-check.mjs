import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const outputRoot = resolve('dist/app');
if (!existsSync(outputRoot) || !statSync(outputRoot).isDirectory()) {
  console.error('Production smoke check failed: dist/app does not exist. Build production first.');
  process.exit(1);
}

const browserRoot = join(outputRoot, 'browser');
// Angular SSR builds may also emit prerendered HTML below other folders.
// Always validate the canonical browser shell first so lazy assets resolve from the proper root.
const assetRoot = existsSync(join(browserRoot, 'index.html')) ? browserRoot : outputRoot;
const indexFile = join(assetRoot, 'index.html');

if (!existsSync(indexFile)) {
  console.error(`Production smoke check failed: canonical browser index.html is missing at ${indexFile}.`);
  process.exit(1);
}

const html = readFileSync(indexFile, 'utf8');
if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
  console.error(`Production smoke check failed: ${indexFile} is not a valid HTML shell.`);
  process.exit(1);
}

const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(fullPath);
  }
}
walk(assetRoot);

const localRefs = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["'][^>]*>/gi)].map(match => match[1])
].filter(ref => !/^(?:https?:)?\/\//i.test(ref) && !ref.startsWith('data:'));

const missingAssets = localRefs.filter(ref => {
  let clean;
  try {
    clean = decodeURIComponent(ref.split('?')[0]).replace(/^\.\//, '');
  } catch {
    return true;
  }
  // Reject traversal and absolute paths rather than silently resolving outside browser output.
  if (clean.startsWith('/') || clean.split('/').includes('..')) return true;
  return !existsSync(resolve(assetRoot, clean));
});

if (missingAssets.length) {
  console.error('Production smoke check failed: referenced local assets are missing:');
  for (const asset of missingAssets) console.error(`- ${asset}`);
  process.exit(1);
}

if (!files.some(file => /\.(?:m?js)$/i.test(file))) {
  console.error(`Production smoke check failed: no JavaScript bundle found under ${assetRoot}.`);
  process.exit(1);
}

console.log(`Production smoke check passed: canonical shell ${indexFile}, ${files.length} browser artifact(s).`);
