import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
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
import { academicSearchService } from '../../services/academic-search.service';
import { sourceVerificationService } from '../services/source-verification.service';

export function createAcademicRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();
  router.use(requireAuth);

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
        // Local catalog is retrieval-only evidence. It must never be presented as externally verified.
        const catalog = crawlerEngine.getCatalog();
        const q = query.toLocaleLowerCase().trim();
        const matched = catalog.filter((b: any) =>
          String(b.title || '').toLocaleLowerCase().includes(q) ||
          String(b.author || '').toLocaleLowerCase().includes(q) ||
          (Array.isArray(b.subjects) && b.subjects.some((sub: any) =>
            String(sub).toLocaleLowerCase().includes(q)
          ))
        );

        deduplicated = matched.map((b: any) => ({
          title: b.title,
          authors: b.author ? [b.author] : [],
          year: b.year ?? 0,
          sourceName: b.sourceName || 'ئەرشیڤی ناوخۆیی',
          url: b.sourceUrl || undefined,
          snippet: b.description || '',
          verificationStatus: 'unverified',
          retrievedFrom: 'local-catalog'
        })) as unknown as typeof deduplicated;
      }

      res.json({
        sources: deduplicated,
        totalFound: deduplicated.length,
        retrievalPolicy: 'relevance-match-only',
        verificationPolicy: 'retrieval-does-not-imply-verification'
      });
    } catch (err: unknown) {
      console.warn('External sources search error (falling back to local catalog):', err);
      res.json({
        sources: [],
        totalFound: 0,
        isFallback: true,
        retrievalPolicy: 'fail-closed',
        verificationPolicy: 'no-source-on-provider-failure'
      });
    }
  });

  // /api/deep_research_agent
  router.post('/deep_research_agent', async (req: Request, res: Response) => {
    try {
      const { topic, discipline, documentTitle } = req.body || {};
      if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        res.status(400).json({ error: 'بابەتی توێژینەوە پێویستە.' });
        return;
      }

      const normalizedTopic = topic.trim().slice(0, 500);
      const normalizedDiscipline = typeof discipline === 'string'
        ? discipline.trim().slice(0, 200)
        : 'گشتی';
      const searchQuery = normalizedDiscipline && normalizedDiscipline !== 'گشتی'
        ? `${normalizedTopic} ${normalizedDiscipline}`
        : normalizedTopic;

      const discoveredSources = await academicSearchService.searchAll(searchQuery, 10);
      const verificationInput = discoveredSources.map(source => ({
        id: source.id,
        title: source.title,
        author: source.authors.join(', '),
        year: source.publicationYear || undefined,
        doi: source.doi || undefined,
        isbn: source.isbn || undefined
      }));
      const verification = await sourceVerificationService.verifySources(
        verificationInput,
        getGeminiClient
      );
      const verifiedIds = new Set(verification.verifiedSources.map(source => source.sourceId));
      const sources = discoveredSources.filter(source => verifiedIds.has(source.id));

      const verifiedRecords = sources;
      const sourceContext = verifiedRecords.map(source => ({
        id: source.id,
        title: source.title,
        authors: source.authors,
        publicationYear: source.publicationYear,
        abstract: source.abstract || '',
        source: source.source,
        doi: source.doi || '',
        url: source.url || '',
        verificationStatus: 'verified'
      }));

      if (sources.length === 0) {
        res.json({
          topic: normalizedTopic,
          discipline: normalizedDiscipline,
          documentTitle: typeof documentTitle === 'string' ? documentTitle.trim().slice(0, 500) : '',
          executiveSummary: '',
          keyFindings: [],
          theoreticalFramework: '',
          methodologicalInsights: '',
          academicSources: [],
          kurdishAcademicSynthesis: '',
          futureAvenues: [],
          sourceIntegrity: {
            retrievalStatus: discoveredSources.length ? 'results-but-unverified' : 'no-results',
            sourceCount: discoveredSources.length,
            verificationStatus: discoveredSources.length ? 'none-verified' : 'not-verified'
          },
          message: discoveredSources.length
            ? 'سەرچاوەکان دۆزرایەوە، بەڵام هیچ یەکێکیان بە verification ـی دەرەکی نەگەیشت؛ بۆیە synthesis دروست نەکرا.'
            : 'هیچ تۆمارێکی لە index ـە ئەکادیمییەکاندا بۆ ئەم بابەتە نەدۆزرایەوە؛ هیچ سەرچاوەی ساختە دروست نەکرا.'
        });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `توێژینەوەیەکی قووڵی ئەکادیمی بۆ بابەتی «${normalizedTopic}» بکە لە بواری «${normalizedDiscipline}».

تەنها ئەم تۆمارە ڕاستەقینانەی خوارەوە بەکاربهێنە:
${JSON.stringify(sourceContext, null, 2)}

یاساکانی گرنگ:
- هیچ نووسەر، ساڵ، DOI، ناونیشان، دەرئەنجام یان statistic ـێکی نوێ لە خۆتەوە دروست مەکە.
- ئەگەر داتای سەرچاوە بۆ پشتگیری بانگەشەیەک کافی نییە، بە ڕوونی بڵێ «بەڵگەی بەس نییە».
- جیاوازی بکە لەنێوان زانیارییەکانی source record و inference ـی شیکاری.
- هیچ citation ـێک دروست مەکە کە لە sourceContext ـدا نییە.

تەنها JSON:
{
  "executiveSummary": "پوختەی شیکاری",
  "keyFindings": ["خاڵی یەکەم"],
  "theoreticalFramework": "چوارچێوەی تیۆری؛ ئەگەر لە تۆمارەکاندا بەڵگە نییە، بنووسە بەڵگەی بەس نییە.",
  "methodologicalInsights": "تێبینیی مێتۆدۆلۆژی لەسەر ئەو data ـی بەردەست",
  "kurdishAcademicSynthesis": "سینتێزی ئەکادیمی بە سۆرانی",
  "futureAvenues": ["ڕێگای داهاتوو"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.15
        }
      });

      const parsed = robustParseJson(response.text || '{}') as Record<string, unknown>;
      const stringArray = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string').slice(0, 20)
          : [];

      res.json({
        topic: normalizedTopic,
        discipline: normalizedDiscipline,
        documentTitle: typeof documentTitle === 'string' ? documentTitle.trim().slice(0, 500) : '',
        executiveSummary: typeof parsed['executiveSummary'] === 'string' ? parsed['executiveSummary'] : '',
        keyFindings: stringArray(parsed['keyFindings']),
        theoreticalFramework: typeof parsed['theoreticalFramework'] === 'string' ? parsed['theoreticalFramework'] : '',
        methodologicalInsights: typeof parsed['methodologicalInsights'] === 'string' ? parsed['methodologicalInsights'] : '',
        academicSources: verifiedRecords.map(source => ({
          title: source.title,
          authors: source.authors.join(', '),
          year: source.publicationYear > 0 ? String(source.publicationYear) : 'n.d.',
          journal: source.source,
          relevance: 'retrieved-from-index',
          doi: source.doi || undefined,
          url: source.url || undefined,
          verificationStatus: 'verified'
        })),
        kurdishAcademicSynthesis: typeof parsed['kurdishAcademicSynthesis'] === 'string' ? parsed['kurdishAcademicSynthesis'] : '',
        futureAvenues: stringArray(parsed['futureAvenues']),
        sourceIntegrity: {
          retrievalStatus: 'index-results',
          sourceCount: sources.length,
          verificationStatus: 'verified'
        }
      });
    } catch (error) {
      console.error('Deep Research Agent error:', error);
      res.status(500).json({ error: 'کێشەیەک لە توێژینەوەی قووڵ ڕوویدا؛ هیچ سەرچاوەی خەیاڵی دەرنەهێنرا.' });
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
