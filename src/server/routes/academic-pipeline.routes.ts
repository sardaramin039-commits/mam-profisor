import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { executeAcademicPipeline } from '../services/academic-pipeline.service';
import { getGeminiClient } from '../services/gemini.service';

const requestSchema = z.object({
  title: z.string().trim().min(2).max(500),
  level: z.enum(['school', 'bachelor', 'master', 'phd', 'professor']).default('phd')
}).strict();

function writeEvent(res: Response, event: unknown): boolean {
  if (res.destroyed || res.writableEnded) return false;
  return res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function createAcademicPipelineRouter(): Router {
  const router = Router();

  router.post('/stream', async (req: Request, res: Response): Promise<void> => {
    const parsed = requestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'ناونیشانی توێژینەوە یان ئاستی ئەکادیمی نادروستە.',
        details: parsed.error.issues
      });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let disconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) disconnected = true;
    });

    const pipeline = executeAcademicPipeline({
      title: parsed.data.title,
      level: parsed.data.level,
      getGeminiClient
    });

    try {
      for await (const event of pipeline) {
        if (disconnected || res.destroyed) {
          await pipeline.return(undefined);
          return;
        }
        if (!writeEvent(res, event)) {
          await pipeline.return(undefined);
          return;
        }
      }
      if (!disconnected && !res.destroyed) res.end();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'هەڵەیەکی نەزانراو ڕوویدا.';
      writeEvent(res, {
        stage: 'error',
        progressPercent: 0,
        message: 'زنجیرەی نووسین تەواو نەبوو؛ دەقی پێشوو وەک خۆی بپارێزە.',
        error: message
      });
      if (!res.destroyed) res.end();
    }
  });

  return router;
}
