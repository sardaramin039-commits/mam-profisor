import { describe, expect, it } from 'vitest';
import { DigitalLibraryCrawlerEngine } from './crawler-engine';

describe('DigitalLibraryCrawlerEngine', () => {
  it('keeps the static source registry non-live until an adapter verifies it', () => {
    const engine = new DigitalLibraryCrawlerEngine();
    const sources = engine.getSources();

    expect(sources.length).toBeGreaterThanOrEqual(40);
    expect(new Set(sources.map(source => source.id)).size).toBe(sources.length);
    expect(sources.every(source => source.status === 'idle')).toBe(true);
    expect(sources.every(source => source.totalItems === 0)).toBe(true);
    expect(sources.every(source => source.lastSync === '')).toBe(true);
  });

  it('does not expose seed books as verified research sources', () => {
    const engine = new DigitalLibraryCrawlerEngine();
    const catalog = engine.getCatalog();

    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.every(book => book.verified === false)).toBe(true);
    expect(catalog.every(book => book.rating === undefined)).toBe(true);
    expect(catalog.every(book => book.reviewCount === undefined)).toBe(true);
  });

  it('returns a warning instead of fabricating crawl results', async () => {
    const engine = new DigitalLibraryCrawlerEngine();
    const log = await engine.triggerSync();

    expect(log.status).toBe('warning');
    expect(log.recordsCrawled).toBe(0);
    expect(log.duplicatesRemoved).toBe(0);
    expect(log.sourcesProcessed).toBe(0);
    expect(log.message).toContain('source-adapter');
  });
});
