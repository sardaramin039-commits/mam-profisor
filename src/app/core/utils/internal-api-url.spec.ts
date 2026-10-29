import { isInternalApiUrl } from './internal-api-url';

describe('isInternalApiUrl', () => {
  it('accepts same-origin API endpoints', () => {
    expect(isInternalApiUrl('/api/search', 'https://mam-professor.example')).toBe(true);
    expect(isInternalApiUrl('/api', 'https://mam-professor.example')).toBe(true);
  });

  it('accepts relative API paths resolved against the supplied origin', () => {
    expect(isInternalApiUrl('api/research', 'https://mam-professor.example')).toBe(true);
  });

  it('rejects external origins and API-like path prefixes', () => {
    expect(isInternalApiUrl('https://attacker.example/api/search', 'https://mam-professor.example')).toBe(false);
    expect(isInternalApiUrl('/apiary/search', 'https://mam-professor.example')).toBe(false);
  });

  it('fails closed for empty URLs, invalid URLs, or missing server-side origin', () => {
    expect(isInternalApiUrl('', 'https://mam-professor.example')).toBe(false);
    expect(isInternalApiUrl('https://[invalid', 'https://mam-professor.example')).toBe(false);
    expect(isInternalApiUrl('/api/search', '')).toBe(false);
  });
});
