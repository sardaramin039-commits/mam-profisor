import { describe, expect, it } from 'vitest';
import { evaluateResearchControlGates } from './research-validation-policy';

describe('research validation export gate', () => {
  it('blocks export when methodology is missing', () => {
    expect(evaluateResearchControlGates({
      methodologyReady: false,
      evidenceReady: true,
      decisionTraceable: true,
      reviewRequired: false
    }).exportBlocked).toBe(true);
  });

  it('blocks export when evidence is missing', () => {
    expect(evaluateResearchControlGates({
      methodologyReady: true,
      evidenceReady: false,
      decisionTraceable: true,
      reviewRequired: false
    }).exportBlocked).toBe(true);
  });

  it('blocks export when decisions are not traceable', () => {
    expect(evaluateResearchControlGates({
      methodologyReady: true,
      evidenceReady: true,
      decisionTraceable: false,
      reviewRequired: false
    }).exportBlocked).toBe(true);
  });

  it('blocks export while review is required', () => {
    expect(evaluateResearchControlGates({
      methodologyReady: true,
      evidenceReady: true,
      decisionTraceable: true,
      reviewRequired: true
    }).exportBlocked).toBe(true);
  });

  it('allows export only when every gate is satisfied', () => {
    expect(evaluateResearchControlGates({
      methodologyReady: true,
      evidenceReady: true,
      decisionTraceable: true,
      reviewRequired: false
    }).exportBlocked).toBe(false);
  });
});
