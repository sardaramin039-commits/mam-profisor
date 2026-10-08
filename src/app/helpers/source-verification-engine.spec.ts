import { describe, expect, it } from 'vitest';
import { SourceVerificationEngine } from './source-verification-engine';

describe('SourceVerificationEngine local verification', () => {
  const candidate = {
    title: 'Study',
    author: 'Researcher',
    publicationYear: 2025,
    publisherOrJournal: 'Journal',
    identifiers: { doi: '10.1234/example' },
    retrievedTextSnippet: 'The claim is supported by this exact evidence.',
    externallyVerified: true
  };

  it('does not upgrade a local snippet to VERIFIED without server-verified full text', () => {
    const result = SourceVerificationEngine.processWorkflow(
      'The claim is supported by this exact evidence.',
      candidate
    );

    expect(result.verificationStatus).not.toBe('VERIFIED');
    expect(result.identityStatus).toBe('unverified');
    expect(result.citationEligible).toBe(false);
  });

  it('allows VERIFIED only when server-verified full text is explicit', () => {
    const result = SourceVerificationEngine.processWorkflow(
      'The claim is supported by this exact evidence.',
      {
        ...candidate,
        serverVerifiedFullText: true
      }
    );

    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.identityStatus).toBe('verified');
    expect(result.citationEligible).toBe(true);
  });

  it('preserves verified duplicate evidence and metadata on the canonical record', () => {
    const unverified = SourceVerificationEngine.processWorkflow(
      'A verified claim from the full text.',
      {
        ...candidate,
        title: 'Local Copy',
        retrievedTextSnippet: 'A short local excerpt.'
      }
    );

    const verified = SourceVerificationEngine.processWorkflow(
      'A verified claim from the full text.',
      {
        ...candidate,
        title: 'Authoritative Copy',
        retrievedTextSnippet: 'A verified claim from the full text.',
        pageNumber: 42,
        sourceUrl: 'https://example.org/full-text',
        serverVerifiedFullText: true
      }
    );

    const [canonical] = SourceVerificationEngine.deduplicateSources([unverified, verified]);

    expect(canonical.citationEligible).toBe(true);
    expect(canonical.verificationStatus).toBe('VERIFIED');
    expect(canonical.title).toBe('Authoritative Copy');
    expect(canonical.exactEvidenceSnippet).toBe('A verified claim from the full text.');
    expect(canonical.pageNumber).toBe(42);
    expect(canonical.sourceUrl).toBe('https://example.org/full-text');
    expect(canonical.workflowStepsCompleted.verified).toBe(true);
  });

  it('does not report a tampered VERIFIED status as an audited verified source', () => {
    const local = SourceVerificationEngine.processWorkflow(
      'The claim is supported by this exact evidence.',
      candidate
    );
    const tampered = {
      ...local,
      verificationStatus: 'VERIFIED' as const,
      citationEligible: true
    };

    const report = SourceVerificationEngine.generateAuditReport([tampered]);

    expect(report.verifiedCount).toBe(0);
    expect(report.unverifiedCount).toBe(1);
    expect(report.verifiedSources).toEqual([]);
  });
});
