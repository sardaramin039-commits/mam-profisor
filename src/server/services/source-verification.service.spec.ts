import { describe, expect, it } from 'vitest';
import {
  assessEvidenceVerification,
  isCitationEligibleEvidence
} from './source-verification.service';

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
  it('blocks abstracts even when the claim exactly matches the evidence', () => {
    expect(
      isCitationEligibleEvidence('verified', true, 'abstract', 'unknown')
    ).toBe(false);
  });

  it('requires server-verified full text for citation eligibility', () => {
    expect(
      isCitationEligibleEvidence(
        'verified',
        true,
        'full-text',
        'server-verified-fulltext'
      )
    ).toBe(true);
    expect(
      isCitationEligibleEvidence(
        'verified',
        true,
        'full-text',
        'user-supplied-content'
      )
    ).toBe(false);
  });
});
