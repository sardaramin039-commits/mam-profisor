import { GoogleGenAI } from '@google/genai';

export interface QACheckItem {
  ruleName: string;
  passed: boolean;
  severity: 'warning' | 'critical';
  detailsKurdish: string;
  recommendedActionKurdish: string;
}

export interface QAGateResult {
  exportBlocked: boolean;
  overallQAScore: number;
  criticalViolationsCount: number;
  checks: QACheckItem[];
  kurdishSummaryStatus: string;
}

function clampScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function hasVerifiedSource(source: any): boolean {
  return source?.existenceVerified === true
    && source?.rejectedAsFabricated !== true
    && source?.trustLevel !== 'D'
    && source?.trustLevel !== 'F';
}

export class AcademicQAGateService {
  /**
   * Pre-export gate. AI can provide review suggestions, but deterministic safety rules
   * always override a permissive AI result.
   */
  public async runQAGate(
    documentText: string,
    sources: any[],
    getGeminiClient: () => GoogleGenAI
  ): Promise<QAGateResult> {
    const ai = getGeminiClient();

    const prompt = `پێداچوونەوەی QA بۆ بەڵگەنامەی ئەکادیمی بکە.
تێکست: ${documentText.slice(0, 5000)}
سەرچاوەکان: ${JSON.stringify((Array.isArray(sources) ? sources : []).slice(0, 10))}

یاسا:
- هیچ citation یان source ـێک بە تەنها بەهۆی قسەی AI Verified مەکە.
- دۆخی سەرچاوە لە metadata ـی دەرەکی و system verification ـەوە دێت.
- ئەگەر بەڵگە کافی نییە، passed=false دابنێ.
- نمرەکان خەملاندنن؛ هیچ نمرەیەک نابێت جێگەی verification بگرێتەوە.

تەنها JSON:
{
  "exportBlocked": true,
  "overallQAScore": 0,
  "criticalViolationsCount": 1,
  "kurdishSummaryStatus": "بەڵگەنامەکە پێویستی بە پشکنینی زیاتر هەیە.",
  "checks": [
    {
      "ruleName": "Citation Integrity",
      "passed": false,
      "severity": "critical",
      "detailsKurdish": "پشتڕاستکردنەوەی citation تەواو نییە.",
      "recommendedActionKurdish": "سەرچاوەکان بە شێوەی دەرەکی پشتڕاست بکە."
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const checks: QACheckItem[] = Array.isArray(parsed.checks) ? parsed.checks : [];
      const safeSources = Array.isArray(sources) ? sources : [];
      const unverifiedCount = safeSources.filter(source => !hasVerifiedSource(source)).length;

      if (unverifiedCount > 0) {
        checks.push({
          ruleName: 'Deterministic Source Verification',
          passed: false,
          severity: 'critical',
          detailsKurdish: `${unverifiedCount} سەرچاوە بە verification ـی دەرەکی نەگەیشتوون یان نیشانەی ڕەتکراونەوەیان هەیە.`,
          recommendedActionKurdish: 'پێش Export سەرچاوەکان بە DOI/ISBN/کاتەلۆگی ساغ پشتڕاست بکەوە.'
        });
      }

      if (checks.length === 0) {
        checks.push({
          ruleName: 'QA Engine Availability',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'هیچ ئەنجامێکی پشتڕاستکراوی QA لە موتورەکەوە وەرنەگیرا.',
          recommendedActionKurdish: 'پشکنینی QA دووبارە بکەوە پێش Export.'
        });
      }

      const criticalCount = checks.filter(check => !check.passed && check.severity === 'critical').length;
      const aiScore = clampScore(parsed.overallQAScore);
      const overallQAScore = criticalCount > 0 ? Math.min(aiScore, 49) : aiScore;

      return {
        exportBlocked: Boolean(parsed.exportBlocked) || criticalCount > 0,
        overallQAScore,
        criticalViolationsCount: criticalCount,
        checks,
        kurdishSummaryStatus: typeof parsed.kurdishSummaryStatus === 'string'
          ? parsed.kurdishSummaryStatus
          : 'پشکنینی QA بە دڵنیاییی تەواو نەگەیشتووە.'
      };
    } catch (err: unknown) {
      console.error('Error in AcademicQAGateService:', err);
      return {
        exportBlocked: true,
        overallQAScore: 0,
        criticalViolationsCount: 1,
        checks: [{
          ruleName: 'QA Engine Availability',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'موتۆری QA بەردەست نەبوو؛ سیستەم بەهۆی ئەمانەتی ئەکادیمی Export ـی بلۆک کرد.',
          recommendedActionKurdish: 'دوای بەردەستبوونی QA، پشکنین دووبارە بکەوە.'
        }],
        kurdishSummaryStatus: 'QA نەکرا؛ Export بە شێوەی fail-closed بلۆک کرا.'
      };
    }
  }
}

export const academicQAGateService = new AcademicQAGateService();
