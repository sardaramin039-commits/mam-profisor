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

const COUNT_FIELDS: Array<keyof Pick<
  ResearchValidationInput,
  'sourcesCount' | 'claimsCount' | 'evidenceCount' | 'decisionCount'
>> = ['sourcesCount', 'claimsCount', 'evidenceCount', 'decisionCount'];

function isValidCount(value: number | undefined): boolean {
  return value !== undefined && Number.isSafeInteger(value) && value >= 0;
}

function validateCounts(input: ResearchValidationInput, blockers: string[]): void {
  for (const field of COUNT_FIELDS) {
    const value = input[field];
    if (value !== undefined && !isValidCount(value)) {
      blockers.push(`${field} must be a finite non-negative safe integer.`);
    }
  }
}

function validateEvidenceMetrics(input: ResearchValidationInput, blockers: string[]): void {
  const claimsCount = input.claimsCount;
  const evidenceCount = input.evidenceCount;
  const coverage = input.evidenceCoverage;
  const claimsValid = claimsCount === undefined || isValidCount(claimsCount);
  const evidenceValid = evidenceCount === undefined || isValidCount(evidenceCount);
  const coverageProvided = coverage !== undefined;
  const coverageValid = coverageProvided &&
    Number.isFinite(coverage) &&
    coverage >= 0 &&
    coverage <= 100;

  if (
    claimsValid &&
    claimsCount !== undefined &&
    claimsCount > 0
  ) {
    if (evidenceCount === undefined) {
      blockers.push('Evidence count is not recorded for the declared claims.');
    } else if (evidenceValid && evidenceCount === 0) {
      blockers.push('Claims exist without any recorded evidence.');
    }

    if (!coverageProvided) {
      blockers.push('Evidence coverage is not recorded for the declared claims.');
    } else if (!coverageValid) {
      blockers.push('Evidence coverage must be a finite percentage from 0 to 100.');
    } else if (coverage < 80) {
      blockers.push('Evidence coverage is below the 80% release threshold.');
    }
  } else if (coverageProvided && !coverageValid) {
    blockers.push('Evidence coverage must be a finite percentage from 0 to 100.');
  }
}

function buildBlockers(input: ResearchValidationInput): string[] {
  const blockers: string[] = [];
  if (input.methodologyReady !== true) blockers.push('Methodology is not explicitly recorded.');
  if (input.evidenceReady !== true) blockers.push('Verified evidence is not ready.');
  if (input.decisionTraceable !== true) blockers.push('Research decisions are not traceable.');
  if (input.reviewRequired !== false) blockers.push('Evidence coverage requires academic review or review status is unknown.');

  validateCounts(input, blockers);

  if (input.sourcesCount === 0) {
    blockers.push('No research source is linked to the project.');
  }
  if (input.decisionCount === 0) {
    blockers.push('No research decision is recorded for the project.');
  }

  validateEvidenceMetrics(input, blockers);

  return [...new Set(blockers)];
}

export function evaluateResearchControlGates(
  input: ResearchValidationInput
): ResearchValidationGates {
  const blockers = buildBlockers(input);
  const exportBlocked = blockers.length > 0;

  return {
    methodologyReady: input.methodologyReady === true,
    evidenceReady: input.evidenceReady === true,
    decisionTraceable: input.decisionTraceable === true,
    reviewRequired: input.reviewRequired !== false,
    exportBlocked,
    readyForManuscript: !exportBlocked,
    blockers
  };
}
