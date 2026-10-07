import assert from 'node:assert/strict';
import { assessEvidenceVerification } from '../src/server/services/source-verification.service.ts';

console.log('🧪 Starting P1 Academic Integrity Smoke Test...\n');

const missingEvidence = assessEvidenceVerification({
  claimText: 'بانگەشەی زانستی',
  evidenceText: ''
});
assert.equal(
  missingEvidence.status,
  'not_available',
  'A claim without evidence MUST remain unavailable'
);

const verifiedEvidence = assessEvidenceVerification({
  claimText: 'ئەم وتارە پێشکەوتنێکی گرنگە.',
  evidenceText: 'ئەم وتارە پێشکەوتنێکی گرنگە.'
});
assert.equal(
  verifiedEvidence.status,
  'verified',
  'An exact normalized claim/evidence match MUST be verified'
);

const mismatchedEvidence = assessEvidenceVerification({
  claimText: 'ئەم وتارە پێشکەوتنێکی گرنگە.',
  evidenceText: 'دەقی تر کە هیچ پەیوەندییەکی نییە.'
});
assert.equal(
  mismatchedEvidence.status,
  'unverified',
  'A mismatched evidence chunk MUST NOT become verified'
);

console.log('✅ P1 Academic Integrity Smoke Test PASSED SUCCESSFULLY!');
