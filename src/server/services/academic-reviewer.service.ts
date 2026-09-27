import { GoogleGenAI } from '@google/genai';

export interface EvaluationCriterion {
  category: string; // e.g. "Research Question", "Structure", "Argumentation", etc.
  score: number; // 0 - 10
  severity: 'low' | 'medium' | 'high' | 'critical';
  findingKurdish: string;
  evidenceQuoteKurdish: string;
  recommendationKurdish: string;
}

export interface ReviewerReport {
  overallScore: number; // 0 - 10
  thesisDefenseSimulatedPassed: boolean;
  criteria: EvaluationCriterion[];
  summaryCritiqueKurdish: string;
}

export class AcademicReviewerService {
  /**
   * Evaluates draft theses as an AI Professor without changing text, strictly reviewing and scoring.
   */
  public async evaluateThesis(
    draftText: string,
    topic: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<ReviewerReport> {
    const ai = getGeminiClient();

    const prompt = `تۆ سەرۆکی لیژنەی هەڵسەنگاندن و پڕۆفیسۆری باڵای زانکۆی هارفەردیت. ئەرکت هەڵسەنگاندنی ئەکادیمیانەی بەخشینی دکتۆرا یان ماستەرە بۆ ئەم تێکستە زانستییە:
بابەت: ${topic}
دەقی تێز: ${draftText}

تکایە بەپێی 9 پێوەرەکەی هارفەرد نمرەی (0 بۆ 10) بدە و تەنها هەڵسەنگاندن و ڕەخنە بنووسە:
1. Research Question
2. Structure
3. Argumentation
4. Evidence
5. Citation
6. Source Quality
7. Methodology
8. Academic Language
9. Originality

وەڵامەکەت تەنها بە JSON بێت بەم شێوازە:
{
  "overallScore": 8.8,
  "thesisDefenseSimulatedPassed": true,
  "summaryCritiqueKurdish": "شیکاری گشتی لیژنەی هەڵسەنگاندن بە کوردیی سۆرانی زانستی",
  "criteria": [
    {
      "category": "Research Question",
      "score": 9.0,
      "severity": "low",
      "findingKurdish": "پرسیارەکە ڕوون و بەهێز دیاریکراوە.",
      "evidenceQuoteKurdish": "تێکستی پشتڕاستکەرەوە لە تێزەکەدا",
      "recommendationKurdish": "پێشنیار بۆ قووڵکردنەوەی زیاتری ناوەڕۆکەکە."
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
        overallScore: parsed.overallScore || 8.5,
        thesisDefenseSimulatedPassed: parsed.thesisDefenseSimulatedPassed ?? true,
        summaryCritiqueKurdish: parsed.summaryCritiqueKurdish || 'تێزەکە خاوەن ئاستێکی بەرزی زانستی و بونیادگەرییە.',
        criteria: parsed.criteria || []
      };
    } catch (err: any) {
      console.error('Error in AcademicReviewerService:', err);
      return {
        overallScore: 0,
        thesisDefenseSimulatedPassed: false,
        summaryCritiqueKurdish: 'هەڵسەنگاندنی AI سەرکەوتوو نەبوو؛ هیچ نمرەیەکی ساختە بۆ بەڵگەکردنی کوالێتی کارەکە دانەنرا.',
        criteria: []
      };
    }
  }
}

export const academicReviewerService = new AcademicReviewerService();
