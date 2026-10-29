import { Router } from 'express';
import { getAutoEvolutionEngine, AdvancedGenerationOptions } from '../services/GeminiAutoEvolutionEngine';

export function createGeminiEvolutionRouter(): Router {
  const router = Router();

  /**
   * دۆزینەوەی خۆکاری نوێترین مۆدێلەکانی Pro و Flash
   */
  router.get('/models', async (_req, res) => {
    try {
      const engine = getAutoEvolutionEngine();
      const models = await engine.discoverLatestModels();
      res.json({ success: true, models });
    } catch (err: any) {
      console.warn('Error discovering latest models:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error discovering models' });
    }
  });

  /**
   * جێبەجێکردنی Smart Generation بە مۆدی قووڵبیرکردنەوە، گەڕانی زیندوو و Schema
   */
  router.post('/smart-generate', async (req, res) => {
    try {
      const {
        taskType = 'deep_academic_reasoning',
        systemInstruction,
        prompt,
        responseSchema,
        enableThinking = true,
        thinkingBudgetTokens = 8192,
        enableGoogleSearchGrounding = false,
        cachedContextName,
        temperature
      } = req.body as AdvancedGenerationOptions;

      if (!prompt) {
        res.status(400).json({ success: false, error: 'دەقی داواکراو (prompt) پێویستە.' });
        return;
      }

      const engine = getAutoEvolutionEngine();
      const result = await engine.executeSmartGeneration({
        taskType,
        systemInstruction: systemInstruction || '',
        prompt,
        responseSchema,
        enableThinking,
        thinkingBudgetTokens,
        enableGoogleSearchGrounding,
        cachedContextName,
        temperature
      });

      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Smart generate error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error executing smart generation' });
    }
  });

  /**
   * دروستکردنی Context Cache بۆ هەڵگرتنی بەڵگەنامە و سەرچاوە گەورەکان
   */
  router.post('/context-cache', async (req, res) => {
    try {
      const { cacheTitle, systemInstruction, largeReferenceTexts, ttlSeconds = 3600 } = req.body;
      if (!cacheTitle || !Array.isArray(largeReferenceTexts) || largeReferenceTexts.length === 0) {
        res.status(400).json({ success: false, error: 'ناونیشانی کاش و دەقی سەرچاوەکان پێویستن.' });
        return;
      }

      const engine = getAutoEvolutionEngine();
      const cacheName = await engine.createAcademicContextCache(
        cacheTitle,
        systemInstruction || '',
        largeReferenceTexts,
        ttlSeconds
      );

      res.json({ success: true, cacheName });
    } catch (err: any) {
      console.error('Context cache creation error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error creating context cache' });
    }
  });

  return router;
}
