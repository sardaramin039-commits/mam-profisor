import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { executeAcademicPipeline } from '../services/academic-pipeline.service';

const requestSchema = z.object({
  title: z.string().trim().min(2).max(500),
  level: z.enum(['school', 'bachelor', 'master', 'phd', 'professor']).default('phd')
}).strict();

async function writeEvent(res: Response, event: unknown): Promise<boolean> {
  if (res.destroyed || res.writableEnded) return false;
  const canContinue = res.write(`data: ${JSON.stringify(event)}\n\n`);
  if (canContinue) return true;

  // A false write result means backpressure, not a broken client. Wait for drain
  // or stop only if the connection closes/errors while we are waiting.
  return new Promise<boolean>(resolve => {
    const cleanup = (): void => {
      res.off('drain', onDrain);
      res.off('close', onClose);
      res.off('error', onClose);
    };
    const onDrain = (): void => {
      cleanup();
      resolve(!res.destroyed && !res.writableEnded);
    };
    const onClose = (): void => {
      cleanup();
      resolve(false);
    };

    res.once('drain', onDrain);
    res.once('close', onClose);
    res.once('error', onClose);
    if (res.destroyed || res.writableEnded) onClose();
  });
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
      level: parsed.data.level
    });

    try {
      for await (const event of pipeline) {
        if (disconnected || res.destroyed) {
          await pipeline.return(undefined);
          return;
        }
        if (!(await writeEvent(res, event))) {
          await pipeline.return(undefined);
          return;
        }
      }
      if (!disconnected && !res.destroyed) res.end();
    } catch (error: unknown) {
      // Keep provider, credential, and implementation details in server logs only.
      const errorName = error instanceof Error ? error.name : typeof error;
      console.error('[academic-pipeline] Streaming generation failed:', errorName);
      await writeEvent(res, {
        stage: 'error',
        progressPercent: 0,
        message: 'زنجیرەی نووسین بەهۆی کێشەیەکی سێرڤەر تەواو نەبوو؛ دەقی پێشوو وەک خۆی بپارێزە.'
      });
      if (!res.destroyed) res.end();
    }
  });

  return router;
}
