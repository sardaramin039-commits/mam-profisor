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


  it('enriches an OpenAlex open-access landing page when full text is available', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/works/W123456789')) {
        return new Response(JSON.stringify({
          best_oa_location: {
            is_oa: true,
            landing_page_url: 'https://publisher.example.org/articles/oa-study'
          }
        }), { status: 200 });
      }

      if (url.includes('publisher.example.org/articles/oa-study')) {
        return new Response(
          '<html><head><title>Open access study</title></head><body><main>School belonging is associated with stronger student engagement in secondary education.</main></body></html>',
          {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' }
          }
        );
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'openalex-W123456789',
      title: 'Open access study',
      sourceType: 'OpenAlex',
      openAlexId: 'https://openalex.org/W123456789',
      url: 'https://openalex.org/W123456789',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['school belonging is associated with stronger student engagement']
    );

    expect(enriched.evidenceType).toBe('full-text');
    expect(enriched.evidenceProvenance).toBe('server-verified-fulltext');
    expect(enriched.claimText).toBe(
      'school belonging is associated with stronger student engagement'
    );
    expect(enriched.evidenceText).toContain('School belonging is associated with stronger student engagement');
    expect(enriched.evidenceUrl).toBe('https://publisher.example.org/articles/oa-study');
  });

  it('enriches a DOAJ article page only when the returned page contains the claim', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('doaj.example.org/article/42')) {
        return new Response(
          '<article><p>Teacher feedback can improve revision quality when students receive actionable guidance.</p></article>',
          {
            status: 200,
            headers: { 'content-type': 'text/html' }
          }
        );
      }

      throw new Error(`unexpected URL: ${url}`);
    }) as typeof fetch;

    const source = {
      id: 'doaj-42',
      title: 'Teacher feedback study',
      sourceType: 'DOAJ',
      url: 'https://doaj.example.org/article/42',
      evidenceType: 'abstract' as const
    };

    const [enriched] = await enrichSourcesWithFullText(
      [source],
      ['teacher feedback can improve revision quality']
    );

    expect(enriched.evidenceType).toBe('full-text');
    expect(enriched.evidenceProvenance).toBe('server-verified-fulltext');
    expect(enriched.evidenceUrl).toBe(source.url);
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
