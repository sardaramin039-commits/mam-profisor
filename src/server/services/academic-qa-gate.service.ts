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
    getGeminiClient: () => GoogleGenAI,
    compliance?: {
      confidence?: { overallScore?: number };
      similarity?: { overallSimilarityScore?: number; highRiskMatches?: number };
      contradictionCount?: number;
      citationIntegrity?: number;
      totalClaims?: number;
    }
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
      const wordCount = documentText.trim().split(/\s+/).filter(Boolean).length;
      const citationMarkerCount = (documentText.match(/\([^()]{2,100},\s*[12١٢][0-9٠-٩]{3}[a-z]?\)|\[[0-9٠-٩,;\s-]+\]/g) || []).length;

      if (wordCount > 250 && citationMarkerCount === 0) {
        checks.push({
          ruleName: 'Citation-to-Document Link',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'بەڵگەنامەکە درێژەی پێویست هەیە، بەڵام هیچ نیشانەیەکی ڕوونی citation لە دەقەکەدا نەدۆزرایەوە.',
          recommendedActionKurdish: 'Claim ـە پەیوەندیدارەکان بە citation ـی ڕاستەقینە ببەستە و پاشان Export دووبارە بکەوە.'
        });
      }
      if (safeSources.length === 0) {
        checks.push({
          ruleName: 'Source Availability',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'هیچ سەرچاوەیەکی دەرەکیی پشتڕاستکراو بۆ بەڵگەنامەکە نەدابین کراوە.',
          recommendedActionKurdish: 'سەرچاوەی ڕاستەقینە بدۆزەوە و پێش Export پشتڕاستی بکەوە.'
        });
      }


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

      const confidenceScore = Number(compliance?.confidence?.overallScore);
      const similarityScore = Number(compliance?.similarity?.overallSimilarityScore);
      const highRiskSimilarity = Number(compliance?.similarity?.highRiskMatches) || 0;
      const contradictionCount = Number(compliance?.contradictionCount) || 0;
      const citationIntegrity = Number(compliance?.citationIntegrity);
      const totalClaims = Number(compliance?.totalClaims) || 0;

      if (Number.isFinite(confidenceScore) && confidenceScore < 70) {
        checks.push({
          ruleName: 'Academic Confidence',
          passed: false,
          severity: 'critical',
          detailsKurdish: `ئەستەمەنی ئەکادیمی تەنها ${Math.round(confidenceScore)}% ـە.`,
          recommendedActionKurdish: 'Evidence و citation ـەکان زیاد بکە و پێش Export پشکنینی مرۆیی بکە.'
        });
      }

      if (highRiskSimilarity > 0 || (Number.isFinite(similarityScore) && similarityScore >= 35)) {
        checks.push({
          ruleName: 'Similarity Screening',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'شێوەی هاوشێوەیی بەرز لەگەڵ corpus ـی بەردەست دۆزرایەوە.',
          recommendedActionKurdish: 'سەرچاوەی ڕاستەقینە citation بکە، quote ـەکان دیاری بکە، و دەقی خۆت دووبارە پشکنەوە.'
        });
      }

      if (contradictionCount > 0) {
        checks.push({
          ruleName: 'Source Contradictions',
          passed: false,
          severity: 'critical',
          detailsKurdish: `${contradictionCount} ناکۆکییە زانستییە پشتڕاستکراوەکان پێویستیان بە چارەسەرکردن هەیە.`,
          recommendedActionKurdish: 'هەردوو دیدگا و بەڵگەکە هەڵسەنگێنە و پێش کۆتایی، جیاوازییەکە ڕوون بکە.'
        });
      }

      if (totalClaims > 0 && Number.isFinite(citationIntegrity) && citationIntegrity / totalClaims < 0.9) {
        checks.push({
          ruleName: 'Citation Coverage',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'پوششی citation بۆ Claim ـەکان کەمتر لە ئاستی پێویستە.',
          recommendedActionKurdish: 'هەر Claim ـێک بە Evidence ـی سەرچاوەی پشتڕاستکراو ببەستە.'
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
