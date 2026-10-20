import { GoogleGenAI } from '@google/genai';

export interface KurdishLanguageIssue {
  type: 'grammar' | 'spelling' | 'terminology' | 'tone' | 'cohesion';
  originalText: string;
  suggestedText: string;
  explanationKurdish: string;
}

export interface KurdishLanguageAnalysis {
  status: 'generated' | 'degraded';
  overallLanguageScore: number | null;
  academicTonePassed: boolean;
  issues: KurdishLanguageIssue[];
  refinedTextKurdish: string;
  kurdishSummary: string;
}

const MAX_INPUT_LENGTH = 80_000;
const MAX_REFINED_LENGTH = 100_000;
const VALID_ISSUE_TYPES = new Set<KurdishLanguageIssue['type']>([
  'grammar', 'spelling', 'terminology', 'tone', 'cohesion'
]);

function normalizeInput(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/\r\n?/g, '\n').trim()
    : '';
}

function countOccurrences(text: string, fragment: string): number {
  if (!fragment) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= text.length) {
    const foundAt = text.indexOf(fragment, offset);
    if (foundAt < 0) break;
    count += 1;
    offset = foundAt + fragment.length;
  }
  return count;
}

function trimIdentifierPunctuation(value: string): string {
  return value.replace(/[.,;:!?،؛)\]}]+$/u, '');
}

function protectedFragments(text: string): string[] {
  const matches = [
    ...(text.match(/\[[0-9٠-٩۰-۹]+(?:\s*[,;]\s*[0-9٠-٩۰-۹]+)*\]/gu) || []),
    ...(text.match(/\([^()\n]{1,160}\b(?:19|20)\d{2}[a-z]?\)/giu) || []),
    ...(text.match(/\b10\.\d{4,9}\/[^\s<>"']+/giu) || []),
    ...(text.match(/https?:\/\/[^\s<>"']+/giu) || []),
    ...(text.match(/\bISBN(?:-1[03])?:?\s*[0-9X-]{10,20}\b/giu) || []),
    ...(text.match(/\bISSN:?\s*[0-9X-]{8,10}\b/giu) || []),
    ...(text.match(/[0-9٠-٩۰-۹]+(?:[.,٫٬][0-9٠-٩۰-۹]+)?\s*%?/gu) || [])
  ];
  return matches.map(trimIdentifierPunctuation).filter(Boolean);
}

function protectedMaterialPreserved(original: string, candidate: string): boolean {
  const allFragments = new Set([
    ...protectedFragments(original),
    ...protectedFragments(candidate)
  ]);
  return Array.from(allFragments).every(fragment =>
    countOccurrences(candidate, fragment) === countOccurrences(original, fragment)
  );
}

function safeIssues(value: unknown): KurdishLanguageIssue[] {
  if (!Array.isArray(value)) return [];
  const issues: KurdishLanguageIssue[] = [];
  for (const candidate of value.slice(0, 100)) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const item = candidate as Record<string, unknown>;
    const type = item['type'];
    const originalText = typeof item['originalText'] === 'string' ? item['originalText'].trim() : '';
    const suggestedText = typeof item['suggestedText'] === 'string' ? item['suggestedText'].trim() : '';
    const explanationKurdish = typeof item['explanationKurdish'] === 'string'
      ? item['explanationKurdish'].trim()
      : '';
    if (
      typeof type !== 'string' ||
      !VALID_ISSUE_TYPES.has(type as KurdishLanguageIssue['type']) ||
      !originalText || !suggestedText || !explanationKurdish ||
      originalText.length > 1_000 || suggestedText.length > 1_000 ||
      explanationKurdish.length > 2_000
    ) continue;
    issues.push({
      type: type as KurdishLanguageIssue['type'],
      originalText,
      suggestedText,
      explanationKurdish
    });
  }
  return issues;
}

function degradedResult(original: string, summary: string): KurdishLanguageAnalysis {
  return {
    status: 'degraded',
    overallLanguageScore: null,
    academicTonePassed: false,
    issues: [],
    refinedTextKurdish: original,
    kurdishSummary: summary
  };
}

export class KurdishAcademicLanguageService {
  /**
   * Proposes Sorani academic-language improvements without treating model scores as independent proof.
   */
  public async analyzeAndRefineLanguage(
    text: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<KurdishLanguageAnalysis> {
    const original = normalizeInput(text);
    if (!original) {
      return degradedResult('', 'دەقی بەتاڵە؛ پشکنینی زمانی ئەکادیمی ئەنجام نەدرا.');
    }
    if (original.length > MAX_INPUT_LENGTH) {
      return degradedResult(
        original,
        'قەبارەی دەق لە سنووری ' + MAX_INPUT_LENGTH +
          ' پیت زیاترە؛ دەقەکە وەک خۆی پارێزرا و هیچ نمرەیەک دروست نەکرا.'
      );
    }

    const prompt = [
      'تۆ پسپۆڕی زمانی کوردی (شێوەزاری سۆرانیی پێوەر) و سەرنووسەری ئەکادیمییت.',
      'دەقەکە لە ڕووی ڕێزمان، ڕێنووس، زاراوەی زانستی و تۆنی ئەکادیمی بپشکنە و پێشنیاری چاکسازی بکە.',
      'هەموو citation، DOI، URL، ISBN، ISSN، بەروار و ژمارەکان بە هەمان نووسین و بە هەمان ژمارەی دووبارەبوونەوە بپارێزە.',
      'هیچ citation، سەرچاوە، ئامار یان فاکتێکی نوێ زیاد مەکە. نمرەی زمانی هەڵسەنگاندنی پێشنیارکراوی مۆدێلە، نە بەڵگەی سەربەخۆ.',
      'ئەگەر ناتوانیت ماددە پارێزراوەکان بپارێزیت، دەقی سەرەتایی بە هەمان شێوە بگەڕێنەوە.',
      '',
      'دەق:',
      '<ACADEMIC_TEXT>',
      original,
      '</ACADEMIC_TEXT>',
      '',
      'وەڵام تەنها JSON بێت:',
      '{',
      '  "overallLanguageScore": 0,',
      '  "academicTonePassed": false,',
      '  "refinedTextKurdish": "دەقی پێشنیارکراو",',
      '  "kurdishSummary": "کورتەی شیکاری",',
      '  "issues": [{"type":"terminology","originalText":"دەقی کۆن","suggestedText":"پێشنیاری چاکسازی","explanationKurdish":"ڕوونکردنەوە"}]',
      '}'
    ].join('\n');

    try {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.2 }
      });
      const parsed: unknown = JSON.parse(response.text || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return degradedResult(original, 'وەڵامی مۆدێل بە شێوەی پێویست نەبوو؛ دەقی سەرەتایی پارێزرا.');
      }
      const result = parsed as Record<string, unknown>;
      const candidate = normalizeInput(result['refinedTextKurdish']);
      if (!candidate || candidate.length > MAX_REFINED_LENGTH) {
        return degradedResult(original, 'دەقی پێشنیارکراو بەتاڵە یان لە سنووری قەبارە زیاترە؛ دەقی سەرەتایی پارێزرا.');
      }
      if (!protectedMaterialPreserved(original, candidate)) {
        return degradedResult(
          original,
          'چاکسازیی پێشنیارکراو citation، ژمارە، بەروار یان ناسنامەی سەرچاوەی گۆڕیوە؛ چاکسازییەکە ڕەت کرایەوە و دەقی سەرەتایی پارێزرا.'
        );
      }

      const rawScore = result['overallLanguageScore'];
      const scoreIsValid = typeof rawScore === 'number' &&
        Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 100;
      const summary = typeof result['kurdishSummary'] === 'string'
        ? result['kurdishSummary'].trim().slice(0, 4_000)
        : '';

      return {
        status: 'generated',
        overallLanguageScore: scoreIsValid ? rawScore : null,
        academicTonePassed: scoreIsValid && result['academicTonePassed'] === true,
        issues: safeIssues(result['issues']),
        refinedTextKurdish: candidate,
        kurdishSummary: summary || 'پێشنیاری زمانی وەرگیرا؛ بۆ بڕیاری کۆتایی پێداچوونەوەی مرۆیی پێویستە.'
      };
    } catch (error: unknown) {
      console.error('Error in KurdishAcademicLanguageService:', error);
      return degradedResult(
        original,
        'پشکنینی زمانی ئەکادیمی بەردەست نەبوو؛ هیچ نمرە یان پەسەندکردنێک دروست نەکرا و دەقەکە وەک خۆی پارێزرا.'
      );
    }
  }
}

export const kurdishAcademicLanguageService = new KurdishAcademicLanguageService();
