import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { openAiChatGptService } from '../services/openai-chatgpt.service';

const discoverSourcesSchema = z.object({
  query: z.string().trim().min(1).max(2000),
  discipline: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(8),
  timeframe: z.string().trim().max(100).optional()
}).strict();

const organizeReferencesSchema = z.object({
  topic: z.string().trim().min(1).max(2000),
  discipline: z.string().trim().max(200).optional(),
  rawReferences: z.string().max(100_000).default(''),
  citationStyle: z.string().trim().max(50).default('harvard'),
  language: z.string().trim().max(20).default('ckb')
}).strict();

export function createChatGptAcademicSourcesRouter(): Router {
  const router = Router();

  router.post('/discover-sources', async (req: Request, res: Response) => {
    const parsed = discoverSourcesSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای گەڕانی سەرچاوەکان نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const result = await openAiChatGptService.discoverAcademicSources(parsed.data);
      res.json(result);
    } catch (error: unknown) {
      console.error('[ChatGPT discover-sources error]:', error);
      res.status(500).json({
        error: 'کێشەیەک لە پەیوەندی بە خزمەتگوزاریی سەرچاوەکان ڕوویدا.'
      });
    }
  });

  router.post('/organize-references', async (req: Request, res: Response) => {
    const parsed = organizeReferencesSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای ڕێکخستنی سەرچاوەکان نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const result = await openAiChatGptService.organizeAndFormatReferences(parsed.data);
      res.json(result);
    } catch (error: unknown) {
      console.error('[ChatGPT organize-references error]:', error);
      res.status(500).json({
        error: 'کێشەیەک لە پەیوەندی بۆ ڕێکخستنی سەرچاوەکان ڕوویدا.'
      });
    }
  });

  router.get('/status', (_req: Request, res: Response) => {
    const key = openAiChatGptService.getApiKey();
    const isConfigured = Boolean(key && key.startsWith('sk-'));

    res.json({
      service: 'ChatGPT Academic Source Assistant',
      isConfigured,
      hasKey: isConfigured,
      capabilities: [
        'دۆزینەوەی سەرچاوەی ئەکادیمی',
        'ڕێکخستنی بەیبلۆگرافی',
        'ئامادەکردنی ئاماژەدانی ناو دەق'
      ]
    });
  });

  return router;
}
