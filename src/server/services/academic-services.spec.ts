import { describe, expect, it } from 'vitest';
import { AcademicConfidenceService } from './academic-confidence.service';
import { CitationIntelligenceService } from './citation-intelligence.service';
import { DisciplineProfileService } from './discipline-profile.service';
import { TextSimilarityService } from './text-similarity.service';

describe('academic integrity services', () => {
  it('assigns lower confidence when evidence coverage is incomplete', () => {
    const result = new AcademicConfidenceService().assess({
      verifiedClaims: 4,
      totalClaims: 10,
      citationEligibleClaims: 4,
      contradictionCount: 1,
      similarityScore: 0,
      sourceVerificationRate: 50
    });

    expect(result.evidenceCoverage).toBe(40);
    expect(result.evidenceStrength).toBe('weak');
    expect(result.humanReviewRequired).toBe(true);
  });

  it('creates citations only from eligible verified claims', () => {
    const result = new CitationIntelligenceService().build(
      [{
        paragraphIndex: 1,
        text: 'دەق',
        claims: [
          {
            claimId: 'C1',
            sourceId: 'S1',
            citationId: 'CIT-1',
            citationEligible: true,
            verificationStatus: 'verified',
            page: '12'
          },
          {
            claimId: 'C2',
            sourceId: 'S2',
            citationId: 'CIT-2',
            citationEligible: false,
            verificationStatus: 'unverified'
          }
        ]
      }],
      [{
        sourceId: 'S1',
        sourceTitle: 'Academic Source',
        author: 'A. Author',
        year: '2025',
        publisher: 'Publisher',
        doiOrIsbn: '10.1234/example'
      }],
      'APA7'
    );

    expect(result.verifiedCitationCount).toBe(1);
    expect(result.blockedCitationCount).toBe(1);
    expect(result.citations[0].inText).toContain('2025');
    expect(result.citations[0].verified).toBe(true);
  });

  it('maps Kurdish discipline aliases to stable profiles', () => {
    const service = new DisciplineProfileService();

    expect(service.getProfile('دەروونناسی').id).toBe('psychology');
    expect(service.getProfile('education').id).toBe('education');
    expect(service.getProfile('بوارێکی نەناسراو').id).toBe('general');
  });

  it('screens repeated five-token phrases against the supplied corpus', () => {
    const result = new TextSimilarityService().screen(
      'ئەم دەقە لەسەر بنەمای بەڵگەی زانستی دروست کراوە و داتاکە پشکنراوە',
      [{
        sourceId: 'S1',
        title: 'Source',
        content: 'ئەم دەقە لەسەر بنەمای بەڵگەی زانستی دروست کراوە و داتاکە پشکنراوە'
      }]
    );

    expect(result.overallSimilarityScore).toBeGreaterThanOrEqual(80);
    expect(result.matches[0].risk).toBe('high');
  });
});
