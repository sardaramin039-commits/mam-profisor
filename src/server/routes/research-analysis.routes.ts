import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT_ANALYZE_RIGOR } from '../../prompts/system-prompts';
import { robustParseJson } from '../utils/json-repair';
import { multiAgentOrchestratorService } from '../services/multi-agent-orchestrator.service';

export function createResearchAnalysisRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * Academic Rigor & Four-Module Analysis Endpoint
   */
  router.post('/analyze_academic_rigor', async (req, res) => {
    try {
      const { title, content, discipline, theoreticalFramework, academicStyle } = req.body;
      if (!content || typeof content !== 'string') {
        res.status(400).json({ error: 'ناوەڕۆکی بەش پێویستە بۆ هەڵسەنگاندن' });
        return;
      }

      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_ANALYZE_RIGOR;
      const userPrompt = `پێشکەشکردنی هەڵسەنگاندنێکی ئەکادیمی زۆر قووڵ، ڕاستگۆ و بێ لایەن بۆ ئەم دەقە:
ناونیشانی کار: "${title || 'تێزی گشتی'}"
کایەی زانستی: "${discipline || 'گشتی'}"
چوارچێوەی تیۆری دیاریکراو: "${theoreticalFramework || 'critical_theory'}"
شێوازی سەرچاوەهێنانەوەی زانستی: "${academicStyle || 'harvard'}"

دەق بۆ شیکردنەوە:
"${content}"

تکایە داتاکان بخەرە سەر تەواوترین پێکهاتەی JSON بە زمانی کوردیی نووسراوی فەرمی (سۆرانی پێوەر).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (error) {
      console.error('Analyze academic rigor error:', error);
      res.status(503).json({
        error: 'پشکنینی وردی کوالێتیی ئەکادیمی لەم کاتەدا بەردەست نییە؛ هیچ نمرە یان دۆخی ساختە دروست نەکرا.',
        code: 'ACADEMIC_RIGOR_UNAVAILABLE'
      });
    }
  });

  /**
   * Academic Consultation Assistant Endpoint
   */
  router.post('/academic_consultation', async (req, res) => {
    try {
      const { userQuestion, discipline, academicLevel, currentThesisContext } = req.body;
      if (!userQuestion) {
        res.status(400).json({ error: 'پرسیاری توێژەر پێویستە' });
        return;
      }

      const ai = getGeminiClient();
      const userPrompt = `وەک ڕاوێژکارێکی باڵای ئەکادیمی (Harvard/Oxford Academic Advisor)، ڕێننمایی زانستی زۆر قووڵ بۆ ئەم پرسیارەی توێژەر بنووسە:
پرسیاری توێژەر: "${userQuestion}"
کایەی زانستی: "${discipline || 'گشتی'}"
ئاستی زانستی: "${academicLevel || 'ماستەر'}"
پاشخانی کارەکە: "${(currentThesisContext || '').slice(0, 500)}"

تکایە بە شێوازی JSON وەڵام بدەرەوە:
{
  "advisorResponse": "پێشنیار و وەڵامی زانستی زۆر قووڵ بە کوردیی سۆرانی",
  "methodologicalSteps": ["هەنگاوی یەکەم", "هەنگاوی دووەم"],
  "recommendedReadings": ["سەرچاوەی زانستی ١", "سەرچاوەی زانستی ٢"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (err) {
      console.error('Academic consultation error:', err);
      res.status(500).json({ error: 'کێشەیەک لە ڕاوێژکاریی ئەکادیمی ڕوویدا' });
    }
  });

  /**
   * Methodology Construction Endpoint
   */
  router.post('/construct_methodology', async (req, res) => {
    try {
      const { title, discipline, researchType, sampleSize } = req.body;
      const ai = getGeminiClient();
      const userPrompt = `مێتۆدۆلۆژیای زانستیی بونیاد بنێ بۆ ئەم توێژینەوەیە:
ناونیشان: "${title}"
کایە: "${discipline}"
جۆری توێژینەوە: "${researchType || 'چۆنایەتی و چەندایەتی'}"
قەبارەی نموونە: "${sampleSize || '١٠٠ بەشداربوو'}"

تکایە بە JSON وەڵام بدەرەوە:
{
  "methodologyText": "دەقی چڕی مێتۆدۆلۆژیا بە کوردیی سۆرانی",
  "dataCollectionTools": ["کەرەستەی کۆکردنەوەی داتای ١", "کەرەستەی ٢"],
  "validityReliabilitySteps": ["هەنگاوی سەلماندنی دروستی و بەها"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (err) {
      console.error('Construct methodology error:', err);
      res.status(500).json({ error: 'کێشەیەک لە بونیادنانی مێتۆدۆلۆژی ڕوویدا' });
    }
  });

  /**
   * Real Sequential Multi-Agent Pipeline Execution Endpoint
   */
  router.post('/multi_agent_pipeline', async (req, res) => {
    try {
      const {
        topic,
        professorMode = 'ماستەر',
        researchMemory,
        discipline = 'گشتی',
        draftText = '',
        rawSources = []
      } = req.body;

      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        res.status(400).json({ error: 'بابەت یان پرسیاری توێژینەوە پێویستە' });
        return;
      }

      const result = await multiAgentOrchestratorService.executePipeline(
        {
          topic: topic.trim(),
          discipline,
          draftText: draftText || JSON.stringify(researchMemory || {}),
          rawSources: Array.isArray(rawSources) ? rawSources : []
        },
        getGeminiClient
      );

      res.json({
        topic: topic.trim(),
        academicLevel: professorMode,
        pipelineSteps: result.executionPipelineLog,
        verifiedSourcesCount: result.verifiedSourcesCount,
        keyEvidencePoints: result.claimEvidenceGraphIntegrity > 0
          ? ['Claim-Evidence Graph بە پشتگیری سەرچاوەی دەقییەوە دروست کرا.']
          : [],
        verifiedCitations: [],
        peerReviewAudit: result.reviewerReport,
        synthesizedProse: result.finalThesisDraftKurdish,
        qaGateResult: result.qaGateResult
      });
    } catch (err) {
      console.error('Multi-agent pipeline error:', err);
      res.status(503).json({
        error: 'پڕۆسەی Multi-Agent لەم کاتەدا بەردەست نییە؛ هیچ دۆخی تەواوبوون یان سەرچاوەی ساختە نێردراوە نییە.',
        code: 'MULTI_AGENT_UNAVAILABLE'
      });
    }
  });;

  return router;
}
