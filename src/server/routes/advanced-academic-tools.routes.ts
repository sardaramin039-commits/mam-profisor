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
        contents: `پێوەر و ئاستی زانستیی هارڤارد (Harvard Standard) بەکاربهێنە بۆ دەقەکە: "${text}" (بوار: ${discipline || 'گشتی'})`,
        config: { systemInstruction: SYSTEM_PROMPT_HARVARD_FEATURES, responseMimeType: 'application/json', temperature: 0.2 }
      });

      return res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Harvard quality audit error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە هەڵسەنگاندنی هارڤارددا ڕوویدا.' });
    }
  });

  /**
   * Viva Defense Answer Evaluation Endpoint
   */
  router.post('/evaluate_viva_defense', async (req: Request, res: Response) => {
    try {
      const { thesisTitle, chapterContext, question, answer, academicLevel = 'ماستەر' } = req.body;
      if (typeof thesisTitle !== 'string' || typeof question !== 'string' || typeof answer !== 'string' || !answer.trim()) {
        res.status(400).json({ error: 'ناونیشانی تێز، پرسیاری Viva و وەڵام پێویستن.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt =
        'تۆ هەڵسەنگێنەری Viva Voce ـی ئەکادیمیت.\n' +
        'ئاستی خوێندن: ' + academicLevel + '\n' +
        'ناونیشانی تێز: ' + thesisTitle + '\n' +
        'کورتەی چوارچێوەی بەش: ' + String(chapterContext || '').slice(0, 8000) + '\n' +
        'پرسیاری لێژنە: ' + question + '\n' +
        'وەڵامی توێژەر: ' + answer + '\n\n' +
        'وەڵام بە JSON بدەرەوە: {"evaluationStatus":"evaluated","score":0,"passBand":"strong|adequate|needs_revision","feedbackText":"پێداچوونەوەی ورد لەسەر وەڵامەکە","strengths":[],"weaknesses":[],"improvementActions":[]}\n' +
        'نمرە تەنها هەڵسەنگاندنی AI ـیە، نە بڕیاری فەرمیی کۆتاییی زانکۆ. هیچ سەرچاوە یان citation لە خۆتەوە دروست مەکە.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      });

      const parsed = robustParseJson(response.text || '');
      const numericScore = Number(parsed?.score);
      const score = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0;
      const validBand = ['strong', 'adequate', 'needs_revision'];

      res.json({
        evaluationStatus: 'evaluated',
        score,
        passBand: validBand.includes(parsed?.passBand) ? parsed.passBand : 'needs_revision',
        isPassed: score >= 70,
        feedbackText: parsed?.feedbackText || 'هەڵسەنگاندنی AI بۆ وەڵامەکە بەردەست بوو.',
        strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed?.weaknesses) ? parsed.weaknesses : [],
        improvementActions: Array.isArray(parsed?.improvementActions) ? parsed.improvementActions : []
      });
    } catch (error) {
      console.error('Evaluate viva defense error:', error);
      res.status(503).json({ error: 'هەڵسەنگاندنی وەڵامی Viva لەم کاتەدا بەردەست نییە.', code: 'VIVA_EVALUATION_UNAVAILABLE' });
    }
  });

  /**
   * Academic title and abstract ideation
   */
  router.post('/title_summary', async (req: Request, res: Response) => {
    try {
      const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
      if (!topic) {
        res.status(400).json({ error: 'بابەت پێویستە.' });
        return;
      }
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'بۆ ئەم بابەتەی توێژینەوە سێ ناونیشانی ئەکادیمی و یەک پوختەی بێ‌سەرچاوە دروست بکە: ' + topic,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });
      const parsed = robustParseJson(response.text || '{}');
      const titles = Array.isArray(parsed?.titles)
        ? parsed.titles.filter((v: unknown) => typeof v === 'string' && v.trim()).slice(0, 3)
        : [];
      const summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';
      res.json({ titles, summary });
    } catch (error) {
      console.error('Title summary error:', error);
      res.status(503).json({ error: 'دروستکردنی ناونیشان و پوختە لەم کاتەدا بەردەست نییە.', code: 'TITLE_SUMMARY_UNAVAILABLE' });
    }
  });

  router.post('/summarize_thesis_context', async (req: Request, res: Response) => {
    try {
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      if (!text) { res.status(400).json({ error: 'دەقی تێز پێویستە.' }); return; }
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: text,
        config: { systemInstruction: SYSTEM_PROMPT_SUMMARIZE_THESIS_CONTEXT, responseMimeType: 'application/json', temperature: 0.2 }
      });
      res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Summarize thesis context error:', error);
      res.status(503).json({ error: 'پوختەکردنی کۆنتێکستی تێز لەم کاتەدا بەردەست نییە.', code: 'THESIS_CONTEXT_UNAVAILABLE' });
    }
  });

  router.post('/academic_additions', async (req: Request, res: Response) => {
    try {
      const { chapterTitle = '', chapterText = '', discipline = 'گشتی', academicLevel = 'ماستەر' } = req.body;
      if (!String(chapterText).trim()) { res.status(400).json({ error: 'دەقی بەش پێویستە.' }); return; }
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'بۆ ئەم بەشەی تێز بڕگەی یارمەتیدەری ئەکادیمی پێشنیار بکە، بەبێ دروستکردنی سەرچاوە یان داتای ساختە.\\nناونیشان: ' + chapterTitle + '\\nکایە: ' + discipline + '\\nئاست: ' + academicLevel + '\\nدەق: ' + String(chapterText).slice(0, 12000),
        config: { responseMimeType: 'application/json', temperature: 0.2 }
      });
      res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Academic additions error:', error);
      res.status(503).json({ error: 'زیادکردنی ئەکادیمی لەم کاتەدا بەردەست نییە.', code: 'ACADEMIC_ADDITIONS_UNAVAILABLE' });
    }
  });

  router.post('/sorani_phonetics', async (req: Request, res: Response) => {
    try {
      const { text, subDialect = 'hawler', scope = 'full' } = req.body;
      if (!String(text).trim()) { res.status(400).json({ error: 'دەق پێویستە.' }); return; }
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'شیکاریی زمانەوانی و دەنگسازیی سۆرانی بکە. شێوەزاری ئامانج: ' + subDialect + '، سنوور: ' + scope + '\\nدەق: ' + String(text).slice(0, 12000) + '\\nهیچ سەرچاوە یان داتای ساختە دروست مەکە. وەڵام JSON بێت.',
        config: { responseMimeType: 'application/json', temperature: 0.2 }
      });
      res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Sorani phonetics error:', error);
      res.status(503).json({ error: 'شیکاریی فۆنێتیک و شێوەزار لەم کاتەدا بەردەست نییە.', code: 'PHONETICS_UNAVAILABLE' });
    }
  });

  router.post('/recalibrate_rigor', async (req: Request, res: Response) => {
    try {
      const { text, intuition, discipline = 'گشتی', academicLevel = 'ماستەر' } = req.body;
      if (!String(text).trim()) { res.status(400).json({ error: 'دەقی بەش پێویستە.' }); return; }
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ئاستی ئەکادیمیی ئەم دەقە دووبارە هەڵبسەنگێنە بە لەبەرچاوگرتنی تێبینیی توێژەر.\\nکایە: ' + discipline + '\\nئاست: ' + academicLevel + '\\nتێبینیی توێژەر: ' + String(intuition || '').slice(0, 4000) + '\\nدەق: ' + String(text).slice(0, 12000) + '\\nهیچ نمرە یان دۆخی پەسەندکراو بەبێ شواهدی دەق مەدەرە. وەڵام JSON بێت.',
        config: { responseMimeType: 'application/json', temperature: 0.15 }
      });
      res.json(robustParseJson(response.text || '{}'));
    } catch (error) {
      console.error('Rigor recalibration error:', error);
      res.status(503).json({ error: 'دووبارە هەڵسەنگاندنی ئاستی ئەکادیمی لەم کاتەدا بەردەست نییە.', code: 'RIGOR_RECALIBRATION_UNAVAILABLE' });
    }
  });

  return router;
}
