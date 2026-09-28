import { GoogleGenAI } from '@google/genai';

export interface ScholarlyProseResult {
  refinedText: string;
  changes: string[];
  unsupportedContentBlocked: number;
  humanReviewRequired: boolean;
  stylePolicy: string;
}

export class HumanScholarlyProseService {
  public async refine(
    draftText: string,
    profile: { name: string; style: string; terminology: string[] },
    getGeminiClient: () => GoogleGenAI
  ): Promise<ScholarlyProseResult> {
    const input = String(draftText || '').trim();
    if (!input) {
      return {
        refinedText: '',
        changes: [],
        unsupportedContentBlocked: 0,
        humanReviewRequired: true,
        stylePolicy: 'Natural scholarly prose; factual content must remain evidence-bound.'
      };
    }

    const prompt = `دەقێکی ئەکادیمی بە شێوازی نووسینی مرۆیی و زانستی چاک بکە.
بوار: ${profile.name}
شێواز: ${profile.style}
زاراوە پەسەندکراوەکان: ${profile.terminology.join('، ')}

یاساکان:
1. هیچ فاکت، ئامار، citation، ناوی نووسەر، ساڵ یان سەرچاوەی نوێ زیاد مەکە.
2. Claim ـەکان، citation ـەکان و quote ـە هەبووەکان مەگۆڕە بە شێوەیەک کە واتا بگۆڕێت.
3. ڕستەسازی سروشتی، جۆراوجۆر و زانستی بەکاربهێنە.
4. لە کلیشەی AI، دووبارەکردنەوە و وشەی بێ‌پێویست دووربە.
5. ئەگەر دەقێک پشتگیری نەکرێت، بیخەڕەوە یان نیشانی پێویستی بە پشکنینی مرۆیی بدە.

وەڵام JSON:
{"refinedText":"...","changes":["..."],"unsupportedContentBlocked":0}

دەق:
${input}`;

    try {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.35 }
      });
      const parsed = JSON.parse(response.text || '{}');
      return {
        refinedText: typeof parsed.refinedText === 'string' && parsed.refinedText.trim()
          ? parsed.refinedText.trim()
          : input,
        changes: Array.isArray(parsed.changes)
          ? parsed.changes.filter((item: unknown): item is string => typeof item === 'string').slice(0, 30)
          : [],
        unsupportedContentBlocked: Number(parsed.unsupportedContentBlocked) > 0
          ? Number(parsed.unsupportedContentBlocked)
          : 0,
        humanReviewRequired: true,
        stylePolicy: 'Natural scholarly prose; AI output is never proof of human authorship.'
      };
    } catch {
      return {
        refinedText: input,
        changes: [],
        unsupportedContentBlocked: 0,
        humanReviewRequired: true,
        stylePolicy: 'Natural scholarly prose; factual content must remain evidence-bound.'
      };
    }
  }
}

export const humanScholarlyProseService = new HumanScholarlyProseService();
