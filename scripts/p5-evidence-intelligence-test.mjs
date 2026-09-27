import assert from 'node:assert/strict';
import { EvidenceGroundingService } from '../src/server/services/evidence-grounding.service.ts';

console.log('🧪 Starting P5 Evidence Intelligence & Citation Grounding Contract Test...\n');

const groundingService = new EvidenceGroundingService();

// 1. Test Citation Eligibility Gate
console.log('Testing Citation Eligibility Gate...');
const gate1 = groundingService.evaluateCitationEligibility('verified', true);
assert.equal(gate1.eligible, true, 'Verified source with evidence MUST be eligible for citation');
assert.equal(gate1.status, 'verified');

const gate2 = groundingService.evaluateCitationEligibility('unverified', true);
assert.equal(gate2.eligible, false, 'Unverified source MUST be blocked from citations');

const gate3 = groundingService.evaluateCitationEligibility('verified', false);
assert.equal(gate3.eligible, false, 'Source without evidence chunk MUST be blocked from citations');

console.log('✅ Citation Eligibility Gate assertions passed.');

// 2. Mock Gemini Client for Evidence-Grounded Generation
const mockGeminiClient = () => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify({
        paragraphs: [
          {
            paragraphIndex: 1,
            text: 'تەوەرەی زانستیی دەقەکە لەسەر سۆرانی بە شێوەیەکی تێرپڕ ڕوون کراوەتەوە (سەعید، ٢٠٢٣).',
            claims: [
              {
                claimId: 'CLM-001',
                sentenceText: 'دەقی زانستیی سۆرانی بە شێوەیەکی تێرپڕ ڕوون کراوەتەوە',
                sourceId: 'SRC-001',
                evidenceId: 'EVI-001',
                verificationStatus: 'verified',
                citationEligible: true,
                citationText: '(سەعید، ٢٠٢٣)',
                confidence: 96,
                gapDetected: false
              },
              {
                claimId: 'CLM-002',
                sentenceText: 'ئیدعایەکی بێ سەرچاوە لە دەقدا هەیە',
                sourceId: 'SRC-FAKE',
                evidenceId: 'EVI-FAKE',
                verificationStatus: 'unverified',
                citationEligible: false,
                confidence: 40,
                gapDetected: true
              }
            ]
          }
        ],
        verifiedCitations: [
          {
            citationId: 'CIT-001',
            sourceId: 'SRC-001',
            inTextCitation: '(سەعید، ٢٠٢٣)',
            evidenceQuote: 'دەقی بەڵگەی سەلمێنراو ناو سەرچاوەکە',
            verified: true
          }
        ],
        evidenceGaps: [
          {
            claimId: 'CLM-002',
            claimText: 'ئیدعایەکی بێ سەرچاوە لە دەقدا هەیە',
            warning: 'Evidence Required'
          }
        ],
        kurdishSummary: 'سەلماندنی بەڵگەیی بە سەرکەوتوویی تێپەڕی.'
      })
    })
  }
});

console.log('\nTesting Grounded Content Generation Service...');
const mockEvidenceChunks = [
  {
    sourceId: 'SRC-001',
    sourceTitle: 'ڕێزمانی سۆرانی',
    chunkText: 'دەقی بەڵگەی سەلمێنراو ناو سەرچاوەکە',
    verificationStatus: 'verified',
    pageNumber: '45',
    author: 'سەعید',
    year: '2023'
  },
  {
    sourceId: 'SRC-002',
    sourceTitle: 'سەرچاوەی نەپشکنراو',
    chunkText: 'تێکستی نەپشکنراو',
    verificationStatus: 'unverified'
  }
];

const result = await groundingService.generateGroundedContent(
  'زمانی کوردی',
  'شیکاری زمانەوانی ببنوسە',
  mockEvidenceChunks,
  mockGeminiClient
);

assert.ok(result.paragraphs.length > 0, 'Must produce grounded paragraphs');
assert.ok(result.integrityMetrics, 'Integrity metrics must be present');
assert.equal(result.integrityMetrics.blockedSyntheticCitations, 1, 'Unverified claim citation MUST be blocked');
assert.equal(result.evidenceGaps.length, 1, 'Evidence gap for unverified claim MUST be flagged');

console.log('✅ Grounded Content Generation assertions passed.');
console.log('\n🎉 ALL P5 Evidence Intelligence & Citation Grounding Tests PASSED SUCCESSFULLY!');
