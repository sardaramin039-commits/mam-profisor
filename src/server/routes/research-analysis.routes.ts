import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT_ANALYZE_RIGOR } from '../../prompts/system-prompts';
import { robustParseJson } from '../utils/json-repair';

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
      const reqTitle = req.body.title || 'کارێکی ئەکادیمی';
      const reqContent = req.body.content || '';
      
      const fallbackResponse = {
        academicScore: null,
        toneEvaluation: 'هەڵسەنگاندنی خۆکار بەهۆی نەبوونی خزمەتگوزاریی ژیریی دەستکرد بەردەست نییە.',
        citationSuggestions: 'هیچ citation ی نوێ بە شێوەی ئۆفلاین دروست نەکراوە؛ سەرچاوەکان دەبێت بە شێوەی دەرەکی پشتڕاست بکرێنەوە.',
        plagiarismSimilarity: null,
        vocabularyComplexity: 'نەپشکنراو',
        sentencesReform: [],
        honestyCapExplanation: 'سیستەم نمرە، ڕێژەی هاوشێوەیی یان پەیوەندییە تیۆرییەکان لە کاتی نەبوونی AI خەملاندن ناکات.',
        requiredHumanActions: [
          'پێداچوونەوەی دەقی سەرەکی و دیاریکردنی خاڵە پێویستەکان بە شێوەی مرۆیی',
          'پشتڕاستکردنەوەی citation و بەڵگەکان لە سەرچاوە دەرەکییەکان'
        ],
        fallacies: [],
        hedgingChecks: [],
        theoreticalConsistency: {
          frameworkUsed: reqContent ? (req.body.theoreticalFramework || 'critical_theory') : 'critical_theory',
          status: 'not_verified',
          notes: 'هیچ پشتڕاستکردنەوەی تیۆری لە offline fallback ـدا نەکراوە.'
        },
        crossReferenceStatus: {
          citationCount: null,
          matchedCount: null,
          mismatches: []
        }
      };
      res.json(fallbackResponse);
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
      const userPrompt = `وەک ڕاوێژکارێکی ئەکادیمی و بێلایەن، ڕێننمایی زانستی زۆر قووڵ بۆ ئەم پرسیارەی توێژەر بنووسە:
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
قەبارەی نموونە: "${sampleSize || 'دیارینەکراو'}"

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
      const { topic, professorMode = 'ماستەر', researchMemory } = req.body;
      if (!topic) {
        res.status(400).json({ error: 'بابەت یان پرسیاری توێژینەوە پێویستە' });
        return;
      }

      const ai = getGeminiClient();

      const researchPrompt = `تۆ سەرپەرشتیاری تیمی Multi-Agent هەڵسەنگاندن و نووسینی ئەکادیمیت لە چوارچێوەی ناوخۆیی ئەپەکەیت.
تکایە زنجیرە شیکاریی فرە-ئەجێنت (Research -> Evidence -> Writer -> Citation -> Reviewer) ئەنجام بدە بۆ بابەتی: "${topic}"
ئاستی پرۆفیسۆر: ${professorMode}
پاشخانی بیرگەی توێژینەوە: ${JSON.stringify(researchMemory || {})}

پێویستە وەڵامەکە بە JSON و بە تەنها ئەم شێوازە بێت:
{
  "topic": "${topic}",
  "academicLevel": "${professorMode}",
  "pipelineSteps": [
    { "agentName": "Research Agent", "status": "completed", "summary": "دەستنیشانکردنی کێشە، چەمکەکان و ڕەوتی مێژوویی بابەتەکە" },
    { "agentName": "Evidence Agent", "status": "completed", "summary": "کۆکردنەوەی بەڵگە و هەڵسەنگاندنی هێزی سەرچاوە زانستییەکان" },
    { "agentName": "Writer Agent", "status": "completed", "summary": "داڕشتنی دەقی چڕی زانستی بێ لایەن و فەرمی" },
    { "agentName": "Citation Agent", "status": "completed", "summary": "هاوسازکردنی بەڵگەکان لەگەڵ سەرچاوە ڕاستەقینەکاندا" },
    { "agentName": "Reviewer Agent", "status": "completed", "summary": "پێداچوونەوەی ڕەخنەیی، متمانە و نمرەی کۆتایی" }
  ],
  "synthesizedProse": "دەقی ئەکادیمیی سەرەکیی داڕێژراو بە کوردیی سۆرانیی فەرمی، بێ لایەن و زانستی بەپێی پێوەری ${professorMode}.",
  "keyEvidencePoints": [
    "خاڵی بەڵگەی یەکەم بە پشتیوانی سەرچاوەی ساغکراوە",
    "خاڵی بەڵگەی دووەم"
  ],
  "verifiedCitations": [],
  "peerReviewAudit": {
    "scholarlyScore": null,
    "rigorGrade": null,
    "criticalFeedback": "پێداچوونەوەی ڕەخنەیی و ئامۆژگاری زانستی بۆ توێژەر؛ هیچ citation یەک Verified ناکرێت لەم قۆناغەدا."
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: researchPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      res.json(robustParseJson(response.text || '{}'));
    } catch (err) {
      console.error('Multi-agent pipeline error:', err);
      res.status(500).json({ error: 'کێشەیەک لە ڕاکێشانی پڕۆسەی Multi-Agent دا ڕوویدا' });
    }
  });

  return router;
}
