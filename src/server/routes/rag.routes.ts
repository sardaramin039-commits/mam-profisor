import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

export function createRagRouter(_getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/rag/hybrid-retrieve
   *
   * The retrieval backend is intentionally fail-closed until a real indexed
   * corpus/vector search is available. No mock scholarly records are returned.
   */
  router.post('/hybrid-retrieve', async (req, res) => {
    try {
      const { query, documentId } = req.body || {};

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'داواکاری گەڕان (query) پێویستە.' });
        return;
      }

      res.json({
        query: query.trim(),
        documentId: typeof documentId === 'string' ? documentId : 'DOC-UNKNOWN',
        candidates: [],
        metrics: {
          lexicalMatchCount: 0,
          semanticMatchCount: 0,
          fusedCandidatesCount: 0,
          rerankedCount: 0
        },
        retrievalStatus: 'unavailable',
        message: 'موتۆری RAG لەم ژینگەیەدا corpus ـی ئیندێکسکراوی پشتڕاستکراوی نییە؛ هیچ بەڵگەی ساختە ناداتەوە.'
      });
    } catch (err: unknown) {
      console.error('RAG Hybrid Retrieve Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پرۆسەی گەڕانی RAG دروست بوو.' });
    }
  });

  return router;
}
