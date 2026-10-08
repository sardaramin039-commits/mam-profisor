/**
 * OpenAI-assisted academic source tooling.
 * Bibliographic records originate from real academic indexes; the LLM may only
 * summarize or format records already supplied to it.
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

function sourceTypeFor(record: AcademicPaper): AcademicSourceItem['sourceType'] {
  return record.isbn ? 'book' : 'journal';
}

function yearFor(record: AcademicPaper): number | string {
  return record.publicationYear > 0 ? record.publicationYear : 'n.d.';
}

function firstAuthor(record: AcademicPaper): string {
  return record.authors[0] || 'Unknown author';
}

function citationApa(record: AcademicPaper): string {
  const author = firstAuthor(record);
  const year = yearFor(record);
  const tail = record.doi
    ? `https://doi.org/${record.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')}`
    : record.url || '';
  return `${author}. (${year}). ${record.title}.${tail ? ` ${tail}` : ''}`;
}

function citationHarvard(record: AcademicPaper): string {
  return `${firstAuthor(record)} (${yearFor(record)}) ${record.title}.${record.doi ? ` DOI: ${record.doi}` : ''}`;
}

function citationMla(record: AcademicPaper): string {
  return `${firstAuthor(record)}. "${record.title}." ${yearFor(record)}.${record.doi ? ` DOI: ${record.doi}.` : ''}`;
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

function mapRecord(record: AcademicPaper, query: string): AcademicSourceItem {
  return {
    id: record.id,
    title: record.title,
    authors: record.authors,
    year: yearFor(record),
    journalOrPublisher: record.source === 'googlebooks' ? 'Google Books' : record.source,
    doi: record.doi,
    url: record.url,
    sourceType: sourceTypeFor(record),
    citationAPA: citationApa(record),
    citationHarvard: citationHarvard(record),
    citationMLA: citationMla(record),
    relevanceExplanation: `تۆمارەکە لە بنکەدراوەی ${record.source} بۆ گەڕانی «${query}» وەرگیراوە. ئەم دۆخە تەنها retrieval ـە و بە تەنها verification ـی سەرچاوەکە نیشان نادات.`,
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
    const query = request.discipline
      ? `${request.query} ${request.discipline}`.trim()
      : request.query.trim();

    const records = await academicSearchService.searchAll(query, limit);
    const discoveredSources = records.map(record => mapRecord(record, query));

    if (discoveredSources.length === 0) {
      return {
        success: true,
        query: request.query,
        discoveredSources: [],
        thematicSummary: 'هیچ تۆمارێکی ڕاستەقینە لە index ـە بەردەستەکاندا نەدۆزرایەوە؛ هیچ سەرچاوەیەکی خەیاڵی دروست نەکرا.',
        suggestedKeywords: [],
        provider: 'Academic indexes'
      };
    }

    let thematicSummary = 'تۆمارەکان لە index ـە ئەکادیمییە ڕاستەقینەکان وەرگیراون و پێویستیان بە verification یەک بە یەک هەیە.';
    let suggestedKeywords: string[] = [];

    const apiKey = this.getOptionalApiKey();
    if (apiKey) {
      try {
        const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: this.getModel(),
            messages: [
              {
                role: 'system',
                content: 'تەنها ئەو record ـانە شیکاری بکە کە لە user content ـدا دراون. هیچ citation، DOI، ناوی نووسەر یان source record ـی نوێ دروست مەکە. وەڵام JSON بێت.'
              },
              {
                role: 'user',
                content: JSON.stringify({
                  query: request.query,
                  discipline: request.discipline || 'گشتی',
                  records: discoveredSources.map(source => ({
                    id: source.id,
                    title: source.title,
                    authors: source.authors,
                    year: source.year,
                    source: source.journalOrPublisher,
                    doi: source.doi,
                    url: source.url
                  }))
                })
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(12_000)
        });

        if (response.ok) {
          const data = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>
          };
          const raw = data.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(raw) as {
            thematicSummary?: unknown;
            suggestedKeywords?: unknown;
          };
          if (typeof parsed.thematicSummary === 'string') {
            thematicSummary = parsed.thematicSummary;
          }
          if (Array.isArray(parsed.suggestedKeywords)) {
            suggestedKeywords = parsed.suggestedKeywords
              .filter((item): item is string => typeof item === 'string')
              .slice(0, 12);
          }
        }
      } catch (error) {
        console.warn('[OpenAI discovery summarization unavailable]:', error);
      }
    }

    return {
      success: true,
      query: request.query,
      discoveredSources,
      thematicSummary,
      suggestedKeywords,
      provider: apiKey ? 'Academic indexes + optional AI summary' : 'Academic indexes'
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
            verificationStatus: 'retrieved-not-verified' as const
          }))
          .slice(0, 100)
      : [];

    return {
      success: true,
      topic: request.topic,
      citationStyle: style,
      sortedReferences,
      curatedBibliography: typeof parsed.curatedBibliography === 'string'
        ? parsed.curatedBibliography
        : '',
      inTextCitationGuide: typeof parsed.inTextCitationGuide === 'string'
        ? parsed.inTextCitationGuide
        : '',
      methodologyNotes: [
        typeof parsed.methodologyNotes === 'string' ? parsed.methodologyNotes : '',
        'ئەم ئەنجامە formatting ـە؛ پشکنینی بوونی سەرچاوە و metadata دەبێت لە Source Verification ـدا جێبەجێ بکرێت.'
      ].filter(Boolean).join(' '),
      provider: 'OpenAI formatting assistant'
    };
  }
}

export const openAiChatGptService = new OpenAiChatGptService();
