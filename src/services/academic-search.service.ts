import axios from 'axios';

export interface AcademicPaper {
  id: string;
  title: string;
  doi?: string;
  authors: string[];
  publicationYear: number;
  abstract?: string;
  source: 'openalex' | 'crossref' | 'googlebooks' | 'kurdisharchive';
  url?: string;
}

export class AcademicSearchService {
  private openAlexBaseUrl = 'https://api.openalex.org/works';
  private crossrefBaseUrl = 'https://api.crossref.org/works';
  private googleBooksBaseUrl = 'https://www.googleapis.com/books/v1/volumes';

  /**
   * گەڕان لە داتابەیزی OpenAlex
   */
  async searchOpenAlex(query: string, limit = 10): Promise<AcademicPaper[]> {
    if (!query || query.trim() === '') return [];
    try {
      const apiKey = process.env['OPENALEX_API_KEY'];
      const headers: Record<string, string> = {
        'User-Agent': 'AcademicKurdishPlatform/1.0 (mailto:admin@example.com)',
      };
      if (apiKey) {
        headers['api_key'] = apiKey;
      }

      const response = await axios.get(this.openAlexBaseUrl, {
        params: { search: query, 'per-page': limit },
        headers,
        timeout: 8000,
      });

      const results = response.data?.results;
      if (!Array.isArray(results)) return [];

      return results.map((item: any) => ({
        id: item.id || item.doi || `openalex:${this.stableId(item.display_name || item.title || '')}`,
        title: item.display_name || item.title || 'سەردێڕی دیارینەکراو',
        doi: item.doi || undefined,
        authors: item.authorships?.map((a: any) => a.author?.display_name || '').filter(Boolean) || ['توێژەری نەناسراو'],
        publicationYear: item.publication_year ?? 0,
        abstract: item.abstract_inverted_index ? this.decodeAbstract(item.abstract_inverted_index) : undefined,
        source: 'openalex' as const,
        url: item.doi || (item.id ? `https://openalex.org/${item.id}` : undefined),
      }));
    } catch (error) {
      console.warn('[OpenAlex Error]:', error);
      return [];
    }
  }

  /**
   * گەڕان لە داتابەیزی Crossref
   */
  async searchCrossRef(query: string, limit = 10): Promise<AcademicPaper[]> {
    if (!query || query.trim() === '') return [];
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'AcademicKurdishPlatform/1.0 (mailto:admin@example.com)',
      };
      const token = process.env['CROSSREF_PLUS_TOKEN'];
      if (token) {
        headers['Crossref-Plus-API-Token'] = `Bearer ${token}`;
      }

      const response = await axios.get(this.crossrefBaseUrl, {
        params: { query, rows: limit },
        headers,
        timeout: 8000,
      });

      const items = response.data?.message?.items;
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => ({
        id: item.DOI || `crossref:${this.stableId(item.title?.[0] || '')}`,
        title: item.title?.[0] || 'سەردێڕی دیارینەکراو',
        doi: item.DOI,
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean) || ['توێژەری نەناسراو'],
        publicationYear: item.published?.['date-parts']?.[0]?.[0] ?? 0,
        source: 'crossref' as const,
        url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
      }));
    } catch (error) {
      console.warn('[CrossRef Error]:', error);
      return [];
    }
  }

  /**
   * هاوتاکردن بۆ بەکارهێنان لە کۆدە هاوپێچەکان (Alias for searchCrossRef)
   */
  async searchCrossref(query: string, limit = 10): Promise<AcademicPaper[]> {
    return this.searchCrossRef(query, limit);
  }

  /**
   * گەڕان لە Google Books API
   */
  async searchGoogleBooks(query: string, limit = 5): Promise<AcademicPaper[]> {
    if (!query || query.trim() === '') return [];
    try {
      const apiKey = process.env['GOOGLE_BOOKS_API_KEY'];
      const params: Record<string, string | number> = {
        q: query,
        maxResults: limit,
      };
      if (apiKey) params['key'] = apiKey;

      const response = await axios.get(this.googleBooksBaseUrl, {
        params,
        timeout: 8000,
      });

      const items = response.data?.items;
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const info = item.volumeInfo || {};
        const yearMatch = info.publishedDate?.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;

        return {
          id: item.id || info.industryIdentifiers?.[0]?.identifier || `gbooks:${this.stableId(info.title || '')}`,
          title: info.title || 'سەردێڕی دیارینەکراو',
          authors: info.authors || ['نووسەری دیارینەکراو'],
          publicationYear: year,
          source: 'googlebooks' as const,
          url: info.infoLink,
          abstract: info.description ? info.description.slice(0, 200) + '...' : undefined,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * گەڕانی یەکگرتوو بەناو سەرجەم کەتەلۆگە جیهانییەکان
   */
  async searchAll(query: string, limit = 6): Promise<AcademicPaper[]> {
    const subLimit = Math.max(2, Math.floor(limit / 3));
    const [openAlex, crossref, googleBooks] = await Promise.all([
      this.searchOpenAlex(query, subLimit),
      this.searchCrossRef(query, subLimit),
      this.searchGoogleBooks(query, subLimit),
    ]);

    const combined = [...openAlex, ...crossref, ...googleBooks];
    if (combined.length > 0) return combined.slice(0, limit);

    // Never invent a scholarly record when external indexes return no results.
    return [];
  }

  /**
   * وەرگێڕانی Abstractی پێچەوانەکراو (Inverted Index) لە OpenAlexەوە بۆ دەقی ئاسایی
   */
  private decodeAbstract(invertedIndex: Record<string, number[]>): string {
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      positions.forEach((pos) => words.push([word, pos]));
    }
    return words
      .sort((a, b) => a[1] - b[1])
      .map((w) => w[0])
      .join(' ');
  }


  private stableId(value: string): string {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  /**
   * پشکنینی خۆکاری جێگیری، بەردەستبوون و وەڵامدانەوەی APIـە ئەکادیمییەکان
   */
  async checkApisHealth(): Promise<{
    crossref: { status: 'healthy' | 'degraded' | 'down'; latencyMs: number; error?: string };
    openalex: { status: 'healthy' | 'degraded' | 'down'; latencyMs: number; error?: string };
    googlebooks: { status: 'healthy' | 'degraded' | 'down'; latencyMs: number; error?: string };
    timestamp: string;
    allHealthy: boolean;
  }> {
    const checkOne = async (fn: () => Promise<any>): Promise<{ status: 'healthy' | 'degraded' | 'down'; latencyMs: number; error?: string }> => {
      const start = Date.now();
      try {
        await fn();
        const latencyMs = Date.now() - start;
        return {
          status: latencyMs > 3500 ? 'degraded' : 'healthy',
          latencyMs,
        };
      } catch (err: any) {
        return {
          status: 'down',
          latencyMs: Date.now() - start,
          error: err?.message || 'Connection failed',
        };
      }
    };

    const [crossref, openalex, googlebooks] = await Promise.all([
      checkOne(async () => {
        const res = await axios.get(`${this.crossrefBaseUrl}?rows=1`, { timeout: 4500 });
        if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      }),
      checkOne(async () => {
        const res = await axios.get(`${this.openAlexBaseUrl}?per-page=1`, { timeout: 4500 });
        if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      }),
      checkOne(async () => {
        const res = await axios.get(`${this.googleBooksBaseUrl}?q=science&maxResults=1`, { timeout: 4500 });
        if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      }),
    ]);

    const allHealthy = crossref.status === 'healthy' && openalex.status === 'healthy' && googlebooks.status === 'healthy';

    return {
      crossref,
      openalex,
      googlebooks,
      timestamp: new Date().toISOString(),
      allHealthy,
    };
  }
}

export const academicSearchService = new AcademicSearchService();

