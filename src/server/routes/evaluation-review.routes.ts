import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { robustParseJson } from '../utils/json-repair';

export function createEvaluationReviewRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * AI Peer Review Endpoint
   */
  router.post('/ai_peer_review', async (req, res) => {
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
  router.post('/analyze_literature_gap', async (req, res) => {
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
   * Harvard Academic Review Endpoint
   */
  router.post('/harvard_academic_review', async (req, res) => {
    try {
      const { title, text, discipline } = req.body;
      const ai = getGeminiClient();
      const userPrompt = `پێداچوونەوەی ئاستی زانکۆی هارڤەرد بۆ ئەم دەقە ئەنجام بدە:
ناونیشان: "${title}"
کایە: "${discipline}"
دەق: "${(text || '').slice(0, 3000)}"

تکایە بە JSON وەڵام بدەرەوە:
{
  "harvardRigorScore": 88,
  "scholarFeedback": "شیکاری قووڵ و ڕەخنەیی بێ لایەن بۆ گوتاری زانستی",
  "methodologyPurity": "هەڵسەنگاندنی پاکیی مێتۆدۆلۆژی",
  "keyRefinements": ["داواکاری چاکسازی ١", "داواکاری چاکسازی ٢"]
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
      console.error('Harvard academic review error:', err);
      res.status(500).json({ error: 'کێشەیەک لە پێداچوونەوەی هارڤەرددا ڕوویدا' });
    }
  });

  return router;
}
