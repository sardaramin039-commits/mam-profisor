import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { vectorStoreService } from '../../services/vector-store.service';

export function createRagRouter(_getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/rag/index-document
   * Indexes caller-owned content into the private pgvector library.
   */
  router.post('/index-document', async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const { title, content, author, year, documentId } = req.body || {};
      if (
        typeof title !== 'string' ||
        title.trim().length < 3 ||
        title.trim().length > 500 ||
        typeof content !== 'string' ||
        content.trim().length < 20 ||
        content.length > 200_000
      ) {
        res.status(400).json({ error: 'ناونیشان و ناوەڕۆکی بەڵگەنامەکە نادروستن.' });
        return;
      }

      const parsedYear = year === undefined || year === null || year === ''
        ? undefined
        : Number(year);

      if (parsedYear !== undefined && (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > 2100)) {
        res.status(400).json({ error: 'ساڵی بڵاوکردنەوە نادروستە.' });
        return;
      }

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
  router.post('/hybrid-retrieve', async (req, res) => {
    try {
      const { query, documentId, verifiedOnly = false, limit = 5 } = req.body || {};
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'داواکاری گەڕان (query) پێویستە.' });
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
