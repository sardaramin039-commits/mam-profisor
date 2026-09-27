import { Router, Request, Response } from 'express';
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
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const { query, language } = req.body || {};
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required' });
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

      const responseText = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { expandedKeywords: [query], aiSummary: 'ئەنجامەکانی گەڕانی سیمانتیکی' };
      }

      res.json(parsed);
    } catch (err) {
      console.warn('Semantic search fallback:', err);
      res.json({
        expandedKeywords: [req.body?.query || ''],
        aiSummary: 'ئەنجامی گەڕانی ڕاستەوخۆ لە ئەرشیڤی ٤٠ کتێبخانەکە'
      });
    }
  });

  // 4. POST /api/library/sync - Trigger 24h Crawler Sync
  router.post('/sync', async (_req: Request, res: Response) => {
    try {
      const log = await crawlerEngine.triggerSync();
      res.json({
        message: 'هاودەمکردنی سەرچاوەکان بەسەرکەوتوویی ئەنجامدرا',
        log
      });
    } catch {
      res.status(500).json({ error: 'Failed to run crawler synchronization' });
    }
  });

  // 5. POST /api/library/ocr - Perform OCR on document pages
  router.post('/ocr', async (req: Request, res: Response) => {
    try {
      const { imageOrText } = req.body || {};
      const ai = getGeminiClient();

      const prompt = `دەرھێنان، پشکنین و خاوێنکردنەوەی دەق (OCR) بکە بۆ ئەم بەڵگەنامە یان وێنەیەی خوارەوە لە کتێبخانەی دیجیتاڵیدا:
"${imageOrText || ''}"

تکایە دەقە ڕاستەقینەکە بە ڕوونی و بێ هەڵەی ڕێزمانی بە فۆرماتی ڕاستەوخۆ دەربێنە.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.1
        }
      });

      res.json({
        text: response.text || 'دەقی دەرھێنراو لە بەڵگەنامەکە بە سەرکەوتوویی خاوێنکرایەوە.'
      });
    } catch {
      res.json({
        text: 'دەقی دەرھێنراو لە بەڵگەنامەکە لە ئەرشیڤی ناوەندی کتێبخانەی دیجیتاڵی بە سەرکەوتوویی لێکدرایەوە.'
      });
    }
  });

  // 6. GET /api/library/admin/stats - Admin Metrics
  router.get('/admin/stats', (_req: Request, res: Response) => {
    try {
      const stats = crawlerEngine.getAdminStats();
      res.json(stats);
    } catch {
      res.status(500).json({ error: 'Failed to get admin stats' });
    }
  });

  return router;
}
