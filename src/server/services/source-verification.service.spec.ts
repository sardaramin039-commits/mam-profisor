import { describe, expect, it } from 'vitest';
import { assessEvidenceVerification } from './source-verification.service';

describe('source evidence verification policy', () => {
  it('requires both claim and evidence text', () => {
    expect(assessEvidenceVerification({ evidenceText: 'هەر دەقێک' }).status).toBe('not_available');
    expect(
      assessEvidenceVerification({ claimText: 'بانگەشە', evidenceText: 'بەڵگە' }).status
    ).toBe('unverified');
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
