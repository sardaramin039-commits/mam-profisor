import { Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import { vectorStoreService } from '../../services/vector-store.service';

const indexSchema = z.object({
  title: z.string().trim().min(3).max(500),
  content: z.string().trim().min(20).max(2_000_000),
  author: z.string().trim().max(300).optional(),
  year: z.coerce.number().int().min(1000).max(2100).optional(),
  documentId: z.string().trim().max(200).optional()
}).strict();

const retrieveSchema = z.object({
  query: z.string().trim().min(2).max(5000),
  documentId: z.string().trim().max(200).optional(),
  verifiedOnly: z.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(20).default(5)
}).strict();

export function createRagRouter(_getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/rag/index-document
   * Indexes caller-owned content into the private pgvector library.
   */
  router.post('/index-document', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const parsed = indexSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: 'داتای بەڵگەنامە نادروستە.', issues: parsed.error.issues });
        return;
      }

      const { title, content, author, year, documentId } = parsed.data;
      const parsedYear = year;

      const indexed = await vectorStoreService.indexDocument({
        title: title.trim(),
        content: content.trim(),
        author: typeof author === 'string' ? author.trim().slice(0, 300) : undefined,
        year: parsedYear,
        userId,
        documentId: typeof documentId === 'string' ? documentId.trim().slice(0, 200) : undefined
      });

      res.status(201).json({
        id: indexed.id,
        title: indexed.title,
        retrievalStatus: indexed.retrievalStatus,
        verificationStatus: 'unverified',
        embeddingDimensions: indexed.embedding?.length || 0,
        documentId: indexed.documentId || indexed.id,
        chunkCount: indexed.chunkCount || 1,
        indexingStatus: indexed.retrievalStatus
      });
    } catch (err: unknown) {
      console.error('RAG document indexing error:', err);
      res.status(500).json({ error: 'نەتوانرا بەڵگەنامەکە بۆ RAG ئیندێکس بکرێت.' });
    }
  });

  /**
   * POST /api/rag/hybrid-retrieve
   *
   * Retrieves only from the real pgvector-backed library index or the
   * process-local cache of documents explicitly indexed by the caller.
   * Retrieval relevance is not source verification.
   */
  router.post('/hybrid-retrieve', async (req: AuthRequest, res) => {
    try {
      const parsed = retrieveSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: 'داتای retrieval نادروستە.', issues: parsed.error.issues });
        return;
      }
      const { query, documentId, verifiedOnly, limit } = parsed.data;
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const safeLimit = Math.max(1, Math.min(20, Number.isFinite(Number(limit)) ? Math.round(Number(limit)) : 5));
      const results = await vectorStoreService.searchSimilarDocuments(query.trim(), userId, safeLimit, typeof documentId === 'string' ? documentId.trim() : undefined);

      const candidates = results
        .filter(result => !verifiedOnly || result.verificationStatus === 'verified')
        .map(result => ({
          chunkId: result.id,
          documentId: result.documentId || 'DOC-UNKNOWN',
          sourceId: result.id,
          sourceTitle: result.title,
          text: result.content,
          verificationStatus: result.verificationStatus || 'unverified',
          score: Math.max(0, Math.min(1, Number(result.score) || 0)),
          provenance: {
            author: result.author,
            year: result.year ? String(result.year) : undefined
          },
          retrievalStatus: result.retrievalStatus || 'in-memory-index'
        }));

      res.json({
        query: query.trim(),
        candidates,
        metrics: {
          lexicalMatchCount: candidates.filter(candidate => candidate.retrievalStatus === 'in-memory-index').length,
          semanticMatchCount: candidates.filter(candidate => candidate.retrievalStatus === 'persisted-vector').length,
          fusedCandidatesCount: candidates.length,
          rerankedCount: candidates.length,
          chunkCount: candidates.length > 0 ? new Set(candidates.map(candidate => candidate.documentId)).size : 0
        },
        retrievalStatus: candidates.length > 0 ? 'available' : 'no-matching-indexed-content',
        verificationPolicy: 'retrieval-relevance-does-not-imply-source-verification'
      });
    } catch (err: unknown) {
      console.error('RAG Hybrid Retrieve Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پرۆسەی گەڕانی RAG دروست بوو.' });
    }
  });

  return router;
}
