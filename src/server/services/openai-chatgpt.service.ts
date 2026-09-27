/**
 * OpenAI ChatGPT Academic Service
 * پسپۆڕی ئەکادیمی بۆ دۆزینەوە، هەڵسەنگاندن و ڕێکخستنی سەرچاوە زانستییەکان
 */

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
    const envKey = process.env['OPENAI_API_KEY'];
    if (!envKey || envKey.trim().length === 0) {
      throw new Error('OPENAI_API_KEY is not configured on the server.');
    }
    return envKey.trim();
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
    const limit = Math.min(request.limit || 8, 15);

    const systemPrompt = `تۆ سەرنوسەر و ڕاوێژکاری باڵای بەیبلۆگرافی و لێکۆڵینەوەی ئەکادیمیت.
⚠️ **پڕۆتۆکۆلی توندی بەرپەرچدانەوەی سەرچاوەی هەڵبەستراو (Strict Zero-Hallucination Protocol)**:
١. بە هیچ شێوەیەک بۆت نییە ناوی سەرچاوە، ناوی توێژەر، گۆڤار یان ساڵی هەڵبەستراو و خەیاڵی بنووسیت.
٢. دەبێت تەواوی سەرچاوەکان تۆمارکراو و ڕاستەقینە بن لە بنکەدراوە متمانەپێکراوەکانی جیهان وەک: Scopus، Web of Science، PubMed، IEEE Xplore، SpringerLink، JSTOR، ScienceDirect، Wiley، لەگەڵ سەرچاوە مێژوویی و زمانییە ساغکراوەکانی کوردی.
٣. هەر سەرچاوەیەک پێویستە کۆدی DOIی ڕاستەقینە یان بەستەری شایستە و ناوی بڵاوکەرەوەی فەرمی هەبێت. ئەگەر بەڵگەی سەلمێنراوی تەواو لەبەردەستتدا نییە لەسەر سەرچاوەیەک، هەرگیز لە خۆتەوە دروستی مەکە و دەری مەپەڕێنە.
٤. ئەگەر سەرچاوەکە توێژینەوەی نێودەوڵەتییە، ناونیشان و ناوی نووسەران بە ڕەسەنی (ئینگلیزی یان زمانی سەرەکی) بهێڵەوە و لە بەشی "relevanceExplanation" بە زمانی کوردیی سۆرانیی ئەکادیمی و زانستی شرۆڤەی بکە.

وەڵام تەنها لە فۆرماتی دروستی JSON بەم نەخشەیە بێت:
{
  "discoveredSources": [
    {
      "title": "ناونیشانی فەرمیی ڕاستەقینەی سەرچاوەکە",
      "authors": ["ناوی تەواوی نووسەرانی ڕاستەقینە"],
      "year": 2023,
      "journalOrPublisher": "ناوی گۆڤار یان دەزگای چاپی فەرمی",
      "doi": "10.xxxx/xxxxx",
      "url": "بەستەری فەرمی",
      "sourceType": "journal",
      "citationAPA": "فۆرماتی دروستی APA 7th",
      "citationHarvard": "فۆرماتی دروستی Harvard",
      "citationMLA": "فۆرماتی دروستی MLA 9th",
      "relevanceExplanation": "ڕوونکردنەوەی بەستنەوەی سەرچاوە بە توێژینەوە بە کوردیی سۆرانی",
      "credibilityScore": 98
    }
  ],
  "thematicSummary": "پوختەی زانستیی سەرچاوە ساغکراوەکان بە زمانی کوردی",
  "suggestedKeywords": ["کلیلەوشەکان"]
}`;

    const userPrompt = `بابەتی لێکۆڵینەوە: "${request.query}"
دیۆسپلین و بوار: "${request.discipline || 'گشتی'}"
سنووری کاتی: "${request.timeframe || 'نوێترین توێژینەوەکانی ٥ بۆ ١٠ ساڵی ڕابردوو'}"
ژمارەی سەرچاوە پێویستەکان: ${limit} دانەی متمانەپێکراو لە بنکەدراوە پێشەنگەکانی وەک Scopus، Web of Science، PubMed، IEEE، و Springer.`;

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
        response_format: { type: 'json_object' },
        temperature: 0.2
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
      parsed = { discoveredSources: [], thematicSummary: '', suggestedKeywords: [] };
    }

    return {
      success: true,
      query: request.query,
      discoveredSources: parsed.discoveredSources || [],
      thematicSummary: parsed.thematicSummary || '',
      suggestedKeywords: parsed.suggestedKeywords || [],
      provider: 'ChatGPT (OpenAI)'
    };
  }

  /**
   * ڕێکخستن، ستانداردکردن و پۆلێنکردنی سەرچاوەکان بەپێی شێوازە ئەکادیمییەکان
   */
  public async organizeAndFormatReferences(request: OrganizeReferencesRequest): Promise<OrganizeReferencesResponse> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const style = request.citationStyle || 'harvard';

    const systemPrompt = `تۆ پسپۆڕی بەڕێوەبردن و ڕێکخستنی بەیبلۆگرافی و ژێدەرە ئەکادیمییەکانیت بە ستانداردەکانی (APA 7th, Harvard, MLA 9th, Chicago).
⚠️ **یاسای نەگۆڕی ئەکادیمی بۆ نەهێشتنی سەرچاوەی هەڵبەستراو (Zero-Hallucination & Provenance Audit)**:
١. تەنها ئەو سەرچاوانە ڕێکبخە و پەسەند بکە کە ڕاستەقینەن یان بەکارهێنەر لە تێکستە خاوەکەدا دابینی کردوون.
٢. ئەگەر بەکارهێنەر داوای هێنانی سەرچاوەی زیاتری کردبوو، تەنها و تەنها وتاری باوەڕپێکراوی گۆڤارە نێودەوڵەتییەکان، کتێبی چاپکراوی زانکۆکان و سەرچاوەی ساغکراوە دابنێ بە ناونیشانی دەقاودەق، ناوی نووسەران و ساڵی ڕاستەقینە.
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
${request.rawReferences || 'تکایە بەپێی بابەتە سەرەکییەکە گشتگیرترین و کاریگەرترین سەرچاوە زانستییەکان ڕێکبخە و فۆرمات بکە.'}`;

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
        response_format: { type: 'json_object' },
        temperature: 0.2
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
