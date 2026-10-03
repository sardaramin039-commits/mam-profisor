import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { researchMemoryService } from '../services/research-memory.service';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth';

const projectIdSchema = z.string().regex(
  /^[A-Za-z0-9_-]{1,128}$/,
  'ناسنامەی پڕۆژە تەنها دەتوانێت پیت، ژمارە، - و _ هەبێت.'
);

const memoryItemSchema = z.object({
  topic: z.string().trim().max(500).optional(),
  type: z.enum(['note', 'claim', 'evidence', 'source', 'summary', 'draft_chapter']),
  content: z.string().trim().min(1).max(100_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  metadata: z.record(z.string(), z.unknown()).optional()
});

function parseProjectId(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = projectIdSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function createResearchMemoryRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();

  router.get('/:projectId', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const projectId = parseProjectId(req.params['projectId']);
      if (!projectId) {
        res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
        return;
      }

      const projectState = await researchMemoryService.hydrateProjectState(userId, projectId);
      res.json(projectState);
    } catch (err: unknown) {
      console.error('Research Memory Get Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە وەرگرتنی یادگەی توێژینەوەکەدا ڕووی دا.' });
    }
  });

  router.post('/:projectId/items', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const projectId = parseProjectId(req.params['projectId']);
      if (!projectId) {
        res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
        return;
      }

      const parsed = memoryItemSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          error: 'داتای بڕگەی یادگە نادروستە.',
          issues: parsed.error.issues
        });
        return;
      }

      await researchMemoryService.hydrateProjectState(userId, projectId);
      const newItem = await researchMemoryService.addMemoryItem(userId, projectId, {
        userId,
        topic: parsed.data.topic || 'توێژینەوەی ئەکادیمی',
        type: parsed.data.type,
        content: parsed.data.content,
        tags: parsed.data.tags,
        metadata: parsed.data.metadata
      });

      res.status(201).json(newItem);
    } catch (err: unknown) {
      console.error('Research Memory Add Item Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە تۆمارکردنی بڕگەی نوێدا ڕووی دا.' });
    }
  });

  router.post('/:projectId/summarize', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }

      const projectId = parseProjectId(req.params['projectId']);
      if (!projectId) {
        res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
        return;
      }

      const summary = await researchMemoryService.summarizeMemoryWithAI(
        userId,
        projectId,
        getGeminiClient
      );
      res.json({ summary });
    } catch (err: unknown) {
      console.error('Research Memory Summarize Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە دروستکردنی پوختەی یادگەدا ڕووی دا.' });
    }
  });

  return router;
}
