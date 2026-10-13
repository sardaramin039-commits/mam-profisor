import { describe, expect, it } from 'vitest';
import { downgradeUntrustedEvidence } from './untrusted-evidence';

describe('untrusted evidence boundary', () => {
  it('overrides client-supplied verification and full-text provenance flags', () => {
    const result = downgradeUntrustedEvidence({
      id: 'source-1',
      title: 'Client supplied record',
      verificationStatus: 'verified',
      identityStatus: 'verified',
      evidenceStatus: 'verified',
      evidenceType: 'full-text',
      evidenceProvenance: 'server-verified-fulltext',
      provenance: 'server-verified-fulltext',
      citationEligible: true,
      existenceVerified: true,
      content: 'Client can control this content.'
    });

    expect(result.verificationStatus).toBe('unverified');
    expect(result.identityStatus).toBe('unverified');
    expect(result.evidenceStatus).toBe('unverified');
    expect(result.evidenceType).toBe('snippet');
    expect(result.evidenceProvenance).toBe('user-supplied-content');
    expect(result.provenance).toBe('user-supplied-content');
    expect(result.citationEligible).toBe(false);
    expect(result.existenceVerified).toBe(false);
    expect(result.content).toBe('Client can control this content.');
  });

  it('does not allow non-object array items through the evidence boundary', () => {
    const { downgradeUntrustedEvidenceList } = require('./untrusted-evidence') as typeof import('./untrusted-evidence');
    const result = downgradeUntrustedEvidenceList([null, 'bad', [], { title: 'ok' }]);

    expect(result).toHaveLength(1);
    expect(result[0].verificationStatus).toBe('unverified');
  });
});
