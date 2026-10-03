import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { multiAgentOrchestratorService } from '../services/multi-agent-orchestrator.service';

const orchestrationSchema = z.object({
  topic: z.string().trim().min(2).max(500),
  discipline: z.string().trim().max(200).default('گشتی'),
  draftText: z.string().max(250_000).default(''),
  rawSources: z.array(z.record(z.string(), z.unknown())).max(100).default([]),
  citationStyle: z.enum(['APA7', 'MLA9', 'ChicagoAD', 'ChicagoNB', 'Harvard', 'IEEE']).default('APA7')
}).strict();

export function createMultiAgentRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();

  router.post('/orchestrate', async (req, res) => {
    const parsed = orchestrationSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای ئۆرکێستراکردنی Multi-Agent نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const result = await multiAgentOrchestratorService.executePipeline(
        parsed.data,
        getGeminiClient
      );
      res.json({ success: true, result });
    } catch (err: unknown) {
      console.error('MultiAgent Route Error:', err);
      res.status(500).json({
        error: 'کێشەیەک لە ڕێکخستنی بریکارەکاندا دروست بوو.'
      });
    }
  });

  return router;
}
