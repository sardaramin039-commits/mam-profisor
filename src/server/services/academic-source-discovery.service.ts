import type { GoogleGenAI } from '@google/genai';
import { academicSearchService } from '../../services/academic-search.service';
import {
  fetchSemanticScholar,
  fetchPubMed,
  fetchDOAJ,
  fetchOpenLibrary,
  fetchInternetArchive,
  fetchEuropeana,
  fetchLibraryOfCongress
} from '../../helpers/academic-integrations';
import { discoverGoogleSearchSources } from './google-search-grounding.service';

/**
 * Free/public-source discovery only. This service deliberately does not call
 * paid generative search providers; returned records remain unverified candidates.
 */
export class AcademicSourceDiscoveryService {
  public async discover(
    topic: string,
    discipline: string,
    getGeminiClient?: () => GoogleGenAI
  ): Promise<unknown[]> {
    const query = [topic.trim(), discipline.trim()].filter(Boolean).join(' ');
    const searches: Array<() => Promise<unknown[]>> = [
      () => fetchSemanticScholar(query),
      () => fetchPubMed(query),
      () => fetchDOAJ(query),
      () => fetchOpenLibrary(query),
      () => fetchInternetArchive(query),
      () => fetchEuropeana(query),
      () => fetchLibraryOfCongress(query),
      () => academicSearchService.searchAll(query, 12)
    ];

    if (getGeminiClient) {
      searches.push(() => discoverGoogleSearchSources(topic, discipline, getGeminiClient));
    }

    const settled = await Promise.allSettled(
      searches.map(search => Promise.resolve().then(search))
    );

    return settled.flatMap(result =>
      result.status === 'fulfilled' && Array.isArray(result.value)
        ? result.value
        : []
    );
  }
}

export const academicSourceDiscoveryService = new AcademicSourceDiscoveryService();
