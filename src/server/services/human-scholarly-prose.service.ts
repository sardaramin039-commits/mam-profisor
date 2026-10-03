import { GoogleGenAI } from '@google/genai';

export interface ScholarlyProseResult {
  refinedText: string;
  changes: string[];
  unsupportedContentBlocked: number;
  humanReviewRequired: boolean;
  stylePolicy: string;
  preservationPassed?: boolean;
}

export interface ScholarlyProseProfile {
  name: string;
  style: string;
  terminology: string[];
}

const DEFAULT_POLICY =
  'Natural scholarly prose; factual content must remain evidence-bound and AI output is not proof of human authorship.';

function countOccurrences(text: string, fragment: string): number {
  if (!fragment) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= text.length) {
    const index = text.indexOf(fragment, offset);
    if (index < 0) break;
    count++;
    offset = index + fragment.length;
  }
  return count;
}

function extractCitationFragments(text: string): string[] {
  const matches = [
    ...(text.match(/\\[[0-9]+(?:\\s*[,;]\\s*[0-9]+)*\\]/g) || []),
    ...(text.match(/\\([^()\\n]{1,120}\\b(?:19|20)\\d{2}[a-z]?\\)/g) || [])
  ];
  return Array.from(new Set(matches.map(item => item.trim()).filter(Boolean)));
}

function sameProtectedFragments(original: string, refined: string, fragments: string[]): boolean {
  const uniqueFragments = Array.from(
    new Set([
      ...fragments.map(item => String(item || '').trim()).filter(Boolean),
      ...extractCitationFragments(original)
    ])
  );
  return uniqueFragments.every(fragment =>
    countOccurrences(refined, fragment) >= countOccurrences(original, fragment)
  );
}

export class HumanScholarlyProseService {
  public isSafeRefinement(original: string, refined: string, protectedFragments: string[] = []): boolean {
    const source = String(original || '').trim();
    const candidate = String(refined || '').trim();
    if (!source || !candidate) return false;
    return sameProtectedFragments(source, candidate, protectedFragments);
  }

  public async refine(
    draftText: string,
    profile: ScholarlyProseProfile,
    getGeminiClient: () => GoogleGenAI
  ): Promise<ScholarlyProseResult> {
    return this.runRefinement(draftText, profile, [], getGeminiClient, false);
  }

  public async refineGrounded(
    groundedText: string,
    profile: ScholarlyProseProfile,
    protectedFragments: string[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<ScholarlyProseResult> {
    return this.runRefinement(groundedText, profile, protectedFragments, getGeminiClient, true);
  }

  private async runRefinement(
    draftText: string,
    profile: ScholarlyProseProfile,
    protectedFragments: string[],
    getGeminiClient: () => GoogleGenAI,
    groundedOnly: boolean
  ): Promise<ScholarlyProseResult> {
    const input = String(draftText || '').trim();
    if (!input) {
      return {
        refinedText: '',
        changes: [],
        unsupportedContentBlocked: 0,
        humanReviewRequired: true,
        stylePolicy: DEFAULT_POLICY,
        preservationPassed: false
      };
    }

    const modeRule = groundedOnly
      ? 'ئەمە تەنها دەستکاریکردنی شێوازی دەقێکی پشتبەستوو بە Evidence ـە. هیچ زانیارییەکی نوێ، Claim ـی نوێ یان دەرئەنجامی نوێ زیاد مەکە.'
      : 'ئامانج ڕێکخستنی دەقێکی زانستیی سروشتییە، بەبێ زیادکردنی هیچ فاکتێکی نوێ.';

    const protectedRule = protectedFragments.length
      ? `ئەم citation ـە دیاریکراوانە دەبێت بە هەمان نووسین و هەمان ژمارە لە وەڵامدا بمێننەوە:
${protectedFragments.map(item => `- ${item}`).join('\n')}`
      : 'هیچ citation ـێکی پارێزراوی تایبەت نییە، بەڵام هەموو citation و ژمارە و ناوی سەرچاوەی هەبوو دەبێت بپارێزرێن.';

    const prompt = `تۆ سەرنووسەرێکی زانکۆیییت کە دەقی ئەکادیمی بە شێوازی نووسینی مرۆیی و سروشتی دەنووسێت.

بوار: ${profile.name}
شێوازی بوار: ${profile.style}
زاراوەی پەسەندکراو: ${profile.terminology.join('، ')}

${modeRule}

پێوەرەکانی نووسین:
1. ڕستە درێژ و کورتەکان بە شێوەیەکی سروشتی تێکەڵ بکە؛ بۆ ئەوەی هەموو ڕستەکان یەک قەبارە نەبن.
2. پەیوەندیی نێوان بیرۆکەکان بە مانای ڕاستەوخۆ دروست بکە، نەک بە کۆمەڵێک دەستەواژەی کلیشەیی.
3. وشە و ڕستەی دووبارەکراو کەم بکە، بەڵام زاراوەی پسپۆڕیی پێویست مەگۆڕە.
4. لە دەستپێکردنی زۆرێک لە پاراگرافەکان بە هەمان شێواز دووربە.
5. لە دەستەواژەی ساختە و گشتی وەک «بە شێوەیەکی گشتی»، «شایانی باسە»، «ئەم توێژینەوەیە بەڕوونی دەریدەخات» بەبێ پێویستی واتایی دووربە.
6. دەربڕینی دڵنیایی لەگەڵ بەڵگە بگونجێنە؛ لە شوێنی دڵنیایی زۆر، کە evidence سنووردارە، زمانی هەڵسەنگاندن و ئاگاداری بەکاربهێنە.
7. دەقەکە ڕوون و خوێندراو بێت، بەڵام مەبەست «ئاسانکردنەوەی زمان» نەبێت بە نرخێکی لەدەستدانی وردیی زانستی.
8. هیچ شتێک لەسەر پرۆسەی AI، پرۆمپت، «وەک AI»، یان توانای خۆت مەنووسە.
9. هیچ فاکت، ئامار، citation، DOI، ساڵ، ناوی نووسەر، quote یان سەرچاوەی نوێ دروست مەکە.
10. مانای Claim ـەکان مەگۆڕە و ژمارە، بەروار، پێناسە و بەڵگەی هەبوو مەشێوێنە.

${protectedRule}

وەڵام تەنها بە JSON بێت:
{"refinedText":"...","changes":["..."],"unsupportedContentBlocked":0}

دەقی کار:
${input}`;

    try {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.55 }
      });
      const parsed = JSON.parse(response.text || '{}');
      const candidate = typeof parsed.refinedText === 'string' && parsed.refinedText.trim()
        ? parsed.refinedText.trim()
        : input;
      const preservationPassed = this.isSafeRefinement(input, candidate, protectedFragments);

      return {
        refinedText: preservationPassed ? candidate : input,
        changes: Array.isArray(parsed.changes)
          ? parsed.changes.filter((item: unknown): item is string => typeof item === 'string').slice(0, 30)
          : [],
        unsupportedContentBlocked: Number(parsed.unsupportedContentBlocked) > 0
          ? Number(parsed.unsupportedContentBlocked)
          : 0,
        humanReviewRequired: true,
        stylePolicy: DEFAULT_POLICY,
        preservationPassed
      };
    } catch {
      return {
        refinedText: input,
        changes: [],
        unsupportedContentBlocked: 0,
        humanReviewRequired: true,
        stylePolicy: DEFAULT_POLICY,
        preservationPassed: false
      };
    }
  }
}

export const humanScholarlyProseService = new HumanScholarlyProseService();
