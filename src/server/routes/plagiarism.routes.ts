import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { textSimilarityService } from '../services/text-similarity.service';
import { robustParseJson } from '../utils/json-repair';

export function createPlagiarismRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * POST /api/plagiarism_check
   * Analyzes manuscript text for academic originality, similarity risks, and unquoted passages.
   */
  router.post('/plagiarism_check', async (req: Request, res: Response) => {
    try {
      const { content, title } = req.body || {};
      const trimmed = typeof content === 'string' ? content.trim() : '';

      if (!trimmed || trimmed.length < 10 || trimmed.length > 100_000) {
        res.status(400).json({
          error: 'دەق دەبێت لەنێوان ١٠ و ١٠٠٬٠٠٠ پیت بێت.'
        });
        return;
      }

      // This endpoint currently has no authoritative comparison corpus attached.
      // Screening against [] cannot establish originality or plagiarism.
      const localResult = textSimilarityService.screen(trimmed.slice(0, 50000), []);

      try {
        const ai = getGeminiClient();
        const prompt = `تۆ پسپۆڕێکی وردبینیت لە دیاریکردنی دزدیی ئەدەبی (Plagiarism) و ڕەسەنایەتیی دەقی ئەکادیمی بە زمانی کوردی.
دەقێکی توێژینەوەت پێشکەش دەکرێت. شیکاری بکە بۆ:
١. ڕێژەی ڕەسەنایەتی دەقەکە (Originality Score لە نێوان ٠ تا ١٠٠).
٢. ئاستی مەترسی: "نزم" (ئەگەر ڕەسەنایەتی سەرووی 80٪ بێت)، "مامناوەند" (نێوان 50 بۆ 80٪)، یان "بەرز" (خوار 50٪).
٣. ژمارەی ئەو دەستەواژە یان بڕگانەی کە ئەگەری لێکچوونی نائاسایی یان وەرگرتنی بێ سەرچاوەیان هەیە (matchesCount).
٤. شیکاریی ورد و ڕێنمایی چاکسازی بە زمانی کوردیی فەرمی (سۆرانی پێوەر) لەژێر بڕگەی detailedAnalysis.

ناونیشانی کار: "${typeof title === 'string' ? title.slice(0, 200) : 'تێز'}"
دەق بۆ پشکنین:
"""
${trimmed.slice(0, 12000)}
"""

وەڵامەکەت بە تەنها لە فۆرماتی JSONی بێ هیچ دەقێکی زیادە بنووسە بەم کلیلانە:
{
  "originalityScore": 92,
  "plagiarismRisk": "نزم",
  "matchesCount": 1,
  "detailedAnalysis": "شیکاری تەواو بە کوردی..."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const parsed = robustParseJson<{
          originalityScore?: number;
          plagiarismRisk?: 'نزم' | 'مامناوەند' | 'بەرز';
          matchesCount?: number;
          detailedAnalysis?: string;
        }>(response.text || '{}');

        const score = typeof parsed?.originalityScore === 'number' && Number.isFinite(parsed.originalityScore)
          ? Math.max(0, Math.min(100, Math.round(parsed.originalityScore)))
          : null;

        const risk: 'نزم' | 'مامناوەند' | 'بەرز' | 'نەپشکنراو' =
          parsed?.plagiarismRisk === 'بەرز' || parsed?.plagiarismRisk === 'مامناوەند' || parsed?.plagiarismRisk === 'نزم'
            ? parsed.plagiarismRisk
            : score === null ? 'نەپشکنراو' : score >= 80 ? 'نزم' : score >= 55 ? 'مامناوەند' : 'بەرز';

        res.json({
          originalityScore: score,
          plagiarismRisk: risk,
          matchesCount: typeof parsed?.matchesCount === 'number' && Number.isFinite(parsed.matchesCount)
            ? Math.max(0, Math.round(parsed.matchesCount))
            : null,
          analysisMode: 'ai-heuristic-no-external-corpus',
          corpusCoverage: localResult.corpusCoverage,
          limitation: 'ئەمە پێشبینیی AI ـە؛ بەراورد لەگەڵ corpus ـی سەرچاوە ڕاستەقینە نەکراوە و بەڵگەی پاکبوونەوە لە plagiarism نییە.',
          detailedAnalysis: parsed?.detailedAnalysis || 'AI شیکاریی وردی دابین نەکرد؛ بڕیارێکی پشتڕاستکراو لەسەر ڕەسەنایەتی ناتوانرێت بدرێت.'
        });
      } catch (aiErr) {
        console.warn('AI Plagiarism check fallback:', aiErr);
        // No external corpus and no AI result means no supportable originality score.
        res.status(503).json({
          success: false,
          status: 'degraded',
          originalityScore: null,
          plagiarismRisk: 'نەپشکنراو',
          matchesCount: null,
          analysisMode: 'unavailable',
          corpusCoverage: 0,
          limitation: 'AI بەردەست نەبوو و هیچ corpus ـی سەرچاوەی ڕاستەقینە بۆ بەراورد بەستراو نەبوو؛ نمرەی ڕەسەنایەتی دروست نەکرا.',
          detailedAnalysis: 'نەتوانرا پشکنینی ڕەسەنایەتی ئەنجام بدرێت؛ ئەم وەڵامە نابێت وەک بەڵگەی پاکبوونەوە لە plagiarism بەکاربهێنرێت.'
        });
      }
    } catch (err: unknown) {
      console.error('Plagiarism check endpoint error:', err);
      res.status(500).json({ error: 'هەڵەیەک لە کاتی پشکنینی ڕەسەنایەتی دەق ڕوویدا.' });
    }
  });

  return router;
}
