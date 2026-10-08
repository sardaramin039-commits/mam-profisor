import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildSubmissionReceipt,
  verifySubmissionReceipt
} from '../src/server/services/publication-submission-receipt.service.ts';
import {
  buildSubmissionAuditEvent,
  verifySubmissionAuditChain
} from '../src/server/services/publication-submission-audit.service.ts';
import {
  buildSubmissionVersion,
  verifySubmissionVersionChain
} from '../src/server/services/publication-submission-version.service.ts';
import {
  buildSubmissionManifest,
  verifySubmissionManifest
} from '../src/server/services/publication-submission-manifest.service.ts';
import type { PublicationSubmissionPolicy } from '../src/server/services/publication-submission.service.ts';
import { assembleManuscript } from '../src/server/services/manuscript-assembly.service.ts';
import { buildPublicationSubmissionPackage } from '../src/server/services/publication-submission.service.ts';
import { verifyPublicationSubmissionIntegrity } from '../src/server/services/publication-submission-integrity.service.ts';
import {
  buildEditorialDecision,
  buildRevisionPlan
} from '../src/server/services/publication-submission-editorial-decision.service.ts';

console.log('🧪 Starting integrated P16-P20 Submission Chain Contract Test...\n');

const fingerprint = 'a'.repeat(64);
const version = buildSubmissionVersion({
  submissionId: 'SUB-CHAIN',
  cycle: 1,
  kind: 'READY',
  statusAtCapture: 'READY',
  packageFingerprint: fingerprint,
  capturedAt: '2026-10-08T17:00:00.000Z'
});
assert.equal(verifySubmissionVersionChain([version]).status, 'VERIFIED');

const receipt = buildSubmissionReceipt({
  submissionId: 'SUB-CHAIN',
  userId: 'USER-CHAIN',
  workspaceId: 'WS-CHAIN',
  journalName: 'Chain Journal',
  manuscriptType: 'article',
  submissionFingerprint: fingerprint,
  submissionVersionId: version.id,
  note: 'Submission recorded.',
  submittedAt: '2026-10-08T17:01:00.000Z'
});
assert.equal(
  verifySubmissionReceipt(receipt, {
    submissionId: 'SUB-CHAIN',
    workspaceId: 'WS-CHAIN',
    submissionFingerprint: fingerprint,
    submissionVersionId: version.id
  }).status,
  'VERIFIED'
);

const audit1 = buildSubmissionAuditEvent({
  submissionId: 'SUB-CHAIN',
  version: 1,
  from: null,
  to: 'READY',
  note: 'Ready after integrity gate.',
  occurredAt: '2026-10-08T17:00:30.000Z',
  previousHash: ''
});
const audit2 = buildSubmissionAuditEvent({
  submissionId: 'SUB-CHAIN',
  version: 2,
  from: 'READY',
  to: 'SUBMITTED',
  note: 'Submitted.',
  receiptId: receipt.id,
  occurredAt: '2026-10-08T17:01:00.000Z',
  previousHash: audit1.eventHash
});
assert.equal(
  verifySubmissionAuditChain(
    [audit2, audit1],
    'SUBMITTED',
    2,
    audit2.eventHash
  ).status,
  'VERIFIED'
);

const manuscript = assembleManuscript({
  projectId: 'WS-CHAIN',
  title: 'توێژینەوەی زنجیرەیی',
  abstract: 'پوختە',
  methodology: 'میتۆد',
  chapters: [{
    id: 'CH-1',
    title: 'بەشی یەکەم',
    order: 1,
    content: 'ناوەڕۆک'
  }],
  conclusion: 'ئەنجام'
});
const policy = {
  journalName: 'Chain Journal',
  manuscriptType: 'article',
  requiredSections: ['abstract', 'methodology', 'chapter', 'conclusion']
} satisfies PublicationSubmissionPolicy;
const pkg = buildPublicationSubmissionPackage({
  manuscript,
  policy,
  keywords: ['research', 'kurdish']
});
const integrity = verifyPublicationSubmissionIntegrity({ package: pkg });
assert.equal(integrity.status, 'READY');

const manifest = buildSubmissionManifest({
  submissionId: 'SUB-CHAIN',
  userId: 'USER-CHAIN',
  workspaceId: 'WS-CHAIN',
  policy,
  package: pkg,
  integrity,
  versionId: version.id,
  auditHeadHash: audit2.eventHash,
  capturedAt: '2026-10-08T17:01:05.000Z'
});
assert.equal(verifySubmissionManifest(manifest).status, 'VERIFIED');

const decision = buildEditorialDecision({
  submissionId: 'SUB-CHAIN',
  userId: 'EDITOR-1',
  workspaceId: 'WS-CHAIN',
  decisionType: 'MAJOR_REVISION',
  resultingStatus: 'REVISION_REQUESTED',
  submissionVersionId: version.id,
  note: 'Revise methodology and evidence coverage.',
  lifecycleVersion: 3,
  decidedAt: '2026-10-08T18:00:00.000Z'
});
const plan = buildRevisionPlan(
  decision.id,
  'SUB-CHAIN',
  version.id,
  'MAJOR',
  [{
    title: 'Clarify methodology',
    details: 'Add sampling and analysis details.',
    scope: 'SECTION',
    required: true
  }],
  '2026-10-08T18:00:00.000Z'
);
assert.equal(plan.submissionVersionId, version.id);
assert.equal(plan.tasks[0].status, 'OPEN');
assert.equal(decision.resultingStatus, 'REVISION_REQUESTED');

const routeContracts = [
  ['src/server/routes/publication-submission-lifecycle.routes.ts', 'verifySubmissionReceipt'],
  ['src/server/services/publication-submission-editorial-decision.service.ts', 'verifySubmissionReceipt'],
  ['src/server/routes/publication-submission-manifest.routes.ts', 'researchControlPlaneService'],
  ['src/server/routes/publication-submission-manifest.routes.ts', 'resolveServerVerifiedCitations']
];

for (const [path, marker] of routeContracts) {
  assert.ok(readFileSync(path, 'utf8').includes(marker), path + ' is missing required P16-P19 trust-boundary wiring.');
}

console.log('✅ Integrated P16-P20 Submission Chain Contract Test PASSED SUCCESSFULLY!');
