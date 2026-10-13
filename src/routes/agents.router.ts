import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  academicAgentsService,
  ACADEMIC_AGENTS_LIST,
} from '../services/academic-agents.service';

export const agentsRouter = Router();

const runAgentSchema = z.object({
  agentId: z.string().trim().min(1).max(100),
  prompt: z.string().trim().min(1).max(20_000),
  context: z.string().max(40_000).optional()
}).strict();

// پیشاندانی لیستی سەرجەم ١٢ بریکارە ئەکادیمییە پسپۆڕەکە
agentsRouter.get('/list', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: ACADEMIC_AGENTS_LIST.length,
    agents: ACADEMIC_AGENTS_LIST,
  });
});

// وەرگرتنی زانیاری دەربارەی بریکارێکی دیاریکراو
agentsRouter.get('/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;
  const agent = ACADEMIC_AGENTS_LIST.find((a) => a.id === agentId);
  if (!agent) {
    res.status(404).json({
      success: false,
      error: `بریکار بە ناسنامەی '${agentId}' نەدۆزرایەوە.`,
    });
    return;
  }
  res.json({ success: true, agent });
});

// جێبەجێکردنی داواکاری و ئەرکی ئەکادیمی لە ڕێگەی بریکارەوە
agentsRouter.post(
  '/run',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = runAgentSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'داتای ناردراو بۆ بریکاری ئەکادیمی نادروستە.',
          issues: parsed.error.issues
        });
        return;
      }

      const { agentId, prompt, context } = parsed.data;
      if (!ACADEMIC_AGENTS_LIST.some(agent => agent.id === agentId)) {
        res.status(404).json({ success: false, error: 'بریکاری ئەکادیمی نەدۆزرایەوە.' });
        return;
      }

      const result = await academicAgentsService.runAgent(
        agentId,
        prompt,
        context
      );
      const degraded = result.startsWith('[DEGRADED — AI PROVIDER UNAVAILABLE]');
      res.status(degraded ? 503 : 200).json({
        success: !degraded,
        generationSucceeded: !degraded,
        degraded,
        status: degraded ? 'AI_PROVIDER_UNAVAILABLE' : 'completed',
        agentId,
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);
