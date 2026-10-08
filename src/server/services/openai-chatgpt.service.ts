/**
 * OpenAI-assisted academic source tooling.
 * Bibliographic records originate from real academic indexes; the LLM may only
 * summarize or format records already supplied to it.
 */

export interface AcademicSourceItem {
  id?: string;
  title: string;
  authors: string[];
  year: number | string;
  journalOrPublisher: string;
  doi?: string;
  openAlexId?: string;
  url?: string;
  sourceType: 'journal' | 'book' | 'conference' | 'thesis' | 'report';
  citationAPA: string;
  citationHarvard: string;
  citationMLA: string;
  relevanceExplanation: string;
  credibilityScore?: number;
  verificationStatus?: 'retrieved-not-verified' | 'verified';
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

function doiFromUrl(url: string): string | undefined {
  const match = url.match(/(?:doi\.org\/|doi:\s*)(10\.\d{4,9}\/[^\s?#]+)$/i);
  return match?.[1]?.replace(/[.)],;]+$/, '').trim();
}

function openAlexIdFromUrl(url: string): string | undefined {
  const match = url.match(/openalex\.org\/(W\d+)/i);
  return match?.[1];
}

function normalizedContains(haystack: string, needle: unknown): boolean {
  const value = String(needle ?? '').trim();
  return !value || haystack.includes(value.toLocaleLowerCase().normalize('NFKC'));
}

function isRawReferenceMatch(item: AcademicSourceItem, normalizedRaw: string): boolean {
  const authors = Array.isArray(item.authors) ? item.authors : [];
  const fields = [
    item.title,
    ...authors,
    item.year,
    item.doi,
    item.url,
    item.journalOrPublisher
  ];

  return fields
    .filter(value => String(value ?? '').trim())
    .every(value => normalizedContains(normalizedRaw, value));
}

function formatValidatedReference(item: AcademicSourceItem, style: string): string {
  const authors = (Array.isArray(item.authors) ? item.authors : []).filter(Boolean).join(', ');
  const year = String(item.year ?? 'n.d.');
  const title = String(item.title || '').trim();
  const container = String(item.journalOrPublisher || '').trim();
  const identifier = item.doi
    ? ` https://doi.org/${item.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')}`
    : item.url ? ` ${item.url}` : '';
  if (!title) return '';

  if (style === 'mla') {
    return `${authors}. "${title}." ${container}${container ? ', ' : ''}${year}.${identifier}`.trim();
  }
  if (style === 'chicago') {
    return `${authors}. "${title}." ${container}${container ? ', ' : ''}${year}.${identifier}`.trim();
  }
  return `${authors} (${year}). ${title}.${container ? ` ${container}.` : ''}${identifier}`.trim();
}

function formatValidatedBibliography(items: AcademicSourceItem[], style: string): string {
  return items
    .map(item => formatValidatedReference(item, style))
    .filter(Boolean)
    .join('\n');
}

function surnameOf(author: string): string {
  const tokens = author.trim().split(/\s+/).filter(Boolean);
  return tokens[tokens.length - 1] || author.trim();
}

function formatInTextCitation(item: AcademicSourceItem, style: string): string {
  const authors = (Array.isArray(item.authors) ? item.authors : [])
    .map(surnameOf)
    .filter(Boolean);
  const year = String(item.year ?? 'n.d.');
  if (authors.length === 0) return '';
  const first = authors[0];

  if (style === 'mla') {
    if (authors.length === 1) return `(${first})`;
    if (authors.length === 2) return `(${first} and ${authors[1]})`;
    return `(${first} et al.)`;
  }

  if (authors.length === 2) {
    const joiner = style === 'apa' || style === 'chicago' ? ' & ' : ' and ';
    return `(${first}${joiner}${authors[1]}, ${year})`;
  }

  return authors.length > 2
    ? `(${first} et al., ${year})`
    : `(${first}, ${year})`;
}

function formatValidatedCitationGuide(items: AcademicSourceItem[], style: string): string {
  return items
    .map(item => {
      const citation = formatInTextCitation(item, style);
      return citation ? `- ${item.title}: ${citation}` : '';
    })
    .filter(Boolean)
    .join('\n');
}



function mapFreeAcademicRecord(record: AcademicPaper): AcademicSourceItem {
  return {
    id: record.id,
    title: record.title,
    authors: Array.isArray(record.authors) ? record.authors : [],
    year: record.publicationYear > 0 ? record.publicationYear : 'n.d.',
    journalOrPublisher: record.source || 'Academic index',
    doi: record.doi,
    url: record.url,
    sourceType: record.isbn ? 'book' : 'journal',
    citationAPA: '',
    citationHarvard: '',
    citationMLA: '',
    relevanceExplanation: 'سەرچاوەکە لە بنکەدراوە ئەکادیمییە خۆڕاییەکان وەرگیراوە؛ پێویستی بە verification ـی زیاتر هەیە.',
    verificationStatus: 'retrieved-not-verified'
  };
}

export class OpenAiChatGptService {
  public getApiKey(): string {
    const key = process.env['OPENAI_API_KEY']?.trim();
    if (!key) {
      throw new Error('OPENAI_API_KEY is not configured on the server.');
    }
    return key;
  }

  private getOptionalApiKey(): string | undefined {
    const key = process.env['OPENAI_API_KEY']?.trim();
    return key || undefined;
  }

  public getBaseUrl(): string {
    return process.env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1';
  }

  private getModel(): string {
    return process.env['OPENAI_MODEL'] || 'gpt-4o-mini';
  }

  public async discoverAcademicSources(
    request: DiscoverSourcesRequest
  ): Promise<DiscoverSourcesResponse> {
    const limit = Math.min(Math.max(request.limit || 8, 1), 15);
    const query = [request.query.trim(), request.discipline?.trim()].filter(Boolean).join(' ');
    const apiKey = this.getOptionalApiKey();

    if (process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] !== 'true' || !apiKey) {
      const records = await academicSearchService.searchAll(query, limit);
      const sources = records.map(mapFreeAcademicRecord);
      return {
        success: true,
        query: request.query,
        discoveredSources: sources,
        thematicSummary: sources.length
          ? 'سەرچاوەکان بە شێوەی خۆڕایی لە بنکەدراوە ئەکادیمییەکان وەرگیراون؛ هەر یەکەیان پێویستی بە verification ـی جیاواز هەیە.'
          : 'هیچ سەرچاوەیەکی ڕاستەقینە لە بنکەدراوە خۆڕاییەکاندا نەدۆزرایەوە؛ هیچ سەرچاوەیەکی خەیاڵی دروست نەکرا.',
        suggestedKeywords: [],
        provider: sources.length ? 'Free academic indexes' : 'Free academic indexes'
      };
    }

    const input = `Find ${limit} high-quality academic sources for this research query.
Query: ${query}
Prefer peer-reviewed papers, scholarly books, university repositories, government/scientific institutions, and recognized academic indexes.
Use web search. Do not invent sources, authors, years, DOI values, or URLs.
Return a concise summary and keywords, but the source list must come from web-search results. Do not cite a source unless its URL was returned by web search.`;

    const response = await fetch(`${this.getBaseUrl()}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env['OPENAI_RESEARCH_MODEL'] || 'gpt-4o-mini',
        reasoning: { effort: 'low' },
        tools: [{
          type: 'web_search',
          filters: {
            blocked_domains: ['reddit.com', 'quora.com', 'wikipedia.org']
          }
        }],
        tool_choice: 'required',
        include: ['web_search_call.action.sources'],
        input
      }),
      signal: AbortSignal.timeout(30_000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI web search failed with status ${response.status}.`);
    }

    const payload = await response.json() as {
      output?: Array<{
        type?: string;
        action?: { sources?: Array<{ url?: string; title?: string }> };
        content?: Array<{ text?: string }>;
      }>;
      output_text?: string;
    };

    const seen = new Set<string>();
    const discoveredSources: AcademicSourceItem[] = [];
    for (const item of payload.output || []) {
      if (item.type !== 'web_search_call') continue;
      for (const source of item.action?.sources || []) {
        const url = String(source.url || '').trim();
        if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
        seen.add(url);
        const doi = doiFromUrl(url);
        const openAlexId = openAlexIdFromUrl(url);
        discoveredSources.push({
          id: `OPENAI-WEB-${discoveredSources.length + 1}`,
          title: String(source.title || url).trim(),
          authors: [],
          year: 'n.d.',
          journalOrPublisher: 'OpenAI Web Search',
          doi,
          openAlexId,
          url,
          sourceType: 'report',
          citationAPA: '',
          citationHarvard: '',
          citationMLA: '',
          relevanceExplanation: 'سەرچاوەکە بە web search ـی OpenAI دۆزرایەوە؛ metadata ـەکە پێویستی بە Source Verification هەیە.',
          verificationStatus: 'retrieved-not-verified'
        });
        if (discoveredSources.length >= limit) break;
      }
      if (discoveredSources.length >= limit) break;
    }

    let thematicSummary = 'ChatGPT بە web search سەرچاوەی ڕاستەقینەی web ـی دۆزییەوە؛ هەر سەرچاوەیەک پێویستی بە verification ـی جیاواز هەیە.';
    let suggestedKeywords: string[] = [];
    try {
      const raw = String(payload.output_text || '').trim();
      const parsed = JSON.parse(raw) as { thematicSummary?: unknown; suggestedKeywords?: unknown };
      if (typeof parsed.thematicSummary === 'string') thematicSummary = parsed.thematicSummary;
      if (Array.isArray(parsed.suggestedKeywords)) {
        suggestedKeywords = parsed.suggestedKeywords
          .filter((value): value is string => typeof value === 'string')
          .slice(0, 12);
      }
    } catch {}

    return {
      success: true,
      query: request.query,
      discoveredSources,
      thematicSummary,
      suggestedKeywords,
      provider: 'OpenAI Responses API web_search'
    };
  }
  public async organizeAndFormatReferences(
    request: OrganizeReferencesRequest
  ): Promise<OrganizeReferencesResponse> {
    const rawReferences = (request.rawReferences || '').trim();
    const style = request.citationStyle || 'harvard';

    if (!rawReferences) {
      return {
        success: true,
        topic: request.topic,
        citationStyle: style,
        sortedReferences: [],
        curatedBibliography: '',
        inTextCitationGuide: '',
        methodologyNotes: 'هیچ سەرچاوەیەکی خام دابین نەکراوە؛ بۆ ڕێکخستن سەرچاوەی نوێ لە خۆتەوە دروست نەکرا.',
        provider: 'No-Language-Model'
      };
    }

    const apiKey = this.getApiKey();
    const systemPrompt = `تۆ تەنها ئامرازێکی ڕێکخستنی سەرچاوەیت.
یاسا:
١. تەنها ئەو سەرچاوانە ڕێکبخە کە لە rawReferences ـدا هەن.
٢. هیچ سەرچاوە، نووسەر، ساڵ، DOI، URL یان metadata ـی نوێ دروست مەکە.
٣. ئەگەر metadata ـی سەرچاوەیەک ناتەواوە، بە «ناتەواو» نیشانی بدە؛ پڕی مەکە.
٤. ئەنجامەکان formatting ـن، نە verification.
وەڵام تەنها JSON بێت.`;

    const userPrompt = JSON.stringify({
      topic: request.topic,
      discipline: request.discipline || 'گشتی',
      citationStyle: style,
      language: request.language || 'ckb',
      rawReferences
    });

    const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed with status ${response.status}.`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    };
    const raw = data.choices?.[0]?.message?.content || '{}';

    let parsed: {
      sortedReferences?: AcademicSourceItem[];
      curatedBibliography?: string;
      inTextCitationGuide?: string;
      methodologyNotes?: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const normalizedRaw = rawReferences.toLocaleLowerCase().normalize('NFKC');
    const sortedReferences = Array.isArray(parsed.sortedReferences)
      ? parsed.sortedReferences
          .filter((item): item is AcademicSourceItem =>
            Boolean(
              item &&
              typeof item === 'object' &&
              typeof item.title === 'string' &&
              isRawReferenceMatch(item, normalizedRaw)
            )
          )
          .map(item => ({
            ...item,
            citationAPA: formatValidatedReference(item, 'apa'),
            citationHarvard: formatValidatedReference(item, 'harvard'),
            citationMLA: formatValidatedReference(item, 'mla'),
            verificationStatus: 'retrieved-not-verified' as const
          }))
          .slice(0, 100)
      : [];

    return {
      success: true,
      topic: request.topic,
      citationStyle: style,
      sortedReferences,
      curatedBibliography: formatValidatedBibliography(sortedReferences, style),
      inTextCitationGuide: formatValidatedCitationGuide(sortedReferences, style),
      methodologyNotes: [
        typeof parsed.methodologyNotes === 'string' ? parsed.methodologyNotes : '',
        'ئەم ئەنجامە formatting ـە؛ پشکنینی بوونی سەرچاوە و metadata دەبێت لە Source Verification ـدا جێبەجێ بکرێت.'
      ].filter(Boolean).join(' '),
      provider: 'OpenAI formatting assistant'
    };
  }
}

export const openAiChatGptService = new OpenAiChatGptService();
