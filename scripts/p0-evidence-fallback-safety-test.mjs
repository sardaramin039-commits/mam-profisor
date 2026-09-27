import assert from 'node:assert/strict';
import { EvidenceGroundingService } from '../src/server/services/evidence-grounding.service.ts';

const service = new EvidenceGroundingService();
const result = await service.generateGroundedContent(
  'بابەتی تاقیکردنەوە',
  'پوختەیەکی کورت',
  [{
    sourceId: 'SRC-001',
    sourceTitle: 'سەرچاوەی پشتڕاستکراو',
    chunkText: 'بەڵگەی ڕاستەقینە',
    verificationStatus: 'verified'
  }],
  () => { throw new Error('forced fallback'); }
);

assert.equal(result.verifiedCitations.length, 0);
assert.equal(result.paragraphs[0].claims[0].citationEligible, false);
assert.equal(result.integrityMetrics.citationEligibleClaims, 0);
assert.ok(!JSON.stringify(result).includes('2024'));

console.log('P0 evidence fallback safety test passed.');