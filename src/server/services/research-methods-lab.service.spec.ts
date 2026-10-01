import { describe, expect, it } from 'vitest';
import { researchMethodsLabService } from './research-methods-lab.service';

describe('ResearchMethodsLabService', () => {
  it('builds PICO framework completeness deterministically', () => {
    const result = researchMethodsLabService.run('framework', {
      framework: 'PICO',
      values: { population: 'students', intervention: 'peer tutoring', comparison: 'usual teaching', outcome: 'achievement' }
    }) as { complete: number; total: number };
    expect(result.total).toBe(4);
    expect(result.complete).toBe(4);
  });

  it('flags missing claim evidence without inventing support', () => {
    const result = researchMethodsLabService.run('claim_map', { claims: [{ id: 'C1', text: 'x', sources: [] }] }) as { unmappedClaims: number };
    expect(result.unmappedClaims).toBe(1);
  });

  it('downgrades evidence certainty only for explicit serious domains', () => {
    const result = researchMethodsLabService.run('evidence_grade', {
      initialCertainty: 'high',
      riskOfBias: 'serious',
      inconsistency: 'serious'
    }) as { finalCertainty: string; downgradedFor: string[] };
    expect(result.finalCertainty).toBe('low');
    expect(result.downgradedFor).toEqual(['riskOfBias', 'inconsistency']);
  });

  it('blocks methodology review readiness when required fields are missing', () => {
    const result = researchMethodsLabService.run('methodology_gate', {
      design: 'quantitative',
      researchQuestion: 'Does X relate to Y?'
    }) as Record<string, unknown>;

    expect(result['readyForMethodReview']).toBe(false);
    expect(Number(result['missing'])).toBeGreaterThan(0);
    expect(Number(result['completionPercent'])).toBeLessThan(100);
  });

  it('reports complete quantitative methodology preflight only when required fields exist', () => {
    const result = researchMethodsLabService.run('methodology_gate', {
      design: 'quantitative',
      researchQuestion: 'Does X relate to Y?',
      variables: 'X and Y with operational definitions',
      populationSample: 'Defined target population and sampling frame',
      sampleSizeJustification: 'Power analysis with assumptions recorded',
      measurement: 'Validated measurement instruments',
      analysisPlan: 'Regression with specified covariates',
      missingData: 'Predefined missing-data handling',
      ethics: 'Ethics approval and consent plan'
    }) as Record<string, unknown>;

    expect(result['readyForMethodReview']).toBe(true);
    expect(result['missing']).toBe(0);
    expect(result['completionPercent']).toBe(100);
  });

  it('maps systematic reviews to PRISMA 2020', () => {
    const result = researchMethodsLabService.run('reporting_guideline', { design: 'systematic_review' }) as Record<string, unknown>;
    const matches = result['matches'] as Array<Record<string, unknown>>;

    expect(matches.some(item => item['id'] === 'PRISMA 2020')).toBe(true);
  });

  it('maps observational subtypes to STROBE', () => {
    const result = researchMethodsLabService.run('reporting_guideline', { design: 'observational_cross_sectional' }) as Record<string, unknown>;
    const matches = result['matches'] as Array<Record<string, unknown>>;

    expect(matches.some(item => item['id'] === 'STROBE')).toBe(true);
  });
});
