import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { vectorStoreService } from '../../services/vector-store.service';

export function createRagRouter(_getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/rag/hybrid-retrieve
   * Real retrieval endpoint. It never fabricates source records.
   */
  router.post('/hybrid-retrieve', async (req, res) => {
    try {
      const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
      const documentId = typeof req.body?.documentId === 'string' ? req.body.documentId.trim() : '';
      const verifiedOnly = req.body?.verifiedOnly === true;
      const limitRaw = Number(req.body?.limit);
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.trunc(limitRaw), 1), 20)
        : 5;

      if (!query) {
        res.status(400).json({ error: 'داواکاری گەڕان (query) پێویستە.' });
        return;
      }

      const documents = await vectorStoreService.searchSimilarDocuments(query, limit);
      const filtered = documentId
        ? documents.filter(document => document.id === documentId)
        : documents;

      const candidates = filtered.map(document => ({
        chunkId: document.id,
        documentId: document.id,
        sourceId: document.id,
        sourceTitle: document.title,
        text: document.content,
        verificationStatus: 'unverified' as const,
        score: document.score ?? document.similarity ?? 0,
        provenance: {
          author: document.author,
          year: document.year
        }
      })).filter(candidate => !verifiedOnly || candidate.verificationStatus === 'verified');

      res.json({
        query,
        candidates,
        metrics: {
          lexicalMatchCount: 0,
          semanticMatchCount: documents.length,
          fusedCandidatesCount: candidates.length,
          rerankedCount: candidates.length
        },
        grounded: candidates.length > 0,
        requiresVerification: candidates.some(candidate => candidate.verificationStatus !== 'verified')
      });
    } catch (err: unknown) {
      console.error('RAG Hybrid Retrieve Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پرۆسەی گەڕانی RAG دروست بوو.' });
    }
  });

  return router;
}
