import { GoogleGenAI } from '@google/genai';

export interface EvaluationCriterion {
  category: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  findingKurdish: string;
  evidenceQuoteKurdish: string;
  recommendationKurdish: string;
}

export interface ReviewerSourceContext {
  sourceId: string;
  sourceTitle: string;
  author?: string;
  year?: string;
  publisher?: string;
  doiOrIsbn?: string;
  verificationStatus: 'verified';
}

export interface ReviewerReport {
  overallScore: number;
  thesisDefenseSimulatedPassed: boolean;
  criteria: EvaluationCriterion[];
  summaryCritiqueKurdish: string;
}

export interface ReviewerContext {
  discipline?: string;
  verifiedSources?: ReviewerSourceContext[];
}

export class AcademicReviewerService {
  public async evaluateThesis(
    draftText: string,
    topic: string,
    getGeminiClient: () => GoogleGenAI,
    context: ReviewerContext = {}
  ): Promise<ReviewerReport> {
    const ai = getGeminiClient();
    const sourceContext = (context.verifiedSources || []).slice(0, 100);

    const prompt = `تۆ وەک Reviewer ـێکی زانستی و بێلایەن کار دەکەیت. ئەرکت هەڵسەنگاندنی ئەکادیمییانەی ئەم دەقەی توێژینەوەیەیە.

بابەت: ${topic}
بوار: ${context.discipline || 'گشتی'}
دەقی تێز:
${draftText}

سەرچاوەی VERIFIED ـی بەردەست بۆ ئەم پشکنینە:
${JSON.stringify(sourceContext, null, 2)}

یاساکانی هەڵسەنگاندن:
١. تەنها لەسەر ئەو دەق و سەرچاوانەی لێرەدا دراون هەڵسەنگاندن بکە.
٢. نابێت DOI، ناوی نووسەر، ساڵ، quote یان داتای نوێ دروست بکەیت.
٣. Source Quality و Citation تەنها بە پشتبەستن بە لیستی VERIFIED ـی سەرەوە هەڵسەنگێنە. ئەگەر context ـی سەرچاوە بەس نییە، لە finding ـدا بە ڕوونی بڵێ «بەڵگەی بەس نییە».
٤. evidenceQuoteKurdish تەنها کاتێک دابنێ کە دەتوانیت دەقێکی ڕاستەوخۆ لە دەقی تێزەکەوە بنووسیت؛ نابێت quote ـی خەیاڵی بێت.
٥. نمرەکان پێوانەی ناوخۆی Review ـن، نە بڕوانامە یان accreditation ـی دەرەکی.
٦. ئەگەر دڵنیایی بەس نییە، بڕیارەکەت سنووردار و ڕوون بکە.

بەپێی ئەم 9 پێوەرە هەڵسەنگاندن بکە:
1. Research Question
2. Structure
3. Argumentation
4. Evidence
5. Citation
6. Source Quality
7. Methodology
8. Academic Language
9. Originality

تەنها JSON و بەو شێوازە وەڵام بدەرەوە:
{
  "overallScore": 8.8,
  "thesisDefenseSimulatedPassed": false,
  "summaryCritiqueKurdish": "شیکاریی گشتی بە کوردیی سۆرانی زانستی",
  "criteria": [
    {
      "category": "Research Question",
      "score": 9.0,
      "severity": "low",
      "findingKurdish": "دۆزینەوەی پشکنراو",
      "evidenceQuoteKurdish": "quote ـی دەقاودەق لە دەقی تێز",
      "recommendationKurdish": "پێشنیاری چاکسازی"
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

      const parsed = JSON.parse(response.text || '{}') as Record<string, unknown>;
      const rawCriteria = Array.isArray(parsed['criteria']) ? parsed['criteria'] : [];
      const draftNormalized = draftText.trim();

      const criteria: EvaluationCriterion[] = rawCriteria.map((criterion: unknown) => {
        const item = criterion && typeof criterion === 'object'
          ? criterion as Record<string, unknown>
          : {};
        const rawQuote = String(item['evidenceQuoteKurdish'] || '').trim();
        const evidenceQuoteKurdish =
          rawQuote && draftNormalized.includes(rawQuote) ? rawQuote : '';
        const finding = String(item['findingKurdish'] || '').trim();
        const recommendation = String(item['recommendationKurdish'] || '').trim();

        return {
          category: String(item['category'] || 'Unclassified'),
          score: Math.max(0, Math.min(10, Number(item['score']) || 0)),
          severity: ['low', 'medium', 'high', 'critical'].includes(item['severity'])
            ? item['severity'] as EvaluationCriterion['severity']
            : 'medium',
          findingKurdish: finding || 'هیچ دۆزینەوەیەکی پشتڕاستکراو نییە.',
          evidenceQuoteKurdish,
          recommendationKurdish: recommendation || 'پێویستی بە پشکنینی زیاتر هەیە.'
        };
      });

      if (criteria.length === 0 && !parsed['summaryCritiqueKurdish']) {
        throw new Error('Reviewer returned no usable evaluation');
      }

      const overallScore = Math.max(
        0,
        Math.min(10, Number(parsed['overallScore']) || 0)
      );

      return {
        overallScore,
        thesisDefenseSimulatedPassed: parsed['thesisDefenseSimulatedPassed'] === true,
        summaryCritiqueKurdish: String(
          parsed['summaryCritiqueKurdish'] ||
          'هەڵسەنگاندنەکە بەردەستە، بەڵام پێویستی بە پشکنینی توێژەر هەیە.'
        ),
        criteria
      };
    } catch (err: unknown) {
      console.error('Error in AcademicReviewerService:', err);
      return {
        overallScore: 0,
        thesisDefenseSimulatedPassed: false,
        summaryCritiqueKurdish: 'موتۆری هەڵسەنگاندن وەڵامی پشتڕاستکراوی نەدا؛ نمرەکە نابێت وەک هەڵسەنگاندنی دەرەکی لێک بدرێتەوە.',
        criteria: [
          {
            category: 'Reviewer Availability',
            score: 0,
            severity: 'critical',
            findingKurdish: 'موتۆری Reviewer وەڵامی پشتڕاستکراوی نەدا.',
            evidenceQuoteKurdish: '',
            recommendationKurdish: 'پێداچوونەوەی Reviewer دووبارە بکەوە پێش بەکارهێنانی ئەنجامەکە.'
          }
        ]
      };
    }
  }
}

export const academicReviewerService = new AcademicReviewerService();
