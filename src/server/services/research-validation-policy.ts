export interface ResearchValidationGates {
  methodologyReady: boolean;
  evidenceReady: boolean;
  decisionTraceable: boolean;
  reviewRequired: boolean;
  exportBlocked: boolean;
}

export function evaluateResearchControlGates(input: {
  methodologyReady: boolean;
  evidenceReady: boolean;
  decisionTraceable: boolean;
  reviewRequired: boolean;
}): ResearchValidationGates {
  const exportBlocked =
    !input.methodologyReady ||
    !input.evidenceReady ||
    !input.decisionTraceable ||
    input.reviewRequired;

  return {
    methodologyReady: input.methodologyReady,
    evidenceReady: input.evidenceReady,
    decisionTraceable: input.decisionTraceable,
    reviewRequired: input.reviewRequired,
    exportBlocked
  };
}
