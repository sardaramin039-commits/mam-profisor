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
});
