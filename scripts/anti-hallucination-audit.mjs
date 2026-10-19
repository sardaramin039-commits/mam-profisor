import { existsSync, readFileSync } from 'node:fs';

const file = 'src/app/features/advanced-research/services/research-api-client.service.ts';
if (!existsSync(file)) {
  console.error(`Academic integrity audit cannot find required source: ${file}`);
  process.exit(1);
}

const source = readFileSync(file, 'utf8');
const forbiddenPatterns = [
  [/\bstatus\s*:\s*['"]verified['"]/i, 'hard-coded verified status'],
  [/\bisValid\s*:\s*true\b/i, 'hard-coded valid citation flag'],
  [/\bfactualityScore\s*:\s*\d+/i, 'hard-coded fact-check score'],
  [/\bsimilarityScore\s*:\s*\d+/i, 'hard-coded plagiarism similarity'],
  [/\boverallScore\s*:\s*\d+/i, 'hard-coded review or integrity score'],
  [/\btrustScore\s*:\s*\d+/i, 'hard-coded evidence trust score'],
  [/\bvalidCount\s*:\s*citations\.length/i, 'automatic validation of every citation'],
  [/\bconfidenceScore\s*\|\|\s*70\b/i, 'synthetic default confidence score'],
  [/\baverageConfidenceScore\s*:\s*70\b/i, 'synthetic average confidence score'],
  [/return\s+of\(\{\s*success\s*:\s*true\s*,\s*(?:id|versionId)\s*:/i, 'fake persistence success response']
];

const violations = forbiddenPatterns
  .filter(([pattern]) => pattern.test(source))
  .map(([, label]) => label);

const mustFailClosed = [
  'runFactCheck',
  'runOcr',
  'runPeerReview',
  'runPlagiarismAnalysis',
  'validateCitations',
  'lookupOrcid',
  'searchGoogleScholar',
  'findJournals',
  'lookupAuthorHIndex',
  'verifyClaim',
  'evaluateCitationQuality',
  'auditResearchIntegrity',
  'saveResearchVersion',
  'getWorkspace',
  'requestExportGate',
  'listResearchDecisions',
  'addResearchDecision',
  'findAcademicReferences'
];

for (const method of mustFailClosed) {
  const declaration = new RegExp(`\\b${method}\\s*\\([^)]*\\)[^{]*\\{[\\s\\S]{0,500}?this\\.notConfigured\\(['"]${method}['"]\\)`);
  if (!declaration.test(source)) violations.push(`unimplemented method does not fail closed: ${method}`);
}

if (!source.includes('resolveDoiProvider(doi)') ||
    !source.includes('lookupIsbnProvider(isbn)') ||
    !source.includes('lookupIssnProvider(issn)')) {
  violations.push('DOI/ISBN/ISSN lookup is not wired to real provider functions');
}

if (!source.includes('private requestStructured<T>') ||
    !source.includes('JSON.parse(cleaned)')) {
  violations.push('Gemini response JSON validation helper is missing');
}

if (violations.length) {
  console.error('Academic integrity audit failed:');
  for (const issue of violations) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Academic integrity audit passed for the critical research API client.');
console.log('This static check does not replace source-level review or independent citation verification.');
