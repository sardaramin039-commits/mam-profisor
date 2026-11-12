import { Router, Request, Response } from 'express';
import { DIGITAL_LIBRARY_SOURCES } from '../services/digital-library-sources';

export const libraryRouter = Router();

// تۆماری ٤٠ سەرچاوەی دیجیتاڵی؛ ژمارەی بەڵگەنامەکان تەنها دوای crawl ـی ڕاستەقینە دیاری دەکرێن.
libraryRouter.get('/sources', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: DIGITAL_LIBRARY_SOURCES.length,
    sources: DIGITAL_LIBRARY_SOURCES,
  });
});

// وەرگرتنی ئاماری گشتیی ئەرشیڤەکان
libraryRouter.get('/stats', (_req: Request, res: Response) => {
  const totalItems = DIGITAL_LIBRARY_SOURCES.reduce(
    (sum, s) => sum + (s.totalItems || 0),
    0
  );
  const categories: Record<string, number> = {};
  for (const s of DIGITAL_LIBRARY_SOURCES) {
    categories[s.category] = (categories[s.category] || 0) + 1;
  }

  res.json({
    success: true,
    totalArchives: DIGITAL_LIBRARY_SOURCES.length,
    totalDigitalDocuments: totalItems,
    categoriesDistribution: categories,
  });
});

// گەڕان لەنێو کەتەلۆگی سەرچاوە و ئەرشیڤەکان
libraryRouter.get('/search', (req: Request, res: Response) => {
  const q = ((req.query['q'] as string) || '').toLowerCase().trim();
  const category = (req.query['category'] as string) || '';

  let filtered = DIGITAL_LIBRARY_SOURCES;
  if (category) {
    filtered = filtered.filter((s) => s.category === category);
  }
  if (q) {
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameKurdish.includes(q) ||
        (s.description ? s.description.includes(q) : false)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    results: filtered,
  });
});

// وەرگرتنی زانیاری دەربارەی ئەرشیڤێکی دیاریکراو
libraryRouter.get('/sources/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const source = DIGITAL_LIBRARY_SOURCES.find((s) => s.id === id);
  if (!source) {
    return res.status(404).json({
      success: false,
      error: `ئەرشیڤ بە کۆدی '${id}' نەدۆزرایەوە.`,
    });
  }
  return res.json({ success: true, source });
});
