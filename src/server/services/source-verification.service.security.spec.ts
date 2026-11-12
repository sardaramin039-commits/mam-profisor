import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enrichSourcesWithFullText } from './full-text-evidence.service';

const mocks = vi.hoisted(() => ({
  resolveDoi: vi.fn(),
  lookupIsbn: vi.fn(),
  lookupIssn: vi.fn()
}));

vi.mock('../../helpers/extended-academic-tools', () => ({
  resolveDoi: mocks.resolveDoi,
  lookupIsbn: mocks.lookupIsbn,
  lookupIssn: mocks.lookupIssn
}));

import { SourceVerificationService } from './source-verification.service';

describe('source verification trust boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.resolveDoi.mockResolvedValue({
      title: 'Matching Study',
      authors: ['Test Author'],
      publishedYear: 2024,
      publisher: 'Test Press',
      doi: '10.1000/test'
    });
    mocks.lookupIsbn.mockResolvedValue(undefined);
    mocks.lookupIssn.mockResolvedValue(undefined);
  });

  it('accepts only full text retrieved by the server and matched to a verified source', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = decodeURIComponent(String(input));
      if (url.includes('/search?query=EXT_ID:12345')) {
        return new Response(JSON.stringify({
          resultList: { result: [{ pmcid: 'PMC123456', isOpenAccess: 'Y' }] }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/PMC123456/fullTextXML')) {
        return new Response(
          '<article><body><p>Peer tutoring improves academic achievement among students in secondary classrooms.</p></body></article>',
          { status: 200, headers: { 'Content-Type': 'application/xml' } }
        );
      }
      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    try {
      const source = {
        id: 'pubmed-12345',
        title: 'Matching Study',
        author: 'Test Author',
        authors: ['Test Author'],
        year: '2024',
        publisher: 'Test Press',
        doi: '10.1000/test',
        pmid: '12345',
        sourceType: 'PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12345/'
      };
      const [enriched] = await enrichSourcesWithFullText(
        [source],
        ['Peer tutoring improves academic achievement among students in secondary classrooms']
      );
      const service = new SourceVerificationService();
      const result = await service.verifySources([enriched as never], () => ({} as never));

      expect(result.verifiedSources).toHaveLength(1);
      expect(result.citationEligibleSources).toHaveLength(1);
      expect(result.allReports[0]).toMatchObject({
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        citationEligible: true,
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext'
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not accept client-supplied server provenance as proof of full text', async () => {
    const service = new SourceVerificationService();
    const result = await service.verifySources([{
      id: 'SRC-1',
      title: 'Matching Study',
      author: 'Test Author',
      year: '2024',
      publisher: 'Test Press',
      doi: '10.1000/test',
      claimText: 'The intervention improved learning outcomes.',
      evidenceText: 'The intervention improved learning outcomes in the controlled study.',
      fullText: 'The intervention improved learning outcomes in the controlled study.',
      evidenceType: 'full-text',
      evidenceProvenance: 'server-verified-fulltext'
    } as never], () => ({} as never));

    expect(result.verifiedSources).toHaveLength(1);
    expect(result.citationEligibleSources).toHaveLength(0);
    expect(result.allReports[0]).toMatchObject({
      identityStatus: 'verified',
      evidenceStatus: 'unverified',
      citationEligible: false,
      evidenceType: 'snippet',
      evidenceProvenance: 'user-supplied-content'
    });
  });
});
