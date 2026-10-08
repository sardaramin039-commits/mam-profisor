import { Router } from 'express';
import { z } from 'zod';
import { assembleManuscript } from '../services/manuscript-assembly.service';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import type { AuthRequest } from '../../middleware/auth';

const id = z.string().trim().min(1).max(128);

const chapterSchema = z.object({
  id,
  title: z.string().trim().min(1).max(500),
  order: z.number().int().min(1).max(1000),
  content: z.string().max(500_000),
  citationIds: z.array(id).max(500).default([])
}).strict();

const citationSchema = z.object({
  citationId: id,
  sourceId: id,
  inText: z.string().trim().max(500),
  bibliography: z.string().trim().max(5000),
  verified: z.boolean(),
  evidenceId: id.optional()
}).strict();

const assembleSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  abstract: z.string().max(100_000).optional(),
  researchQuestion: z.string().max(10_000).optional(),
  methodology: z.string().max(100_000).optional(),
  chapters: z.array(chapterSchema).min(1).max(100),
  conclusion: z.string().max(100_000).optional(),
  citations: z.array(citationSchema).max(500).default([])
}).strict();

export function createManuscriptAssemblyRouter(): Router {
  const router = Router();

  router.post('/:workspaceId/assemble', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const workspaceId = req.params['workspaceId'];

    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }

    const idCheck = id.safeParse(workspaceId);
    if (!idCheck.success) {
      res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
      return;
    }

    const parsed = assembleSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای manuscript نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const control = await researchControlPlaneService.snapshot(userId, workspaceId);
      const manuscript = assembleManuscript({
        projectId: workspaceId,
        ...parsed.data
      });

      const exportBlocked = control.gates.exportBlocked || manuscript.integrity.structuralStatus !== 'PASS';
      res.status(exportBlocked ? 409 : 200).json({
        success: !exportBlocked,
        exportBlocked,
        controlPlane: control,
        manuscript
      });
    } catch (error) {
      console.error('Manuscript assembly error:', error);
      res.status(500).json({ error: 'نەتوانرا manuscript کۆبکرێتەوە.' });
    }
  });

  return router;
}
