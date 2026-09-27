import { Router, Request, Response } from 'express';
import { openAiChatGptService } from '../services/openai-chatgpt.service';

/**
 * ڕێڕەوەکانی ChatGPT بۆ دۆزینەوە و ڕێکخستنی سەرچاوە ئەکادیمییەکان
 */
export function createChatGptAcademicSourcesRouter(): Router {
  const router = Router();

  /**
   * دۆزینەوەی سەرچاوە زانستییە نوێ و پێشەنگەکان لەڕێگەی ChatGPT
   */
  router.post('/discover-sources', async (req: Request, res: Response) => {
    try {
      const { query, discipline, limit, timeframe } = req.body;
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ error: 'تکایە بابەتی گەڕان بە دروستی بنووسە.' });
      }

      const result = await openAiChatGptService.discoverAcademicSources({
        query: query.trim(),
        discipline,
        limit: Number(limit) || 8,
        timeframe
      });

      return res.json(result);
    } catch (error: any) {
      console.error('[ChatGPT discover-sources error]:', error);
      return res.status(500).json({
        error: 'کێشەیەک لە پەیوەندی بە ChatGPT بۆ دۆزینەوەی سەرچاوەکان ڕوویدا.',
        details: error?.message || String(error)
      });
    }
  });

  /**
   * ڕێکخستن، پۆلێنکردن و فۆرماتکردنی سەرچاوەکان بە ستانداردەکانی APA, Harvard, MLA
   */
  router.post('/organize-references', async (req: Request, res: Response) => {
    try {
      const { topic, discipline, rawReferences, citationStyle, language } = req.body;
      if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({ error: 'تکایە ناونیشان یان بابەتی سەرەکی بنووسە.' });
      }

      const result = await openAiChatGptService.organizeAndFormatReferences({
        topic: topic.trim(),
        discipline,
        rawReferences,
        citationStyle: citationStyle || 'harvard',
        language: language || 'ckb'
      });

      return res.json(result);
    } catch (error: any) {
      console.error('[ChatGPT organize-references error]:', error);
      return res.status(500).json({
        error: 'کێشەیەک لە پەیوەندی بە ChatGPT بۆ ڕێکخستنی سەرچاوەکان ڕوویدا.',
        details: error?.message || String(error)
      });
    }
  });

  /**
   * پشکنینی دۆخی بەردەستبوونی کلیل و خزمەتگوزاریی ChatGPT
   */
  router.get('/status', (req: Request, res: Response) => {
    const key = openAiChatGptService.getApiKey();
    const isConfigured = Boolean(key && key.startsWith('sk-'));
    return res.json({
      service: 'ChatGPT Academic Source Assistant',
      isConfigured,
      hasKey: isConfigured,
      model: 'gpt-4o-mini',
      capabilities: [
        'دۆزینەوەی سەرچاوەی ئەکادیمی',
        'ڕێکخستنی بەیبلۆگرافی بە شێوازی Harvard, APA, MLA',
        'ئامادەکردنی ئاماژەدانی ناو دەق (In-text citations)'
      ]
    });
  });

  return router;
}
