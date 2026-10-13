import { GoogleGenAI } from '@google/genai';

export interface EvaluationCriterion {
  category: string;
  score: number | null;
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
  evidenceText?: string;
  pageNumber?: string | number | null;
  verificationStatus: 'verified';
}

export interface ReviewerReport {
  status: 'generated' | 'degraded';
  overallScore: number | null;
  thesisDefenseSimulatedPassed: boolean | null;
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

        const severityValue = typeof item['severity'] === 'string'
          ? item['severity']
          : 'medium';
        const severity: EvaluationCriterion['severity'] = [
          'low',
          'medium',
          'high',
          'critical'
        ].includes(severityValue)
          ? severityValue as EvaluationCriterion['severity']
          : 'medium';

        const rawScore = item['score'];
        const numericScore = typeof rawScore === 'number' && Number.isFinite(rawScore)
          ? Math.max(0, Math.min(10, rawScore))
          : null;

        return {
          category: String(item['category'] || 'Unclassified'),
          score: numericScore,
          severity,
          findingKurdish: finding || 'هیچ دۆزینەوەیەکی پشتڕاستکراو نییە.',
          evidenceQuoteKurdish,
          recommendationKurdish: recommendation || 'پێویستی بە پشکنینی زیاتر هەیە.'
        };
      });

      if (criteria.length === 0 && !parsed['summaryCritiqueKurdish']) {
        throw new Error('Reviewer returned no usable evaluation');
      }

      const rawOverallScore = parsed['overallScore'];
      const overallScore = typeof rawOverallScore === 'number' && Number.isFinite(rawOverallScore)
        ? Math.max(0, Math.min(10, rawOverallScore))
        : null;
      const defensePassed = typeof parsed['thesisDefenseSimulatedPassed'] === 'boolean'
        ? parsed['thesisDefenseSimulatedPassed']
        : null;

      return {
        status: 'generated',
        overallScore,
        thesisDefenseSimulatedPassed: defensePassed,
        summaryCritiqueKurdish: String(
          parsed['summaryCritiqueKurdish'] ||
          'هەڵسەنگاندنەکە بەردەستە، بەڵام پێویستی بە پشکنینی توێژەر هەیە.'
        ),
        criteria
      };
    } catch (err: unknown) {
      console.error('Error in AcademicReviewerService:', err);
      return {
        status: 'degraded',
        overallScore: null,
        thesisDefenseSimulatedPassed: null,
        summaryCritiqueKurdish: 'هەڵسەنگاندنی Reviewer تەواو نەبوو؛ هیچ نمرە یان بڕیاری بەرگری دروست نەکرا. دوای بەردەستبوونی AI دووبارە هەوڵ بدە.',
        criteria: []
      };
    }
  }
}

export const academicReviewerService = new AcademicReviewerService();
