import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate.middleware';
import { academicSearchService } from '../services/academic-search.service';
import { vectorStoreService } from '../services/vector-store.service';

export const academicRouter = Router();

const searchSchema = z.object({
  query: z.object({
    q: z.string().min(2, 'دەبێت کەمتر لە ٢ پیت نەبێت'),
    limit: z.string().optional(),
  }),
});

// گەڕانی فرە-ناوەندی لەناو هەموو داتابەیسە جیهانییەکان بە Zod Validation
academicRouter.get(
  '/search',
  validateRequest(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query['q'] as string) || '';
      const limit = parseInt((req.query['limit'] as string) || '10', 10);

      const [openAlexResults, crossrefResults] = await Promise.all([
        academicSearchService.searchOpenAlex(query, limit),
        academicSearchService.searchCrossRef(query, limit),
      ]);

      res.json({
        success: true,
        query,
        count: openAlexResults.length + crossrefResults.length,
        results: [...openAlexResults, ...crossrefResults],
      });
    } catch (error) {
      next(error);
    }
  }
);

// گەڕان تەنها لە OpenAlex
academicRouter.get(
  '/openalex',
  validateRequest(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query['q'] as string) || '';
      const limit = parseInt((req.query['limit'] as string) || '10', 10);
      const results = await academicSearchService.searchOpenAlex(query, limit);
      res.json({ success: true, query, count: results.length, results });
    } catch (error) {
      next(error);
    }
  }
);

// گەڕان تەنها لە Crossref
academicRouter.get(
  '/crossref',
  validateRequest(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query['q'] as string) || '';
      const limit = parseInt((req.query['limit'] as string) || '10', 10);
      const results = await academicSearchService.searchCrossRef(query, limit);
      res.json({ success: true, query, count: results.length, results });
    } catch (error) {
      next(error);
    }
  }
);

// گەڕان تەنها لە Google Books
academicRouter.get(
  '/google-books',
  validateRequest(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query['q'] as string) || '';
      const limit = parseInt((req.query['limit'] as string) || '5', 10);
      const results = await academicSearchService.searchGoogleBooks(query, limit);
      res.json({ success: true, query, count: results.length, results });
    } catch (error) {
      next(error);
    }
  }
);

// گەڕانی ڤێکتەری لە بەڵگەنامە باوەڕپێکراوەکان
academicRouter.post(
  '/vector/search',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, limit } = req.body as { query?: string; limit?: number };
      if (!query) {
        res.status(400).json({ success: false, error: 'دیاریکردنی query پێویستە.' });
        return;
      }
      const results = await vectorStoreService.searchSimilarDocuments(query, limit || 5);
      res.json({ success: true, count: results.length, results });
    } catch (error) {
      next(error);
    }
  }
);

// ئیندێکسکردنی بەڵگەنامەی نوێ لە کۆگای ڤێکتەر
academicRouter.post(
  '/vector/index',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, author, year } = req.body as {
        title?: string;
        content?: string;
        author?: string;
        year?: number;
      };
      if (!title || !content) {
        res.status(400).json({
          success: false,
          error: 'دیاریکردنی title و content پێویستە.',
        });
        return;
      }
      const indexed = await vectorStoreService.indexDocument({
        title,
        content,
        author,
        year,
      });
      res.json({ success: true, document: indexed });
    } catch (error) {
      next(error);
    }
  }
);

// پشکنینی دۆخی تەندروستی و بەردەستبوونی APIـە ئەکادیمییەکان (Crossref, OpenAlex, Google Books)
academicRouter.get(
  '/apis-health',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await academicSearchService.checkApisHealth();
      res.json({ success: true, health });
    } catch (error) {
      next(error);
    }
  }
);

