import assert from 'node:assert/strict';
import { sourceVerificationService } from '../src/server/services/source-verification.service.ts';

console.log('🧪 Starting P1 Academic Integrity Smoke Test...\n');

const mockGeminiClient = () => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify({
        reports: [
          {
            sourceTitle: 'کتێبی سەلمێنراو',
            author: 'د. ڕێبوار',
            publisher: 'چاپخانەی هارفەرد',
            integrityScore: 95,
            trustLevel: 'A+',
            existenceVerified: true,
            metadataAccuracy: 95,
            peerReviewed: true,
            rejectedAsFabricated: false,
            kurdishVerificationDetails: 'سەرچاوەی بەرز'
          },
          {
            sourceTitle: 'سەرچاوەی بێبەڵگە',
            author: 'نادیار',
            publisher: 'نادیار',
            integrityScore: 20,
            trustLevel: 'F',
            existenceVerified: false,
            metadataAccuracy: 10,
            peerReviewed: false,
            rejectedAsFabricated: true,
            kurdishVerificationDetails: 'سەرچاوەی ڕەتکراوە'
          }
        ]
      })
    })
  }
});

const result = await sourceVerificationService.verifySources(
  [{ title: 'کتێبی سەلمێنراو', author: 'د. ڕێبوار', year: '2024' }],
  mockGeminiClient
);

assert.equal(result.verifiedSources.length, 2, 'Verified sources count must be 2');
assert.equal(result.verifiedSources[0].trustLevel, 'A+');
assert.equal(result.rejectedSourcesCount, 1, 'One source with Trust Level F must be flagged as rejected');

console.log('✅ P1 Academic Integrity Smoke Test PASSED SUCCESSFULLY!');
