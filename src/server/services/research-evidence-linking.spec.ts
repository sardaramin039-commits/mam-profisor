import { describe, expect, it } from 'vitest';
import { linkClaimsToEvidence } from './research-evidence-linking';
import type { SourceVerificationReport } from './source-verification.service';

function report(citationEligible: boolean): SourceVerificationReport {
  return {
    sourceId: 'SRC-1',
    sourceTitle: 'Peer Tutoring Study',
    author: 'Researcher',
    year: '2024',
    publisher: 'Test Press',
    integrityScore: 100,
    trustLevel: 'C',
    existenceVerified: true,
    identityStatus: 'verified',
    evidenceStatus: citationEligible ? 'verified' : 'unverified',
    citationEligible,
    evidenceText: 'Peer tutoring improves academic achievement among students.',
    evidenceType: citationEligible ? 'full-text' : 'snippet',
    evidenceProvenance: citationEligible ? 'server-verified-fulltext' : 'user-supplied-content',
    metadataAccuracy: 100,
    peerReviewed: false,
    rejectedAsFabricated: false,
    kurdishVerificationDetails: 'test'
  };
}

describe('claim-to-evidence citation eligibility', () => {
  const claim = 'Peer tutoring improves academic achievement among students.';

  it('does not trust source flags without a citation-eligible server report', async () => {
    const links = await linkClaimsToEvidence(
      [claim],
      [{
        id: 'SRC-1',
        title: 'Peer Tutoring Study',
        evidenceText: claim,
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext'
      }],
      [report(false)]
    );

    expect(links).toHaveLength(1);
    expect(links[0]?.claimCitationEligible).toBe(false);
  });

  it('allows a claim only when the server report verifies the source and evidence', async () => {
    const links = await linkClaimsToEvidence(
      [claim],
      [{
        id: 'SRC-1',
        title: 'Peer Tutoring Study',
        evidenceText: claim,
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext'
      }],
      [report(true)]
    );

    expect(links).toHaveLength(1);
    expect(links[0]?.claimCitationEligible).toBe(true);
    expect(links[0]?.verificationStatus).toBe('verified');
  });
});
