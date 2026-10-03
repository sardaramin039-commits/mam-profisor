import { Router, Request, Response } from 'express';\nimport { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { 
  fetchSemanticScholar, 
  fetchPubMed, 
  fetchOpenLibrary, 
  fetchInternetArchive,
  fetchDOAJ,
  fetchWorldCat,
  fetchEuropeana,
  fetchLibraryOfCongress,
  fetchOAIPMH
} from '../../helpers/academic-integrations';
import { resolveDoi, lookupIsbn, lookupIssn } from '../../helpers/extended-academic-tools';
import { robustParseJson } from '../utils/json-repair';
import { academicSearchService } from '../../services/academic-search.service';

export function createAcademicSearchIntegrationsRouter(getGeminiClient: () => GoogleGenAI): Router {
  const router = Router();

  /**
   * Semantic Database Search & Article Matcher
   */
  router.post('/semantic_database_search', async (req: Request, res: Response) => {
    try {
      const { title, concept, discipline } = req.body;
      const ai = getGeminiClient();
      const searchQuery = concept || title || 'academic research';

      let englishQuery = searchQuery;
      const containsKurdish = Array.from(String(searchQuery)).some((char) => (char as string).charCodeAt(0) > 127);
      if (containsKurdish) {
        try {
          const translationResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate this Kurdish academic concept into a brief English search query: "${searchQuery}"`,
            config: { temperature: 0.1 }
          });
          const translated = translationResponse.text?.trim().replace(/["'.]/g, '');
          if (translated && translated.length > 2) {
            englishQuery = translated;
          }
        } catch (err) {
          console.error('Error translating query to English:', err);
        }
      }

      let s2Results: any[] = [];
      try {
        const s2Url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(englishQuery)}&limit=5&fields=title,authors,venue,year,externalIds,abstract`;
        const s2Response = await fetch(s2Url, {
          headers: { 'User-Agent': 'Academic-Thesis-Assistant/1.0', 'Accept': 'application/json' }
        });
        if (s2Response.ok) {
          const s2Data = await s2Response.json() as any;
          if (s2Data && Array.isArray(s2Data.data)) {
            s2Results = s2Data.data;
          }
        }
      } catch (s2Error) {
        console.error('Semantic Scholar API error:', s2Error);
      }

      // AI may classify/match retrieved records, but it must never invent new scholarly records.
      if (s2Results.length === 0) {
        return res.json({
          matchedArticles: [],
          query: englishQuery,
          message: 'هیچ تۆمارێکی Semantic Scholar بۆ ئەم گەڕانە نەدۆزرایەوە؛ هیچ سەرچاوەی ساختە دروست نەکرا.'
        });
      }

      const systemPrompt = `تۆ پسپۆڕی بەدواداچوون و لێکۆڵینەوەیت. تەنها ئەو تۆمارانە هەڵبژێرە و پۆلێن بکە کە لە لیستی داتای پشکنراوەدا هەن؛ بە هیچ شێوەیەک نووسەر، ساڵ، DOI، ناونیشان یان سەرچاوەی نوێ مەخە.`;
      const prompt = `ئەم تۆمارانەی Semantic Scholar هەمان داتای ڕاستەوخۆی بنکەدراون:
${JSON.stringify(s2Results)}

بابەت: ${title || concept} (دیسیپلین: ${discipline || 'گشتی'})
تەنها تۆمارەکانی لیستی سەرەوە بۆ پۆلێنکردن بەکاربهێنە.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { systemInstruction: systemPrompt, responseMimeType: 'application/json', temperature: 0.2 }
      });

      const parsed = robustParseJson(response.text || '{}');
      if (Array.isArray(parsed.matchedArticles)) {
        // Hard cap AI output to retrieved records, then replace citation-critical fields
        // with values returned by the authoritative upstream index.
        parsed.matchedArticles = parsed.matchedArticles.slice(0, s2Results.length);
        s2Results.forEach((p, idx) => {
          if (parsed.matchedArticles[idx]) {
            parsed.matchedArticles[idx].title = p.title || parsed.matchedArticles[idx].title;
            parsed.matchedArticles[idx].authors = p.authors?.map((a: any) => a.name).join(', ') || parsed.matchedArticles[idx].authors;
            parsed.matchedArticles[idx].year = p.year || parsed.matchedArticles[idx].year;
            parsed.matchedArticles[idx].doi = p.externalIds?.DOI || parsed.matchedArticles[idx].doi;
            parsed.matchedArticles[idx].source = 'Semantic Scholar';
            parsed.matchedArticles[idx].sourceVerified = false;
            parsed.matchedArticles[idx].retrievedFromIndex = true;
            parsed.matchedArticles[idx].verificationStatus = 'retrieved-not-verified';
          }
        });
      }

      return res.json(parsed);
    } catch (error) {
      console.error('Semantic search error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە سێرڤەر ڕوویدا لە کاتی گەڕانی بنکەدراوە.' });
    }
  });

  /**
   * Multi Academic Search (Semantic Scholar, PubMed, OpenLibrary, InternetArchive)
   */
  router.post('/multi_academic_search', async (req: Request, res: Response) => {
    try {
      const { query, limit = 10 } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'داواکاری گەڕان پێویستە' });
        return;
      }

      const [s2, pubmed, openLib, archive, doaj, worldcat, europeana, loc, oaipmh] = await Promise.allSettled([
        fetchSemanticScholar(query),
        fetchPubMed(query),
        fetchOpenLibrary(query),
        fetchInternetArchive(query),
        fetchDOAJ(query),
        fetchWorldCat(query),
        fetchEuropeana(query),
        fetchLibraryOfCongress(query),
        fetchOAIPMH(query)
      ]);

      const sources = [
        ...(s2.status === 'fulfilled' ? s2.value : []),
        ...(pubmed.status === 'fulfilled' ? pubmed.value : []),
        ...(openLib.status === 'fulfilled' ? openLib.value : []),
        ...(archive.status === 'fulfilled' ? archive.value : []),
        ...(doaj.status === 'fulfilled' ? doaj.value : []),
        ...(worldcat.status === 'fulfilled' ? worldcat.value : []),
        ...(europeana.status === 'fulfilled' ? europeana.value : []),
        ...(loc.status === 'fulfilled' ? loc.value : []),
        ...(oaipmh.status === 'fulfilled' ? oaipmh.value : [])
      ];

      return res.json({ sources, total: sources.length, query });
    } catch (error) {
      console.error('Multi academic search error:', error);
      return res.status(500).json({ error: 'کێشەیەک ڕوویدا لە گەڕانی فرە-بنکەدراوە.' });
    }
  });

  /**
   * DOI Resolver Endpoint
   */
  router.post('/doi_resolver', async (req: Request, res: Response) => {
    try {
      const { doi } = req.body;
      if (!doi) return res.status(400).json({ error: 'کۆدی DOI پێویستە' });
      const result = await resolveDoi(doi);
      return res.json(result);
    } catch (error) {
      console.error('DOI resolver error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە ڕەچاوکردنی DOI ڕوویدا.' });
    }
  });

  /**
   * ISBN Lookup Endpoint
   */
  router.post('/isbn_lookup', async (req: Request, res: Response) => {
    try {
      const { isbn } = req.body;
      if (!isbn) return res.status(400).json({ error: 'ژمارەی ISBN پێویستە' });
      const result = await lookupIsbn(isbn);
      return res.json(result);
    } catch (error) {
      console.error('ISBN lookup error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە بەدواداچوونی ISBN ڕوویدا.' });
    }
  });

  /**
   * ISSN Lookup Endpoint
   */
  router.post('/issn_lookup', async (req: Request, res: Response) => {
    try {
      const { issn } = req.body;
      if (!issn) return res.status(400).json({ error: 'ژمارەی ISSN پێویستە' });
      const result = await lookupIssn(issn);
      return res.json(result);
    } catch (error) {
      console.error('ISSN lookup error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە بەدواداچوونی ISSN ڕوویدا.' });
    }
  });

  /**
   * Suggest sources from real academic indexes.
   * This endpoint never asks an LLM to invent bibliographic records.
   */
  router.post('/suggest_sources', async (req: Request, res: Response) => {
    try {
      const { topic, discipline } = req.body || {};
      if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        return res.status(400).json({ error: 'بابەتێکی دروستی توێژینەوە پێویستە.' });
      }

      const query = discipline ? `${topic.trim()} ${String(discipline).trim()}` : topic.trim();
      const sources = await academicSearchService.searchAll(query, 10);
      return res.json({
        success: true,
        query,
        sources,
        total: sources.length,
        sourcePolicy: 'real-index-records-only'
      });
    } catch (error) {
      console.error('Suggest sources error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە گەڕانی سەرچاوەکان ڕوویدا.' });
    }
  });

  router.post('/quick_suggest_sources', async (req: Request, res: Response) => {
    try {
      const { topic } = req.body || {};
      if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        return res.status(400).json({ error: 'بابەتێکی دروستی توێژینەوە پێویستە.' });
      }

      const sources = await academicSearchService.searchAll(topic.trim(), 5);
      return res.json({
        success: true,
        query: parsed.data.topic,
        sources,
        total: sources.length,
        sourcePolicy: 'real-index-records-only'
      });
    } catch (error) {
      console.error('Quick suggest sources error:', error);
      return res.status(500).json({ error: 'کێشەیەک لە گەڕانی خێرای سەرچاوەکان ڕوویدا.' });
    }
  });
  return router;
}
