import { afterEach, describe, expect, it } from 'vitest';
import { researchIntelligenceService } from './research-intelligence.service';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function response(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

describe('research intelligence discovery', () => {
  it('uses OpenAlex and Crossref and deduplicates identical DOI records', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('api.openalex.org/works')) {
        return response({
          results: [{
            id: 'https://openalex.org/W123',
            doi: 'https://doi.org/10.1000/example',
            title: 'Example Academic Study',
            publication_year: 2025,
            authorships: [{ author: { display_name: 'Example Author' } }],
            primary_location: {
              landing_page_url: 'https://example.org/paper',
              source: { display_name: 'Example Journal' }
            },
            cited_by_count: 12
          }]
        });
      }

      if (url.includes('api.crossref.org/works')) {
        return response({
          message: {
            items: [{
              DOI: '10.1000/example',
              title: ['Example Academic Study'],
              author: [{ given: 'Example', family: 'Author' }],
              publisher: 'Example Publisher',
              published: { 'date-parts': [[2025]] },
              URL: 'https://doi.org/10.1000/example',
              'container-title': ['Example Journal'],
              'is-referenced-by-count': 12
            }]
          }
        });
      }

      return response({ results: [], data: [], message: { items: [] }, response: { docs: [] }, items: [] });
    }) as typeof fetch;

    const result = await researchIntelligenceService.discover(
      'کاریگەریی فێربوون',
      'دەروونناسی'
    );

    expect(result.providers).toContain('OpenAlex');
    expect(result.providers).toContain('Crossref');
    expect(result.sources.filter(source => source.doi === '10.1000/example')).toHaveLength(1);
    expect(result.sources[0]?.title).toBe('Example Academic Study');
  });
});
