import assert from 'node:assert/strict';
import { evaluateResearchControlGates } from '../src/server/services/research-validation-policy.ts';
import { assembleManuscript } from '../src/server/services/manuscript-assembly.service.ts';

console.log('🧪 Starting integrated P7-P10 Research Chain Contract Test...\n');

const blocked = evaluateResearchControlGates({
  methodologyReady: false,
  evidenceReady: true,
  decisionTraceable: true,
  reviewRequired: false,
  sourcesCount: 1,
  claimsCount: 2,
  evidenceCount: 1,
  decisionCount: 1,
  evidenceCoverage: 50
});
assert.equal(blocked.exportBlocked, true);
assert.equal(blocked.readyForManuscript, false);
assert.ok(blocked.blockers.length >= 2);
assert.ok(blocked.blockers.some(item => item.includes('Methodology')));

const ready = evaluateResearchControlGates({
  methodologyReady: true,
  evidenceReady: true,
  decisionTraceable: true,
  reviewRequired: false,
  sourcesCount: 2,
  claimsCount: 2,
  evidenceCount: 2,
  decisionCount: 2,
  evidenceCoverage: 100
});
assert.equal(ready.exportBlocked, false);
assert.equal(ready.readyForManuscript, true);
assert.equal(ready.blockers.length, 0);

const manuscript = assembleManuscript({
  projectId: 'CHAIN-1',
  title: 'توێژینەوەی تاقیکردنەوە',
  methodology: 'میتۆدی تاقیکردنەوە',
  chapters: [{
    id: 'CH-1',
    title: 'بەشی یەکەم',
    order: 1,
    content: 'ناوەڕۆکی بەشی یەکەم',
    citationIds: ['CIT-1']
  }],
  citations: [{
    citationId: 'CIT-1',
    sourceId: 'SRC-1',
    evidenceId: 'EVI-1',
    inText: '(Test, 2026)',
    bibliography: 'Test, A. (2026). Verified Source.',
    verified: true
  }]
});
assert.equal(manuscript.integrity.structuralStatus, 'PASS');
assert.equal(manuscript.integrity.fingerprint.length, 64);

const unverified = assembleManuscript({
  projectId: 'CHAIN-1',
  title: 'توێژینەوەی تاقیکردنەوە',
  methodology: 'میتۆدی تاقیکردنەوە',
  chapters: [{
    id: 'CH-1',
    title: 'بەشی یەکەم',
    order: 1,
    content: 'ناوەڕۆکی بەشی یەکەم',
    citationIds: ['CIT-1']
  }],
  citations: [{
    citationId: 'CIT-1',
    sourceId: 'SRC-1',
    evidenceId: 'EVI-1',
    inText: '(Test, 2026)',
    bibliography: 'Test, A. (2026). Unverified Source.',
    verified: false
  }]
});
assert.equal(unverified.integrity.structuralStatus, 'REJECT');

console.log('✅ Integrated P7-P10 Research Chain Contract Test PASSED SUCCESSFULLY!');
