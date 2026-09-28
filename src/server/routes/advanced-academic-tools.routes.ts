import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { robustParseJson } from '../utils/json-repair';
import { 
  SYSTEM_PROMPT_HARVARD_FEATURES, 
  SYSTEM_PROMPT_AI_INTEGRITY_AUDIT, 
  SYSTEM_PROMPT_SUMMARIZE_THESIS_CONTEXT, 
  SYSTEM_PROMPT_ANONYMIZE_DATA 
} from '../../prompts/system-prompts';

export function createAdvancedAcademicToolsRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * Research Timeline Generator
   */
  router.post('/research_timeline', async (req: Request, res: Response) => {
    try {
      const { topic, durationMonths = 12 } = req.body;
      const ai = getGeminiClient();
      const prompt = `خشتەی کاتیی کارکردن (Timeline) بۆ تێزی زانستیی لەسەر بابەت: "${topic}" بۆ ماوەی ${durationMonths} مانگ بنووسە بە JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 }
      });

      return res.json(robustParseJson(response.text || '[]'));
    } catch (error) {
      console.error('Research timeline error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە دروستکردنی خشتەی کاتیدا ڕوویدا.' });
    }
  });

  /**
   * Mind Map Generator
   */
  router.post('/mind_map_generator', async (req: Request, res: Response) => {
    try {
      const { topic, depth = 3 } = req.body;
      const ai = getGeminiClient();
      const prompt = `نەخشەی زیهنیی زانستی (Mind Map) داڕێژە بۆ بابەتی: "${topic}" بێ وەستان بە ئاستی زانیاریی ${depth} بڕگە بە JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Mind map generator error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە دارشتنی نەخشەی زیهنیدا ڕوویدا.' });
    }
  });

  /**
   * Auto Outline Generator
   */
  router.post('/auto_outline_generator', async (req: Request, res: Response) => {
    try {
      const { topic, methodology, discipline } = req.body;
      const ai = getGeminiClient();
      const prompt = `هێڵکاریی گشتیی (Outline) بەشەکانی تێز داڕێژە بۆ: "${topic}" (میتۆدۆلۆژی: ${methodology || 'گشتی'}, بوار: ${discipline || 'زانست'}). وەڵام بە JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Auto outline generator error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە دارشتنی هێڵکاریدا ڕوویدا.' });
    }
  });

  /**
   * Table & Figure Generator
   */
  router.post('/table_figure_generator', async (req: Request, res: Response) => {
    try {
      const { concept, type = 'table' } = req.body;
      const ai = getGeminiClient();
      const prompt = `داتای خشتە یان دیپۆزیتۆری نەخشەیی زانستی (${type}) دروست بکە بۆ: "${concept}" بە زمانی کوردی بە JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Table/Figure generator error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە دروستکردنی خشتە و گرافدا ڕوویدا.' });
    }
  });

  /**
   * Viva Simulation
   */
  router.post('/simulate_viva', async (req: Request, res: Response) => {
    try {
      const { thesisTitle, abstract } = req.body;
      const ai = getGeminiClient();
      const prompt = `وەک لێژنەی تاووتوێکردنی تێزی دکتۆرا/ماستەر (Viva Voce)، ٥ پرسیاری ڕەخنەیی قووڵ لەگەڵ شێوازی وەڵامدانەوەی گونجاو بپڕسە بۆ تێزی: "${thesisTitle}". کورتە: "${abstract}". وەڵام بە JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.4 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Simulate viva error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە تاووتوێکردنی تاقیکردنەوەدا ڕوویدا.' });
    }
  });

  /**
   * AI Integrity Audit
   */
  router.post('/ai_integrity_audit', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'دەق پێویستە' });
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `پشکنینی ئینتێگریتی و دەستپاکی زانستی بکە بۆ ئەم دەقە: "${text}"`,
        config: { systemInstruction: SYSTEM_PROMPT_AI_INTEGRITY_AUDIT, responseMimeType: 'application/json', temperature: 0.2 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('AI integrity audit error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە پشکنینی ئینتێگریتیدا ڕوویدا.' });
    }
  });

  /**
   * Anonymize Data Endpoint
   */
  router.post('/anonymize_data', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'دەق پێویستە' });
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `ناوە تایبەتەکان، شوێنە حساسەکان و زانیارییە کەسییەکان بشارەوە و لە دەق ناویان دەربێنە: "${text}"`,
        config: { systemInstruction: SYSTEM_PROMPT_ANONYMIZE_DATA, responseMimeType: 'application/json', temperature: 0.1 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Anonymize data error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە ناونیشان سڕینەوەدا ڕوویدا.' });
    }
  });

  /**
   * Harvard Quality Audit Endpoint
   */
  router.post('/harvard_quality_audit', async (req: Request, res: Response) => {
    try {
      const { text, discipline } = req.body;
      if (!text) return res.status(400).json({ error: 'دەق پێویستە' });
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `پێوەرە ناوخۆییەکانی هەڵسەنگاندنی ئەکادیمی بەکاربهێنە بۆ دەقەکە: "${text}" (بوار: ${discipline || 'گشتی'})`,
        config: { systemInstruction: SYSTEM_PROMPT_HARVARD_FEATURES, responseMimeType: 'application/json', temperature: 0.2 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Academic quality audit error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە هەڵسەنگاندنی ئەکادیمیدا ڕوویدا.' });
    }
  });

  return router;
}
