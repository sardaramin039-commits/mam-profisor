import { Router, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import type { AuthRequest } from '../../middleware/auth';
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
  citationStyle: z.enum(['apa', 'harvard', 'mla', 'chicago']).default('harvard'),
  language: z.enum(['ckb', 'en', 'ar']).default('ckb')
}).strict();

export function createChatGptAcademicSourcesRouter(): Router {
  const router = Router();

  router.post('/discover-sources', async (req: AuthRequest, res: Response) => {
    const openAiEnabled =
      process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] === 'true' &&
      process.env['ALLOW_BILLABLE_AI'] === 'true';
    if (openAiEnabled && !req.user) {
      res.status(401).json({ error: 'ئەم مۆدەیە تەنها بۆ بەکارهێنەری authenticated ـە.' });
      return;
    }
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

  router.post('/organize-references', async (req: AuthRequest, res: Response) => {
    const openAiEnabled =
      process.env['ENABLE_OPENAI_REFERENCE_FORMATTING'] === 'true' &&
      process.env['ALLOW_BILLABLE_AI'] === 'true';
    if (openAiEnabled && !req.user) {
      res.status(401).json({ error: 'ئەم مۆدەیە تەنها بۆ بەکارهێنەری authenticated ـە.' });
      return;
    }
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

  router.get('/status', (_req: AuthRequest, res: Response) => {
    const key = process.env['OPENAI_API_KEY']?.trim() || '';
    const openAiEnabled =
      process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] === 'true' &&
      process.env['ALLOW_BILLABLE_AI'] === 'true';
    const isConfigured = Boolean(key.startsWith('sk-'));
    res.json({
      service: 'Academic Source Discovery',
      mode: openAiEnabled && isConfigured ? 'ChatGPT Web Search' : 'Free academic indexes',
      model: openAiEnabled && isConfigured
        ? (process.env['OPENAI_RESEARCH_MODEL'] || 'gpt-4o-mini')
        : 'free',
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
