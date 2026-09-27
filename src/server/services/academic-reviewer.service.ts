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
      const rawCriteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];
      const criteria: EvaluationCriterion[] = rawCriteria.map((criterion: any) => ({
        category: String(criterion?.category || 'Unclassified'),
        score: Math.max(0, Math.min(10, Number(criterion?.score) || 0)),
        severity: ['low', 'medium', 'high', 'critical'].includes(criterion?.severity)
          ? criterion.severity
          : 'medium',
        findingKurdish: String(criterion?.findingKurdish || 'هیچ دۆزینەوەیەکی پشتڕاستکراو نییە.'),
        evidenceQuoteKurdish: String(criterion?.evidenceQuoteKurdish || ''),
        recommendationKurdish: String(criterion?.recommendationKurdish || 'پێویستی بە پشکنینی زیاتر هەیە.')
      }));

      if (criteria.length === 0 && !parsed.summaryCritiqueKurdish) {
        throw new Error('Reviewer returned no usable evaluation');
      }

      const overallScore = Math.max(0, Math.min(10, Number(parsed.overallScore) || 0));
      return {
        overallScore,
        thesisDefenseSimulatedPassed: parsed.thesisDefenseSimulatedPassed === true,
        summaryCritiqueKurdish: String(
          parsed.summaryCritiqueKurdish || 'هەڵسەنگاندنەکە بەردەستە، بەڵام پێویستی بە پشکنینی توێژەر هەیە.'
        ),
        criteria
      };
    } catch (err: unknown) {
      console.error('Error in AcademicReviewerService:', err);
      return {
        overallScore: 0,
        thesisDefenseSimulatedPassed: false,
        summaryCritiqueKurdish: 'هەڵسەنگاندنی ئەکادیمی بەهۆی نەبوونی موتورەکە بەردەست نەبوو؛ هیچ نمرەیەکی خەملێنراو پیشان نادرێت.',
        criteria: [
          {
            category: 'Reviewer Availability',
            score: 0,
            severity: 'critical',
            findingKurdish: 'موتۆری Reviewer وەڵامی پشتڕاستکراوی نەدا.',
            evidenceQuoteKurdish: '',
            recommendationKurdish: 'پێداچوونەوەی Reviewer دووبارە بکەوە پێش بەکارهێنانی نمرەکە.'
          }
        ]
      };
    }
  }
}

export const academicReviewerService = new AcademicReviewerService();
