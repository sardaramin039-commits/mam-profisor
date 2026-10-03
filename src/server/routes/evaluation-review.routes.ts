import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { robustParseJson } from '../utils/json-repair';
import { validateRequest } from '../../middleware/validate.middleware';
import { peerReviewSchema, literatureGapSchema, harvardReviewSchema } from '../utils/academic-analysis.schemas';
import { academicReviewerService } from '../services/academic-reviewer.service';

export function createEvaluationReviewRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * AI Peer Review Endpoint
   */
  router.post('/ai_peer_review', validateRequest(peerReviewSchema), async (req, res) => {
    try {
      const { title, text, discipline } = req.body;
      if (!text) {
        res.status(400).json({ error: 'دەقی توێژینەوە پێویستە' });
        return;
      }

      const ai = getGeminiClient();
      const userPrompt = `پێداچوونەوەی ئەکادیمی (Peer Review) ئەنجام بدە بۆ ئەم دەقە:
ناونیشان: "${title || 'تێز'}"
کایە: "${discipline || 'گشتی'}"
دەق: "${text.slice(0, 3000)}"

تکایە بە JSON وەڵام بدەرەوە:
{
  "overallVerdict": "تێبینی و بڕیاری سەرەکیی داوەر",
  "strengths": ["خاڵی بەهێزی ١", "خاڵی بەهێزی ٢"],
  "weaknesses": ["خاڵی لاوازی ١", "خاڵی لاوازی ٢"],
  "revisionsRequired": ["داواکاری بۆ چاکسازی ١", "داواکاری بۆ چاکسازی ٢"]
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
      console.error('AI peer review error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پێداچوونەوەی ئەکادیمیدا ڕوویدا' });
    }
  });

  /**
   * Literature Gap Analysis Endpoint
   */
  router.post('/analyze_literature_gap', validateRequest(literatureGapSchema), async (req, res) => {
    try {
      const { topic, discipline, existingLiterature } = req.body;
      const ai = getGeminiClient();
      const userPrompt = `شیکاری کەلەبەری زانستی (Literature Gap Analysis) ئەنجام بدە بۆ ئەم بابەتە:
بابەت: "${topic}"
کایەی زانستی: "${discipline}"
پاشخانی سەرچاوەکان: "${existingLiterature || ''}"

تکایە بە JSON وەڵام بدەرەوە:
{
  "identifiedGaps": [
    {
      "gapType": "مێتۆدۆلۆژی یان جۆغرافی یان تیۆری",
      "description": "ڕوونکردنەوەی کەلەبەرە زانستییەکە بە سۆرانی",
      "potentialContribution": "چۆنیەتی پڕکردنەوەی کەلەبەرەکە لەم توێژینەوەیەدا"
    }
  ],
  "strategicRecommendations": ["پێشنیاری ستراتیژی ١", "پێشنیاری ستراتیژی ٢"]
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
      console.error('Analyze literature gap error:', err);
      res.status(500).json({ error: 'کێشەیەک لە شیکاری کەلەبەری زانستیدا ڕوویدا' });
    }
  });

  /**
   * Legacy route kept for compatibility; it now uses the unified Academic Reviewer.
   */
  router.post('/harvard_academic_review', validateRequest(harvardReviewSchema), async (req, res) => {
    try {
      const { title, text, discipline } = req.body;
      const report = await academicReviewerService.evaluateThesis(
        text || '',
        title || 'تێز',
        getGeminiClient,
        { discipline, verifiedSources: [] }
      );

      return res.json({
        success: true,
        report,
        compatibility: 'legacy-route-unified-academic-review'
      });
    } catch (error: unknown) {
      console.error('Unified academic review error:', error);
      return res.status(500).json({
        error: 'کێشەیەک لە پێداچوونەوەی ئەکادیمیدا ڕوویدا.'
      });
    }
  });

  return router;
}
