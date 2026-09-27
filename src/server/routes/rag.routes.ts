import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { vectorStoreService } from '../../services/vector-store.service';

export function createRagRouter(_getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/rag/generate-embedding
   * Generates server-side Gemini Embedding 2 vectors for authenticated clients.
   */
  router.post('/generate-embedding', async (req, res) => {
    try {
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

      if (!text) {
        res.status(400).json({ error: 'دەقی embedding پێویستە.' });
        return;
      }

      if (text.length > 50_000) {
        res.status(413).json({ error: 'دەقەکە زۆر گەورەیە بۆ embedding؛ تکایە بەش بەش بنێرە.' });
        return;
      }

      const ai = _getGeminiClient();
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
        config: { outputDimensionality: 768 }
      });

      const embedding = response.embeddings?.[0]?.values || [];
      if (embedding.length !== 768) {
        res.status(502).json({ error: 'ژمارەی dimension ـەکانی embedding چاوەڕوانکراو نەبوو.' });
        return;
      }

      res.json({ embedding, dimensions: embedding.length, model: 'gemini-embedding-2' });
    } catch (err: unknown) {
      console.error('Embedding generation error:', err);
      res.status(500).json({ error: 'نەتوانرا embedding ـی دەق دروست بکرێت.' });
    }
  });

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
