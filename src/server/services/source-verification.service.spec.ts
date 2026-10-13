import { describe, expect, it, vi } from 'vitest';

vi.mock('../../helpers/extended-academic-tools', () => ({
  resolveDoi: vi.fn(async () => ({
    title: 'Authoritative Full Text Study',
    authors: ['Author One'],
    publishedYear: 2025,
    publisher: 'Verified Publisher',
    doi: '10.1000/test'
  })),
  lookupIsbn: vi.fn(async () => undefined),
  lookupIssn: vi.fn(async () => undefined)
}));
import {
  assessEvidenceVerification,
  isCitationEligibleEvidence,
  SourceVerificationService
} from './source-verification.service';
import { markServerVerifiedFullText } from './evidence-verification-policy';

describe('source verification author preservation', () => {
  it('preserves multiple authors in the verification report', async () => {
    const service = new SourceVerificationService();
    const result = await service.verifySources([{
      id: 'SRC-AUTHORS',
      title: 'Author Preservation Study',
      authors: ['First Author', 'Second Author'],
      year: '2025'
    }], () => ({}) as any);

    expect(result.allReports[0]?.authors).toEqual(['First Author', 'Second Author']);
    expect(result.allReports[0]?.author).toBe('First Author, Second Author');
  });
});

describe('source evidence verification policy', () => {
  it('requires both claim and evidence text', () => {
    expect(assessEvidenceVerification({ evidenceText: 'هەر دەقێک' }).status).toBe('not_available');
    expect(
      assessEvidenceVerification({ claimText: 'بانگەشە', evidenceText: 'بەڵگە' }).status
    ).toBe('not_available');
  });

  it('accepts an exact normalized claim match', () => {
    const result = assessEvidenceVerification({
      claimText: 'ئەم وتارە پێشکەوتنێکی گرنگە.',
      evidenceText: 'ئەم وتارە پێشکەوتنێکی گرنگە.'
    });
    expect(result.status).toBe('verified');
    expect(result.method).toBe('exact-normalized-claim-match');
  });
});


describe('citation evidence eligibility policy', () => {
  it('allows citations only for server-acquired full text with matching evidence', async () => {
    const service = new SourceVerificationService();
    const trusted = markServerVerifiedFullText({
      id: 'SRC-TRUSTED',
      sourceId: 'SRC-TRUSTED',
      title: 'Authoritative Full Text Study',
      openAlexId: 'W123456789',
      claimText: 'validated claim',
      evidenceText: 'This authoritative full text contains the validated claim and supporting details.',
      evidenceType: 'full-text' as const,
      evidenceProvenance: 'server-verified-fulltext' as const
    });

    const result = await service.verifySources([trusted], () => ({}) as any);
    expect(result.verifiedSources[0]?.identityStatus).toBe('verified');
    expect(result.citationEligibleSources).toHaveLength(1);
    expect(result.citationEligibleSources[0]?.citationEligible).toBe(true);
  });

  it('preserves server trust through successful DOI metadata normalization', async () => {
    const service = new SourceVerificationService();
    const trusted = markServerVerifiedFullText({
      id: 'SRC-DOI-TRUSTED',
      title: 'Authoritative Full Text Study',
      doi: '10.1000/test',
      author: 'Author One',
      year: '2025',
      claimText: 'validated claim',
      evidenceText: 'This authoritative full text contains the validated claim and supporting details.',
      evidenceType: 'full-text' as const,
      evidenceProvenance: 'server-verified-fulltext' as const
    });

    const result = await service.verifySources([trusted], () => ({}) as any);
    expect(result.verifiedSources[0]?.identityStatus).toBe('verified');
    expect(result.citationEligibleSources).toHaveLength(1);
    expect(result.citationEligibleSources[0]?.citationEligible).toBe(true);
  });

  it('blocks abstracts even when the claim exactly matches the evidence', () => {
    expect(
      isCitationEligibleEvidence('verified', true, 'abstract', 'unknown')
    ).toBe(false);
  });

  it('requires server-verified full text for citation eligibility', () => {
    const forged = {
      evidenceType: 'full-text' as const,
      evidenceProvenance: 'server-verified-fulltext' as const
    };
    expect(
      isCitationEligibleEvidence(
        'verified',
        true,
        forged.evidenceType,
        forged.evidenceProvenance,
        forged
      )
    ).toBe(false);

    const trusted = markServerVerifiedFullText({ evidenceText: 'authoritative full-text evidence' });
    expect(
      isCitationEligibleEvidence(
        'verified',
        true,
        trusted.evidenceType,
        trusted.evidenceProvenance,
        trusted
      )
    ).toBe(true);
    expect(
      isCitationEligibleEvidence(
        'verified',
        true,
        'full-text',
        'user-supplied-content',
        markServerVerifiedFullText({ evidenceText: 'authoritative full-text evidence' })
      )
    ).toBe(false);
  });
});
