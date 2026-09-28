import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { researchProjectStateService } from '../services/research-project-state.service';
import type { AuthRequest } from '../../middleware/auth';

export function createResearchProjectStateRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * GET /api/workspace/:workspaceId
   */
  router.get('/:workspaceId', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }
      const { workspaceId } = req.params;
      if (!workspaceId || workspaceId.length > 128) {
        res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
        return;
      }
      const ws = await researchProjectStateService.hydrateWorkspace(userId, workspaceId);
      res.json(ws);
    } catch (err: unknown) {
      console.error('Workspace Get Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە خوێندنەوەی باری واڕکسپەیسدا دروست بوو.' });
    }
  });

  /**
   * POST /api/workspace/:workspaceId/save
   */
  router.post('/:workspaceId/save', async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }
      const { workspaceId } = req.params;
      if (!workspaceId || workspaceId.length > 128) {
        res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
        return;
      }
      const { draftContent, activeChapter } = req.body;
      await researchProjectStateService.hydrateWorkspace(userId, workspaceId);

      const updated = await researchProjectStateService.updateWorkspaceContent(userId, workspaceId, draftContent || '', activeChapter);
      await researchProjectStateService.persistWorkspace(updated);
      res.json(updated);
    } catch (err: unknown) {
      console.error('Workspace Save Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پاشەکەوتکردنی واڕکسپەیسدا دروست بوو.' });
    }
  });

  /**
   * POST /api/workspace/:workspaceId/orchestrate
   */
  router.post('/:workspaceId/orchestrate', async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }
      const { workspaceId } = req.params;
      if (!workspaceId || workspaceId.length > 128) {
        res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
        return;
      }
      const { topic, discipline } = req.body;

      if (!topic) {
        res.status(400).json({ error: 'تەوەرەی توێژینەوە (topic) پێویستە.' });
        return;
      }

      const result = await researchProjectStateService.runFullWorkspaceOrchestration(
        userId,
        workspaceId,
        topic,
        discipline || 'گشتی',
        getGeminiClient
      );

      res.json(result);
    } catch (err: unknown) {
      console.error('Workspace Orchestrate Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە جێبەجێکردنی پرۆسەی سەرانسەریی واڕکسپەیسدا ڕووی دا.' });
    }
  });

  return router;
}
