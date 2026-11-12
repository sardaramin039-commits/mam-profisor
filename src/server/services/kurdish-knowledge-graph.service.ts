import { GoogleGenAI } from '@google/genai';
import { academicSearchService } from '../../services/academic-search.service';

export interface KurdishKnowledgeEntry {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'journal' | 'thesis' | 'article' | 'encyclopedia' | 'archive' | 'unknown';
  discipline: string;
  period: string;
  dialect: 'Sorani' | 'Kurmanji' | 'Hawrami' | 'Unknown';
  isbnOrDoi?: string;
  publisher?: string;
  digitalAvailability: boolean;
  kurdishAbstract: string;
}

/**
 * Retrieval-only Kurdish knowledge graph.
 *
 * The graph never asks an LLM to invent bibliographic records. It maps records
 * returned by the real academic search integrations and leaves unknown metadata blank.
 */
export class KurdishKnowledgeGraphService {
  public async searchKnowledgeGraph(
    query: string,
    _getGeminiClient: () => GoogleGenAI
  ): Promise<KurdishKnowledgeEntry[]> {
    const normalizedQuery = String(query || '').trim().slice(0, 500);
    if (!normalizedQuery) return [];

    try {
      const results = await academicSearchService.searchAll(normalizedQuery, 20);

      return results.map((source): KurdishKnowledgeEntry => ({
        id: source.id,
        title: source.title,
        author: source.authors.join(', '),
        type: 'unknown',
        discipline: 'Unknown',
        period: source.publicationYear > 0 ? String(source.publicationYear) : 'Unknown',
        dialect: 'Unknown',
        isbnOrDoi: source.doi || undefined,
        publisher: undefined,
        digitalAvailability: Boolean(source.url),
        kurdishAbstract: source.abstract || ''
      }));
    } catch (err: unknown) {
      console.error('Error in KurdishKnowledgeGraphService:', err);
      return [];
    }
  }
}

export const kurdishKnowledgeGraphService = new KurdishKnowledgeGraphService();
