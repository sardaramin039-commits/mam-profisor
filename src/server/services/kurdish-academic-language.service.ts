import { GoogleGenAI } from '@google/genai';

export interface KurdishLanguageIssue {
  type: 'grammar' | 'spelling' | 'terminology' | 'tone' | 'cohesion';
  originalText: string;
  suggestedText: string;
  explanationKurdish: string;
}

export interface KurdishLanguageAnalysis {
  overallLanguageScore: number; // 0 - 100
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
    const ai = getGeminiClient();

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
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        overallLanguageScore: Number.isFinite(Number(parsed.overallLanguageScore))
          ? Math.max(0, Math.min(100, Number(parsed.overallLanguageScore)))
          : 0,
        academicTonePassed: parsed.academicTonePassed === true,
        issues: parsed.issues || [],
        refinedTextKurdish: parsed.refinedTextKurdish || text,
        kurdishSummary: parsed.kurdishSummary || 'زمان و ڕێنوسی دەقەکە خاوەن پێوەری فەرمییە.'
      };
    } catch (err: any) {
      console.error('Error in KurdishAcademicLanguageService:', err);
      return {
        overallLanguageScore: 0,
        academicTonePassed: false,
        issues: [{
          type: 'tone',
          originalText: '',
          suggestedText: '',
          explanationKurdish: 'موتۆری زمان بەردەست نەبوو؛ هیچ نمرە یان پەسەندکردنێکی خەملێنراو نادرێت.'
        }],
        refinedTextKurdish: text,
        kurdishSummary: 'پشکنینی زمانی ئەکادیمی بەردەست نەبوو؛ دەقەکە تەنها وەک خۆی پارێزراوە.'
      };
    }
  }
}

export const kurdishAcademicLanguageService = new KurdishAcademicLanguageService();
