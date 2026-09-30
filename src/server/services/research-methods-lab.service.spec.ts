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
});
