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
  it('uses explicit sourceId when titles are identical', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claimId: 'CLAIM-ID',
              text: 'Second-source claim',
              sourceId: 'SRC-TWO',
              evidenceId: 'EVI-TWO',
              confidence: 91,
              quote: 'evidence from source two',
              verificationStatus: 'verified',
              citationId: 'CIT-TWO'
            }],
            evidences: [{
              evidenceId: 'EVI-TWO',
              text: 'evidence from source two',
              sourceId: 'SRC-TWO',
              sourceTitle: 'Same Title'
            }]
          })
        })
      }
    } as any;

    const result = await service.buildGraph(
      'topic',
      'draft',
      [
        {
          id: 'SRC-ONE',
          title: 'Same Title',
          verificationStatus: 'verified',
          identityStatus: 'verified',
          evidenceStatus: 'verified',
          evidenceType: 'full-text',
          evidenceProvenance: 'server-verified-fulltext',
          evidenceText: 'evidence from source one',
          trustLevel: 'A'
        },
        {
          id: 'SRC-TWO',
          title: 'Same Title',
          verificationStatus: 'verified',
          identityStatus: 'verified',
          evidenceStatus: 'verified',
          evidenceType: 'full-text',
          evidenceProvenance: 'server-verified-fulltext',
          evidenceText: 'evidence from source two',
          trustLevel: 'A'
        }
      ],
      () => ai
    );

    expect(result.claims[0]?.sourceId).toBe('SRC-TWO');
    expect(result.claims[0]?.verificationStatus).toBe('verified');
  });

  it('fails closed when title-only evidence mapping is ambiguous', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claimId: 'CLAIM-AMBIG',
              text: 'Ambiguous claim',
              sourceId: '',
              evidenceId: 'EVI-AMBIG',
              confidence: 99,
              quote: 'shared evidence',
              verificationStatus: 'verified',
              citationId: 'CIT-AMBIG'
            }],
            evidences: [{
              evidenceId: 'EVI-AMBIG',
              text: 'shared evidence',
              sourceTitle: 'Same Title'
            }]
          })
        })
      }
    } as any;

    const result = await service.buildGraph(
      'topic',
      'draft',
      [
        {
          id: 'SRC-ONE',
          title: 'Same Title',
          verificationStatus: 'verified',
          identityStatus: 'verified',
          evidenceStatus: 'verified',
          evidenceType: 'full-text',
          evidenceProvenance: 'server-verified-fulltext',
          evidenceText: 'shared evidence',
          trustLevel: 'A'
        },
        {
          id: 'SRC-TWO',
          title: 'Same Title',
          verificationStatus: 'verified',
          identityStatus: 'verified',
          evidenceStatus: 'verified',
          evidenceType: 'full-text',
          evidenceProvenance: 'server-verified-fulltext',
          evidenceText: 'shared evidence',
          trustLevel: 'A'
        }
      ],
      () => ai
    );

    expect(result.claims[0]?.verificationStatus).toBe('unverified');
    expect(result.claims[0]?.sourceId).toBe('');
    expect(result.claims[0]?.syntheticCitationBlocked).toBe(true);
  });

  it('rejects fabricated evidence-node text and downgrades fabricated context snippets', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [
              {
                claimId: 'CLAIM-FABRICATED-EVIDENCE',
                text: 'Unsupported claim',
                sourceId: 'SRC-TRUSTED',
                evidenceId: 'EVI-FABRICATED',
                confidence: 99,
                quote: 'invented evidence that never appears in the source',
                verificationStatus: 'verified',
                citationId: 'CIT-FABRICATED'
              },
              {
                claimId: 'CLAIM-TRUSTED-EVIDENCE',
                text: 'A supported claim',
                sourceId: 'SRC-TRUSTED',
                evidenceId: 'EVI-TRUSTED',
                confidence: 95,
                quote: 'verified source evidence',
                verificationStatus: 'verified',
                citationId: 'CIT-TRUSTED'
              }
            ],
            evidences: [
              {
                evidenceId: 'EVI-FABRICATED',
                text: 'invented evidence that never appears in the source',
                sourceId: 'SRC-TRUSTED',
                sourceTitle: 'Strict Study'
              },
              {
                evidenceId: 'EVI-TRUSTED',
                text: 'verified source evidence',
                contextSnippet: 'fabricated surrounding context',
                sourceId: 'SRC-TRUSTED',
                sourceTitle: 'Strict Study',
                pageNumber: '999'
              }
            ]
          })
        })
      }
    } as any;
    const source = {
      id: 'SRC-TRUSTED',
      title: 'Strict Study',
      verificationStatus: 'verified',
      identityStatus: 'verified',
      evidenceStatus: 'verified',
      evidenceType: 'full-text',
      evidenceProvenance: 'server-verified-fulltext',
      evidenceText: 'The study provides verified source evidence for this test.',
      trustLevel: 'A'
    };

    const result = await service.buildGraph('topic', 'draft', [source], () => ai);

    expect(result.evidences).toHaveLength(1);
    expect(result.evidences[0]).toMatchObject({
      evidenceId: 'EVI-TRUSTED',
      text: 'verified source evidence',
      contextSnippet: 'verified source evidence'
    });
    expect(result.evidences[0]?.pageNumber).toBeUndefined();
    expect(result.claims.find(claim => claim.claimId === 'CLAIM-FABRICATED-EVIDENCE')).toMatchObject({
      verificationStatus: 'unverified',
      citationId: '',
      syntheticCitationBlocked: true
    });
    expect(result.claims.find(claim => claim.claimId === 'CLAIM-TRUSTED-EVIDENCE')?.verificationStatus).toBe('verified');
  });

  it('requires the claim quote to be present in its linked evidence, not merely elsewhere in the source', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claimId: 'CLAIM-WRONG-CHUNK',
              text: 'Claim from another paragraph',
              sourceId: 'SRC-CHUNK',
              evidenceId: 'EVI-CHUNK',
              quote: 'different paragraph elsewhere in the full text',
              verificationStatus: 'verified',
              citationId: 'CIT-WRONG-CHUNK'
            }],
            evidences: [{
              evidenceId: 'EVI-CHUNK',
              text: 'the linked verified excerpt only',
              sourceId: 'SRC-CHUNK',
              sourceTitle: 'Chunk Study'
            }]
          })
        })
      }
    } as any;
    const source = {
      id: 'SRC-CHUNK',
      title: 'Chunk Study',
      verificationStatus: 'verified',
      identityStatus: 'verified',
      evidenceStatus: 'verified',
      evidenceType: 'full-text',
      evidenceProvenance: 'server-verified-fulltext',
      evidenceText: 'the linked verified excerpt only; different paragraph elsewhere in the full text',
      trustLevel: 'A'
    };

    const result = await service.buildGraph('topic', 'draft', [source], () => ai);

    expect(result.claims[0]).toMatchObject({
      verificationStatus: 'unverified',
      syntheticCitationBlocked: true,
      citationId: ''
    });
  });

  it('does not verify a claim whose supplied source ID conflicts with the linked evidence source', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claimId: 'CLAIM-SOURCE-MISMATCH',
              text: 'Misattributed claim',
              sourceId: 'SRC-ONE',
              evidenceId: 'EVI-TWO',
              quote: 'evidence from source two',
              verificationStatus: 'verified',
              citationId: 'CIT-MISMATCH'
            }],
            evidences: [{
              evidenceId: 'EVI-TWO',
              text: 'evidence from source two',
              sourceId: 'SRC-TWO',
              sourceTitle: 'Second Study'
            }]
          })
        })
      }
    } as any;
    const sources = [
      {
        id: 'SRC-ONE',
        title: 'First Study',
        verificationStatus: 'verified',
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceText: 'evidence from source one',
        trustLevel: 'A'
      },
      {
        id: 'SRC-TWO',
        title: 'Second Study',
        verificationStatus: 'verified',
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceText: 'evidence from source two',
        trustLevel: 'A'
      }
    ];

    const result = await service.buildGraph('topic', 'draft', sources, () => ai);

    expect(result.claims[0]).toMatchObject({
      sourceId: 'SRC-TWO',
      verificationStatus: 'unverified',
      syntheticCitationBlocked: true,
      citationId: ''
    });
  });

  it('invalidates duplicated evidence IDs instead of allowing the later source to overwrite the first', async () => {
    const service = new ClaimEvidenceGraphService();
    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claimId: 'CLAIM-DUP-ID',
              text: 'Claim using ambiguous ID',
              sourceId: 'SRC-TWO',
              evidenceId: 'EVI-DUP',
              quote: 'evidence from source two',
              verificationStatus: 'verified',
              citationId: 'CIT-DUP'
            }],
            evidences: [
              { evidenceId: 'EVI-DUP', text: 'evidence from source one', sourceId: 'SRC-ONE', sourceTitle: 'First Study' },
              { evidenceId: 'EVI-DUP', text: 'evidence from source two', sourceId: 'SRC-TWO', sourceTitle: 'Second Study' }
            ]
          })
        })
      }
    } as any;
    const sources = [
      {
        id: 'SRC-ONE',
        title: 'First Study',
        verificationStatus: 'verified',
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceText: 'evidence from source one',
        trustLevel: 'A'
      },
      {
        id: 'SRC-TWO',
        title: 'Second Study',
        verificationStatus: 'verified',
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceText: 'evidence from source two',
        trustLevel: 'A'
      }
    ];

    const result = await service.buildGraph('topic', 'draft', sources, () => ai);

    expect(result.evidences.some(evidence => evidence.evidenceId === 'EVI-DUP')).toBe(false);
    expect(result.claims[0]).toMatchObject({
      verificationStatus: 'unverified',
      citationId: '',
      syntheticCitationBlocked: true
    });
  });
});
