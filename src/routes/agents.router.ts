import { Router, Request, Response, NextFunction } from 'express';
import {
  academicAgentsService,
  ACADEMIC_AGENTS_LIST,
} from '../services/academic-agents.service';

export const agentsRouter = Router();

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
      const { agentId, prompt, context } = req.body as {
        agentId?: string;
        prompt?: string;
        context?: string;
      };

      if (!agentId || !prompt || prompt.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'دیاریکردنی هەردوو بڕگەی agentId و prompt پێویستە.',
        });
        return;
      }

      const result = await academicAgentsService.runAgent(
        agentId,
        prompt,
        context
      );
      res.json({
        success: true,
        agentId,
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);
