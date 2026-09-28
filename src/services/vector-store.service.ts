import { db } from '../db';
import { libraryIndex } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
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
  retrievalStatus?: 'persisted-vector' | 'in-memory-index';
  verificationStatus?: 'verified' | 'unverified';
  userId?: string;
}

function stableId(userId: string, title: string, content: string): string {
  let hash = 2166136261;
  const value = `${userId}::${title.normalize('NFKC')}::${content.normalize('NFKC')}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `vec-${(hash >>> 0).toString(36)}`;
}

function lexicalScore(query: string, text: string): number {
  const queryTokens = new Set(
    query.toLocaleLowerCase().split(/\s+/).filter(token => token.length > 2)
  );
  if (queryTokens.size === 0) return 0;

  const normalizedText = text.toLocaleLowerCase();
  let matched = 0;
  for (const token of queryTokens) {
    if (normalizedText.includes(token)) matched += 1;
  }

  return Math.round((matched / queryTokens.size) * 100) / 100;
}

export class VectorStoreService {
  // Only real documents indexed during this process may exist in memory.
  // No synthetic scholarly seed records are permitted.
  private inMemoryDocs: VectorDocument[] = [];

  async searchSimilarContent(queryEmbedding: number[], userId: string, limit = 5): Promise<VectorDocument[]> {
    const safeLimit = Math.max(1, Math.min(50, Math.round(limit)));
    if (queryEmbedding.length !== 768) return [];

    try {
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      if (!userId) return [];
      const results = await db
        .select({
          id: libraryIndex.id,
          title: libraryIndex.title,
          content: libraryIndex.content,
          similarity: sql<number>`1 - (${libraryIndex.embedding} <=> ${embeddingString}::vector)`,
        })
        .from(libraryIndex)
        .where(eq(libraryIndex.ownerUid, userId))
        .orderBy(sql`${libraryIndex.embedding} <=> ${embeddingString}::vector`)
        .limit(safeLimit);

      return results.map(result => ({
        id: String(result.id),
        title: result.title,
        content: result.content,
        similarity: Number.isFinite(result.similarity) ? result.similarity : 0,
        score: Number.isFinite(result.similarity) ? result.similarity : 0,
        retrievalStatus: 'persisted-vector',
        verificationStatus: 'unverified'
      }));
    } catch (error) {
      console.warn('[VectorStore PostgreSQL retrieval unavailable]:', (error as Error)?.message || error);
      return [];
    }
  }

  async indexDocument(doc: {
    title: string;
    content: string;
    author?: string;
    year?: number;
    userId: string;
  }): Promise<VectorDocument> {
    const embedding = await generateEmbedding(`${doc.title} ${doc.content}`).catch(error => {
      console.warn('[VectorStore embedding unavailable]:', (error as Error)?.message || error);
      return [];
    });

    if (embedding.length > 0 && embedding.length !== 768) {
      throw new Error(`Unexpected embedding dimension: ${embedding.length}; expected 768.`);
    }

    let persisted = false;
    if (embedding.length === 768) {
      try {
        await db.insert(libraryIndex).values({
          title: doc.title,
          content: doc.content,
          language: 'ckb',
          ownerUid: doc.userId,
          embedding,
        });
        persisted = true;
      } catch (err) {
        console.warn('[VectorStore PostgreSQL insert unavailable]:', (err as Error)?.message || err);
      }
    }

    const newDoc: VectorDocument = {
      id: stableId(doc.userId, doc.title, doc.content),
      title: doc.title,
      content: doc.content,
      author: doc.author,
      year: doc.year,
      embedding,
      retrievalStatus: persisted ? 'persisted-vector' : 'in-memory-index',
      verificationStatus: 'unverified',
      userId: doc.userId
    };

    // In-memory copy is only a cache of caller-provided content, never synthetic seed data.
    this.inMemoryDocs = [
      ...this.inMemoryDocs.filter(existing => existing.id !== newDoc.id),
      newDoc
    ];

    return newDoc;
  }

  async searchSimilarDocuments(query: string, userId: string, limit = 5): Promise<VectorDocument[]> {
    const normalizedQuery = query.trim();
    const safeLimit = Math.max(1, Math.min(50, Math.round(limit)));
    if (!normalizedQuery || !userId) return [];

    let queryVector: number[] = [];
    try {
      queryVector = await generateEmbedding(normalizedQuery);
    } catch (error) {
      console.warn('[VectorStore query embedding unavailable]:', (error as Error)?.message || error);
    }

    if (queryVector.length === 768) {
      const dbResults = await this.searchSimilarContent(queryVector, userId, safeLimit);
      if (dbResults.length > 0) return dbResults;
    }

    // Safe fallback: only rank real caller-provided documents already indexed in memory.
    return this.inMemoryDocs
      .filter(doc => doc.userId === userId)
      .map(doc => ({
        ...doc,
        score: lexicalScore(normalizedQuery, `${doc.title} ${doc.content}`),
        similarity: undefined
      }))
      .filter(doc => (doc.score || 0) > 0)
      .sort((left, right) => (right.score || 0) - (left.score || 0))
      .slice(0, safeLimit);
  }
}

export const vectorStoreService = new VectorStoreService();
