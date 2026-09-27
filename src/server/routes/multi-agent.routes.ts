import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { multiAgentOrchestratorService } from '../services/multi-agent-orchestrator.service';

export function createMultiAgentRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/multi-agent/orchestrate
   */
  router.post('/orchestrate', async (req, res) => {
    try {
      const { topic, discipline, draftText, rawSources } = req.body;
      if (!topic) {
        res.status(400).json({ error: 'تەوەرەی توێژینەوە (topic) پێویستە.' });
        return;
      }

      const result = await multiAgentOrchestratorService.executePipeline(
        {
          topic,
          discipline: discipline || 'گشتی',
          draftText,
          rawSources
        },
        getGeminiClient
      );

      res.json(result);
    } catch (err: unknown) {
      console.error('MultiAgent Route Error:', err);
      res.status(500).json({ error: 'کێشەیەک لە ڕێکخستنی بریکارەکاندا (Multi-Agent Pipeline) دروست بوو.' });
    }
  });

  return router;
}
