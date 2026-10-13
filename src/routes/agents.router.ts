import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../middleware/auth';
import {
  academicAgentsService,
  ACADEMIC_AGENTS_LIST,
} from '../services/academic-agents.service';

export const agentsRouter = Router();

const runAgentSchema = z.object({
  agentId: z.string().trim().min(1).max(100)
    .refine(id => ACADEMIC_AGENTS_LIST.some(agent => agent.id === id), 'ناسنامەی بریکار نادروستە.'),
  prompt: z.string().trim().min(1).max(20_000),
  context: z.string().max(40_000).optional().default('')
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

// ئەم endpoint ـە دەتوانێت API ـی AI بەکاربهێنێت؛ دەسەڵات و قەبارەی داواکاری پێش جێبەجێکردن دەپشکنرێن.
agentsRouter.post(
  '/run',
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const parsed = runAgentSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'داتای داواکاریی بریکاری ئەکادیمی نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const execution = await academicAgentsService.runAgent(
        parsed.data.agentId,
        parsed.data.prompt,
        parsed.data.context
      );
      const succeeded = execution.status === 'generated';
      res.status(succeeded ? 200 : 503).json({
        success: succeeded,
        status: execution.status,
        agentId: parsed.data.agentId,
        result: execution.content,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);
