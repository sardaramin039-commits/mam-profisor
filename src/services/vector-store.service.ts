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

    // لە کاتی ناچالاکبوونی سێرڤەری SQL یان پاشەکەوتکردن بەبێ کێشە لە یادگەدا بەردەوام دەبێت
    return this.inMemoryDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      similarity: 0.85,
    })).slice(0, limit);
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

    return this.inMemoryDocs.slice(0, limit).map((doc) => ({
      ...doc,
      score: 0.85,
    }));
  }
}

export const vectorStoreService = new VectorStoreService();
