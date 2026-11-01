import { Router } from 'express';
import { getAutoEvolutionEngine, AdvancedGenerationOptions } from '../services/GeminiAutoEvolutionEngine';
import { GeminiCoreEngine } from '../../lib/gemini/CoreEngine';
import { buildLevelCalibratedBlueprint } from '../../lib/gemini/BlueprintAgent';
import { writeCalibratedSubSection, generateCalibratedConclusion } from '../../lib/gemini/WriterAgent';
import { AdaptiveCitationManager } from '../../lib/gemini/CitationManager';
import { getGeminiClient } from '../services/gemini.service';

export function createGeminiEvolutionRouter(): Router {
  const router = Router();

  /**
   * دۆزینەوەی خۆکاری نوێترین مۆدێلەکانی Pro و Flash
   */
  router.get('/models', async (_req, res) => {
    try {
      let models: { pro: string; flash: string };
      try {
        const coreEngine = GeminiCoreEngine.getInstance();
        models = await coreEngine.getOptimalModels();
      } catch {
        const engine = getAutoEvolutionEngine();
        models = await engine.discoverLatestModels();
      }
      res.json({ success: true, models });
    } catch (err: any) {
      console.warn('Error discovering latest models:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error discovering models' });
    }
  });

  /**
   * نەخشەسازیی کالایبرەیکراوی ئەکادیمی (Academic Blueprint)
   * POST /api/gemini/blueprint
   */
  router.post('/blueprint', async (req, res) => {
    try {
      const { title, level = 'master', discipline = '' } = req.body;
      if (!title) {
        res.status(400).json({ success: false, error: 'Title (ناونیشان) پێویستە.' });
        return;
      }
      const blueprint = await buildLevelCalibratedBlueprint(title, level, discipline);
      res.json({ success: true, blueprint });
    } catch (err: any) {
      console.error('Error generating blueprint:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error generating blueprint' });
    }
  });

  /**
   * نووسینی بەڵگەدار و زنجیرەیی لقە ئەکادیمییەکان (Calibrated SubSection Writing)
   * POST /api/gemini/write-subsection
   */
  router.post('/write-subsection', async (req, res) => {
    try {
      const {
        thesisTitle,
        level = 'master',
        discipline,
        centralThesisThread,
        lockedTerminology,
        chapterTitle,
        chapterObjective,
        chapterOpeningBridge,
        isFirstSubSectionOfChapter,
        isLastSubSectionOfChapter,
        chapterClosingSynthesisGoal,
        sectionTitle,
        axisCentralArgument,
        axisIntroBridge,
        isFirstSubSectionOfAxis,
        subSection,
        previousClosingParagraph = '',
        cumulativeChapterMemory,
        nextSubSectionTitle,
        verifiedLibrarySourcesText,
        cachedContentName
      } = req.body;

      if (!thesisTitle || !subSection) {
        res.status(400).json({ success: false, error: 'thesisTitle and subSection are required.' });
        return;
      }

      const citationManager = new AdaptiveCitationManager(level);
      const result = await writeCalibratedSubSection({
        thesisTitle,
        level,
        discipline,
        centralThesisThread,
        lockedTerminology,
        chapterTitle: chapterTitle || '',
        chapterObjective,
        chapterOpeningBridge,
        isFirstSubSectionOfChapter,
        isLastSubSectionOfChapter,
        chapterClosingSynthesisGoal,
        sectionTitle: sectionTitle || '',
        axisCentralArgument,
        axisIntroBridge,
        isFirstSubSectionOfAxis,
        subSection,
        previousClosingParagraph,
        cumulativeChapterMemory,
        nextSubSectionTitle,
        verifiedLibrarySourcesText,
        cachedContentName,
        citationManager
      });

      const bibliography = citationManager.buildBibliographySection();
      res.json({ success: true, result, bibliography });
    } catch (err: any) {
      console.error('Error writing subsection:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error writing subsection' });
    }
  });

  /**
   * دروستکردنی ئەنجام و ڕاسپاردە ئەکادیمییەکان (Calibrated Conclusion & Recommendations)
   * POST /api/gemini/conclusion
   */
  router.post('/conclusion', async (req, res) => {
    try {
      const { title, level = 'master', allFindings = [], discipline = '' } = req.body;
      if (!title) {
        res.status(400).json({ success: false, error: 'Title is required.' });
        return;
      }
      const text = await generateCalibratedConclusion(title, level, allFindings, discipline);
      res.json({ success: true, text });
    } catch (err: any) {
      console.error('Error generating conclusion:', err);
      res.status(500).json({ success: false, error: err?.message || 'Error generating conclusion' });
    }
  });

  /**
   * جێبەجێکردنی Smart Generation بە مۆدی قووڵبیرکردنەوە، گەڕانی زیندوو و Schema لە ڕێگەی GeminiCoreEngine
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

      try {
        const coreEngine = GeminiCoreEngine.getInstance();
        const mode = enableGoogleSearchGrounding || (taskType as string) === 'grounded_fact_checking'
          ? 'search_grounded'
          : (taskType as string) === 'fast_formatting' || (taskType as string) === 'fast_critic'
          ? 'fast_critic'
          : 'deep_thinking';

        const result = await coreEngine.generate({
          mode,
          systemInstruction: systemInstruction || '',
          prompt,
          responseSchema,
          temperature
        });

        res.json({ success: true, result });
        return;
      } catch (coreErr) {
        console.warn('GeminiCoreEngine failed, falling back to AutoEvolutionEngine:', coreErr);
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
      }
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

  /**
   * پەخشی ڕاستەوخۆ (Streaming SSE) بۆ وەڵامە ئەکادیمییە درێژەکان
   * POST /api/gemini/stream
   */
  router.post('/stream', async (req, res) => {
    try {
      const { prompt, systemInstruction = '', model = 'gemini-3.8-flash' } = req.body;
      if (!prompt) {
        res.status(400).json({ success: false, error: 'دەقی داواکراو پێویستە.' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const ai = getGeminiClient();
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('Gemini stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err?.message || 'Streaming failed' });
      } else {
        res.write(`data: ${JSON.stringify({ error: err?.message || 'Streaming failed' })}\n\n`);
        res.end();
      }
    }
  });

  /**
   * دروستکردنی ڤێکتەری مانایی (Embeddings)
   * POST /api/gemini/generate_embedding
   */
  router.post('/generate_embedding', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        res.status(400).json({ success: false, error: 'دەق پێویستە.' });
        return;
      }
      const ai = getGeminiClient();
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
        config: { outputDimensionality: 768 }
      });
      res.json({ success: true, embedding: response.embeddings?.[0]?.values || [] });
    } catch (err: any) {
      console.error('Embedding generation error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Embedding failed' });
    }
  });

  return router;
}
