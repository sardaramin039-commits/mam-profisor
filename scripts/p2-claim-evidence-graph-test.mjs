import assert from 'node:assert/strict';
import { claimEvidenceGraphService } from '../src/server/services/claim-evidence-graph.service.ts';

console.log('🧪 Starting P2 Claim-Evidence Graph Contract Test...\n');

const mockGeminiClient = () => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify({
        claims: [
          {
            claimId: 'CLAIM-001',
            text: 'کوردستان هەرێمێکی باکووری ڕۆژهەڵاتی ناوەڕاستە',
            sourceId: 'SRC-001',
            evidenceId: 'EVI-001',
            confidence: 95,
            page: '127',
            quote: 'کوردستان لە باکووری ڕۆژهەڵاتی ناوەڕاستە',
            verificationStatus: 'verified',
            citationId: 'CIT-001',
            syntheticCitationBlocked: false
          }
        ],
        evidences: [
          {
            evidenceId: 'EVI-001',
            text: 'کوردستان لە باکووری ڕۆژهەڵاتی ناوەڕاستە',
            contextSnippet: 'تێکستی مێژوویی',
            sourceTitle: 'مێژووی کورد',
            doiOrIsbn: '10.1000/182',
            pageNumber: '127'
          }
        ],
        graphIntegrityScore: 95,
        kurdishSummary: 'گرافی بەڵگە و ادعاکان بونیاد نرا.'
      })
    })
  }
});

const graph = await claimEvidenceGraphService.buildGraph(
  'مێژووی کوردستان',
  'کوردستان هەرێمێکی باکووری ڕۆژهەڵاتی ناوەڕاستە.',
  [{
    sourceId: 'SRC-1',
    title: 'مێژووی کورد',
    doi: '10.1000/182',
    evidenceText: 'کوردستان لە باکووری ڕۆژهەڵاتی ناوەڕاستە',
    evidenceType: 'full-text',
    evidenceProvenance: 'server-verified-fulltext',
    verificationStatus: 'verified'
  }],
  mockGeminiClient
);

assert.ok(graph.claims.length >= 1, 'Graph must contain claims');
assert.ok(graph.evidences.length >= 1, 'Graph must contain evidences');
assert.equal(graph.graphIntegrityScore, 100);
assert.equal(graph.claims[0]?.verificationStatus, 'verified');
assert.equal(graph.claims[0]?.evidenceProvenance, 'server-verified-fulltext');

const blockedGraph = await claimEvidenceGraphService.buildGraph(
  'مێژووی کوردستان',
  'ئەم بانگەشەیە پشتیوانییەکی citation ـی کۆتایی پێویستە.',
  [{
    sourceId: 'SRC-2',
    title: 'مێژووی کورد',
    doi: '10.1000/182',
    evidenceText: 'ئەم بانگەشەیە پشتیوانییەکی citation ـی کۆتایی پێویستە.',
    evidenceType: 'abstract',
    evidenceProvenance: 'unknown',
    verificationStatus: 'verified'
  }],
  mockGeminiClient
);

assert.ok(
  blockedGraph.syntheticCitationsBlockedCount >= 1,
  'Abstract evidence MUST remain blocked from final citation verification'
);

console.log('✅ P2 Claim-Evidence Graph Contract Test PASSED SUCCESSFULLY!');
