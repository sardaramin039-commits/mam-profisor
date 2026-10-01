import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const rules = [
  {
    file: 'src/services/digital-library-sources.ts',
    checks: [
      [/totalItems:\s*(?!0\b)\d+/m, 'static source registry must not contain hard-coded live item counts'],
      [/status:\s*'active'/m, 'static source registry must not claim active status before adapter verification'],
      [/lastSync:\s*new Date\(\)/m, 'static source registry must not present module-load time as a real sync time']
    ]
  },
  {
    file: 'src/services/kurdish-books-catalog.ts',
    checks: [
      [/verified:\s*true/m, 'seed catalog entries must not be marked verified'],
      [/\n\s*rating:\s*[^,\n]+/m, 'seed catalog must not contain fabricated ratings'],
      [/\n\s*reviewCount:\s*[^,\n]+/m, 'seed catalog must not contain fabricated review counts']
    ]
  },
  {
    file: 'src/services/crawler-engine.ts',
    checks: [
      [/recordsCrawled:\s*(?!0\b)\d+/m, 'crawler must not hard-code positive crawl results'],
      [/sourcesProcessed:\s*(?!0\b)\d+/m, 'crawler must not hard-code processed-source results']
    ]
  }
];

let failures = 0;
for (const rule of rules) {
  const content = await readFile(rule.file, 'utf8');
  for (const [pattern, message] of rule.checks) {
    if (pattern.test(content)) {
      console.error(`- ${rule.file}: ${message}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log('Digital library factuality audit passed.');
