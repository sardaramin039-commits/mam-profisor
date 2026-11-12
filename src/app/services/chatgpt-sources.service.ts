import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface DiscoveredAcademicSource {
  title: string;
  authors: string[];
  year: number | string;
  journalOrPublisher: string;
  doi?: string;
  url?: string;
  sourceType: string;
  citationAPA: string;
  citationHarvard: string;
  citationMLA: string;
  relevanceExplanation: string;
  credibilityScore: number;
}

export interface DiscoverSourcesResult {
  success: boolean;
  query: string;
  discoveredSources: DiscoveredAcademicSource[];
  thematicSummary: string;
  suggestedKeywords: string[];
  provider: string;
}

export interface OrganizeReferencesResult {
  success: boolean;
  topic: string;
  citationStyle: string;
  sortedReferences: DiscoveredAcademicSource[];
  curatedBibliography: string;
  inTextCitationGuide: string;
  methodologyNotes: string;
  provider: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatGptSourcesService {
  private http = inject(HttpClient);

  /**
   * دۆزینەوەی سەرچاوە زانستییە پێشەنگەکان لەڕێگەی ChatGPT
   */
  public async discoverSources(
    query: string,
    discipline = 'گشتی',
    limit = 8,
    timeframe = 'نوێترین توێژینەوەکان'
  ): Promise<DiscoverSourcesResult> {
    return firstValueFrom(
      this.http.post<DiscoverSourcesResult>('/api/chatgpt-sources/discover-sources', {
        query,
        discipline,
        limit,
        timeframe
      })
    );
  }

  /**
   * ڕێکخستن و پۆلێنکردنی سەرچاوەکان بەپێی شێوازە نێودەوڵەتییەکان
   */
  public async organizeReferences(
    topic: string,
    rawReferences: string,
    citationStyle: 'harvard' | 'apa' | 'mla' | 'chicago' = 'harvard',
    discipline = 'گشتی'
  ): Promise<OrganizeReferencesResult> {
    return firstValueFrom(
      this.http.post<OrganizeReferencesResult>('/api/chatgpt-sources/organize-references', {
        topic,
        rawReferences,
        citationStyle,
        discipline,
        language: 'ckb'
      })
    );
  }

  /**
   * پشکنینی کارایی و ئامادەیی مۆدیوڵی ChatGPT
   */
  public async checkStatus(): Promise<{ service: string; isConfigured: boolean; model: string }> {
    return firstValueFrom(
      this.http.get<{ service: string; isConfigured: boolean; model: string }>('/api/chatgpt-sources/status')
    );
  }
}
