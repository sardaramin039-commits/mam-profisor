import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

export interface QACheckItem {
  ruleName: string;
  passed: boolean;
  severity: 'warning' | 'critical';
  detailsKurdish: string;
  recommendedActionKurdish: string;
}

export interface ExportContract {
  version: '1.0';
  approved: boolean;
  fingerprint: string;
  identityVerifiedSourceCount: number;
  citationEligibleSourceCount: number;
  createdAt: string;
}

export interface QAGateResult {
  exportBlocked: boolean;
  overallQAScore: number;
  criticalViolationsCount: number;
  checks: QACheckItem[];
  kurdishSummaryStatus: string;
  exportContract: ExportContract;
}

function clampScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function hasCitationEligibleSource(source: unknown): boolean {
  if (!source || typeof source !== 'object') return false;
  const item = source as Record<string, unknown>;
  return item['citationEligible'] === true
    && item['identityStatus'] === 'verified'
    && item['evidenceStatus'] === 'verified'
    && item['existenceVerified'] === true
    && item['rejectedAsFabricated'] !== true;
}

function normalizeCitationValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function citationAuthorMatches(citationAuthor: string, sourceAuthor: string): boolean {
  const citation = normalizeCitationValue(citationAuthor);
  const source = normalizeCitationValue(sourceAuthor);
  if (!citation || !source) return false;
  const citationTokens = citation.split(' ').filter(token => token.length > 2);
  const sourceTokens = new Set(source.split(' '));
  return citationTokens.some(token => sourceTokens.has(token));
}

function auditCitationProvenance(documentText: string, sources: unknown[]): {
  total: number;
  matched: number;
  unmatched: number;
} {
  const eligible = sources
    .filter(hasCitationEligibleSource)
    .map(source => source as Record<string, unknown>);

  const matches = Array.from(documentText.matchAll(
    /\(([^()]{2,120})\s*[,،]\s*(19\d\d|20\d\d)[^()]*\)/g
  ));
  const noCommaMatches = Array.from(documentText.matchAll(
    /\(([^()]{2,120})\s+(19\d\d|20\d\d)[^()]*\)/g
  )).filter(match => !match[0].includes(',') && !match[0].includes('،'));

  const citations = [...matches, ...noCommaMatches];
  const matched = citations.filter(citation => {
    const author = citation[1];
    const year = citation[2];
    return eligible.some(source =>
      citationAuthorMatches(author, String(source['author'] ?? source['authors'] ?? '')) &&
      String(source['year'] ?? source['publicationYear'] ?? '') === year
    );
  }).length;

  return { total: citations.length, matched, unmatched: citations.length - matched };
}
function createExportFingerprint(
  documentText: string,
  sourceIds: string[],
  approved: boolean
): string {
  const payload = JSON.stringify({
    version: '1.0',
    documentText: documentText.trim(),
    sourceIds: [...sourceIds].sort(),
    approved
  });

  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export class AcademicQAGateService {
  public async runQAGate(
    documentText: string,
    sources: unknown[],
    getGeminiClient: () => GoogleGenAI,
    compliance?: {
      confidence?: { overallScore?: number };
      similarity?: { overallSimilarityScore?: number; highRiskMatches?: number };
      contradictionCount?: number;
      citationIntegrity?: number;
      totalClaims?: number;
      identityVerifiedSourceCount?: number;
      citationEligibleSourceCount?: number;
      sourceCount?: number;
    }
  ): Promise<QAGateResult> {
    const ai = getGeminiClient();
    const safeSources = Array.isArray(sources) ? sources : [];
    const identityVerifiedSourceCount = Number(compliance?.identityVerifiedSourceCount) || 0;
    const citationEligibleSourceCount =
      Number(compliance?.citationEligibleSourceCount) || safeSources.filter(hasCitationEligibleSource).length;

    const prompt = `پێداچوونەوەی QA بۆ بەڵگەنامەی ئەکادیمی بکە.
تێکست: ${documentText.slice(0, 5000)}
سەرچاوەی citation-eligible: ${JSON.stringify(safeSources.slice(0, 10))}

یاسا:
- AI ناتوانێت source یان citation بە تەنها Verified بکات.
- Identity verification و evidence verification دوو دۆخی جیاوازن.
- نمرەکان تەنها هەڵسەنگاندنی ناوخۆیین و جێگەی verification ناگرن.
- ئەگەر citation-eligible source نییە یان sourceێک دۆخی هەردووکی identity/evidence ـی verified نییە، Export نابێت ڕێگەپێبدات.

تەنها JSON:
{
  "exportBlocked": true,
  "overallQAScore": 0,
  "criticalViolationsCount": 1,
  "kurdishSummaryStatus": "بەڵگەنامەکە پێویستی بە پشکنینی زیاتر هەیە.",
  "checks": []
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

      const parsed = JSON.parse(response.text || '{}') as Record<string, unknown>;
      const checks: QACheckItem[] = Array.isArray(parsed['checks'])
        ? parsed['checks'].filter((item): item is QACheckItem =>
            Boolean(item && typeof item === 'object')
          )
        : [];

      const invalidSourceCount = safeSources.filter(
        source => !hasCitationEligibleSource(source)
      ).length;
      const wordCount = documentText.trim().split(/\s+/).filter(Boolean).length;
      const citationMarkerCount = (
        documentText.match(
          /\([^()]{2,100},\s*[12١٢][0-9٠-٩]{3}[a-z]?\)|\[[0-9٠-٩,;\s-]+\]/g
        ) || []
      ).length;
      const citationProvenance = auditCitationProvenance(documentText, safeSources);
      const numericCitationMatches = Array.from(
        documentText.matchAll(/\[\s*\d+(?:\s*[,;\-]\s*\d+)*\s*\]/g)
      );

      if (wordCount > 250 && citationMarkerCount === 0) {
        checks.push({
          ruleName: 'Citation-to-Document Link',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'بەڵگەنامەکە درێژەی هەیە، بەڵام هیچ نیشانەیەکی ڕوونی citation تێدا نەدۆزرایەوە.',
          recommendedActionKurdish: 'Claim ـەکان بە citation ـی پەیوەندیدار ببەستە.'
        });
      }

      if (numericCitationMatches.length > 0) {
        const sourceCount = Number(compliance?.sourceCount) || safeSources.length;
        if (sourceCount !== citationEligibleSourceCount) {
          checks.push({
            ruleName: 'Numeric Citation Safety',
            passed: false,
            severity: 'critical',
            detailsKurdish: 'دەقەکە citation ـی ژمارەیی هەیە، بەڵام هەموو source ـەکانی payload بەڵگە و verification ـی پێویستیان نییە.',
            recommendedActionKurdish: 'پێش Export هەموو source ـەکانی bibliography پشتڕاست بکەوە یان citation ـی ژمارەیی بە source ـی eligible بگونجێنە.'
          });
        }
      }

      if (citationProvenance.unmatched > 0) {
        checks.push({
          ruleName: 'Citation Provenance Coverage',
          passed: false,
          severity: 'critical',
          detailsKurdish: String(citationProvenance.unmatched) + ' citation ـی ناگونجە لە دەقەکەدا بە source ـی citation-eligible نەبەستراوە.',
          recommendedActionKurdish: 'هەر citation ـێک بە source ـی پشتڕاستکراو و metadata ـی هاوتا ببەستە.'
        });
      }

      if (identityVerifiedSourceCount === 0) {
        checks.push({
          ruleName: 'Source Identity Verification',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'هیچ source ـێکی identity-verified بۆ Export نەدۆزرایەوە.',
          recommendedActionKurdish: 'DOI، ISBN یان کاتەلۆگی دەرەکیی سەرچاوەکان پشتڕاست بکەوە.'
        });
      }

      if (citationEligibleSourceCount === 0) {
        checks.push({
          ruleName: 'Evidence Verification',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'هیچ source ـێک هەردووکی identity و evidence ـی verified ـی نییە.',
          recommendedActionKurdish: 'بەڵگەی ڕاستەقینە و claim-source link دابین بکە.'
        });
      }

      if (
        citationEligibleSourceCount < identityVerifiedSourceCount ||
        invalidSourceCount > 0
      ) {
        checks.push({
          ruleName: 'Citation Eligibility Contract',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'هەموو source ـە ناسنامە پشتڕاستکراوەکان بەڵگەی پێویستیان نییە؛ بۆیە مافی citation ـی کۆتایییان نییە.',
          recommendedActionKurdish: 'پێش Export هەموو citation ـە گرنگەکان بە evidence ـی پشتڕاستکراو ببەستە.'
        });
      }

      if (checks.length === 0) {
        checks.push({
          ruleName: 'Deterministic QA Baseline',
          passed: true,
          severity: 'warning',
          detailsKurdish: 'هیچ دۆخێکی سەرکەوتوونەکراو لە deterministic checks ـدا نەدۆزرایەوە.',
          recommendedActionKurdish: 'هەر بەم دۆخەش، پشکنینی مرۆیی پێش بەکارهێنانی ئەنجامەکە سودبەخشە.'
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
          recommendedActionKurdish: 'Evidence و citation ـەکان زیاد بکە.'
        });
      }

      if (highRiskSimilarity > 0 || (Number.isFinite(similarityScore) && similarityScore >= 35)) {
        checks.push({
          ruleName: 'Similarity Screening',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'هاوشێوەیی بەرز لەگەڵ corpus ـی بەردەست دۆزرایەوە.',
          recommendedActionKurdish: 'دەقەکە و citation ـەکان دووبارە پشکنەوە.'
        });
      }

      if (contradictionCount > 0) {
        checks.push({
          ruleName: 'Source Contradictions',
          passed: false,
          severity: 'critical',
          detailsKurdish: `${contradictionCount} ناکۆکییە زانستییەکانی پێویستی بە چارەسەرکردن هەیە.`,
          recommendedActionKurdish: 'جیاوازیی بەڵگەکان ڕوون بکەوە پێش کۆتایی.'
        });
      }

      if (
        totalClaims > 0 &&
        Number.isFinite(citationIntegrity) &&
        citationIntegrity / totalClaims < 0.9
      ) {
        checks.push({
          ruleName: 'Citation Coverage',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'پوششی citation بۆ Claim ـەکان کەمتر لە ئاستی پێویستە.',
          recommendedActionKurdish: 'Claim ـەکان بە Evidence ـی پشتڕاستکراو ببەستە.'
        });
      }

      const criticalCount = checks.filter(
        check => !check.passed && check.severity === 'critical'
      ).length;
      const aiScore = clampScore(parsed['overallQAScore']);
      const overallQAScore = criticalCount > 0 ? Math.min(aiScore, 49) : aiScore;
      const approved = !parsed['exportBlocked'] && criticalCount === 0;
      const sourceIds = safeSources
        .filter(hasCitationEligibleSource)
        .map(source => String((source as Record<string, unknown>)['sourceId'] || ''))
        .filter(Boolean);
      const createdAt = new Date().toISOString();

      return {
        exportBlocked: !approved,
        overallQAScore,
        criticalViolationsCount: criticalCount,
        checks,
        kurdishSummaryStatus: typeof parsed['kurdishSummaryStatus'] === 'string'
          ? parsed['kurdishSummaryStatus']
          : approved ? 'QA بە سەرکەوتوویی تێپەڕی.' : 'QA پەسەند نەکرا.',
        exportContract: {
          version: '1.0',
          approved,
          fingerprint: createExportFingerprint(documentText, sourceIds, approved),
          identityVerifiedSourceCount,
          citationEligibleSourceCount,
          createdAt
        }
      };
    } catch (error: unknown) {
      console.error('Error in AcademicQAGateService:', error);
      const createdAt = new Date().toISOString();
      return {
        exportBlocked: true,
        overallQAScore: 0,
        criticalViolationsCount: 1,
        checks: [{
          ruleName: 'QA Engine Availability',
          passed: false,
          severity: 'critical',
          detailsKurdish: 'موتۆری QA بەردەست نەبوو؛ Export بە شێوەی fail-closed بلۆک کرا.',
          recommendedActionKurdish: 'دوای بەردەستبوونی QA، پشکنین دووبارە بکەوە.'
        }],
        kurdishSummaryStatus: 'QA نەکرا؛ Export بلۆک کرا.',
        exportContract: {
          version: '1.0',
          approved: false,
          fingerprint: createExportFingerprint(documentText, [], false),
          identityVerifiedSourceCount,
          citationEligibleSourceCount,
          createdAt
        }
      };
    }
  }
}

export const academicQAGateService = new AcademicQAGateService();
