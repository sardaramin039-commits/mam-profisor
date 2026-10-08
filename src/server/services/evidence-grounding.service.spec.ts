import { afterEach, describe, expect, it } from 'vitest';
import { evidenceGroundingService } from './evidence-grounding.service';
import { claimEvidenceGraphService } from './claim-evidence-graph.service';

const originalBuildGraph = claimEvidenceGraphService.buildGraph;

afterEach(() => {
  claimEvidenceGraphService.buildGraph = originalBuildGraph;
});

describe('EvidenceGroundingService chunk retention', () => {
  it('keeps evidence from any eligible chunk of the same source', async () => {
    claimEvidenceGraphService.buildGraph = async () => ({
      claims: [],
      evidences: [],
      syntheticCitationsBlockedCount: 0,
      graphIntegrityScore: 100,
      kurdishSummary: 'test'
    });

    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            paragraphs: [{
              paragraphIndex: 1,
              text: 'A grounded sentence.',
              claims: [{
                claimId: 'CLM-1',
                sentenceText: 'A grounded sentence.',
                sourceId: 'SRC-1',
                evidenceId: 'EVI-1',
                verificationStatus: 'verified',
                citationEligible: true,
                evidenceQuote: 'evidence from first chunk',
                confidence: 95,
                gapDetected: false
              }]
            }],
            verifiedCitations: [{
              citationId: 'CIT-1',
              sourceId: 'SRC-1',
              inTextCitation: '(Researcher, 2025)',
              evidenceQuote: 'evidence from first chunk',
              verified: true
            }],
            evidenceGaps: [],
            kurdishSummary: 'test'
          })
        })
      }
    } as any;

    const result = await evidenceGroundingService.generateGroundedContent(
      'topic',
      'write from evidence',
      [
        {
          sourceId: 'SRC-1',
          sourceTitle: 'Study',
          chunkText: 'evidence from first chunk',
          verificationStatus: 'verified',
          evidenceType: 'full-text',
          provenance: 'server-verified-fulltext'
        },
        {
          sourceId: 'SRC-1',
          sourceTitle: 'Study',
          chunkText: 'different evidence from second chunk',
          verificationStatus: 'verified',
          evidenceType: 'full-text',
          provenance: 'server-verified-fulltext'
        }
      ],
      () => ai
    );

    expect(result.integrityMetrics.verifiedClaims).toBe(1);
    expect(result.integrityMetrics.citationEligibleClaims).toBe(1);
    expect(result.verifiedCitations).toHaveLength(1);
    expect(result.verifiedCitations[0]?.sourceId).toBe('SRC-1');
  });
});
