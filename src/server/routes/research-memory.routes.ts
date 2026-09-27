import { Router } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import { researchMemoryService } from '../services/research-memory.service';

export function createResearchMemoryRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * GET /api/research-memory/:projectId
   */
  router.get('/:projectId', (req, res) => {
    try {
      const userId = (req as AuthRequest).user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر پشتڕاست نەکراوەتەوە.' });
        return;
      }
      const { projectId } = req.params;
      const projectState = researchMemoryService.getProjectMemory(userId, projectId);
      res.json(projectState);
    } catch (err: unknown) {
      console.error('Research Memory Get Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە وەرگرتنی یادگەی توێژینەوەکەدا ڕووی دا.' });
    }
  });

  /**
   * POST /api/research-memory/:projectId/items
   */
  router.post('/:projectId/items', (req, res) => {
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر پشتڕاست نەکراوەتەوە.' });
        return;
      }
    try {
      const userId = (req as AuthRequest).user?.uid;
      const { projectId } = req.params;
      const { topic, type, content, tags, metadata } = req.body;

      if (!content || !type) {
        res.status(400).json({ error: 'جۆری بڕگە (type) و ناوەڕۆک (content) پێویستن.' });
        return;
      }

      const newItem = researchMemoryService.addMemoryItem(userId, projectId, {
        userId,
        topic: topic || 'توێژینەوەی ئەکادیمی',
        type,
        content,
        tags: tags || [],
        metadata
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
  router.post('/:projectId/summarize', async (req, res) => {
      if (!userId) {
        res.status(401).json({ error: 'ناسنامەی بەکارهێنەر پشتڕاست نەکراوەتەوە.' });
        return;
      }
    try {
      const userId = (req as AuthRequest).user?.uid;
      const { projectId } = req.params;
      const summary = await researchMemoryService.summarizeMemoryWithAI(userId, projectId, getGeminiClient);
      res.json({ summary });
    } catch (err: unknown) {
      console.error('Research Memory Summarize Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە دروستکردنی پوختەی یادگەدا ڕووی دا.' });
    }
  });

  return router;
}
