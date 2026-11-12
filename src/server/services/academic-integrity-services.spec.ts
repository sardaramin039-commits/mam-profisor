import { describe, expect, it } from 'vitest';
import { academicConfidenceService } from './academic-confidence.service';
import { citationIntelligenceService } from './citation-intelligence.service';
import { disciplineProfileService } from './discipline-profile.service';
import { textSimilarityService } from './text-similarity.service';

describe('academic integrity services', () => {
  it('requires human review when evidence or citation coverage is incomplete', () => {
    const result = academicConfidenceService.assess({
      verifiedClaims: 4,
      totalClaims: 10,
      citationEligibleClaims: 4,
      contradictionCount: 1,
      similarityScore: 10,
      sourceVerificationRate: 60
    });
    expect(result.humanReviewRequired).toBe(true);
    expect(result.evidenceCoverage).toBe(40);
    expect(result.citationIntegrity).toBe(40);
  });

  it('returns discipline-specific methodology and terminology', () => {
    const profile = disciplineProfileService.getProfile('دەروونناسی');
    expect(profile.id).toBe('psychology');
    expect(profile.preferredMethods).toContain('experimental');
    expect(profile.terminology).toContain('گۆڕاو');
  });

  it('builds citations only from eligible verified claims', () => {
    const result = citationIntelligenceService.build(
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
            evidenceQuote: 'دەقی پشتبەستوو بە بەڵگە',
            evidenceStatus: 'verified',
            evidenceType: 'full-text',
            evidenceProvenance: 'server-verified-fulltext',
            page: '12'
          },
          {
            claimId: 'C2',
            sourceId: 'S2',
            citationEligible: false,
            verificationStatus: 'unverified'
          }
        ]
      }],
      [{
        sourceId: 'S1',
        sourceTitle: 'Academic Study',
        author: 'Smith, John',
        year: '2024',
        publisher: 'University Press',
        citationEligible: true,
        evidenceStatus: 'verified',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceText: 'دەقی پشتبەستوو بە بەڵگە لە full text ـی سەرچاوەکەدا هەیە.'
      }],
      'APA7'
    );
    expect(result.verifiedCitationCount).toBe(1);
    expect(result.blockedCitationCount).toBe(1);
    expect(result.citations[0]?.inText).toContain('2024');
    expect(result.citations[0]?.inText).toContain('p. 12');
  });

  it('screens exact five-token overlap as a high-risk match when similarity is high', () => {
    const source = 'alpha beta gamma delta epsilon zeta eta theta iota kappa';
    const result = textSimilarityService.screen(
      source,
      [{ id: 'S1', title: 'Source', content: source }]
    );
    expect(result.matches[0]?.sourceId).toBe('S1');
    expect(result.matches[0]?.similarityScore).toBe(100);
    expect(result.matches[0]?.risk).toBe('high');
  });
});
