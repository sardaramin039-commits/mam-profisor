import { db } from '../db';
import { libraryIndex } from '../db/schema';
import { sql } from 'drizzle-orm';
import { generateEmbedding } from './embeddingService';

export interface VectorDocument {
  id: string;
  title: string;
  content: string;
  author?: string;
  year?: number;
  score?: number;
  similarity?: number;
  embedding?: number[];
}

export class VectorStoreService {
  private inMemoryDocs: VectorDocument[] = [];


  /**
   * گەڕانی سێمانتیک لەسەر فایلی کتێبخانە و دەقە کوردییەکان بە Drizzle ORM و pgvector
   */
  async searchSimilarContent(queryEmbedding: number[], limit = 5) {
    try {
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      // بەکارهێنانی Cosine Distance بە SQL لە PostgreSQL pgvector
      const results = await db
        .select({
          id: libraryIndex.id,
          title: libraryIndex.title,
          content: libraryIndex.content,
          similarity: sql<number>`1 - (${libraryIndex.embedding} <=> ${embeddingString}::vector)`,
        })
        .from(libraryIndex)
        .orderBy(sql`${libraryIndex.embedding} <=> ${embeddingString}::vector`)
        .limit(limit);

      if (results && results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn('[VectorStore PostgreSQL fallback]:', (error as Error)?.message || error);
    }

    return [];
  }

  /**
   * ئیندێکسکردنی بەڵگەنامەی نوێ لە PostgreSQL و یادگەدا
   */
  async indexDocument(doc: {
    title: string;
    content: string;
    author?: string;
    year?: number;
  }): Promise<VectorDocument> {
    let embedding: number[] = [];
    try {
      embedding = await generateEmbedding(`${doc.title} ${doc.content}`);
    } catch {
      embedding = [];
    }

    // هەوڵی پاشەکەوتکردن لە PostgreSQL
    try {
      if (embedding.length > 0) {
        await db.insert(libraryIndex).values({
          title: doc.title,
          content: doc.content,
          language: 'ckb',
          embedding,
        });
      }
    } catch (err) {
      console.warn('[VectorStore Insert SQL Fallback]:', (err as Error)?.message || err);
    }

    const newDoc: VectorDocument = {
      id: `vec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: doc.title,
      content: doc.content,
      author: doc.author,
      year: doc.year,
      embedding,
    };

    this.inMemoryDocs.push(newDoc);
    return newDoc;
  }

  /**
   * گەڕانی بەڵگەنامە هاوشێوەکان بە دەق یان وێکتۆر
   */
  async searchSimilarDocuments(query: string, limit = 5): Promise<VectorDocument[]> {
    if (!query || query.trim() === '') return [];

    let queryVector: number[] = [];
    try {
      queryVector = await generateEmbedding(query);
    } catch {
      queryVector = [];
    }

    if (queryVector.length > 0) {
      const dbResults = await this.searchSimilarContent(queryVector, limit);
      if (dbResults && dbResults.length > 0) {
        return dbResults.map((r) => ({
          id: String(r.id),
          title: r.title,
          content: r.content,
          score: Math.round((r.similarity || 0.8) * 100) / 100,
          similarity: r.similarity,
        }));
      }
    }

    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = new Set(normalizedQuery.split(/\s+/).filter(term => term.length > 1));

    return this.inMemoryDocs
      .map(doc => {
        const searchable = `${doc.title} ${doc.content}`.toLowerCase();
        const lexicalMatches = [...queryTerms].filter(term => searchable.includes(term)).length;
        const lexicalScore = queryTerms.size > 0 ? lexicalMatches / queryTerms.size : 0;
        const vectorScore = queryVector.length > 0 && doc.embedding?.length === queryVector.length
          ? this.cosineSimilarity(queryVector, doc.embedding)
          : 0;

        return {
          ...doc,
          similarity: vectorScore > 0 ? vectorScore : lexicalScore,
          score: vectorScore > 0 ? vectorScore : lexicalScore,
        };
      })
      .filter(doc => (doc.score ?? 0) > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let index = 0; index < a.length; index++) {
      dot += a[index] * b[index];
      normA += a[index] * a[index];
      normB += b[index] * b[index];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorStoreService = new VectorStoreService();
