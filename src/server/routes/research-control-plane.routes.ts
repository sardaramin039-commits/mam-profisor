import { Router } from 'express';
import { researchControlPlaneService } from '../services/research-control-plane.service';
import type { AuthRequest } from '../../middleware/auth';

export function createResearchControlPlaneRouter(): Router {
  const router = Router();

  router.get('/:projectId', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const projectId = req.params.projectId;
    if (!userId) {
      res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
      return;
    }
    if (!projectId || projectId.length > 128) {
      res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
      return;
    }
    try {
      res.json(await researchControlPlaneService.snapshot(userId, projectId));
    } catch (error) {
      console.error('Research control plane error:', error);
      res.status(500).json({ error: 'نەتوانرا دۆخی سەرانسەری توێژینەوە بخوێندرێتەوە.' });
    }
  });

  return router;
}
