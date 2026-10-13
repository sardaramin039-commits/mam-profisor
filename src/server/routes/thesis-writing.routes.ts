import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
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
import { humanScholarlyProseService } from '../services/human-scholarly-prose.service';
import { disciplineProfileService } from '../services/discipline-profile.service';
import { evidenceGroundingService } from '../services/evidence-grounding.service';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  thesisRefineSchema,
  structureReviewSchema,
  chapterGenerationSchema,
  glossaryExpansionSchema,
  groundedGenerationSchema
} from '../utils/thesis-writing.schemas';

export function createThesisWritingRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();
  router.use(requireAuth);

  /**
   * Academic Kurdish Text Refinement and Enrichment Endpoint
   */
  router.post('/refine', validateRequest(thesisRefineSchema), async (req, res) => {
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
  "refinedText": "تەنها دەقی پاکنووسکراو؛ هیچ citation یان ناوی سەرچاوە زیاد مەکە ئەگەر لە دەقی سەرەتایی یان سەرچاوەی دابینکراو پشتگیری نەکراوە.",
  "diffs": [
    {
      "original": "بەشە کۆن یان ناڕێکەکەی ناو دەقەکە",
      "replacedWith": "بەشە چاککراو و بەرزکراوە نوێیەکە",
      "reason": "ڕوونکردنەوەی زمانەوانی بۆ هۆکاری گۆڕانکارییەکە"
    }
  ],
  "metrics": {
    "scholarlyScore": null,
    "vocabularyRichness": null,
    "readability": null,
    "status": "requires-grounded-evaluation"
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
  "citations": [] ,
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
        model: (req.body.model || req.body.ragModel || 'gemini-3.8-flash'),
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = robustParseJson(responseText) as Record<string, unknown>;
        const rawRefinedText = typeof parsed['refinedText'] === 'string'
          ? parsed['refinedText'].trim()
          : text;
        const profile = disciplineProfileService.getProfile(String(discipline || 'گشتی'));
        const prose = await humanScholarlyProseService.refine(
          rawRefinedText,
          profile,
          getGeminiClient
        );
        res.json({
          ...parsed,
          refinedText: prose.refinedText || rawRefinedText,
          prosePolicy: prose.stylePolicy,
          prosePreservationPassed: prose.preservationPassed !== false
        });
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
        metrics: {
          scholarlyScore: null,
          vocabularyRichness: null,
          readability: null,
          status: 'unavailable'
        },
        terminology: [],
        academicNotes: [
          'AI نەبوو بەردەست؛ دەقی سەرەتایی بەبێ زیادکردنی بانگەشە یان citation ـی نوێ پارێزرا.'
        ],
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
  router.post('/review_structure', validateRequest(structureReviewSchema), async (req, res) => {
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
        model: (req.body.model || req.body.ragModel || 'gemini-3.8-flash'),
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
  router.post('/generate_chapter', validateRequest(chapterGenerationSchema), async (req, res) => {
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
          '- **ئاماژەدانی ناو تێکست:** لەم قۆناغی نووسینەدا هیچ citation ـێکی نوێ دروست مەکە؛ Citation Engine دوای verification ـی دەرەکی زیاد دەکات.\n' +
          '- **لیستی سەرچاوەکان (Bibliography):** لە کۆتایی کارەکەدا لە بەشی بەیبلۆگرافی سەرچاوەکان بەپێی ڕێزبەندی پاشناوی نووسەر بە فۆرماتی هارڤارد بنووسە.';
      } else if (currentStyle === 'apa7') {
        styleInstruction = '\n📚 **شێواز و ستایلی ئاماژەدان و نووسین: APA 7th Edition (ئەی پی ئەی - حەوتەم)**\n' +
          '- **ئاماژەدانی ناو تێکست:** لەم قۆناغی نووسینەدا هیچ citation ـێکی نوێ دروست مەکە؛ Citation Engine دوای verification ـی دەرەکی زیاد دەکات.\n' +
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
          selectedBookPrompt = `\n⚠️ **تۆماری کتێبی هەڵبژێردراو (Candidate Metadata — Unverified)**:
ئەم تۆمارە تەنها بۆ context ـە و هیچ verification ـی دەرەکی یان peer-review ـی لەوێدا نەسەلمێنراوە:
- ناونیشانی سەرچاوە: "${bookObj.title}"
- نووسەر: "${bookObj.author}"
- ساڵی چاپ: ${bookObj.year}
- دەزگای چاپ: "${bookObj.publisher}"
- بەستەر: "${bookObj.link}"

ئەم metadata ـە تەنها بۆ context بەکاربهێنە؛ هیچ citation ـێک بۆ ئەم تۆمارە دروست مەکە تا verification ـی دەرەکی تەواو بێت.`;
        }
      }

      const citationSafetyInstruction = [
        'لەم قۆناغی writing ـدا هیچ citation، DOI، ISBN، quote یان reference ـی نوێ لە خۆتەوە دروست مەکە.',
        'هیچ citation ـی نموونەیی وەک (Smith, 2023)، (ئەحمەد، ٢٠٢٢) یان [1] لە دەقەکەدا مەنووسە.',
        'تەنها source context ـی دابینکراو وەک input بەکاربهێنە؛ citation eligibility دوای verification ـی دەرەکی دیاری دەکرێت.'
      ].join('\n');

      const userPrompt = `${citationSafetyInstruction}\n\nبەشی ژمارە ${currentChapterIndex + 1} دەستپێبکە بە درێژی بۆ ئەم تێزە:
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

      const targetWordsNum = Number(targetWordsPerChapter) || (targetPages ? Number(targetPages) * 350 : 0) || 1500;
      const adaptiveThinkingBudget = Number(thinkingTokens) > 0 ? Number(thinkingTokens) : Math.min(16000, Math.max(4096, Math.round(targetWordsNum * 6)));
      const adaptiveOutputTokens = Number(writingTokens) > 0 ? Number(writingTokens) : Math.min(32000, Math.max(8192, Math.round(targetWordsNum * 8)));

      const config: {
        systemInstruction?: string;
        responseMimeType?: string;
        temperature?: number;
        tools?: { googleSearch: Record<string, never> }[];
        maxOutputTokens?: number;
        thinkingConfig?: { thinkingBudget?: number };
      } = {
        systemInstruction: systemPrompt + '\n📌 چڕیی زانستی: دەبێت هەموو ڕستەیەک زانیاری و بەڵگەی نوێ بدات و بە تەواوی لە درێژدادڕی دوور بکەوێتەوە.',
        responseMimeType: 'application/json',
        temperature: temperature || 0.65,
        maxOutputTokens: adaptiveOutputTokens,
        thinkingConfig: { thinkingBudget: adaptiveThinkingBudget }
      };

      if (!customSourcesOn) {
        config.tools = [{ googleSearch: {} }];
        delete config.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model: (req.body.model || req.body.ragModel || 'gemini-3.8-flash'),
        contents: userPrompt,
        config
      });

      const parsed = robustParseJson(response.text || '{}') as Record<string, unknown>;
      const generatedContent = typeof parsed['content'] === 'string'
        ? parsed['content'].trim()
        : '';

      const unverifiedCitationPattern =
        /\([A-Z][^()]{1,80},\s*(?:19|20)\d{2}[a-z]?\)|\([^()\u0600-\u06ff]{2,80}،\s*[0-9٠-٩]{4}\)|\[[0-9٠-٩]{1,3}\]/;

      if (unverifiedCitationPattern.test(generatedContent)) {
        throw new Error('Generated chapter contains citation-like references before verification.');
      }

      if (!generatedContent) {
        throw new Error('Chapter generator returned no usable content.');
      }

      const profile = disciplineProfileService.getProfile(String(discipline || 'گشتی'));
      const prose = await humanScholarlyProseService.refine(
        generatedContent,
        profile,
        getGeminiClient
      );
      const finalContent = prose.refinedText || generatedContent;

      if (unverifiedCitationPattern.test(finalContent)) {
        throw new Error('Natural prose pass produced citation-like references before verification.');
      }

      const rawWordCount = Number(parsed['wordCount']);
      const wordCount = Number.isFinite(rawWordCount)
        ? Math.max(0, Math.round(rawWordCount))
        : finalContent.split(/\s+/).filter(Boolean).length;

      res.json({
        content: finalContent,
        wordCount,
        academicNotes: typeof parsed['academicNotes'] === 'string'
          ? parsed['academicNotes']
          : 'Chapter content generated successfully.',
        citationStatus: 'not_verified',
        citationPolicy: 'Citation and bibliography eligibility must be established by the source-verification/evidence pipeline.',
        bibliography: []
      });
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
        academicNotes: 'AI بەردەست نەبوو؛ ئەم وەڵامە تەنها scaffold ـە و هیچ citation ی پشتڕاستکراوی تێدا نییە.',
        citationStatus: 'not_verified',
        citationPolicy: 'No citation is emitted from fallback mode.',
        bibliography: []
      });
    }
  });

  /**
   * AI Expand Glossary Term Endpoint
   */
  router.post('/expand_glossary_term', validateRequest(glossaryExpansionSchema), async (req, res) => {
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
        model: (req.body.model || req.body.ragModel || 'gemini-3.8-flash'),
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
  router.post('/grounded_generate', validateRequest(groundedGenerationSchema), async (req, res) => {
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
