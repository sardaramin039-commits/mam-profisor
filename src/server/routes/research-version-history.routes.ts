import { Router } from 'express';
import { z } from 'zod';
import { researchVersionHistoryService } from '../services/research-version-history.service';
import type { AuthRequest } from '../../middleware/auth';

const createSchema = z.object({
  projectId: z.string().trim().min(1).max(128),
  workspaceId: z.string().trim().min(1).max(128),
  chapter: z.string().trim().max(500).default(''),
  content: z.string().max(500_000),
  summary: z.string().trim().max(5000).default(''),
  source: z.enum(['manual', 'autosave', 'orchestration']).default('manual')
});

export function createResearchVersionHistoryRouter(): Router {
  const router = Router();

  router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }
    try {
      const limit = Number(req.query['limit'] ?? 50);
      res.json({ versions: await researchVersionHistoryService.list(userId, Number.isFinite(limit) ? limit : 50) });
    } catch (error) {
      console.error('Version history list error:', error);
      res.status(500).json({ error: 'نەتوانرا مێژووی وەشانەکان بخوێندرێتەوە.' });
    }
  });

  router.post('/', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }
    const parsed = createSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'داتای وەشان نادروستە.', issues: parsed.error.issues });
      return;
    }
    try {
      const version = await researchVersionHistoryService.create(userId, parsed.data);
      res.status(version ? 201 : 204).json(version);
    } catch (error) {
      console.error('Version history create error:', error);
      res.status(500).json({ error: 'نەتوانرا وەشانەکە تۆمار بکرێت.' });
    }
  });

  return router;
}
