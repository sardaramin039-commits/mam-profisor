import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { academicLevelCriticService } from '../services/academic-level-critic.service';

const refineSchema = z.object({
  draftMarkdown: z.string().trim().min(1).max(80_000),
  level: z.enum(['school', 'bachelor', 'master', 'phd', 'professor']),
  subSectionTitle: z.string().trim().min(1).max(500)
}).strict();

export function createAcademicCriticRouter(): Router {
  const router = Router();

  router.post('/refine-section', async (req: Request, res: Response): Promise<void> => {
    const parsed = refineSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای ناردراو بۆ پشکنینی ئەکادیمی نادروستە.',
        details: parsed.error.issues
      });
      return;
    }

    try {
      const result = await academicLevelCriticService.verifyAndRefineSection(
        parsed.data.draftMarkdown,
        parsed.data.level,
        parsed.data.subSectionTitle
      );
      res.json(result);
    } catch (error: unknown) {
      // Provider errors may contain request details; keep those details out of client responses/logs.
      const errorName = error instanceof Error ? error.name : typeof error;
      console.error('[academic-critic] section refinement failed:', errorName);
      res.status(502).json({
        error: 'پشکنینی ئەکادیمی تەواو نەبوو؛ دەقی بنەڕەتی بپارێزە.',
        code: 'ACADEMIC_CRITIC_FAILED'
      });
    }
  });

  return router;
}
