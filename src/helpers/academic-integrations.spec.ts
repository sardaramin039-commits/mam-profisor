import { describe, expect, it, vi } from 'vitest';
import {
  calculateSourceConfidence,
  fetchSemanticScholar,
  fetchOpenLibrary,
  fetchInternetArchive,
  fetchDOAJ,
  fetchEuropeana,
  fetchLibraryOfCongress,
  fetchWorldCat,
  fetchOAIPMH
} from './academic-integrations';

describe('academic source integrity', () => {
  it('does not treat discovery indexes as peer-review proof', () => {
    expect(calculateSourceConfidence({
      sourceType: 'SemanticScholar',
      title: 'Real paper',
      authors: ['Real Author'],
      year: '2024',
      peerReviewed: false
    })).toBeLessThan(90);
  });

  it('fails closed when provider requests fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(fetchSemanticScholar('test')).resolves.toEqual([]);
    await expect(fetchOpenLibrary('test')).resolves.toEqual([]);
    await expect(fetchInternetArchive('test')).resolves.toEqual([]);
    await expect(fetchDOAJ('test')).resolves.toEqual([]);
    await expect(fetchEuropeana('test')).resolves.toEqual([]);
    await expect(fetchLibraryOfCongress('test')).resolves.toEqual([]);
    await expect(fetchWorldCat('test')).resolves.toEqual([]);
    await expect(fetchOAIPMH('test')).resolves.toEqual([]);

    vi.unstubAllGlobals();
  });
});
