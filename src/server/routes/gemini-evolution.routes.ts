import { Router } from 'express';
import { getAutoEvolutionEngine, AdvancedGenerationOptions } from '../services/GeminiAutoEvolutionEngine';
import { GeminiCoreEngine } from '../../lib/gemini/CoreEngine';
import { buildLevelCalibratedBlueprint } from '../../lib/gemini/BlueprintAgent';
import { writeCalibratedSubSection, generateCalibratedConclusion } from '../../lib/gemini/WriterAgent';
import { AdaptiveCitationManager } from '../../lib/gemini/CitationManager';
import { getGeminiClient } from '../services/gemini.service';
import { apiConfigService } from '../services/api-config.service';

function getWritingFailure(error: unknown): { status: number; code: string; message: string } {
  const err = error as { status?: number; statusCode?: number; code?: string | number; message?: string };
  const status = Number(err?.status ?? err?.statusCode);
  const detail = String(err?.message || '').toLowerCase();

  if (status === 429 || detail.includes('429') || detail.includes('quota') || detail.includes('resource_exhausted')) {
    return { status: 429, code: 'GEMINI_QUOTA_EXCEEDED', message: 'کۆتای Gemini تەواو بوو. کلیلێکی تر زیاد بکە یان دوای چەند خولەکێک دووبارە هەوڵ بدەرەوە.' };
  }
  if (status === 401 || status === 403 || detail.includes('api key not valid') || detail.includes('permission_denied') || detail.includes('unauthorized')) {
    return { status: 503, code: 'GEMINI_KEY_REJECTED', message: 'کلیلی Gemini ڕەتکرایەوە یان مۆڵەتی پێویستی نییە. لە Secrets ـی سێرڤەر کلیلی دروست دابنێ و سێرڤەرەکە نوێ بکەرەوە.' };
  }
  if (status === 503 || detail.includes('unavailable') || detail.includes('overloaded')) {
    return { status: 503, code: 'GEMINI_UNAVAILABLE', message: 'خزمەتگوزاری Gemini بەردەست نییە. کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدەرەوە.' };
  }

  const configuredKeys = apiConfigService.getApiKeys();
  let safeDetail = String(err?.message || '');
  for (const key of configuredKeys) safeDetail = safeDetail.split(key).join('[redacted]');
  safeDetail = safeDetail.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]').slice(0, 240);
  return {
    status: 502,
    code: typeof err?.code === 'string' && /^[A-Z0-9_]+$/.test(err.code) ? err.code : 'GEMINI_GENERATION_FAILED',
    message: safeDetail
      ? `نووسینی Gemini سەرکەوتوو نەبوو: ${safeDetail}`
      : 'نووسینی Gemini سەرکەوتوو نەبوو؛ هیچ دەقێک وەرنەگیرا.'
  };
}

function getResponseText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const record = value as { rawText?: unknown; text?: unknown; content?: unknown };
  const text = record.rawText ?? record.text ?? record.content;
  if (typeof text === 'string') return text;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export function createGeminiEvolutionRouter(): Router {
  const router = Router();

  router.get('/key-status', (_req, res) => {
    const keyCount = apiConfigService.getApiKeys().length;
    res.json({ success: true, configured: keyCount > 0, keyCount });
  });

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
      const { title, level = 'master', discipline = '', targetChapters, targetWordCount, academicControls } = req.body;
      if (!title) {
        res.status(400).json({ success: false, error: 'Title (ناونیشان) پێویستە.' });
        return;
      }
      const blueprint = await buildLevelCalibratedBlueprint(title, level, discipline, targetChapters, targetWordCount, academicControls);
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
        cachedContentName,
        academicControls,
        citationStyle
      } = req.body;

      if (!thesisTitle || !subSection) {
        res.status(400).json({ success: false, error: 'thesisTitle and subSection are required.' });
        return;
      }

      const citationManager = new AdaptiveCitationManager(level, citationStyle);
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
        academicControls,
        citationStyle,
        citationManager
      });
      if (!result.fullSubSectionMarkdown.trim()) {
        throw new Error('Gemini بەتاڵ وەڵامی دایەوە؛ تکایە کلیلی سێرڤەر و دۆخی Gemini بپشکنە.');
      }

      const bibliography = citationManager.buildBibliographySection();
      const text = result.fullSubSectionMarkdown;
      res.json({ success: true, result, bibliography, text, content: text, delta: text });
    } catch (err: unknown) {
      const failure = getWritingFailure(err);
      console.error(`[Gemini write-subsection] ${failure.code} (${failure.status})`);
      res.status(failure.status).json({ success: false, code: failure.code, error: failure.message });
    }
  });

  /**
   * پەخشی ڕاستەوخۆ بۆ نووسینی لق (SSE Calibrated SubSection Streaming)
   * POST /api/gemini/stream-subsection
   */
  router.post('/stream-subsection', async (req, res) => {
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
        cachedContentName,
        academicControls,
        citationStyle
      } = req.body;

      if (!thesisTitle || !subSection) {
        res.status(400).json({ success: false, error: 'thesisTitle and subSection are required.' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      const sendEvent = (event: unknown): void => {
        if (!res.destroyed && !res.writableEnded) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      };

      sendEvent({ status: 'started', message: 'دەستکرا بە نووسینی لقی ئەکادیمی...' });

      const citationManager = new AdaptiveCitationManager(level, citationStyle);
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
        academicControls,
        citationStyle,
        citationManager,
        onLiveProgress: (liveMarkdown, liveWordCount, statusStep) => {
          sendEvent({
            status: 'chunk',
            markdown: liveMarkdown,
            wordCount: liveWordCount,
            step: statusStep
          });
        }
      });
      if (!result.fullSubSectionMarkdown.trim()) {
        throw new Error('Gemini بەتاڵ وەڵامی دایەوە؛ تکایە کلیلی سێرڤەر و دۆخی Gemini بپشکنە.');
      }

      const bibliography = citationManager.buildBibliographySection();
      const text = result.fullSubSectionMarkdown;
      sendEvent({ status: 'completed', success: true, result, bibliography, text, content: text, delta: text });
      if (!res.destroyed && !res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (err: unknown) {
      const failure = getWritingFailure(err);
      console.error(`[Gemini stream-subsection] ${failure.code} (${failure.status})`);
      if (!res.headersSent) {
        res.status(failure.status).json({ success: false, code: failure.code, error: failure.message });
      } else if (!res.destroyed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ status: 'error', code: failure.code, error: failure.message })}\n\n`);
        res.write(`data: ${JSON.stringify({ status: 'failed', code: failure.code })}\n\n`);
        res.end();
      }
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
        maxOutputTokens = 8192,
        enableGoogleSearchGrounding = false,
        cachedContextName,
        temperature,
        model
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
          temperature,
          thinkingBudget: thinkingBudgetTokens,
          maxOutputTokens,
          model
        });

        const text = getResponseText(result);
        if (!text.trim()) throw new Error('Gemini بەتاڵ وەڵامی دایەوە؛ هیچ دەقێک وەرنەگیرا.');
        res.json({ success: true, result, text, content: text, delta: text });
        return;
      } catch {
        console.warn('GeminiCoreEngine failed; trying the configured server-side Gemini client pool.');
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
          temperature,
          maxOutputTokens,
          model
        });
        const text = getResponseText(result);
        if (!text.trim()) throw new Error('Gemini بەتاڵ وەڵامی دایەوە؛ هیچ دەقێک وەرنەگیرا.');
        res.json({ success: true, result, text, content: text, delta: text });
      }
    } catch (err: any) {
      const failure = getWritingFailure(err);
      console.error(`[Gemini smart-generate] ${failure.code} (${failure.status})`);
      res.status(failure.status).json({ success: false, code: failure.code, error: failure.message });
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

  /**
   * Pillar 16: Pre-flight Token Counting
   * POST /api/gemini/count-tokens
   */
  router.post('/count-tokens', async (req, res) => {
    try {
      const { contents, model } = req.body;
      if (!contents) {
        res.status(400).json({ success: false, error: 'contents is required.' });
        return;
      }
      const coreEngine = GeminiCoreEngine.getInstance();
      const totalTokens = await coreEngine.countTokens(contents, model);
      res.json({ success: true, totalTokens });
    } catch (err: any) {
      console.error('Count tokens error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Count tokens failed' });
    }
  });

  /**
   * Pillar 16: Cache Renewal via ai.caches.update (7200s TTL)
   * POST /api/gemini/cache-refresh
   */
  router.post('/cache-refresh', async (req, res) => {
    try {
      const { cacheName, ttlSeconds = 7200 } = req.body;
      if (!cacheName) {
        res.status(400).json({ success: false, error: 'cacheName is required.' });
        return;
      }
      const coreEngine = GeminiCoreEngine.getInstance();
      const updated = await coreEngine.refreshContextCache(cacheName, ttlSeconds);
      res.json({ success: updated });
    } catch (err: any) {
      console.error('Cache refresh error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Cache refresh failed' });
    }
  });

  /**
   * Pillar 17: Sentence-Level Grounding Supports
   * POST /api/gemini/grounded-supports
   */
  router.post('/grounded-supports', async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      if (!prompt) {
        res.status(400).json({ success: false, error: 'prompt is required.' });
        return;
      }
      const coreEngine = GeminiCoreEngine.getInstance();
      const result = await coreEngine.generate<any>({
        mode: 'search_grounded',
        prompt,
        systemInstruction: systemInstruction || 'پسپۆڕی شیکاری و دۆزینەوەی سەرچاوەی ئەکادیمی',
        returnGroundingSupports: true
      });
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Grounding supports error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Grounding supports failed' });
    }
  });

  /**
   * Pillar 18: Large PDF / File State Polling (ai.files.get)
   * POST /api/gemini/poll-file
   */
  router.post('/poll-file', async (req, res) => {
    try {
      const { fileName, maxWaitMs = 120000 } = req.body;
      if (!fileName) {
        res.status(400).json({ success: false, error: 'fileName is required.' });
        return;
      }
      const coreEngine = GeminiCoreEngine.getInstance();
      const isActive = await coreEngine.pollFileUntilActive(fileName, maxWaitMs);
      res.json({ success: isActive, state: 'ACTIVE' });
    } catch (err: any) {
      console.error('File poll error:', err);
      res.status(500).json({ success: false, error: err?.message || 'File polling failed' });
    }
  });

  /**
   * Pillar 20: Multimodal Audio Dictation (Speech to Kurdish Academic Text via inlineData)
   * POST /api/gemini/audio-dictation
   */
  router.post('/audio-dictation', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm;codecs=opus', academicContext = '' } = req.body;
      if (!audioBase64) {
        res.status(400).json({ success: false, error: 'audioBase64 is required.' });
        return;
      }
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64
                }
              },
              {
                text: `تۆ تایپکەر و ڕستەبڕی پسپۆڕی دەقی ئەکادیمیی کوردیت. گوێ لەم تۆمارە دەنگییە بگرە و بە تەواوی دەقەکەی بکە بە زمانی کوردیی فەرمی، زانستی، پاراو و ڕێنووس-ستاندارد.
ڕێساکان:
١. هیچ وشەیەک مەپەڕێنە.
٢. پیتەکان پاک بکەرەوە (ک، ی، ە).
٣. خاڵبەندیی دروست دابنێ.
${academicContext ? `پاشخانی بەشەکە: ${academicContext}` : ''}
تەنها دەقە وەرگێڕدراوەکە بنووسە بێ هیچ قسەیەکی زیادە.`
              }
            ]
          }
        ],
        config: {
          temperature: 0.1
        }
      });

      const transcript = response.text?.trim() || '';
      res.json({ success: true, transcript });
    } catch (err: any) {
      console.error('Audio dictation error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Audio dictation failed' });
    }
  });

  /**
   * Pillar 20: Multimodal Audio Viva Defense Evaluator (Spoken Defense to Academic Viva Evaluation)
   * POST /api/gemini/audio-viva
   */
  router.post('/audio-viva', async (req, res) => {
    try {
      const {
        audioBase64,
        mimeType = 'audio/webm;codecs=opus',
        questionText,
        examinerRole,
        scoringCriteria = []
      } = req.body;

      if (!audioBase64 || !questionText) {
        res.status(400).json({ success: false, error: 'audioBase64 and questionText are required.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64
                }
              },
              {
                text: `تۆ ئەندامی لێژنەی تاوتوێکردنی تێزی ئەکادیمیت (${examinerRole || 'ناوبژیوانی لێژنە'}).
پرسیارەکە ئەمە بوو: "${questionText}"
پێوەرەکانی نمرەدان: ${scoringCriteria.join('، ')}

گوێ لە وەڵامە دەنگییەکەی توێژەر بگرە لەم فایلە دەنگییەدا و بە شێوازی JSON هەڵسەنگاندنی بکە بەم پێکهاتەیە:
{
  "transcript": "دەقی ئەوەی توێژەر لە دەنگەکەدا بە کوردی وتی",
  "grade": 88, // نمرە لەنێوان ٠ تا ١٠٠
  "decisionStatus": "پەسەندکرا بە ئەنجامی نایاب", // یان "پەسەندکرا بە چاکسازیی بچووک" یان "پێویستی بە پێداچوونەوەی دووبارەیە"
  "critique": "ڕاڤەی لێژنە لەسەر وەڵامە دەنگییەکە و ئاستی زانستیی وەڵامەکە بە کوردییەکی زۆر بەرز",
  "recommendations": ["تێبینی و پێشنیاری کردەیی یەکەم", "تێبینی دووەم"]
}`
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, evaluation: parsed });
    } catch (err: any) {
      console.error('Audio viva evaluation error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Audio viva evaluation failed' });
    }
  });

  return router;
}
