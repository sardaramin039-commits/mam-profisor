import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  semanticScholar: vi.fn(),
  pubmed: vi.fn(),
  doaj: vi.fn(),
  openLibrary: vi.fn(),
  internetArchive: vi.fn(),
  europeana: vi.fn(),
  libraryOfCongress: vi.fn(),
  searchAll: vi.fn(),
  googleSearch: vi.fn()
}));

vi.mock('../../helpers/academic-integrations', () => ({
  fetchSemanticScholar: mocks.semanticScholar,
  fetchPubMed: mocks.pubmed,
  fetchDOAJ: mocks.doaj,
  fetchOpenLibrary: mocks.openLibrary,
  fetchInternetArchive: mocks.internetArchive,
  fetchEuropeana: mocks.europeana,
  fetchLibraryOfCongress: mocks.libraryOfCongress
}));

vi.mock('../../services/academic-search.service', () => ({
  academicSearchService: { searchAll: mocks.searchAll }
}));

vi.mock('./google-search-grounding.service', () => ({
  discoverGoogleSearchSources: mocks.googleSearch
}));

import { AcademicSourceDiscoveryService } from './academic-source-discovery.service';

const providerMocks = [
  'semanticScholar', 'pubmed', 'doaj', 'openLibrary',
  'internetArchive', 'europeana', 'libraryOfCongress', 'searchAll'
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  for (const name of providerMocks) mocks[name].mockResolvedValue([]);
  mocks.googleSearch.mockResolvedValue([]);
});

describe('AcademicSourceDiscoveryService', () => {
  it('queries public academic providers without activating optional Gemini search', async () => {
    mocks.semanticScholar.mockResolvedValueOnce([
      { id: 'ss-1', title: 'Indexed paper', url: 'https://example.org/paper' }
    ]);
    const service = new AcademicSourceDiscoveryService();

    const result = await service.discover('Climate change', 'Geography');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: 'Indexed paper' });
    expect(mocks.searchAll).toHaveBeenCalledWith('Climate change Geography', 12);
    expect(mocks.googleSearch).not.toHaveBeenCalled();
    for (const name of providerMocks) expect(mocks[name]).toHaveBeenCalledOnce();
  });

  it('continues when one public provider rejects', async () => {
    mocks.pubmed.mockRejectedValueOnce(new Error('temporary network failure'));
    mocks.doaj.mockResolvedValueOnce([
      { id: 'doaj-1', title: 'Open access paper', url: 'https://example.org/open' }
    ]);
    const service = new AcademicSourceDiscoveryService();

    const result = await service.discover('Education', 'Pedagogy');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: 'Open access paper' });
  });

  it('adds Google Search grounding only when the caller supplies the configured Gemini client', async () => {
    const getGeminiClient = () => ({} as never);
    mocks.googleSearch.mockResolvedValueOnce([
      { id: 'search-1', title: 'Grounded search result', url: 'https://example.org/search' }
    ]);
    const service = new AcademicSourceDiscoveryService();

    const result = await service.discover('History', 'Kurdistan', getGeminiClient);

    expect(mocks.googleSearch).toHaveBeenCalledWith('History', 'Kurdistan', getGeminiClient);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: 'Grounded search result' });
  });
});
