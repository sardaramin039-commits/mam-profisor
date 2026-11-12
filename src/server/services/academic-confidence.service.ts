export type EvidenceStrength = 'verified' | 'strong' | 'moderate' | 'weak' | 'unverified';

export interface ConfidenceAssessment {
  overallScore: number;
  evidenceStrength: EvidenceStrength;
  evidenceCoverage: number;
  citationIntegrity: number;
  contradictionRisk: number;
  similarityRisk: number;
  humanReviewRequired: boolean;
  labelKurdish: string;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class AcademicConfidenceService {
  public assess(input: {
    verifiedClaims: number;
    totalClaims: number;
    citationEligibleClaims: number;
    contradictionCount: number;
    similarityScore: number;
    sourceVerificationRate: number;
  }): ConfidenceAssessment {
    const total = Math.max(1, input.totalClaims);
    const evidenceCoverage = clamp((input.verifiedClaims / total) * 100);
    const citationIntegrity = clamp((input.citationEligibleClaims / total) * 100);
    const contradictionRisk = clamp(Math.min(100, input.contradictionCount * 20));
    const similarityRisk = clamp(input.similarityScore);
    const sourceRate = clamp(input.sourceVerificationRate);
    const overallScore = clamp(
      evidenceCoverage * 0.35 +
      citationIntegrity * 0.25 +
      sourceRate * 0.20 +
      (100 - contradictionRisk) * 0.10 +
      (100 - similarityRisk) * 0.10
    );

    let evidenceStrength: EvidenceStrength = 'unverified';
    if (overallScore >= 90 && evidenceCoverage >= 90) evidenceStrength = 'verified';
    else if (overallScore >= 80) evidenceStrength = 'strong';
    else if (overallScore >= 65) evidenceStrength = 'moderate';
    else if (overallScore >= 40) evidenceStrength = 'weak';

    const labels: Record<EvidenceStrength, string> = {
      verified: 'بەڵگەکان زۆر بەهێز و پشتڕاستکراون',
      strong: 'بەڵگەکان بەهێزن، بەڵام پشکنینی مرۆیی پێشنیارە',
      moderate: 'بەڵگەکان مامناوەندن و هەندێک کەلێن هەیە',
      weak: 'بەڵگەکان لاوازن و پشکنینی زیاتریان پێویستە',
      unverified: 'بەڵگەکان پشتڕاستکراوی کافی نیین'
    };

    return {
      overallScore,
      evidenceStrength,
      evidenceCoverage,
      citationIntegrity,
      contradictionRisk,
      similarityRisk,
      humanReviewRequired: overallScore < 80 || contradictionRisk > 0 || citationIntegrity < 90,
      labelKurdish: labels[evidenceStrength]
    };
  }
}

export const academicConfidenceService = new AcademicConfidenceService();
