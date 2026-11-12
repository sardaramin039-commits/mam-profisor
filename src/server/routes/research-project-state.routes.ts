import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { researchProjectStateService } from '../services/research-project-state.service';
import type { AuthRequest } from '../../middleware/auth';

const workspaceIdSchema = z.string().regex(
  /^[A-Za-z0-9_-]{1,128}$/,
  'ناسنامەی workspace تەنها دەتوانێت پیت، ژمارە، - و _ هەبێت.'
);

const saveSchema = z.object({
  draftContent: z.string().max(500_000).default(''),
  activeChapter: z.string().trim().max(500).optional()
}).strict();

const orchestrationSchema = z.object({
  topic: z.string().trim().min(2).max(500),
  discipline: z.string().trim().max(200).default('گشتی')
}).strict();

function parseWorkspaceId(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = workspaceIdSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function createResearchProjectStateRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();

  router.get('/:workspaceId', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const workspaceId = parseWorkspaceId(req.params['workspaceId']);
      if (!workspaceId) {
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

  router.post('/:workspaceId/save', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const workspaceId = parseWorkspaceId(req.params['workspaceId']);
      if (!workspaceId) {
        res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
        return;
      }

      const parsed = saveSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          error: 'داتای پاشەکەوتکردنی واڕکسپەیس نادروستە.',
          issues: parsed.error.issues
        });
        return;
      }

      await researchProjectStateService.hydrateWorkspace(userId, workspaceId);
      const updated = await researchProjectStateService.updateWorkspaceContent(
        userId,
        workspaceId,
        parsed.data.draftContent,
        parsed.data.activeChapter
      );
      res.json(updated);
    } catch (err: unknown) {
      console.error('Workspace Save Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پاشەکەوتکردنی واڕکسپەیسدا دروست بوو.' });
    }
  });

  router.post('/:workspaceId/orchestrate', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const workspaceId = parseWorkspaceId(req.params['workspaceId']);
      if (!workspaceId) {
        res.status(400).json({ error: 'ناسنامەی workspace نادروستە.' });
        return;
      }

      const parsed = orchestrationSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          error: 'داتای جێبەجێکردنی واڕکسپەیس نادروستە.',
          issues: parsed.error.issues
        });
        return;
      }

      const result = await researchProjectStateService.runFullWorkspaceOrchestration(
        userId,
        workspaceId,
        parsed.data.topic,
        parsed.data.discipline,
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
