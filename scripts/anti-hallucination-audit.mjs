import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src/server', 'src/app', 'src/helpers'];
const EXTENSIONS = new Set(['.ts', '.html', '.js', '.mjs']);

const rules = [
  { name: 'server default identity fallback', pattern: /['"`]default_user['"`]/g, allowed: [] },
  { name: 'publication year inferred from current date', pattern: /new Date\(\)\.getFullYear\(\)/g, allowed: [] },
  { name: 'obvious fake scholarly URL', pattern: /(?:example123|example\.com\/|doi\.org\/example)/gi, allowed: [/scripts\/.*\.(?:mjs|js)$/] },
  { name: 'fake scholarly author placeholder', pattern: /(?:توێژەری نەناسراو|نووسەری نەناسراو)/g, allowed: [] },
  { name: 'mock scholarly retrieval in production source', pattern: /\bmockCandidates\b/g, allowed: [] },
  { name: 'fabricated source verification assignment', pattern: /\bsourceVerified\s*[:=]\s*true\b/g, allowed: [/source-verification-service\.ts$/] },
  { name: 'random ID generation', pattern: /Math\.random\(\)\.toString\(36\)/g, allowed: [/src\/server\/services\/gemini\.service\.ts$/] },
  { name: 'unsupported Cross-Encoder claim', pattern: /(?:Cross-Encoder Score|Cross-Encoder Reranking Engine)/gi, allowed: [] },
  { name: 'unsupported Harvard affiliation branding', pattern: /(?:پڕۆژەی هارڤارد|Harvard Project|Harvard affiliation)/gi, allowed: [] },
  { name: 'known fabricated academic score fallback', pattern: /(?:overallLanguageScore\s*:\s*88|scholarlyScore\s*:\s*60|vocabularyRichness\s*:\s*60|readability\s*:\s*70|overallScore\s*:\s*8\.2)/g, allowed: [] }
];

async function walk(dir, files = []) {
  for (const entry of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const relative = join(dir, entry.name).replaceAll('\\\\', '/');
    if (entry.isDirectory()) await walk(relative, files);
    else {
      const ext = entry.name.includes('.') ? entry.name.slice(entry.name.lastIndexOf('.')) : '';
      if (EXTENSIONS.has(ext)) files.push(relative);
    }
  }
  return files;
}

const files = [];
for (const dir of TARGET_DIRS) await walk(dir, files);

const violations = [];
for (const file of files) {
  const content = await readFile(join(ROOT, file), 'utf8');
  for (const rule of rules) {
    if (rule.allowed.some(pattern => pattern.test(file))) continue;
    rule.pattern.lastIndex = 0;
    for (const match of content.matchAll(rule.pattern)) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        rule: rule.name,
        file,
        line,
        excerpt: content.split('\n')[line - 1]?.trim().slice(0, 220) || ''
      });
    }
  }
}

if (violations.length) {
  console.error('Anti-hallucination gate failed.');
  for (const v of violations) console.error(`- [${v.rule}] ${v.file}:${v.line} ${v.excerpt}`);
  process.exit(1);
}

console.log(`Anti-hallucination gate passed across ${files.length} source files.`);
