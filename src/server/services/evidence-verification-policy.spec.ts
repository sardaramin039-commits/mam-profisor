import { describe, expect, it } from 'vitest';
import {
  isServerVerifiedFullText,
  markServerVerifiedFullText
} from './evidence-verification-policy';

describe('server-verified full-text provenance', () => {
  it('does not trust serializable client flags', () => {
    const clientSupplied = {
      evidenceType: 'full-text',
      evidenceProvenance: 'server-verified-fulltext',
      verificationStatus: 'verified',
      evidenceStatus: 'verified'
    };

    expect(isServerVerifiedFullText(clientSupplied)).toBe(false);
  });

  it('marks a server-acquired full-text object with a non-serializable trust marker', () => {
    const source = markServerVerifiedFullText({ title: 'Verified by server' });

    expect(isServerVerifiedFullText(source)).toBe(true);
    expect(source.evidenceType).toBe('full-text');
    expect(source.evidenceProvenance).toBe('server-verified-fulltext');

    const jsonRoundTrip = JSON.parse(JSON.stringify(source)) as unknown;
    expect(isServerVerifiedFullText(jsonRoundTrip)).toBe(false);
  });
});
