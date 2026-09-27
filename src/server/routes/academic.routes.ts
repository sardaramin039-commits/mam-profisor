import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  SYSTEM_PROMPT_REFINE
} from '../../prompts/system-prompts.js';
import { getDigitalLibraryContextPrompt } from '../config/library-context.js';
import { robustParseJson } from '../utils/json-repair.js';
import { 
  fetchSemanticScholar as apiFetchSemanticScholar, 
  fetchPubMed as apiFetchPubMed, 
  fetchOpenLibrary as apiFetchOpenLibrary, 
  fetchInternetArchive as apiFetchInternetArchive,
  fetchDOAJ as apiFetchDOAJ,
  fetchWorldCat as apiFetchWorldCat,
  fetchEuropeana as apiFetchEuropeana,
  fetchLibraryOfCongress as apiFetchLibraryOfCongress,
  fetchOAIPMH as apiFetchOAIPMH
} from '../../helpers/academic-integrations.js';
import { resolveDoi, lookupIsbn, lookupIssn } from '../../helpers/extended-academic-tools.js';
import { crawlerEngine } from '../../services/crawler-engine';

export function createAcademicRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  // /api/refine
  router.post('/refine', async (req: Request, res: Response) => {
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
      const userPrompt = `شیکردنەوە و پاکنووسی ئەکادیمی بکە بۆ ئەم دەقە لای خوارەوە:
------------------------
دەق: "${text}"
بواری زانستی مەکینەیی: ${discipline || 'گشتی'}
شێوازی زمانەوانی دڵخواز: ${tone || 'فەرمی'}
ئامانجی چاکسازی: ${goal || 'بەرزکردنەوەی ئاستی گوتار'}
------------------------

تکایە بە شێوازی JSON وەڵام بدەرەوە بە تەواوی بەم پێکهاتەیە:
{
  "refinedText": "دەقی ئەکادیمی پاکنووسکراو بە زمانی کوردیی فەرمی و زانستی",
  "diffs": [
    {
      "original": "بەشە کۆن یان ناڕێکەکەی ناو دەقەکە",
      "replacedWith": "بەشە چاککراو و بەرزکراوە نوێیەکە",
      "reason": "هۆکاری زمانەوانی یان میتۆدۆلۆژی بۆ ئەم دەستکارییە"
    }
  ],
  "score": 92
}`;

      const libraryPrompt = getDigitalLibraryContextPrompt(text);
      const fullSystemPrompt = `${SYSTEM_PROMPT_REFINE}\n\n${libraryPrompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [userPrompt],
        config: {
          systemInstruction: fullSystemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('وەڵام لە لایەن مۆدێلی ژیریی دەستکردەوە بە بەتاڵی گەیشت.');
      }

      const json = robustParseJson(responseText);
      res.json(json);
    } catch (error: unknown) {
      console.error('Error in /api/refine:', error);
      const errMsg = error instanceof Error ? error.message : 'هەڵەیەکی نەزانراو ڕوویدا';
      res.status(500).json({ error: `هەڵە لە پاڵفتەکردنی دەق: ${errMsg}` });
    }
  });

  // /api/sources/external
  router.get('/sources/external', async (req: Request, res: Response) => {
    const query = req.query['q'] as string;
    if (!query) {
      res.status(400).json({ error: 'گەڕان پێویستە' });
      return;
    }
    try {
      const results = await Promise.allSettled([
        apiFetchSemanticScholar(query),
        apiFetchPubMed(query),
        apiFetchOpenLibrary(query),
        apiFetchInternetArchive(query),
        apiFetchDOAJ(query),
        apiFetchWorldCat(query),
        apiFetchEuropeana(query),
        apiFetchLibraryOfCongress(query),
        apiFetchOAIPMH(query)
      ]);

      const all = results.flatMap(res => res.status === 'fulfilled' ? res.value : []);
      const seenTitles = new Set<string>();
      let deduplicated = all.filter(item => {
        const key = item.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (key && seenTitles.has(key)) return false;
        if (key) seenTitles.add(key);
        return true;
      });

      if (deduplicated.length === 0) {
        // Dynamic fallback to local catalog
        const catalog = crawlerEngine.getCatalog();
        const q = query.toLowerCase();
        const matched = catalog.filter((b: any) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (Array.isArray(b.subjects) && b.subjects.some((sub: any) => String(sub).toLowerCase().includes(q)))
        );
        const fallbackItems = (matched.length > 0 ? matched : catalog.slice(0, 10)).map((b: any) => ({
          title: b.title,
          authors: [b.author],
          year: b.year,
          sourceName: b.sourceName || 'ئەرشیڤی ٤٠ کتێبخانە دیجیتاڵییەکە',
          url: b.sourceUrl || '#',
          snippet: `کتێبی ساغکراوە لە ئەرشیڤی ${b.sourceName}: ${b.title} لە نووسینی ${b.author} (${b.year}).`
        }));
        deduplicated = fallbackItems as unknown as typeof deduplicated;
      }

      res.json({ sources: deduplicated, totalFound: deduplicated.length, isFallback: all.length === 0 });
    } catch (err: unknown) {
      console.warn('External sources search error (falling back to local catalog):', err);
      const catalog = crawlerEngine.getCatalog();
      const fallbackItems = catalog.slice(0, 10).map((b: any) => ({
        title: b.title,
        authors: [b.author],
        year: b.year,
        sourceName: b.sourceName || 'ئەرشیڤی ٤٠ کتێبخانە دیجیتاڵییەکە',
        url: b.sourceUrl || '#',
        snippet: `کتێبی ساغکراوە لە ئەرشیڤی ${b.sourceName}: ${b.title} لە نووسینی ${b.author} (${b.year}).`
      }));
      res.json({ sources: fallbackItems, totalFound: fallbackItems.length, isFallback: true });
    }
  });

  // /api/tools/doi-resolver
  router.get('/tools/doi-resolver', async (req: Request, res: Response) => {
    const doi = req.query['doi'] as string;
    if (!doi) {
      res.status(400).json({ error: 'DOI input is required' });
      return;
    }
    const result = await resolveDoi(doi);
    if (!result) {
      res.status(404).json({ error: 'DOI resolution failed or DOI not found' });
      return;
    }
    res.json(result);
  });

  // /api/tools/isbn-lookup
  router.get('/tools/isbn-lookup', async (req: Request, res: Response) => {
    const isbn = req.query['isbn'] as string;
    if (!isbn) {
      res.status(400).json({ error: 'ISBN is required' });
      return;
    }
    const result = await lookupIsbn(isbn);
    if (!result) {
      res.status(404).json({ error: 'ISBN lookup failed' });
      return;
    }
    res.json(result);
  });

  // /api/tools/issn-lookup
  router.get('/tools/issn-lookup', async (req: Request, res: Response) => {
    const issn = req.query['issn'] as string;
    if (!issn) {
      res.status(400).json({ error: 'ISSN is required' });
      return;
    }
    const result = await lookupIssn(issn);
    if (!result) {
      res.status(404).json({ error: 'ISSN lookup failed' });
      return;
    }
    res.json(result);
  });

  return router;
}
