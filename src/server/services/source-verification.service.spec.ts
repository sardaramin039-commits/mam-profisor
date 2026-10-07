import { describe, expect, it } from 'vitest';
import { assessEvidenceVerification } from './source-verification.service';

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

describe('source verification lookup policy', () => {
  it('does not perform redundant Crossref metadata lookup for persistent identifiers', async () => {
    const originalFetch = globalThis.fetch;
    let crossrefMetadataCalls = 0;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (String(input).includes('query.bibliographic=')) crossrefMetadataCalls++;
      return new Response(JSON.stringify({ message: { items: [] } }), { status: 200 });
    }) as typeof fetch;

    try {
      const { SourceVerificationService } = await import('./source-verification.service');
      const service = new SourceVerificationService();
      await service.verifySources([{
        id: 'OPENALEX-1',
        title: 'Already Identified Study',
        openAlexId: 'https://openalex.org/W1'
      }], (() => ({}) as any));

      expect(crossrefMetadataCalls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
