import { existsSync, readFileSync } from 'node:fs';

const reportPath = process.argv[2];
if (!reportPath || !existsSync(reportPath)) {
  console.warn('Dependency audit details unavailable: npm audit JSON report was not produced.');
  process.exit(0);
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch {
  console.warn('Dependency audit details unavailable: npm audit output was not valid JSON.');
  process.exit(0);
}

const totals = report.metadata?.vulnerabilities;
if (!totals) {
  const message = report.error?.summary || report.error?.detail || 'npm did not return vulnerability metadata.';
  console.warn(`Dependency audit could not be fully evaluated: ${String(message).slice(0, 500)}`);
  console.warn('This reporting step is non-blocking; treat dependency security status as unknown until reviewed.');
  process.exit(0);
}

console.log('Dependency audit summary (report-only; does not change dependencies):');
console.log(JSON.stringify(totals));
const vulnerabilities = Object.entries(report.vulnerabilities || {})
  .sort(([, a], [, b]) => {
    const rank = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
    return (rank[a.severity] ?? 5) - (rank[b.severity] ?? 5);
  });

for (const [name, item] of vulnerabilities) {
  const fix = item.fixAvailable === true
    ? 'available (semver-compatible)'
    : item.fixAvailable === false
      ? 'no automatic fix reported'
      : item.fixAvailable && typeof item.fixAvailable === 'object'
        ? `available via ${item.fixAvailable.name || name}@${item.fixAvailable.version || 'updated version'}`
        : 'not specified';
  console.log(`[${String(item.severity).toUpperCase()}] ${name} | direct=${Boolean(item.isDirect)} | range=${item.range || 'unknown'} | fix=${fix}`);
  for (const advisory of item.via || []) {
    if (typeof advisory === 'string') {
      console.log(`  via: ${advisory}`);
    } else if (advisory && typeof advisory === 'object') {
      const title = advisory.title || advisory.name || 'advisory';
      const url = advisory.url || 'no advisory URL supplied';
      const range = advisory.range ? `; affected range: ${advisory.range}` : '';
      console.log(`  advisory: ${title} (${url})${range}`);
    }
  }
}

console.log('Review each advisory before upgrading. This report intentionally does not auto-fix or fail the build.');
