import { GoogleGenAI } from '@google/genai';

export interface KurdishLanguageIssue {
  type: 'grammar' | 'spelling' | 'terminology' | 'tone' | 'cohesion';
  originalText: string;
  suggestedText: string;
  explanationKurdish: string;
}

export interface KurdishLanguageAnalysis {
  status: 'generated' | 'degraded';
  overallLanguageScore: number | null; // null when the model did not provide a valid score
  academicTonePassed: boolean;
  issues: KurdishLanguageIssue[];
  refinedTextKurdish: string;
  kurdishSummary: string;
}

export class KurdishAcademicLanguageService {
  /**
   * Refines and validates Kurdish Sorani academic language, grammar, spelling, and academic terminology.
   */
  public async analyzeAndRefineLanguage(
    text: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<KurdishLanguageAnalysis> {
    const prompt = `تۆ پسپۆڕی زمانی کوردی (شێوەزاری سۆرانیی پێوەر) و سەرنووسەری ئەکادیمیی زانکۆیت.
ئەم دەقە لە ڕووی ڕێزمان، ڕێنوس، زاراوەی زانستی، و تۆنی فەرمیی ئەکادیمی بپشکنە و پێشنیاری چاکسازی بکە:

دەق: ${text}

وەڵامەکەت تەنها بە JSON بێت بەم شێوازە:
{
  "overallLanguageScore": 0,
  "academicTonePassed": false,
  "refinedTextKurdish": "دەقی دەستکاریکراو بە سۆرانی بێخەوش و فەرمی",
  "kurdishSummary": "شیکاری زمانی و ڕێزمانی بە کوردی",
  "issues": [
    {
      "type": "terminology",
      "originalText": "وشەی ڕۆژانە",
      "suggestedText": "زاراوەی توندی زانستی",
      "explanationKurdish": "بەکارهێنانی زاراوەی زانستی لە بری زمانی ئاخاوتن."
    }
  ]
}`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawScore = parsed.overallLanguageScore;
      const overallLanguageScore = typeof rawScore === 'number' && Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, rawScore))
        : null;
      const refinedTextKurdish = typeof parsed.refinedTextKurdish === 'string' && parsed.refinedTextKurdish.trim()
        ? parsed.refinedTextKurdish
        : text;
      return {
        status: typeof parsed.refinedTextKurdish === 'string' && parsed.refinedTextKurdish.trim()
          ? 'generated'
          : 'degraded',
        overallLanguageScore,
        academicTonePassed: typeof parsed.academicTonePassed === 'boolean' ? parsed.academicTonePassed : false,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        refinedTextKurdish,
        kurdishSummary: typeof parsed.kurdishSummary === 'string' && parsed.kurdishSummary.trim()
          ? parsed.kurdishSummary
          : 'وەڵامی زمانی بە تەواوی پشتڕاست نەکرایەوە؛ پێویستی بە پشکنینی مرۆیی هەیە.'
      };
    } catch (err: any) {
      console.error('Error in KurdishAcademicLanguageService:', err);
      return {
        status: 'degraded',
        overallLanguageScore: null,
        academicTonePassed: false,
        issues: [],
        refinedTextKurdish: text,
        kurdishSummary: 'پشکنینی زمانی ئەکادیمی بەردەست نەبوو؛ هیچ نمرە یان پەسەندکردنێک دروست نەکرا و دەقەکە وەک خۆی پارێزرا.'
      };
    }
  }
}

export const kurdishAcademicLanguageService = new KurdishAcademicLanguageService();
