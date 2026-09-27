import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

export function createRagRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/rag/hybrid-retrieve
   */
  router.post('/hybrid-retrieve', async (req, res) => {
    try {
      const { query, documentId, verifiedOnly } = req.body;
      if (!query) {
        res.status(400).json({ error: 'داواکاری گەڕان (query) پێویستە.' });
        return;
      }

      const mockCandidates = [
        {
          chunkId: 'CHK-001',
          documentId: documentId || 'DOC-DEFAULT',
          sourceId: 'SRC-001',
          sourceTitle: 'کتێبی زانستیی سۆرانی',
          text: `دەقی زانستی پەیوەندیدار بە "${query}" لە سەرچاوەی سەلمێنراودا.`,
          verificationStatus: 'verified',
          score: 0.92,
          provenance: {
            author: 'د. عومەر کەریم',
            year: '2023',
            publisher: 'دەزگای موکریانی'
          }
        }
      ];

      res.json({
        query,
        candidates: verifiedOnly ? mockCandidates.filter(c => c.verificationStatus === 'verified') : mockCandidates,
        metrics: {
          lexicalMatchCount: 1,
          semanticMatchCount: 1,
          fusedCandidatesCount: 1,
          rerankedCount: 1
        }
      });
    } catch (err: unknown) {
      console.error('RAG Hybrid Retrieve Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پرۆسەی گەڕانی RAG دروست بوو.' });
    }
  });

  return router;
}
