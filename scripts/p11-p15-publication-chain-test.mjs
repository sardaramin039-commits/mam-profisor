import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluatePublicationDefenseReadiness } from '../src/server/services/publication-defense-readiness.service.ts';
import { defenseRehearsalService } from '../src/server/services/defense-rehearsal.service.ts';
import { assembleManuscript } from '../src/server/services/manuscript-assembly.service.ts';
import { buildPublicationSubmissionPackage } from '../src/server/services/publication-submission.service.ts';
import { verifyPublicationSubmissionIntegrity } from '../src/server/services/publication-submission-integrity.service.ts';
import {
  allowedNextStatuses,
  canTransition,
  initialSubmissionStatus,
  isTerminalSubmissionStatus
} from '../src/server/services/publication-submission-lifecycle.policy.ts';

console.log('🧪 Starting integrated P11-P15 Publication Chain Contract Test...\n');

const manuscript = assembleManuscript({
  projectId: 'P11-P15-CHAIN',
  title: 'توێژینەوەی تاقیکاری',
  abstract: 'پوختەی توێژینەوە',
  researchQuestion: 'پرسیاری سەرەکیی توێژینەوە',
  methodology: 'میتۆدی توێژینەوە',
  chapters: [{
    id: 'CH-1',
    title: 'بەشی یەکەم',
    order: 1,
    content: 'ناوەڕۆکی بەشی یەکەم'
  }],
  conclusion: 'ئەنجام'
});
assert.equal(manuscript.integrity.structuralStatus, 'PASS');

const readiness = evaluatePublicationDefenseReadiness({
  title: manuscript.title,
  abstract: 'پوختەی توێژینەوە',
  researchQuestion: 'پرسیاری سەرەکیی توێژینەوە',
  methodology: 'میتۆدی توێژینەوە',
  conclusion: 'ئەنجام',
  chapterCount: 1,
  referencedCitationCount: 0,
  verifiedCitationCount: 0,
  bibliographyCount: 0,
  structuralStatus: 'PASS',
  exportBlocked: false,
  topic: 'توێژینەوە'
});
assert.equal(readiness.publicationStatus, 'READY');
assert.equal(readiness.defenseQuestions.length, 5);

const rehearsal = defenseRehearsalService.prepare({
  topic: 'توێژینەوە',
  title: manuscript.title,
  researchQuestion: 'پرسیاری سەرەکیی توێژینەوە',
  methodology: 'میتۆدی توێژینەوە',
  conclusion: 'ئەنجام',
  chapterTitles: ['بەشی یەکەم'],
  referencedCitationCount: 0,
  verifiedCitationCount: 0,
  bibliographyCount: 0,
  structuralStatus: 'PASS',
  exportBlocked: false
});
assert.ok(rehearsal.questions.length >= 5);
const answer = defenseRehearsalService.assess(
  rehearsal.questions[0],
  'پرسیاری سەرەکی و سنووری توێژینەوە بە ڕوونی دیاریکراون.'
);
assert.notEqual(answer.status, 'MISSING');

const submission = buildPublicationSubmissionPackage({
  manuscript,
  policy: {
    journalName: 'Test Journal',
    manuscriptType: 'article',
    requiredSections: ['methodology', 'chapter'],
    requireAuthorMetadata: false
  }
});
assert.equal(submission.status, 'READY');

const integrity = verifyPublicationSubmissionIntegrity({ package: submission });
assert.equal(integrity.status, 'READY');
assert.equal(integrity.readyToSubmit, true);
assert.equal(integrity.fingerprint.length, 64);

assert.equal(initialSubmissionStatus(integrity.readyToSubmit), 'READY');
assert.equal(canTransition('READY', 'SUBMITTED').allowed, true);
assert.equal(canTransition('DRAFT', 'READY').allowed, false);
assert.equal(isTerminalSubmissionStatus('ACCEPTED'), true);
assert.deepEqual(
  allowedNextStatuses('READY'),
  ['SUBMITTED', 'DRAFT', 'WITHDRAWN']
);

const routeContracts = [
  ['src/server/routes/publication-defense-readiness.routes.ts', 'researchControlPlaneService', 'resolveServerVerifiedCitations'],
  ['src/server/routes/defense-rehearsal.routes.ts', 'researchControlPlaneService', 'resolveServerVerifiedCitations'],
  ['src/server/routes/publication-submission.routes.ts', 'researchControlPlaneService', 'resolveServerVerifiedCitations'],
  ['src/server/routes/publication-submission-integrity.routes.ts', 'researchControlPlaneService', 'resolveServerVerifiedCitations'],
  ['src/server/routes/publication-submission-lifecycle.routes.ts', 'researchControlPlaneService', 'resolveServerVerifiedCitations']
];

for (const [path, gateName, citationGateName] of routeContracts) {
  const source = readFileSync(path, 'utf8');
  assert.ok(source.includes(gateName), path + ' is missing the P9 server gate.');
  assert.ok(source.includes(citationGateName), path + ' is missing the P7 evidence gate.');
}

assert.ok(
  readFileSync('src/server/routes/publication-submission-lifecycle.routes.ts', 'utf8')
    .includes('P9 research validation')
);

console.log('✅ Integrated P11-P15 Publication Chain Contract Test PASSED SUCCESSFULLY!');
