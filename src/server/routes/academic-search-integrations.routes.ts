import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';
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

const semanticSearchSchema = z.object({
  title: z.string().trim().max(500).optional(),
  concept: z.string().trim().max(2000).optional(),
  discipline: z.string().trim().max(200).optional()
}).refine(
  value => Boolean(value.title || value.concept),
  'title یان concept پێویستە.'
);

const multiSearchSchema = z.object({
  query: z.string().trim().min(1).max(2000),
  limit: z.coerce.number().int().min(1).max(50).default(10)
}).strict();

const identifierSchema = z.object({
  value: z.string().trim().min(3).max(500)
}).strict();

const isbnSchema = z.object({
  isbn: z.string().trim().min(10).max(32)
}).strict();

const issnSchema = z.object({
  issn: z.string().trim().min(8).max(32)
}).strict();

const suggestSchema = z.object({
  topic: z.string().trim().min(2).max(500),
  discipline: z.string().trim().max(200).optional()
}).strict();

const quickSuggestSchema = z.object({
  topic: z.string().trim().min(2).max(500)
}).strict();

type SemanticScholarRecord = {
  title?: string;
  authors?: Array<{ name?: string }>;
  year?: number;
  externalIds?: { DOI?: string };
};

export function createAcademicSearchIntegrationsRouter(
  getGeminiClient: () => GoogleGenAI
): Router {
  const router = Router();
  router.use(requireAuth);

  router.post('/semantic_database_search', async (req: Request, res: Response) => {
    const parsed = semanticSearchSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای گەڕانی Semantic Scholar نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const { title, concept, discipline } = parsed.data;
      const ai = getGeminiClient();
      const searchQuery = concept || title || 'academic research';
      let englishQuery = searchQuery;

      const containsKurdish = Array.from(searchQuery).some(
        char => char.charCodeAt(0) > 127
      );

      if (containsKurdish) {
        try {
          const translationResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate this Kurdish academic concept into a brief English search query: "${searchQuery}"`,
            config: { temperature: 0.1 }
          });
          const translated = translationResponse.text?.trim().replace(/["'.]/g, '');
          if (translated && translated.length > 2) englishQuery = translated.slice(0, 2000);
        } catch (error) {
          console.error('Error translating query to English:', error);
        }
      }

      let s2Results: SemanticScholarRecord[] = [];
      try {
        const s2Url =
          'https://api.semanticscholar.org/graph/v1/paper/search' +
          `?query=${encodeURIComponent(englishQuery)}&limit=5&fields=title,authors,venue,year,externalIds,abstract`;

        const s2Response = await fetch(s2Url, {
          headers: {
            'User-Agent': 'Academic-Thesis-Assistant/1.0',
            Accept: 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });

        if (s2Response.ok) {
          const s2Data = await s2Response.json() as { data?: SemanticScholarRecord[] };
          s2Results = Array.isArray(s2Data.data) ? s2Data.data.slice(0, 5) : [];
        }
      } catch (error) {
        console.error('Semantic Scholar API error:', error);
      }

      if (s2Results.length === 0) {
        res.json({
          matchedArticles: [],
          query: englishQuery,
          message: 'هیچ تۆمارێکی Semantic Scholar بۆ ئەم گەڕانە نەدۆزرایەوە؛ هیچ سەرچاوەی ساختە دروست نەکرا.'
        });
        return;
      }

      const systemPrompt =
        'تەنها تۆمارەکانی لیستی پێدراو پۆلێن بکە. هیچ ناوی نووسەر، ساڵ، DOI، ناونیشان یان سەرچاوەی نوێ دروست مەکە.';

      const prompt = `تۆمارە ڕاستەوخۆ و وەرگیراوەکان:
${JSON.stringify(s2Results)}

بابەت: ${title || concept}
دیسیپلین: ${discipline || 'گشتی'}
تەنها تۆمارەکانی سەرەوە بۆ پۆلێنکردن بەکاربهێنە.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const modelResult = robustParseJson(response.text || '{}');
      const matched = Array.isArray(modelResult.matchedArticles)
        ? modelResult.matchedArticles.slice(0, s2Results.length)
        : [];

      const normalized = matched.map((item: unknown, index: number) => {
        const source = s2Results[index];
        const candidate = item && typeof item === 'object'
          ? item as Record<string, unknown>
          : {};

        return {
          ...candidate,
          title: source.title || candidate['title'] || '',
          authors: (source.authors || [])
            .map(author => author.name || '')
            .filter(Boolean)
            .join(', '),
          year: source.year ?? candidate['year'] ?? null,
          doi: source.externalIds?.DOI || candidate['doi'] || '',
          source: 'Semantic Scholar',
          sourceVerified: false,
          retrievedFromIndex: true,
          verificationStatus: 'retrieved-not-verified'
        };
      });

      res.json({
        matchedArticles: normalized,
        query: englishQuery,
        verificationPolicy: 'retrieval-does-not-imply-verification'
      });
    } catch (error) {
      console.error('Semantic search error:', error);
      res.status(500).json({
        error: 'کێشەیەک لە سێرڤەر ڕوویدا لە کاتی گەڕانی بنکەدراوە.'
      });
    }
  });

  router.post('/multi_academic_search', async (req: Request, res: Response) => {
    const parsed = multiSearchSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای گەڕانی فرە-بنکەدراوە نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const { query, limit } = parsed.data;
      const results = await Promise.allSettled([
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

      const sources = results.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
      ).slice(0, limit);

      res.json({
        sources,
        total: sources.length,
        query,
        retrievalPolicy: 'real-index-results',
        verificationPolicy: 'retrieval-does-not-imply-verification'
      });
    } catch (error) {
      console.error('Multi academic search error:', error);
      res.status(500).json({
        error: 'کێشەیەک ڕوویدا لە گەڕانی فرە-بنکەدراوە.'
      });
    }
  });

  router.post('/doi_resolver', async (req: Request, res: Response) => {
    const parsed = identifierSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای DOI نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const result = await resolveDoi(parsed.data.value);
      if (!result) {
        res.status(404).json({ error: 'DOI ـەکە نەدۆزرایەوە.' });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error('DOI resolver error:', error);
      res.status(500).json({ error: 'کێشەیەک لە پشکنینی DOI ڕوویدا.' });
    }
  });

  router.post('/isbn_lookup', async (req: Request, res: Response) => {
    const parsed = isbnSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای ISBN نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const result = await lookupIsbn(parsed.data.isbn);
      if (!result) {
        res.status(404).json({ error: 'ISBN ـەکە نەدۆزرایەوە.' });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error('ISBN lookup error:', error);
      res.status(500).json({ error: 'کێشەیەک لە پشکنینی ISBN ڕوویدا.' });
    }
  });

  router.post('/issn_lookup', async (req: Request, res: Response) => {
    const parsed = issnSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای ISSN نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const result = await lookupIssn(parsed.data.issn);
      if (!result) {
        res.status(404).json({ error: 'ISSN ـەکە نەدۆزرایەوە.' });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error('ISSN lookup error:', error);
      res.status(500).json({ error: 'کێشەیەک لە پشکنینی ISSN ڕوویدا.' });
    }
  });

  router.post('/suggest_sources', async (req: Request, res: Response) => {
    const parsed = suggestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای پێشنیارکردنی سەرچاوە نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const { topic, discipline } = parsed.data;
      const query = discipline ? `${topic} ${discipline}` : topic;
      const sources = await academicSearchService.searchAll(query, 10);
      res.json({
        success: true,
        query,
        sources,
        total: sources.length,
        sourcePolicy: 'real-index-records-only'
      });
    } catch (error) {
      console.error('Suggest sources error:', error);
      res.status(500).json({ error: 'کێشەیەک لە گەڕانی سەرچاوەکان ڕوویدا.' });
    }
  });

  router.post('/quick_suggest_sources', async (req: Request, res: Response) => {
    const parsed = quickSuggestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'داتای گەڕانی خێرای سەرچاوە نادروستە.',
        issues: parsed.error.issues
      });
      return;
    }

    try {
      const sources = await academicSearchService.searchAll(parsed.data.topic, 5);
      res.json({
        success: true,
        query: parsed.data.topic,
        sources,
        total: sources.length,
        sourcePolicy: 'real-index-records-only'
      });
    } catch (error) {
      console.error('Quick suggest sources error:', error);
      res.status(500).json({ error: 'کێشەیەک لە گەڕانی خێرای سەرچاوەکان ڕوویدا.' });
    }
  });

  return router;
}
