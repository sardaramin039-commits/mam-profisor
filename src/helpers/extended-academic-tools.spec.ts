import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupIsbn, lookupIssn, resolveDoi } from './extended-academic-tools';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('academic provider identifier validation', () => {
  it('normalizes DOI resolver prefixes and trailing citation punctuation', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({
      message: {
        title: ['Validated Study'],
        author: [{ given: 'Ada', family: 'Lovelace' }],
        publisher: 'Scholarly Press',
        'container-title': ['Journal of Example Research'],
        created: { 'date-parts': [[2024]] },
        DOI: '10.1000/Valid.Test',
        URL: 'https://doi.org/10.1000/Valid.Test'
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await resolveDoi(' DOI: https://doi.org/10.1000/Valid.Test. ');

    expect(result.doi).toBe('10.1000/Valid.Test');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(encodeURIComponent('10.1000/Valid.Test'));
  });

  it('rejects malformed DOI values before making an external request', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(resolveDoi('not-a-doi')).rejects.toThrow(/DOI/iu);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts ISBN-10 and ISBN-13 values with valid checksums', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const isbn = url.includes('ISBN:0306406152') ? '0306406152' : '9780306406157';
      return new Response(JSON.stringify({
        [`ISBN:${isbn}`]: { title: `Book ${isbn}`, authors: [{ name: 'Researcher' }] }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await lookupIsbn('0-306-40615-2')).toMatchObject({ isbn: '0306406152' });
    expect(await lookupIsbn('978-0-306-40615-7')).toMatchObject({ isbn: '9780306406157' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects ISBNs with invalid checksums before fetching provider data', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(lookupIsbn('978-0-306-40615-8')).rejects.toThrow(/checksum/iu);
    await expect(lookupIsbn('0-306-40615-3')).rejects.toThrow(/checksum/iu);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes ISSN spaces and validates its check digit', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({
      message: { title: 'Journal of Example Studies', publisher: 'Scholarly Press' }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await lookupIssn('0378 5955');

    expect(result.issn).toBe('0378-5955');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('0378-5955');
  });

  it('rejects an ISSN with an invalid check digit before fetching', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(lookupIssn('0378-5954')).rejects.toThrow(/check digit/iu);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
