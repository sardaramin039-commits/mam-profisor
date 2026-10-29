/**
 * Failure response only. This function intentionally never creates academic prose,
 * proposals, outlines, evidence, citations, scores, or fallback templates.
 */
export interface FallbackOptions {
  toolId?: string;
  inputText?: string;
  discipline?: string;
  academicLevel?: string;
}

export function generateDynamicAcademicFallback(options: FallbackOptions): string {
  return JSON.stringify({
    status: 'generation_unavailable',
    generatedContent: null,
    toolId: options.toolId || 'general',
    academicLevel: options.academicLevel || null,
    discipline: options.discipline || null,
    reasonCode: 'AI_PROVIDER_UNAVAILABLE',
    retryable: true
  });
}
