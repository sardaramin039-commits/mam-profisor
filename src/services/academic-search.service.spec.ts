import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { AcademicSearchService } from './academic-search.service';

describe('AcademicSearchService', () => {
  const service = new AcademicSearchService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('drops OpenAlex records without authoritative titles', async () => {
    vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: {
        results: [
          { id: 'https://openalex.org/W1' },
          {
            id: 'https://openalex.org/W2',
            display_name: 'Real paper',
            publication_year: 2024,
            authorships: [{ author: { display_name: 'Real Author' } }]
          }
        ]
      }
    } as never);

    const results = await service.searchOpenAlex('real paper');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Real paper');
    expect(results[0].publicationYear).toBe(2024);
  });

  it('deduplicates repeated identified records without collapsing distinct provider records', async () => {
    const get = vi.spyOn(axios, 'get');
    get
      .mockResolvedValueOnce({
        data: {
          results: [{
            id: 'https://openalex.org/W1',
            display_name: 'Same study',
            publication_year: 2024
          }]
        }
      } as never)
      .mockResolvedValueOnce({
        data: {
          message: {
            items: [
              {
                DOI: '10.1234/example',
                title: ['Same study'],
                published: { 'date-parts': [[2024]] }
              },
              {
                DOI: '10.1234/example',
                title: ['Same study'],
                published: { 'date-parts': [[2024]] }
              }
            ]
          }
        }
      } as never)
      .mockResolvedValueOnce({
        data: {
          items: [{
            id: 'book-1',
            volumeInfo: { title: 'Different book', publishedDate: '2023' }
          }]
        }
      } as never);

    const results = await service.searchAll('same study', 6);
    expect(results.map(result => result.title)).toEqual([
      'Same study',
      'Same study',
      'Different book'
    ]);
  });

  it('treats DOI URLs and bare DOIs as the same identifier', async () => {
    const get = vi.spyOn(axios, 'get');
    get
      .mockResolvedValueOnce({
        data: {
          results: [{
            id: 'https://openalex.org/W1',
            display_name: 'Same study',
            doi: 'https://doi.org/10.1234/example',
            publication_year: 2024
          }]
        }
      } as never)
      .mockResolvedValueOnce({
        data: {
          message: {
            items: [{
              DOI: '10.1234/example',
              title: ['Same study'],
              published: { 'date-parts': [[2024]] }
            }]
          }
        }
      } as never)
      .mockResolvedValueOnce({
        data: { items: [] }
      } as never);

    const results = await service.searchAll('same study', 6);
    expect(results).toHaveLength(1);
    expect(results[0].doi).toBe('https://doi.org/10.1234/example');
  });

  it('keeps same-title records distinct when authors differ and identifiers are absent', async () => {
    const get = vi.spyOn(axios, 'get');
    get
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 'https://openalex.org/W1',
              display_name: 'Same study',
              publication_year: 2024,
              authorships: [{ author: { display_name: 'Author One' } }]
            },
            {
              id: 'https://openalex.org/W2',
              display_name: 'Same study',
              publication_year: 2024,
              authorships: [{ author: { display_name: 'Author Two' } }]
            }
          ]
        }
      } as never)
      .mockResolvedValueOnce({
        data: { message: { items: [] } }
      } as never)
      .mockResolvedValueOnce({
        data: { items: [] }
      } as never);

    const results = await service.searchAll('same study', 6);
    expect(results).toHaveLength(2);
    expect(results.map(result => result.authors)).toEqual([
      ['Author One'],
      ['Author Two']
    ]);
  });

  it('rejects blank and oversized queries before contacting any provider', async () => {
    const get = vi.spyOn(axios, 'get');

    expect(await service.searchOpenAlex('   ')).toEqual([]);
    expect(await service.searchCrossRef('x'.repeat(501))).toEqual([]);
    expect(await service.searchGoogleBooks('\n \t ')).toEqual([]);
    expect(await service.searchAll('x'.repeat(501))).toEqual([]);

    expect(get).not.toHaveBeenCalled();
  });

  it('normalizes Unicode compatibility characters and whitespace in provider queries', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { results: [] }
    } as never);

    await service.searchOpenAlex('  ＡI   research  ');

    expect(get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: { search: 'AI research', 'per-page': 10 }
      })
    );
  });

  it('clamps provider result limits to the safe range', async () => {
    const get = vi.spyOn(axios, 'get');
    get
      .mockResolvedValueOnce({ data: { results: [] } } as never)
      .mockResolvedValueOnce({ data: { message: { items: [] } } } as never)
      .mockResolvedValueOnce({ data: { items: [] } } as never)
      .mockResolvedValueOnce({ data: { results: [] } } as never)
      .mockResolvedValueOnce({ data: { message: { items: [] } } } as never)
      .mockResolvedValueOnce({ data: { items: [] } } as never)
      .mockResolvedValueOnce({ data: { results: [] } } as never)
      .mockResolvedValueOnce({ data: { message: { items: [] } } } as never)
      .mockResolvedValueOnce({ data: { items: [] } } as never);

    await service.searchOpenAlex('topic', 10_000);
    await service.searchCrossRef('topic', -30);
    await service.searchGoogleBooks('topic', Number.POSITIVE_INFINITY);
    await service.searchAll('topic', 10_000);
    await service.searchAll('topic', Number.NaN);

    const calls = get.mock.calls;
    expect((calls[0]?.[1] as { params?: Record<string, unknown> }).params?.['per-page']).toBe(50);
    expect((calls[1]?.[1] as { params?: Record<string, unknown> }).params?.['rows']).toBe(1);
    expect((calls[2]?.[1] as { params?: Record<string, unknown> }).params?.['maxResults']).toBe(5);
    expect((calls[3]?.[1] as { params?: Record<string, unknown> }).params?.['per-page']).toBe(17);
    expect((calls[4]?.[1] as { params?: Record<string, unknown> }).params?.['rows']).toBe(17);
    expect((calls[5]?.[1] as { params?: Record<string, unknown> }).params?.['maxResults']).toBe(17);
    expect((calls[8]?.[1] as { params?: Record<string, unknown> }).params?.['maxResults']).toBe(2);
  });
});
