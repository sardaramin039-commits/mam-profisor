import { Router, Request, Response } from 'express';
import { requireRole, ExtendedAuthRequest } from './middleware/rbac.middleware';
import { requireAuth } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import { crawlerEngine } from '../services/crawler-engine';

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
        query.length > 2_000
      ) {
        res.status(400).json({ error: 'Query must contain 2 to 2000 characters.' });
        return;
      }
      const safeQuery = query.trim();
      const safeLanguage = typeof language === 'string' ? language.trim().slice(0, 60) : 'سۆرانی';

      const ai = getGeminiClient();
      const prompt = `شیکاری سیمانتیکی و فرانۆشکردنی گەڕان بکە بۆ ئەم داواکارییەی گەڕان لە کتێبخانەی دیجیتاڵیی کوردی:
داواکاریی گەڕان (JSON string): ${JSON.stringify(safeQuery)}
زمانی خوازراو: ${safeLanguage}

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

      const responseText = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { expandedKeywords: [query], aiSummary: 'ئەنجامەکانی گەڕانی سیمانتیکی' };
      }

      res.json(parsed);
    } catch (err) {
      console.warn('Semantic library search unavailable:', err);
      res.status(503).json({
        success: false,
        degraded: true,
        retrievalStatus: 'unavailable',
        error: 'فراوانکردنی گەڕان بە AI بەردەست نییە؛ هیچ ئەنجامی گەڕانی ڕاستەوخۆ پشتڕاست نەکراوەتەوە.'
      });
    }
  });

  // 4. POST /api/library/sync - Trigger 24h Crawler Sync
  router.post('/sync', requireAuth, requireRole('admin', 'professor'), async (_req: ExtendedAuthRequest, res: Response) => {
    try {
      const log = await crawlerEngine.triggerSync();
      const synchronized = log.status === 'success';
      res.status(synchronized ? 200 : 503).json({
        success: synchronized,
        status: log.status,
        message: log.message,
        log
      });
    } catch {
      res.status(500).json({ error: 'Failed to run crawler synchronization' });
    }
  });

  // 5. POST /api/library/ocr - OCR from a real page image
  router.post('/ocr', async (req: Request, res: Response) => {
    try {
      const { imageDataUrl } = req.body || {};
      if (typeof imageDataUrl !== 'string' || imageDataUrl.length > 11_200_000) {
        res.status(413).json({ error: 'A PNG, JPEG, or WebP page image up to 8 MiB is required.' });
        return;
      }

      const commaIndex = imageDataUrl.indexOf(',');
      const header = commaIndex >= 0 ? imageDataUrl.slice(0, commaIndex) : '';
      const data = commaIndex >= 0 ? imageDataUrl.slice(commaIndex + 1) : '';
      const mimeMatch = /^data:image\/(png|jpeg|webp);base64$/i.exec(header);
      const allowedMimeType = mimeMatch?.[1]?.toLowerCase();
      const validBase64 = data.length > 0 && data.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(data);

      if (!allowedMimeType || !validBase64) {
        res.status(400).json({ error: 'Only valid base64 data URLs for PNG, JPEG, and WebP are supported.' });
        return;
      }

      const decodedBytes = (data.length / 4) * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
      if (decodedBytes > 8 * 1024 * 1024) {
        res.status(413).json({ error: 'Page image exceeds the 8 MiB decoded limit.' });
        return;
      }

      const mimeType = `image/${allowedMimeType}`;
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
  router.get('/admin/stats', requireAuth, requireRole('admin', 'professor'), (_req: ExtendedAuthRequest, res: Response) => {
    try {
      const stats = crawlerEngine.getAdminStats();
      res.json(stats);
    } catch {
      res.status(500).json({ error: 'Failed to get admin stats' });
    }
  });

  return router;
}
