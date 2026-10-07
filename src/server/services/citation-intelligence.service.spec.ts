import { describe, expect, it } from 'vitest';
import { CitationIntelligenceService } from './citation-intelligence.service';

describe('citation intelligence strict evidence gate', () => {
  const service = new CitationIntelligenceService();

  const source = {
    id: 'SRC-1',
    title: 'Grounded Study',
    author: 'Bandura',
    year: '1977',
    publisher: 'Publisher',
    citationEligible: true,
    evidenceStatus: 'verified',
    evidenceType: 'full-text',
    evidenceProvenance: 'server-verified-fulltext',
    evidenceText: 'Observed evidence supports the stated claim in the verified article full text.'
  };

  it('blocks a citation when the source has only verified identity metadata', () => {
    const result = service.build(
      [{
        claims: [{
          citationId: 'CIT-1',
          sourceId: 'SRC-1',
          citationEligible: true,
          verificationStatus: 'verified',
          evidenceQuote: 'Observed evidence supports the stated claim'
        }]
      }],
      [{ ...source, evidenceStatus: 'verified', evidenceType: 'abstract', evidenceProvenance: 'server-verified-fulltext' }]
    );

    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('blocks a citation when full text came from user supplied content', () => {
    const result = service.build(
      [{
        claims: [{
          citationId: 'CIT-1',
          sourceId: 'SRC-1',
          citationEligible: true,
          verificationStatus: 'verified',
          evidenceQuote: 'Observed evidence supports the stated claim'
        }]
      }],
      [{ ...source, evidenceProvenance: 'user-supplied-content' }]
    );

    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('does not allow a claim to elevate missing source evidence metadata', () => {
    const result = service.build(
      [{
        claims: [{
          citationId: 'CIT-SPOOF',
          sourceId: 'SRC-1',
          citationEligible: true,
          verificationStatus: 'verified',
          evidenceQuote: 'Observed evidence supports the stated claim',
          evidenceStatus: 'verified',
          evidenceType: 'full-text',
          evidenceProvenance: 'server-verified-fulltext'
        }]
      }],
      [{
        ...source,
        evidenceStatus: undefined,
        evidenceType: undefined,
        evidenceProvenance: undefined
      }]
    );

    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });

  it('allows a citation only when the verified quote is bound to server-verified full text', () => {
    const result = service.build(
      [{
        claims: [{
          citationId: 'CIT-1',
          sourceId: 'SRC-1',
          citationEligible: true,
          verificationStatus: 'verified',
          evidenceQuote: 'Observed evidence supports the stated claim'
        }]
      }],
      [source]
    );

    expect(result.citations).toHaveLength(1);
    expect(result.verifiedCitationCount).toBe(1);
    expect(result.blockedCitationCount).toBe(0);
  });

  it('blocks a citation when the supplied quote is not actually present in the evidence', () => {
    const result = service.build(
      [{
        claims: [{
          citationId: 'CIT-1',
          sourceId: 'SRC-1',
          citationEligible: true,
          verificationStatus: 'verified',
          evidenceQuote: 'This quote is not present'
        }]
      }],
      [source]
    );

    expect(result.citations).toHaveLength(0);
    expect(result.blockedCitationCount).toBe(1);
  });
});
