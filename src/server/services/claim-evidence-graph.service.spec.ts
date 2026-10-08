import { describe, expect, it } from 'vitest';
import { ClaimEvidenceGraphService } from './claim-evidence-graph.service';

describe('ClaimEvidenceGraphService strict evidence gate', () => {
  it('verifies only claims grounded in server-verified full text', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [
              {
                claimId: 'CLAIM-STRICT',
                text: 'Supported claim',
                sourceId: 'SRC-STRICT',
                evidenceId: 'EVI-STRICT',
                confidence: 94,
                quote: 'verified source evidence',
                verificationStatus: 'verified',
                citationId: 'CIT-STRICT'
              },
              {
                claimId: 'CLAIM-ABSTRACT',
                text: 'Abstract-only claim',
                sourceId: 'SRC-ABSTRACT',
                evidenceId: 'EVI-ABSTRACT',
                confidence: 99,
                quote: 'abstract evidence',
                verificationStatus: 'verified',
                citationId: 'CIT-ABSTRACT'
              }
            ],
            evidences: [
              {
                evidenceId: 'EVI-STRICT',
                text: 'verified source evidence',
                sourceTitle: 'Strict Study'
              },
              {
                evidenceId: 'EVI-ABSTRACT',
                text: 'abstract evidence',
                sourceTitle: 'Abstract Study'
              }
            ]
          })
        })
      }
    } as any;

    const result = await service.buildGraph(
      'topic',
      'draft',
      [
        {
          id: 'SRC-STRICT',
          title: 'Strict Study',
          verificationStatus: 'verified',
          identityStatus: 'verified',
          evidenceStatus: 'verified',
          evidenceType: 'full-text',
          evidenceProvenance: 'server-verified-fulltext',
          evidenceText: 'verified source evidence and more detail',
          trustLevel: 'A'
        },
        {
          id: 'SRC-ABSTRACT',
          title: 'Abstract Study',
          verificationStatus: 'verified',
          evidenceType: 'abstract',
          evidenceProvenance: 'unknown',
          evidenceText: 'abstract evidence',
          trustLevel: 'A'
        }
      ],
      () => ai
    );

    const strictClaim = result.claims.find(claim => claim.claimId === 'CLAIM-STRICT');
    const abstractClaim = result.claims.find(claim => claim.claimId === 'CLAIM-ABSTRACT');

    expect(strictClaim?.verificationStatus).toBe('verified');
    expect(strictClaim?.syntheticCitationBlocked).toBe(false);
    expect(abstractClaim?.verificationStatus).toBe('unverified');
    expect(abstractClaim?.syntheticCitationBlocked).toBe(true);
    expect(result.syntheticCitationsBlockedCount).toBe(1);
  });
});
