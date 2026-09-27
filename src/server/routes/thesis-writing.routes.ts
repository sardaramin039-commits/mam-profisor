import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  SYSTEM_PROMPT_REFINE,
  SYSTEM_PROMPT_REVIEW_STRUCTURE,
  SYSTEM_PROMPT_GENERATE_CHAPTER,
  SYSTEM_PROMPT_EXPAND_GLOSSARY
} from '../../prompts/system-prompts';
import { PDF4KURD_BOOKS_ARCHIVE } from '../../prompts/pdf4kurd-books';
import { robustParseJson } from '../utils/json-repair';
import { getDigitalLibraryContextPrompt } from '../services/digital-library-context.service';
import { generateDynamicAcademicFallback } from '../services/dynamic-academic-fallback.service';
import { evidenceGroundingService } from '../services/evidence-grounding.service';

export function createThesisWritingRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * Academic Kurdish Text Refinement and Enrichment Endpoint
   */
  router.post('/refine', async (req, res) => {
    const { text, discipline, tone, goal } = req.body;
    try {
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'مەتنی دەقەکە پێویستە بۆ ئەنجامدانی پاڵفتەکردن' });
        return;
      }
      
      if (text.length > 15000) {
        res.status(400).json({ 
          error: 'دەقەکەت زۆر درێژە (تکایە دەقێکی کەمتر لە ١٥,٠٠٠ کارەکتەر بنێرە بۆ پاراستنی خێرایی).' 
        });
        return;
      }

      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_REFINE;

      const userPrompt = `شیکردنەوە و پاکنووسی ئەکادیمی بکە بۆ ئەم دەقە لای خوارەوە:
------------------------
دەق: "${text}"
بواری زانستی مەکینەیی: ${discipline || 'گشتی'}
شێوازی زمانەوانی دڵخواز: ${tone || 'فەرمی'}
ئامانجی چاکسازی: ${goal || 'بەرزکردنەوەی ئاستی گوتار'}
------------------------

تکایە بە شێوازی JSON وەڵام بدەرەوە بە تەواوی بەم پێکهاتەیە:
{
  "refinedText": "دەقی ئەکادیمی پاکنووسکراو بە زمانی کوردیی فەرمی و زانستی، کە کۆدی سەرچاوەی ناوەکی وەک (کاوان، ٢٠٢٣) یان (Smith, 2021) تێدا بەرجەستەیە",
  "diffs": [
    {
      "original": "بەشە کۆن یان ناڕێکەکەی ناو دەقەکە",
      "replacedWith": "بەشە چاککراو و بەرزکراوە نوێیەکە",
      "reason": "ڕوونکردنەوەی زمانەوانی بۆ هۆکاری گۆڕانکارییەکە"
    }
  ],
  "metrics": {
    "scholarlyScore": 85,
    "vocabularyRichness": 90,
    "readability": 75
  },
  "terminology": [
    {
      "foreignTerm": "زاراوە یان وشە بیانییە دۆزراوەکە",
      "kurdishTerm": "پیشنیاری هاوتای ئەکادیمیی کوردیی پاراو",
      "explanation": "شیکاری مانا و پێگەی بەکارهێنانی لە زانستدا"
    }
  ],
  "academicNotes": [
    "تێبینی و ئامۆژگاری زانستی پێویست بۆ توێژەرەکە سەبارەت بە لۆژیکی بابەتەکە"
  ],
  "citations": [
    {
      "key": "کۆدی سەرچاوەکە وەک (کاوان، ٢٠٢٣) یان (Smith, 2021)",
      "inText": "وەک لە دەقدا هاتووە (کاوان، ٢٠٢٣)",
      "supportedClaim": "ئەو لێکۆڵینەوە یان ڕاستییەی کە پاڵپشتی لێ دەکرێت"
    }
  ],
  "visualizations": [
    {
      "type": "bar یان line یان pie یان comparison",
      "title": "ناونیشانی گرافی پێشنیارکراو بۆ پشتگیری داتا",
      "reason": "هۆکاری پێویستی ئەم گرافەیە بۆ خوێنەر",
      "labels": ["داتا ١", "داتا ٢"],
      "values": [75, 90]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = robustParseJson(responseText);
        res.json(parsed);
      } catch (parseErr) {
        console.error('Failed to parse response as JSON. Raw text:', responseText, parseErr);
        res.status(500).json({
          error: 'سەرکەوتوو نەبوو لە وەرگرتنی پێکهاتەی وەڵام لەسەر شێوازی فەرمی JSON',
          rawText: responseText
        });
      }

    } catch (error) {
      console.error('Refine endpoint error:', error);
      const fallbackResponse = {
        refinedText: text,
        diffs: [],
        metrics: { scholarlyScore: 60, vocabularyRichness: 60, readability: 70 },
        terminology: [],
        academicNotes: ["کێشەیەکی هونەری یان نەبوونی هێڵ ڕوویدا لە کاتی پەیوەندیکردن بە مۆدێلی ژیریی دەستکرد. بۆ پاراستنی ناوەڕۆکەکەت، دەقەکەت بەو شێوەیە نیشان دەدرێتەوە."],
        citations: [],
        bibliography: [],
        visualizations: []
      };
      res.json(fallbackResponse);
    }
  });

  /**
   * Structure Review Endpoint
   */
  router.post('/review_structure', async (req, res) => {
    try {
      const { title, discipline, writingType, academicLevel, size, chaptersList } = req.body;
      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_REVIEW_STRUCTURE;
      const userPrompt = `پێداچوونەوە بکە بە جێکەوت و پێکهاتەی کارەکەمان:
ناونیشانی سەرەکی: "${title}"
بواری زانستی: ${discipline}
جۆری نوسین: ${writingType}
ئاستی زانستی: ${academicLevel}
قەبارە: ${size} لاپەڕە

ئەم بەشە سەرەتاییانە دانراون:
${JSON.stringify(chaptersList)}

تکایە بە شێوازی JSON وەڵام بدەرەوە بە تەواوی بەم پێکهاتەیە:
{
  "strengthenedTitle": "بەهێزترین ناونیشانی پێشنیارکراوی ئەکادیمی بۆ کارەکە",
  "feedbackMessage": "شرۆڤەیەکی کورت و بەهێزی ڕەخنەیی لەسەر پێکهاتەکە بە کوردییەکی جوان",
  "suggestions": [
    {
      "chapterIndex": 0,
      "improvedTitle": "ناوی پێشنیارکراوی نوێ بۆ ئەم بەشە تا لەگەڵ ناونیشانەکە بێتەوە",
      "reason": "هۆکار و گۆڕینی وشەکە بۆ زاراوەیەکی باڵاتر"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const text = response.text || '';
      res.json(robustParseJson(text));
    } catch (error) {
      console.error('Review structure error:', error);
      res.status(500).json({ error: 'هەڵەیەک ڕوویدا لە پێداچوونەوەی پێکهاتەدا' });
    }
  });

  /**
   * AI Generate Chapter Endpoint
   */
  router.post('/generate_chapter', async (req, res) => {
    try {
      const { 
        title, discipline, writingType, academicLevel, pages,
        sizeMode, minPages, maxPages, targetPages,
        totalWordsCount, minWordsCount, maxWordsCount, targetWordsPerChapter,
        currentChapterIndex, chapterTitle, 
        previousChapterContent, role, dialect, 
        copyStyleText, temperature, thesisDefense, 
        thinkingTokens, writingTokens, humanizeMode,
        compareAspect, compareFile1, compareFile2,
        activeRules, academicStyle,
        customSourcesOn, customSourcesText,
        customTOCOn, customTOCText,
        fieldWorkOn, fieldWorkText,
        selectedBook
      } = req.body;

      const currentStyle = academicStyle || 'harvard';
      let styleInstruction = '';
      if (currentStyle === 'harvard') {
        styleInstruction = '\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: Harvard Academic Style (هارڤارد)**\n' +
          '- **ئاماژەدانی ناو تێکست:** تەواو پابەندبە بە پێوەری نووسەر-ڕێکەوت لەناو دەق، وەک: (Smith, 2023) یان (ئەحمەد، ٢٠٢٢، ل. ٤٥). مەکە بە ژمارە یان نووسینی ناوی تەواو.\n' +
          '- **لیستی سەرچاوەکان (Bibliography):** لە کۆتایی کارەکەدا لە بەشی بەیبلۆگرافی سەرچاوەکان بەپێی ڕێزبەندی پاشناوی نووسەر بە فۆرماتی هارڤارد بنووسە.';
      } else if (currentStyle === 'apa7') {
        styleInstruction = '\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: APA 7th Edition (ئەی پی ئەی - حەوتەم)**\n' +
          '- **ئاماژەدانی ناو تێکست:** بەکارهێنانی (نووسەر، ساڵ)، وەک: (Aland, 2021) یان (فالح، ٢٠٢٠).\n' +
          '- **لیستی سەرچاوەکان (References):** نووسینی لیستی سەرچاوەکان بە ڕێکوپێکی پاشناوی نووسەران و بەکارهێنانی دێڕی دەرپەڕیۆ (Hanging Indent) لە دەربڕیندا.';
      } else if (currentStyle === 'chicago') {
        styleInstruction = `\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: Chicago Manual of Style (شیکاگۆ)**\n` +
          `- **شێوازی نووسین:** بەکارهێنانی ئیندێکس لەگەڵ زاراوەسازییەکی زۆر ورد.\n` +
          `- **ئاماژەدان:** پەیڕەوکردنی شێوازی تێبینی زمانەوانی و بەیبلۆگرافی لە داڕشتنی سەرچاوەدانی ناوخۆییدا.`;
      } else if (currentStyle === 'mla') {
        styleInstruction = `\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: MLA Style (ئێم ئێڵ ئەی)**\n` +
          `- **ئاماژەدان:** پەیڕەوکردنی (ناوی نووسەر، ژمارەی لاپەڕە) بەبێ کۆما لەنێوانیاندا، وەک: (Kadir 132).\n` +
          `- **سەرچاوەکان:** بەکاربردنی 'Works Cited' بۆ پێڕستی سەرچاوە فەرمییەکان بە پێوەری ئێم ئێڵ ئەی.`;
      } else if (currentStyle === 'ieee') {
        styleInstruction = `\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: IEEE Style (ئای تریپڵ ئی)**\n` +
          `- **ئاماژەدانی ناو دەق:** بەکارهێنانی ژمارە لەناو کەوانەی چوارگۆشەدا، وەک [١] یان [٢] بە ڕێزبەندی دەرکەوتن.\n` +
          `- **لیستی سەرچاوەکان:** ڕێکخستنی سەرچاوەکان لە دەرئەنجامدا بەپێی ژمارەی یەکەمی دەرکەوتنیان لە دەقەکەدا.`;
      } else {
        styleInstruction = `\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: Vancouver Citation Style (ڤانکۆڤەر)**\n` +
          `- **ئاماژەدان:** بەکارهێنانی ژمارەی سەرچاوەی پیتی بچووک یان لە کەوانەدا بە زنجیرەی دەرکەوتن.`;
      }

      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_GENERATE_CHAPTER;

      let comparisonPrompt = '';
      if (compareFile1 || compareFile2) {
        const aspect = compareAspect || 'شیکردنەوەی زمانەوانی، مێژوویی و جیاوازی فیکری کایەکە';
        comparisonPrompt = `\n⚠️ باری بەراوردکاری چالاکە! ئەرکت بەراوردکردنی ئەم نوسین/سەرچاوە بارکراوانەیە بەپێی کایەی "${aspect}":\n` +
           `دەقی یەکەم:\n"${compareFile1 || ''}"\n` +
           `دەقی دووەم:\n"${compareFile2 || ''}"\n` +
           `پێویستە ئەم بەراشت پێکەوەگرێدانە بە شێوازێکی هاوسەنگ لەم بەشەدا بە تەواوی تێکەڵ بکەیت تا پیشەییترین بەراوردکاری بێتە بەرهەم.`;
      }

      let customSourcesPrompt = '';
      if (customSourcesOn && customSourcesText) {
        customSourcesPrompt = `\n⚠️ **یاسای سەرچاوەی تایبەت چالاکە (Strict Custom Sources ONLY)**:\nبەکارهێنەر تەنها ئەم سەرچاوانەی خوارەوەی بۆ دیاریکردویت کە دەبێت لەناو دەق و لە لیستی سەرچاوەکاندا بەکاریان بهێنیت. بە هیچ شێوەیەک هیچ ناوی سەرچاوەیەکی تری دەرەکی دروست مەکە یان بەکار مەهێنە کە لەم دەقەی خوارەوەدا نەبێت:\n"${customSourcesText}"`;
      } else {
        customSourcesPrompt = getDigitalLibraryContextPrompt(chapterTitle || title || discipline) +
          `\n🔍 **باری گەڕان لە ٤٠ کتێبخانە دیجیتاڵییەکەی ئەپڵیکەیشن چالاکە**:\nپێویستە هەمیشە ئاماژەدانی ناو دەق و سەرچاوەکانی کۆتایی لە ناو ئەرشیڤی ٤٠ کتێبخانە دیجیتاڵییەکەوە بدۆزیتەوە. بە هیچ شێوەیەک سەرچاوەی خەیاڵی یان دروستکراو مەنووسە.`;
      }

      let customTOCPrompt = '';
      if (customTOCOn && customTOCText) {
        customTOCPrompt = `\n⚠️ **یاسای پێڕستی تایبەت چالاکە (Strict Custom Table of Contents/Outline)**:\nپێویستە داڕشتن و بونیادی ئەم بەشە بە تەواوی وەک خۆی پابەند بێت بەم پێڕستە یان هێڵکارییەی خوارەوە کە لەلایەن بەکارهێنەرەوە دابینکراوە:\n"${customTOCText}"`;
      } else {
        customTOCPrompt = `\n📝 **باری پێڕستی خۆکار چالاکە**:\nخۆت پێڕستێکی گونجاو و هێڵکارییەکی لۆژیکی بۆ بابەتەکە دابنێ بۆ داڕشتنی گوتارێکی زانستی ڕێکخراو.`;
      }

      let fieldWorkPrompt = '';
      if (fieldWorkOn && fieldWorkText) {
        fieldWorkPrompt = `\n⚠️ **باری زانیاری مەیدانی چالاکە (Field Work Data Integration)**:\nبەکارهێنەر هەندێک زانیاری و داتای مەیدانی پێداویت. پێویستە ئەم زانیارییانەی خوارەوە بە تەواوی لە کایە گونجاوەکانی نووسینەکەدا تێکەڵ بکەیت و وەک بەڵگە یان پشتگیرییەکی ئەزموونی شیکار و هەڵسەنگاندنی بۆ بکەیت و بەکاریان بهێنیت:\n"${fieldWorkText}"`;
      }

      let selectedBookPrompt = '';
      if (selectedBook) {
        const bookObj = PDF4KURD_BOOKS_ARCHIVE.find((b: any) => b.title === selectedBook);
        if (bookObj) {
          selectedBookPrompt = `\n⚠️ **یاسای چەسپاندنی سەرچاوەی فیزیکی ڕاستەقینە (Physical Grounding Rule)**:
پێویستە ئەم بەشە بە تەواوی بەسترابێتەوە بە کتێب و ژانی نووسینی ئەم سەرچاوە فەرمییەی خوارەوە:
- ناونیشانی سەرچاوە: "${bookObj.title}"
- نووسەر: "${bookObj.author}"
- ساڵی چاپ: ${bookObj.year}
- دەزگای چاپ: "${bookObj.publisher}"
- بەستەر: "${bookObj.link}"

دەبێت بە لایەنی کەمەوە لە ٣ شوێنی گرنگ لەناو دەقدا بە شێوازی فەرمی ئاماژە بەم کتێبە بکەیت بەپێی ستاندارد (بۆ نموونە: (${bookObj.author}, ${bookObj.year}))، و زانیاری و تێزەکان لەگەڵ بیرۆکەکانی ئەم کتێبە یەکبخەیت.`;
        }
      }

      const userPrompt = `بەشی ژمارە ${currentChapterIndex + 1} دەستپێبکە بە درێژی بۆ ئەم تێزە:
ناونیشانی تێز: "${title}"
ناونیشانی بەشی ژمارە ${currentChapterIndex + 1}: "${chapterTitle}"
بواری زانستی: ${discipline}
ئاستی زانستی: ${academicLevel}
ژمارەی لاپەڕە دڵخواز: ${targetPages || pages}
تێکڕای ووشەی دڵخواز بۆ بەشەکە: ${targetWordsPerChapter} وشە
${styleInstruction}
${customSourcesPrompt}
${customTOCPrompt}
${fieldWorkPrompt}
${selectedBookPrompt}
${previousChapterContent ? `\nکورتە دەقی بەشی پێشوو:\n"${previousChapterContent.slice(-1500)}"` : ''}
${copyStyleText ? `\nکۆپی ستایل:\n"${copyStyleText}"` : ''}
${comparisonPrompt}

تکایە بە شێوازی JSON وەڵام بدەرەوە بە تەواوی فۆرماتەکە بەم پێکهاتەیە:
{
  "content": "ناوەڕۆکی قووڵ، درێژ، فەرمی و تێرکەری بەشی ژمارە ${currentChapterIndex + 1}",
  "wordCount": ${targetWordsPerChapter || 8750},
  "academicNotes": "تێبینی زمانەوانی و پێشنیاری نووسەر بۆ توێژەرەکە"
}`;

      const config: {
        systemInstruction?: string;
        responseMimeType?: string;
        temperature?: number;
        tools?: { googleSearch: Record<string, never> }[];
      } = {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: temperature || 0.7
      };

      if (!customSourcesOn) {
        config.tools = [{ googleSearch: {} }];
        delete config.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config
      });

      const text = response.text || '';
      res.json(robustParseJson(text));
    } catch (error) {
      console.error('Generate chapter error:', error);
      const fallbackTitle = req.body.chapterTitle || 'ناونیشانی بەشەکە';
      const fallbackText = generateDynamicAcademicFallback({
        toolId: 'academic_paraphrase',
        inputText: fallbackTitle,
        discipline: req.body.discipline || 'گشتی',
        academicLevel: req.body.academicLevel || 'زانکۆ'
      });
      res.json({
        content: fallbackText,
        wordCount: fallbackText.trim().split(/\s+/).filter(Boolean).length,
        academicNotes: 'دەقی بەشەکە بە ڕێگەی مۆدێلی ئۆفلاین دروستکرا.'
      });
    }
  });

  /**
   * AI Expand Glossary Term Endpoint
   */
  router.post('/expand_glossary_term', async (req, res) => {
    try {
      const { term, definition, category } = req.body;
      if (!term || typeof term !== 'string') {
        res.status(400).json({ error: 'زاراوەکە پێویستە' });
        return;
      }

      const ai = getGeminiClient();
      const systemPrompt = SYSTEM_PROMPT_EXPAND_GLOSSARY;
      const userPrompt = `شیکردنەوەی فراوان و ئەکادیمی بۆ ئەم زاراوەیە بکە:
زاراوە: "${term}"
پێناسەی سەرەتایی: "${definition || ''}"
پۆلێنکاری: "${category || 'گشتی'}"

تکایە بە JSON وەڵام بدەرەوە:
{
  "term": "${term}",
  "academicDefinition": "پێناسەی زانستی زۆر ورد و ئەکادیمی بە سۆرانی",
  "etymology": "ڕەگوڕێشە یان بنەچەی وشەکە لە زمان یان زانستدا",
  "usageContext": "چۆنیەتی بەکارهێنانی لە توێژینەوەی ئەکادیمیدا",
  "relatedTerms": ["زاراوەی بەستراوی ١", "زاراوەی بەستراوی ٢"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      res.json(robustParseJson(response.text || ''));
    } catch (err) {
      console.error('Expand glossary term error:', err);
      res.status(500).json({ error: 'کێشەیەک لە فراوانکردنی زاراوەکە ڕوویدا' });
    }
  });

  /**
   * P5 Evidence Intelligence & Grounded Content Generation Endpoint
   */
  router.post('/grounded_generate', async (req, res) => {
    try {
      const { topic, prompt, evidenceChunks } = req.body;
      if (!topic || !prompt) {
        res.status(400).json({ error: 'تەوەرە (topic) و داواکاری (prompt) پێویستن.' });
        return;
      }

      const result = await evidenceGroundingService.generateGroundedContent(
        topic,
        prompt,
        Array.isArray(evidenceChunks) ? evidenceChunks : [],
        getGeminiClient
      );

      res.json(result);
    } catch (err: unknown) {
      console.error('Grounded generate error:', err);
      res.status(500).json({ error: 'کێشەیەک لە دروستکردنی دەقی بنەماپێدراو لەسەر بەڵگەکان ڕوویدا.' });
    }
  });

  return router;
}
