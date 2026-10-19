import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const outputRoot = 'dist/app';
if (!existsSync(outputRoot) || !statSync(outputRoot).isDirectory()) {
  console.error('Production smoke check failed: dist/app does not exist. Build production first.');
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
walk(outputRoot);

const indexFile = files.find(file => basename(file) === 'index.html');
if (!indexFile) {
  console.error('Production smoke check failed: no index.html found under dist/app.');
  process.exit(1);
}

const html = readFileSync(indexFile, 'utf8');
if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
  console.error(`Production smoke check failed: ${indexFile} is not a valid HTML shell.`);
  process.exit(1);
}

const localRefs = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["'][^>]*>/gi)].map(match => match[1])
].filter(ref => !/^(?:https?:)?\/\//i.test(ref) && !ref.startsWith('data:'));

const missingAssets = localRefs.filter(ref => {
  const clean = decodeURIComponent(ref.split('?')[0]).replace(/^\.\//, '');
  const target = resolve(dirname(indexFile), clean);
  return !existsSync(target);
});

if (missingAssets.length) {
  console.error('Production smoke check failed: referenced local assets are missing:');
  for (const asset of missingAssets) console.error(`- ${asset}`);
  process.exit(1);
}

if (!files.some(file => /\.(?:m?js)$/i.test(file))) {
  console.error('Production smoke check failed: no JavaScript bundle found.');
  process.exit(1);
}

console.log(`Production smoke check passed: found ${indexFile} and ${files.length} build artifact(s).`);
