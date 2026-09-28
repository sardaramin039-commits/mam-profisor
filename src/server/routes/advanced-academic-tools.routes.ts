import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  researchTimelineSchema,
  mindMapSchema,
  autoOutlineSchema,
  tableFigureSchema,
  vivaSchema,
  textOnlySchema,
  harvardAuditSchema,
  vivaDefenseSchema,
  titleSummarySchema,
  thesisContextSchema,
  academicAdditionsSchema,
  soraniPhoneticsSchema,
  rigorRecalibrationSchema
} from '../utils/advanced-tools.schemas';
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
  router.post('/research_timeline', validateRequest(researchTimelineSchema), async (req: Request, res: Response) => {
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
  router.post('/mind_map_generator', validateRequest(mindMapSchema), async (req: Request, res: Response) => {
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
  router.post('/auto_outline_generator', validateRequest(autoOutlineSchema), async (req: Request, res: Response) => {
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
  router.post('/table_figure_generator', validateRequest(tableFigureSchema), async (req: Request, res: Response) => {
    try {
      const { concept, type = 'table' } = req.body;
      const ai = getGeminiClient();
      const prompt = `خشتە یان شێوەی زانستی (${type}) تەنها لەسەر داتای پێدراو ڕێکبخە بۆ: "${concept}". ئەگەر ژمارە، پێوانە، دەرئەنجام یان dataset ـی ڕاستەقینە نەدراوە، هیچ داتای نوێ دروست مەکە؛ بە جێی ئەوە rows/values ـی بەتاڵ دابنێ و status=requires-real-data بنووسە. وەڵام بە JSON.`

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
  router.post('/simulate_viva', validateRequest(vivaSchema), async (req: Request, res: Response) => {
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
  router.post('/ai_integrity_audit', validateRequest(textOnlySchema), async (req: Request, res: Response) => {
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
  router.post('/anonymize_data', validateRequest(textOnlySchema), async (req: Request, res: Response) => {
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
  router.post('/harvard_quality_audit', validateRequest(harvardAuditSchema), async (req: Request, res: Response) => {
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
