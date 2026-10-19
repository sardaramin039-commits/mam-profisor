export interface ResearchValidationGates {
  methodologyReady: boolean;
  evidenceReady: boolean;
  decisionTraceable: boolean;
  reviewRequired: boolean;
  exportBlocked: boolean;
  readyForManuscript: boolean;
  blockers: string[];
}

export interface ResearchValidationInput {
  methodologyReady: boolean;
  evidenceReady: boolean;
  decisionTraceable: boolean;
  reviewRequired: boolean;
  sourcesCount?: number;
  claimsCount?: number;
  evidenceCount?: number;
  decisionCount?: number;
  evidenceCoverage?: number;
}

function clampCoverage(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function buildBlockers(input: ResearchValidationInput): string[] {
  const blockers: string[] = [];
  if (!input.methodologyReady) blockers.push('Methodology is not explicitly recorded.');
  if (!input.evidenceReady) blockers.push('Verified evidence is not ready.');
  if (!input.decisionTraceable) blockers.push('Research decisions are not traceable.');
  if (input.reviewRequired) blockers.push('Evidence coverage requires academic review.');

  if (input.sourcesCount !== undefined && input.sourcesCount === 0) {
    blockers.push('No research source is linked to the project.');
  }
  if (
    input.claimsCount !== undefined &&
    input.evidenceCount !== undefined &&
    input.claimsCount > 0 &&
    input.evidenceCount === 0
  ) {
    blockers.push('Claims exist without any recorded evidence.');
  }

  const coverage = clampCoverage(input.evidenceCoverage);
  if (
    input.claimsCount !== undefined &&
    input.evidenceCoverage !== undefined &&
    input.claimsCount > 0 &&
    coverage < 80
  ) {
    blockers.push('Evidence coverage is below the 80% release threshold.');
  }

  return [...new Set(blockers)];
}

export function evaluateResearchControlGates(
  input: ResearchValidationInput
): ResearchValidationGates {
  const blockers = buildBlockers(input);
  const exportBlocked = blockers.length > 0;

  return {
    methodologyReady: input.methodologyReady,
    evidenceReady: input.evidenceReady,
    decisionTraceable: input.decisionTraceable,
    reviewRequired: input.reviewRequired,
    exportBlocked,
    readyForManuscript: !exportBlocked,
    blockers
  };
}
