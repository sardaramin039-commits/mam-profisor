import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { vectorStoreService } from '../../services/vector-store.service';

export function createRagRouter(_getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

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

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'داواکاری گەڕان (query) پێویستە.' });
        return;
      }

      const safeLimit = Math.max(1, Math.min(20, Number.isFinite(Number(limit)) ? Math.round(Number(limit)) : 5));
      const results = await vectorStoreService.searchSimilarDocuments(query.trim(), safeLimit);

      const candidates = results
        .filter(result => !verifiedOnly || result.verificationStatus === 'verified')
        .map(result => ({
          chunkId: result.id,
          documentId: typeof documentId === 'string' ? documentId : 'DOC-UNKNOWN',
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
          rerankedCount: candidates.length
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
