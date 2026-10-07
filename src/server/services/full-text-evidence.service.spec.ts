import { afterEach, describe, expect, it } from 'vitest';
import { enrichSourcesWithFullText } from './full-text-evidence.service';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('full-text evidence enrichment', () => {
  it('retrieves only open-access Europe PMC full text and preserves source metadata', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = decodeURIComponent(String(input));

      if (url.includes('/search?query=EXT_ID:12345')) {
        return new Response(JSON.stringify({
          resultList: {
            result: [{
              pmcid: 'PMC123456',
              isOpenAccess: 'Y'
            }]
          }
        }), { status: 200 });
      }

      if (url.includes('/PMC123456/fullTextXML')) {
        return new Response(
          '<article><body><p>Peer tutoring improves academic achievement among students in secondary classrooms.</p></body></article>',
          { status: 200 }
        );
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'pubmed-12345',
      title: 'Peer Tutoring Study',
      authors: ['Researcher'],
      year: '2025',
      sourceType: 'PubMed',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
      pmid: '12345',
      doi: '10.1000/example',
      evidenceText: 'abstract evidence',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['peer tutoring improves academic achievement among students']
    );

    expect(enriched.id).toBe(source.id);
    expect(enriched.doi).toBe(source.doi);
    expect(enriched.evidenceType).toBe('full-text');
    expect(enriched.evidenceProvenance).toBe('server-verified-fulltext');
    expect(enriched.claimText).toBe(
      'peer tutoring improves academic achievement among students'
    );
    expect(enriched.evidenceText).toContain('Peer tutoring improves academic achievement');
    expect(enriched.evidenceUrl).toContain('/PMC123456/fullTextXML');
  });

  it('leaves a source unchanged when Europe PMC does not mark it as open access', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = decodeURIComponent(String(input));

      if (url.includes('/search?query=EXT_ID:98765')) {
        return new Response(JSON.stringify({
          resultList: {
            result: [{
              pmcid: 'PMC987654',
              isOpenAccess: 'N'
            }]
          }
        }), { status: 200 });
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'pubmed-98765',
      title: 'Restricted Study',
      pmid: '98765',
      evidenceText: 'abstract evidence',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['restricted claim']
    );

    expect(enriched).toEqual(source);
  });
});
