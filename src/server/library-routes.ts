import { Router, Request, Response } from 'express';
import { requireRole, ExtendedAuthRequest } from './middleware/rbac.middleware';
import { GoogleGenAI } from '@google/genai';
import { crawlerEngine } from '../services/crawler-engine';
import { requireAuth } from '../middleware/auth';

export function createLibraryRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  // 1. GET /api/library/books - List & Filter Catalog
  router.get('/books', (_req: Request, res: Response) => {
    try {
      const catalog = crawlerEngine.getCatalog();
      res.json({
        total: catalog.length,
        books: catalog
      });
    } catch {
      res.status(500).json({ error: 'Failed to retrieve books catalog' });
    }
  });

  // 2. GET /api/library/sources - 40 Digital Library Repositories Status
  router.get('/sources', (_req: Request, res: Response) => {
    try {
      const sources = crawlerEngine.getSources();
      res.json({
        total: sources.length,
        sources
      });
    } catch {
      res.status(500).json({ error: 'Failed to retrieve sources list' });
    }
  });

  // 3. POST /api/library/search - AI Semantic Search & Query Expansion
  router.post('/search', requireAuth, async (req: Request, res: Response) => {
    try {
      const { query, language } = req.body || {};
      if (
        typeof query !== 'string' ||
        query.trim().length < 2 ||
        query.length > 5000 ||
        (language !== undefined && (typeof language !== 'string' || language.length > 50))
      ) {
        res.status(400).json({ error: 'Valid query (2-5000 characters) and optional language are required.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `شیکاری سیمانتیکی و فرانۆشکردنی گەڕان بکە بۆ ئەم داواکارییەی گەڕان لە کتێبخانەی دیجیتاڵیی کوردی:
داواکاری: "${query}"
زمانی خوازراو: ${language || 'سۆرانی'}

تکایە وەڵام بە فۆرماتی JSON بدەرەوە بەم شێوەیە:
{
  "expandedKeywords": ["کلیلەوشەی ١", "کلیلەوشەی ٢"],
  "intent": "پوختەی ئامانجی لێکۆڵینەوەکە",
  "recommendedCategories": ["مێژوو", "زمانەوانی"],
  "aiSummary": "پوختەیەکی زانستی کورت لەسەر بابەتەکە بۆ توێژەر"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const responseText = response.text || '';
      let parsed: Record<string, unknown>;
      try {
        const candidate = JSON.parse(responseText) as unknown;
        if (
          !candidate ||
          typeof candidate !== 'object' ||
          Array.isArray(candidate) ||
          !Array.isArray((candidate as Record<string, unknown>)['expandedKeywords']) ||
          typeof (candidate as Record<string, unknown>)['aiSummary'] !== 'string'
        ) {
          throw new Error('Invalid semantic-search response shape.');
        }
        parsed = candidate as Record<string, unknown>;
      } catch {
        res.status(502).json({
          success: false,
          degraded: true,
          status: 'AI_RESPONSE_INVALID',
          error: 'AI نەیتوانی وەڵامێکی پێکهاتەدار بۆ گەڕانی سیمانتیکی بدات.'
        });
        return;
      }

      res.json({ success: true, degraded: false, ...parsed });
    } catch (err) {
      console.warn('Semantic search provider unavailable:', err);
      res.status(503).json({
        success: false,
        degraded: true,
        status: 'AI_PROVIDER_UNAVAILABLE',
        error: 'گەڕانی سیمانتیکی بەردەست نییە؛ هیچ ئەنجامی ڕاستەوخۆی کتێبخانە بە ساختە پیشان نادرێت.'
      });
    }
  });

  // 4. POST /api/library/sync - Trigger 24h Crawler Sync
  router.post('/sync', requireRole('admin', 'professor'), async (_req: ExtendedAuthRequest, res: Response) => {
    try {
      const log = await crawlerEngine.triggerSync();
      const success = log.status === 'success';
      res.json({
        success,
        degraded: !success,
        message: log.message,
        log
      });
    } catch {
      res.status(500).json({ error: 'Failed to run crawler synchronization' });
    }
  });

  // 5. POST /api/library/ocr - OCR from a real page image
  router.post('/ocr', requireAuth, async (req: Request, res: Response) => {
    try {
      const { imageDataUrl } = req.body || {};
      if (typeof imageDataUrl !== 'string' || imageDataUrl.length > 12_000_000) {
        res.status(400).json({ error: 'Valid page image is required (maximum 8 MB decoded input).' });
        return;
      }

      const commaIndex = imageDataUrl.indexOf(',');
      const header = commaIndex >= 0 ? imageDataUrl.slice(0, commaIndex) : '';
      const data = commaIndex >= 0 ? imageDataUrl.slice(commaIndex + 1) : '';
      const mimeMatch = header.startsWith('data:image/') ? header.slice('data:image/'.length).split(';')[0] : '';
      const allowedMimeTypes = new Set(['png', 'jpeg', 'webp']);

      if (commaIndex < 0 || !allowedMimeTypes.has(mimeMatch) || !data) {
        res.status(400).json({ error: 'Only PNG, JPEG, and WebP page images are supported.' });
        return;
      }

      const mimeType = `image/${mimeMatch}`;
      const ai = getGeminiClient();
      const prompt = 'OCR ـی ئەم وێنەی لاپەڕەی بەڵگەنامە بکە. تەنها ئەو دەقەی بە ڕاستی لە وێنەکەدا دەبینرێت بنووسە. هیچ وشە، ڕستە، سەرچاوە یان زانیارییەکی خەیاڵی زیاد مەکە. هێڵبەندی و ژمارەکانی لاپەڕە تا ئەوەی دەتوانیت بپارێزە.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ],
        config: { temperature: 0.1 }
      });

      const text = response.text?.trim();
      if (!text) {
        res.status(422).json({ error: 'OCR returned no text.' });
        return;
      }

      res.json({ text });
    } catch (err) {
      console.warn('Library OCR failed:', err);
      res.status(502).json({ error: 'OCR service failed. Please retry.' });
    }
  });

  // 6. GET /api/library/admin/stats - Admin Metrics
  router.get('/admin/stats', requireRole('admin', 'professor'), (_req: ExtendedAuthRequest, res: Response) => {
    try {
      const stats = crawlerEngine.getAdminStats();
      res.json(stats);
    } catch {
      res.status(500).json({ error: 'Failed to get admin stats' });
    }
  });

  return router;
}
