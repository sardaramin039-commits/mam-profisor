import { describe, expect, it } from 'vitest';
import { evaluateResearchControlGates } from './research-validation-policy';

const ready = {
  methodologyReady: true,
  evidenceReady: true,
  decisionTraceable: true,
  reviewRequired: false
};

describe('research validation export gate', () => {
  it('blocks export when methodology is missing', () => {
    expect(evaluateResearchControlGates({ ...ready, methodologyReady: false }).exportBlocked).toBe(true);
  });

  it('blocks export when evidence is missing', () => {
    expect(evaluateResearchControlGates({ ...ready, evidenceReady: false }).exportBlocked).toBe(true);
  });

  it('blocks export when decisions are not traceable', () => {
    expect(evaluateResearchControlGates({ ...ready, decisionTraceable: false }).exportBlocked).toBe(true);
  });

  it('blocks export while review is required', () => {
    expect(evaluateResearchControlGates({ ...ready, reviewRequired: true }).exportBlocked).toBe(true);
  });

  it('allows export when supplied validation metrics are valid and all gates pass', () => {
    const result = evaluateResearchControlGates({
      ...ready,
      sourcesCount: 2,
      claimsCount: 2,
      evidenceCount: 3,
      decisionCount: 1,
      evidenceCoverage: 90
    });
    expect(result.exportBlocked).toBe(false);
    expect(result.readyForManuscript).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'blocks invalid source counts (%s)',
    sourcesCount => {
      const result = evaluateResearchControlGates({ ...ready, sourcesCount });
      expect(result.exportBlocked).toBe(true);
      expect(result.blockers.some(blocker => blocker.includes('sourcesCount'))).toBe(true);
    }
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'blocks invalid claim counts (%s)',
    claimsCount => {
      const result = evaluateResearchControlGates({ ...ready, claimsCount });
      expect(result.exportBlocked).toBe(true);
      expect(result.blockers.some(blocker => blocker.includes('claimsCount'))).toBe(true);
    }
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'blocks invalid evidence counts (%s)',
    evidenceCount => {
      const result = evaluateResearchControlGates({ ...ready, evidenceCount });
      expect(result.exportBlocked).toBe(true);
      expect(result.blockers.some(blocker => blocker.includes('evidenceCount'))).toBe(true);
    }
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'blocks invalid decision counts (%s)',
    decisionCount => {
      const result = evaluateResearchControlGates({ ...ready, decisionCount });
      expect(result.exportBlocked).toBe(true);
      expect(result.blockers.some(blocker => blocker.includes('decisionCount'))).toBe(true);
    }
  );

  it.each([-0.1, 100.1, Number.NaN, Number.POSITIVE_INFINITY])(
    'blocks invalid evidence coverage (%s)',
    evidenceCoverage => {
      const result = evaluateResearchControlGates({
        ...ready,
        claimsCount: 1,
        evidenceCount: 1,
        evidenceCoverage
      });
      expect(result.exportBlocked).toBe(true);
      expect(result.blockers.some(blocker => blocker.includes('Evidence coverage must'))).toBe(true);
    }
  );

  it('blocks export when claims exist but coverage or evidence counts are unknown', () => {
    const result = evaluateResearchControlGates({ ...ready, claimsCount: 1 });
    expect(result.exportBlocked).toBe(true);
    expect(result.blockers).toContain('Evidence count is not recorded for the declared claims.');
    expect(result.blockers).toContain('Evidence coverage is not recorded for the declared claims.');
  });

  it('blocks export when review status is missing', () => {
    const result = evaluateResearchControlGates({
      methodologyReady: true,
      evidenceReady: true,
      decisionTraceable: true
    } as typeof ready);
    expect(result.exportBlocked).toBe(true);
    expect(result.reviewRequired).toBe(true);
  });

  it('blocks export when explicit source or decision counts are zero', () => {
    expect(evaluateResearchControlGates({ ...ready, sourcesCount: 0 }).exportBlocked).toBe(true);
    expect(evaluateResearchControlGates({ ...ready, decisionCount: 0 }).exportBlocked).toBe(true);
  });

  it('blocks export when evidence coverage is below 80 percent', () => {
    const result = evaluateResearchControlGates({
      ...ready,
      claimsCount: 2,
      evidenceCount: 2,
      evidenceCoverage: 79
    });
    expect(result.exportBlocked).toBe(true);
    expect(result.blockers).toContain('Evidence coverage is below the 80% release threshold.');
  });
});
