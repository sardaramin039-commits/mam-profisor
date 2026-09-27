/**
 * OpenAI ChatGPT Academic Service
 * پسپۆڕی ئەکادیمی بۆ دۆزینەوە، هەڵسەنگاندن و ڕێکخستنی سەرچاوە زانستییەکان
 */

import { academicSearchService, AcademicPaper } from '../../services/academic-search.service';

export interface AcademicSourceItem {
  id?: string;
  title: string;
  authors: string[];
  year: number | string;
  journalOrPublisher: string;
  doi?: string;
  url?: string;
  sourceType: 'journal' | 'book' | 'conference' | 'thesis' | 'report';
  citationAPA: string;
  citationHarvard: string;
  citationMLA: string;
  relevanceExplanation: string;
  credibilityScore: number;
}

export interface OrganizeReferencesRequest {
  topic: string;
  discipline?: string;
  rawReferences?: string;
  citationStyle?: 'apa' | 'harvard' | 'mla' | 'chicago';
  language?: 'ckb' | 'en' | 'ar';
}

export interface OrganizeReferencesResponse {
  success: boolean;
  topic: string;
  citationStyle: string;
  sortedReferences: AcademicSourceItem[];
  curatedBibliography: string;
  inTextCitationGuide: string;
  methodologyNotes: string;
  provider: string;
}

export interface DiscoverSourcesRequest {
  query: string;
  discipline?: string;
  limit?: number;
  timeframe?: string;
}

export interface DiscoverSourcesResponse {
  success: boolean;
  query: string;
  discoveredSources: AcademicSourceItem[];
  thematicSummary: string;
  suggestedKeywords: string[];
  provider: string;
}

export class OpenAiChatGptService {
  public getApiKey(): string {
    const envKey = process.env['OPENAI_API_KEY']?.trim();
    if (!envKey) {
      throw new Error('OPENAI_API_KEY environment variable is missing.');
    }
    return envKey;
  }

  public getBaseUrl(): string {
    return process.env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1';
  }

  /**
   * دۆزینەوەی سەرچاوەی ئەکادیمی متمانەپێکراو لەڕێگەی ChatGPT
   */
  public async discoverAcademicSources(request: DiscoverSourcesRequest): Promise<DiscoverSourcesResponse> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const model = process.env['OPENAI_MODEL']?.trim() || 'gpt-5.6-luna';
    const limit = Math.min(request.limit || 8, 15);

    const retrievedSources = await academicSearchService.searchAll(request.query, limit);

    if (retrievedSources.length === 0) {
      return {
        success: true,
        query: request.query,
        discoveredSources: [],
        thematicSummary: 'هیچ سەرچاوەیەکی ڕاستەقینە لە بنکەدراوەکانی گەڕانی ئەکادیمی نەدۆزرایەوە.',
        suggestedKeywords: [],
        provider: 'OpenAlex/Crossref/Google Books'
      };
    }

    const retrievalContext = retrievedSources.map((source: AcademicPaper) => ({
      id: source.id,
      title: source.title,
      authors: source.authors,
      year: source.publicationYear,
      source: source.source,
      doi: source.doi || null,
      url: source.url || null,
      abstract: source.abstract || null
    }));

    const systemPrompt = `تۆ ڕاوێژکاری ئەکادیمییت. سەرچاوەکان لەلایەن سیستەمی داتاکانی OpenAlex/Crossref/Google Books پێشتر دۆزرایەوە و تۆ ماف نییە هیچ سەرچاوەیەکی نوێ زیاد بکەیت یان metadata ـی سەرچاوەکان بگۆڕیت.
تەنها پەیوەندیی هەر سەرچاوەیەک بە بابەتەکە، پوختەی گشتی، و کلیلەوشەکان شیکار بکە.
هەر سەرچاوە تەنها بە ID ـی هەمان input ناسێنە.

وەڵام تەنها JSON بێت:
{
  "analyses": [
    {
      "id": "ID",
      "relevanceExplanation": "ڕوونکردنەوەی پەیوەندیی سەرچاوەکە بە بابەتەکە بە سۆرانی"
    }
  ],
  "thematicSummary": "پوختەی زانستیی ئەو سەرچاوانەی بەڕاستی دۆزراونەتەوە",
  "suggestedKeywords": ["keyword"]
}`;

    const userPrompt = `بابەتی لێکۆڵینەوە: "${request.query}"
دیسیپلین: "${request.discipline || 'گشتی'}"
سنووری کات: "${request.timeframe || 'گشتی'}"

سەرچاوەی ڕاستەقینەی دۆزراو:
${JSON.stringify(retrievalContext)}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { analyses: [], thematicSummary: '', suggestedKeywords: [] };
    }

    const analyses = Array.isArray(parsed.analyses) ? parsed.analyses : [];
    const analysisById = new Map(
      analyses
        .filter((item: any) => typeof item?.id === 'string')
        .map((item: any) => [item.id, item.relevanceExplanation || ''])
    );

    const discoveredSources: AcademicSourceItem[] = retrievedSources.map((source: AcademicPaper) => {
      const authorText = source.authors.length > 0 ? source.authors.join(', ') : 'نادیار';
      const venue = source.source === 'googlebooks' ? 'Google Books' : source.source;
      const year = source.publicationYear || '';
      const url = source.url || '';
      const citationBase = `${authorText} (${year}). ${source.title}.${venue ? ` ${venue}.` : ''}${url ? ` ${url}` : ''}`;

      return {
        id: source.id,
        title: source.title,
        authors: source.authors.length > 0 ? source.authors : ['نادیار'],
        year,
        journalOrPublisher: venue,
        doi: source.doi,
        url: source.url,
        sourceType: source.source === 'googlebooks' ? 'book' : 'report',
        citationAPA: citationBase,
        citationHarvard: citationBase,
        citationMLA: citationBase,
        relevanceExplanation: analysisById.get(source.id) || 'شیکاریی LLM بۆ ئەم سەرچاوەی ڕاستەقینە بەردەست نییە.',
        credibilityScore: 0
      };
    });

    return {
      success: true,
      query: request.query,
      discoveredSources,
      thematicSummary: parsed.thematicSummary || '',
      suggestedKeywords: Array.isArray(parsed.suggestedKeywords) ? parsed.suggestedKeywords : [],
      provider: 'OpenAlex/Crossref/Google Books + ChatGPT curation'
    };
  }

  /**
   * ڕێکخستن، ستانداردکردن و پۆلێنکردنی سەرچاوەکان بەپێی شێوازە ئەکادیمییەکان
   */
  public async organizeAndFormatReferences(request: OrganizeReferencesRequest): Promise<OrganizeReferencesResponse> {
    const style = request.citationStyle || 'harvard';
    const rawReferences = request.rawReferences?.trim();

    if (!rawReferences) {
      return {
        success: false,
        topic: request.topic,
        citationStyle: style,
        sortedReferences: [],
        curatedBibliography: '',
        inTextCitationGuide: '',
        methodologyNotes: 'هیچ سەرچاوەیەکی خاو لە داواکارییەکەدا دابین نەکراوە؛ ئەم operation ـە سەرچاوەی نوێ دروست ناکات.',
        provider: 'provenance-safe formatter'
      };
    }

    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const model = process.env['OPENAI_MODEL']?.trim() || 'gpt-5.6-luna';

    const systemPrompt = `تۆ پسپۆڕی بەڕێوەبردن و ڕێکخستنی بەیبلۆگرافی و ژێدەرە ئەکادیمییەکانیت بە ستانداردەکانی (APA 7th, Harvard, MLA 9th, Chicago).
⚠️ **یاسای نەگۆڕی ئەکادیمی بۆ نەهێشتنی سەرچاوەی هەڵبەستراو (Zero-Hallucination & Provenance Audit)**:
١. تەنها ئەو سەرچاوانە ڕێکبخە و پەسەند بکە کە ڕاستەقینەن یان بەکارهێنەر لە تێکستە خاوەکەدا دابینی کردوون.
٢. سەرچاوەی نوێ مەدۆزەوە و هیچ تۆمارێکی bibliographic زیاد مەکە؛ تەنها ئەو سەرچاوانە ڕێکبخە کە لە `rawReferences` ـدا هاتوون.
٣. هەر سەرچاوەیەک کە بوونی زانستی نەبێت یان گوماناوی بێت دەبێت لە بەشی 'methodologyNotes' هۆشداری دەربارەی بدرێت.
٤. ڕێزبەندکردنی ئەلفوبێیی (Alphabetical Order) بەپێی پاشناوی نووسەران جێبەجێ بکە.
٥. ئاماژەدانی ناو دەق (In-text citations) بە شێوازی یاسایی (وەک: (Smith, 2021) یان (حەمە، ٢٠٢٢)) دابنێ.

وەڵام تەنها لە فۆرماتی دروستی JSON بەم نەخشەیە بێت:
{
  "sortedReferences": [
    {
      "title": "ناونیشانی تەواو و ساغکراوەی سەرچاوە",
      "authors": ["نووسەران"],
      "year": 2022,
      "journalOrPublisher": "ناوی گۆڤار یان دەزگای چاپی فەرمی",
      "doi": "",
      "url": "",
      "sourceType": "journal",
      "citationAPA": "فۆرماتی تەواوی APA 7th",
      "citationHarvard": "فۆرماتی تەواوی Harvard",
      "citationMLA": "فۆرماتی تەواوی MLA 9th",
      "relevanceExplanation": "ڕوونکردنەوەی بەستنەوەی سەرچاوە بە توێژینەوە بە کوردی",
      "credibilityScore": 95
    }
  ],
  "curatedBibliography": "دەقی ئامادەکراوی تەواوی لیستی سەرچاوەکان بە ڕێزبەندی ئەلفوبێ بە فۆرماتی داواکراو",
  "inTextCitationGuide": "ڕێنمایی کورت بۆ نووسەری توێژینەوەکە لەسەر چۆنیەتی هێنانی ناوی ئەم سەرچاوانە لە ناو دەقدا بە کوردی",
  "methodologyNotes": "تێبینی زانستی و دڵنیایی لە ساغبوونەوە و نەبوونی سەرچاوەی هەڵبەستراو"
}`;

    const userPrompt = `بابەتی توێژینەوە: "${request.topic}"
شێوازی داواکراو بۆ سەرچاوەکان: "${style.toUpperCase()}"
سەرچاوە خاوەکان / تێکست بۆ ڕێکخستن:
${rawReferences}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { sortedReferences: [], curatedBibliography: '', inTextCitationGuide: '', methodologyNotes: '' };
    }

    return {
      success: true,
      topic: request.topic,
      citationStyle: style,
      sortedReferences: parsed.sortedReferences || [],
      curatedBibliography: parsed.curatedBibliography || '',
      inTextCitationGuide: parsed.inTextCitationGuide || '',
      methodologyNotes: parsed.methodologyNotes || '',
      provider: 'ChatGPT (OpenAI)'
    };
  }
}

export const openAiChatGptService = new OpenAiChatGptService();
