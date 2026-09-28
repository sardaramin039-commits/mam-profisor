import { db } from '../db';
import { libraryIndex } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { generateEmbedding } from './embeddingService';

export interface VectorDocument {
  id: string;
  documentId?: string;
  title: string;
  content: string;
  author?: string;
  year?: number;
  chunkIndex?: number;
  chunkCount?: number;
  pageStart?: number;
  pageEnd?: number;
  score?: number;
  similarity?: number;
  embedding?: number[];
  retrievalStatus?: 'persisted-vector' | 'partial-vector' | 'in-memory-index';
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

function chunkContent(content: string, maxChars = 6000, overlapChars = 700): string[] {
  const normalized = content.normalize('NFKC').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);

    if (end < normalized.length) {
      const paragraphBoundary = normalized.lastIndexOf('\n\n', end);
      const sentenceBoundary = normalized.lastIndexOf('. ', end);
      const wordBoundary = normalized.lastIndexOf(' ', end);
      const preferredBoundary = paragraphBoundary > start + maxChars * 0.55
        ? paragraphBoundary
        : sentenceBoundary > start + maxChars * 0.55
          ? sentenceBoundary + 1
          : wordBoundary > start + maxChars * 0.55
            ? wordBoundary
            : end;

      end = preferredBoundary;
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;
    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
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

type StoredMetadata = {
  documentId?: string;
  author?: string;
  year?: number;
  chunkIndex?: number;
  chunkCount?: number;
  pageStart?: number;
  pageEnd?: number;
  verificationStatus?: 'verified' | 'unverified';
};

function parseMetadata(value: unknown): StoredMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const metadata = value as Record<string, unknown>;
  const year = Number(metadata['year']);
  const chunkIndex = Number(metadata['chunkIndex']);
  const chunkCount = Number(metadata['chunkCount']);

  return {
    documentId: typeof metadata['documentId'] === 'string' ? metadata['documentId'] : undefined,
    author: typeof metadata['author'] === 'string' ? metadata['author'] : undefined,
    year: Number.isInteger(year) ? year : undefined,
    chunkIndex: Number.isInteger(chunkIndex) ? chunkIndex : undefined,
    chunkCount: Number.isInteger(chunkCount) ? chunkCount : undefined,
    pageStart: Number.isInteger(Number(metadata['pageStart'])) ? Number(metadata['pageStart']) : undefined,
    pageEnd: Number.isInteger(Number(metadata['pageEnd'])) ? Number(metadata['pageEnd']) : undefined,
    verificationStatus: metadata['verificationStatus'] === 'verified' ? 'verified' : 'unverified'
  };
}

export class VectorStoreService {
  private inMemoryDocs: VectorDocument[] = [];

  async searchSimilarContent(
    queryEmbedding: number[],
    userId: string,
    limit = 5,
    documentId?: string
  ): Promise<VectorDocument[]> {
    const safeLimit = Math.max(1, Math.min(50, Math.round(limit)));
    if (queryEmbedding.length !== 768 || !userId) return [];

    try {
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      const ownerFilter = eq(libraryIndex.ownerUid, userId);
      const documentFilter = documentId
        ? sql`${libraryIndex.metadata}->>'documentId' = ${documentId}`
        : undefined;
      const filters = documentFilter ? and(ownerFilter, documentFilter) : ownerFilter;

      const results = await db
        .select({
          id: libraryIndex.id,
          title: libraryIndex.title,
          content: libraryIndex.content,
          metadata: libraryIndex.metadata,
          similarity: sql<number>`1 - (${libraryIndex.embedding} <=> ${embeddingString}::vector)`,
        })
        .from(libraryIndex)
        .where(filters)
        .orderBy(sql`${libraryIndex.embedding} <=> ${embeddingString}::vector`)
        .limit(safeLimit);

      return results.map(result => {
        const metadata = parseMetadata(result.metadata);
        const similarity = Number(result.similarity);
        return {
          id: String(result.id),
          documentId: metadata.documentId,
          title: result.title,
          content: result.content,
          author: metadata.author,
          year: metadata.year,
          chunkIndex: metadata.chunkIndex,
          chunkCount: metadata.chunkCount,
          pageStart: metadata.pageStart,
          pageEnd: metadata.pageEnd,
          similarity: Number.isFinite(similarity) ? similarity : 0,
          score: Number.isFinite(similarity) ? similarity : 0,
          retrievalStatus: 'persisted-vector' as const,
          verificationStatus: metadata.verificationStatus
        };
      });
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
    documentId?: string;
    pages?: Array<{ pageNumber: number; text: string }>;
    verificationStatus?: 'verified' | 'unverified';
  }): Promise<VectorDocument> {
    const normalizedPages = Array.isArray(doc.pages)
      ? doc.pages
        .filter(page => Number.isInteger(page?.pageNumber) && typeof page?.text === 'string' && page.text.trim())
        .slice(0, 5000)
        .sort((a, b) => a.pageNumber - b.pageNumber)
      : [];

    const pageAwareSource = normalizedPages.length
      ? normalizedPages.map(page => `\\n[PAGE:${page.pageNumber}]\\n${page.text.trim()}`).join('\\n')
      : doc.content;

    const chunks = chunkContent(pageAwareSource);
    if (chunks.length === 0) {
      throw new Error('Document content produced no indexable chunks.');
    }

    const stableDocumentId = doc.documentId?.trim() || stableId(doc.userId, doc.title, pageAwareSource);
    const indexedChunks: VectorDocument[] = [];

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedding = await generateEmbedding(`${doc.title}\n\n${chunk}`).catch(error => {
        console.warn(`[VectorStore embedding unavailable for chunk ${index + 1}/${chunks.length}]:`, (error as Error)?.message || error);
        return [];
      });

      if (embedding.length > 0 && embedding.length !== 768) {
        throw new Error(`Unexpected embedding dimension: ${embedding.length}; expected 768.`);
      }

      const pageNumbers = [...chunk.matchAll(/\\[PAGE:(\\d+)\\]/g)].map(match => Number(match[1])).filter(Number.isInteger);
      const pageStart = pageNumbers.length ? Math.min(...pageNumbers) : undefined;
      const pageEnd = pageNumbers.length ? Math.max(...pageNumbers) : undefined;

      indexedChunks.push({
        id: `memory-${stableDocumentId}-${index + 1}`,
        documentId: stableDocumentId,
        title: doc.title,
        content: chunk.replace(/\\[PAGE:\\d+\\]\\s*/g, '').trim(),
        author: doc.author,
        year: doc.year,
        chunkIndex: index,
        chunkCount: chunks.length,
        pageStart,
        pageEnd,
        embedding,
        retrievalStatus: 'in-memory-index',
        verificationStatus: doc.verificationStatus || 'unverified',
        userId: doc.userId
      });
    }

    const persistable = indexedChunks.filter(chunk => chunk.embedding?.length === 768);
    let retrievalStatus: VectorDocument['retrievalStatus'] = 'in-memory-index';

    if (persistable.length > 0) {
      try {
        await db.transaction(async tx => {
          await tx
            .delete(libraryIndex)
            .where(and(
              eq(libraryIndex.ownerUid, doc.userId),
              sql`${libraryIndex.metadata}->>'documentId' = ${stableDocumentId}`
            ));

          await tx.insert(libraryIndex).values(
            persistable.map(chunk => ({
              title: chunk.title,
              content: chunk.content,
              language: 'ckb',
              ownerUid: doc.userId,
              embedding: chunk.embedding,
              metadata: {
                documentId: stableDocumentId,
                author: chunk.author,
                year: chunk.year,
                chunkIndex: chunk.chunkIndex,
                chunkCount: chunk.chunkCount,
                pageStart: chunk.pageStart,
                pageEnd: chunk.pageEnd,
                verificationStatus: chunk.verificationStatus
              }
            }))
          );
        });

        retrievalStatus = persistable.length === indexedChunks.length
          ? 'persisted-vector'
          : 'partial-vector';
      } catch (error) {
        console.warn('[VectorStore PostgreSQL transaction unavailable]:', (error as Error)?.message || error);
        retrievalStatus = 'in-memory-index';
      }
    }

    this.inMemoryDocs = [
      ...this.inMemoryDocs.filter(existing => existing.documentId !== stableDocumentId || existing.userId !== doc.userId),
      ...indexedChunks.map(chunk => ({
        ...chunk,
        retrievalStatus
      }))
    ];

    return {
      ...indexedChunks[0],
      id: stableDocumentId,
      retrievalStatus
    };
  }

  private async searchLexicalContent(
    query: string,
    userId: string,
    limit: number,
    documentId?: string
  ): Promise<VectorDocument[]> {
    try {
      const ownerFilter = eq(libraryIndex.ownerUid, userId);
      const documentFilter = documentId
        ? sql`${libraryIndex.metadata}->>'documentId' = ${documentId}`
        : undefined;
      const filters = documentFilter ? and(ownerFilter, documentFilter) : ownerFilter;

      const lexical = sql<number>`
        ts_rank_cd(
          to_tsvector('simple', ${libraryIndex.content}),
          plainto_tsquery('simple', ${query})
        )
      `;

      const rows = await db
        .select({
          id: libraryIndex.id,
          title: libraryIndex.title,
          content: libraryIndex.content,
          metadata: libraryIndex.metadata,
          lexicalScore: lexical
        })
        .from(libraryIndex)
        .where(filters)
        .orderBy(sql`${lexical} DESC`)
        .limit(limit);

      return rows.map(row => {
        const metadata = parseMetadata(row.metadata);
        return {
          id: String(row.id),
          documentId: metadata.documentId,
          title: row.title,
          content: row.content,
          author: metadata.author,
          year: metadata.year,
          chunkIndex: metadata.chunkIndex,
          chunkCount: metadata.chunkCount,
          pageStart: metadata.pageStart,
          pageEnd: metadata.pageEnd,
          score: Math.max(0, Math.min(1, Number(row.lexicalScore) || 0)),
          similarity: undefined,
          retrievalStatus: 'persisted-vector' as const,
          verificationStatus: 'unverified' as const
        };
      }).filter(result => (result.score || 0) > 0);
    } catch (error) {
      console.warn('[VectorStore lexical retrieval unavailable]:', (error as Error)?.message || error);
      return [];
    }
  }

  async searchSimilarDocuments(
    query: string,
    userId: string,
    limit = 5,
    documentId?: string
  ): Promise<VectorDocument[]> {
    const normalizedQuery = query.trim();
    const safeLimit = Math.max(1, Math.min(50, Math.round(limit)));
    if (!normalizedQuery || !userId) return [];

    const candidateLimit = Math.min(50, safeLimit * 4);
    let semantic: VectorDocument[] = [];
    let lexical: VectorDocument[] = [];

    try {
      const queryVector = await generateEmbedding(normalizedQuery);
      if (queryVector.length === 768) {
        semantic = await this.searchSimilarContent(queryVector, userId, candidateLimit, documentId);
      }
    } catch (error) {
      console.warn('[VectorStore query embedding unavailable]:', (error as Error)?.message || error);
    }

    lexical = await this.searchLexicalContent(normalizedQuery, userId, candidateLimit, documentId);

    const merged = new Map<string, VectorDocument>();
    for (const result of semantic) merged.set(result.id, { ...result, score: Number(result.similarity) || 0 });
    for (const result of lexical) {
      const existing = merged.get(result.id);
      if (existing) {
        const semanticScore = Math.max(0, Math.min(1, Number(existing.similarity) || Number(existing.score) || 0));
        const lexicalScoreValue = Math.max(0, Math.min(1, Number(result.score) || 0));
        merged.set(result.id, {
          ...existing,
          score: semanticScore * 0.65 + lexicalScoreValue * 0.35,
          retrievalStatus: 'persisted-vector'
        });
      } else {
        merged.set(result.id, result);
      }
    }

    const fused = [...merged.values()]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, safeLimit);

    if (fused.length > 0) return fused;

    return this.inMemoryDocs
      .filter(doc => doc.userId === userId && (!documentId || doc.documentId === documentId))
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
