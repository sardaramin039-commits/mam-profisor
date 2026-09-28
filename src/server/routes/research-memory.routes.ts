import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { researchMemoryService } from '../services/research-memory.service';
import { z } from 'zod';
import type { AuthRequest } from '../../middleware/auth';

const memoryItemSchema = z.object({
  topic: z.string().trim().max(500).optional(),
  type: z.enum(['note', 'claim', 'evidence', 'source', 'summary', 'draft_chapter']),
  content: z.string().trim().min(1).max(100_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export function createResearchMemoryRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * GET /api/research-memory/:projectId
   */
  router.get('/:projectId', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }
      const { projectId } = req.params;
      if (!projectId || projectId.length > 128) {
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

  /**
   * POST /api/research-memory/:projectId/items
   */
  router.post('/:projectId/items', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }
      const { projectId } = req.params;
      if (!projectId || projectId.length > 128) {
        res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
        return;
      }
      await researchMemoryService.hydrateProjectState(userId, projectId);
      const parsed = memoryItemSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: 'داتای بڕگەی یادگە نادروستە.', issues: parsed.error.issues });
        return;
      }

      const newItem = await researchMemoryService.addMemoryItem(userId, projectId, {
        userId,
        topic: parsed.data.topic || 'توێژینەوەی ئەکادیمی',
        type: parsed.data.type,
        content: parsed.data.content,
        tags: parsed.data.tags,
        metadata: parsed.data.metadata
      });

      res.json(newItem);
    } catch (err: unknown) {
      console.error('Research Memory Add Item Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە تۆمارکردنی بڕگەی نوێدا ڕووی دا.' });
    }
  });

  /**
   * POST /api/research-memory/:projectId/summarize
   */
  router.post('/:projectId/summarize', async (req: AuthRequest, res) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر نەدۆزرایەوە.' });
        return;
      }
      const { projectId } = req.params;
      if (!projectId || projectId.length > 128) {
        res.status(400).json({ error: 'ناسنامەی پڕۆژە نادروستە.' });
        return;
      }
      const summary = await researchMemoryService.summarizeMemoryWithAI(userId, projectId, getGeminiClient);
      res.json({ summary });
    } catch (err: unknown) {
      console.error('Research Memory Summarize Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە دروستکردنی پوختەی یادگەدا ڕووی دا.' });
    }
  });

  return router;
}
