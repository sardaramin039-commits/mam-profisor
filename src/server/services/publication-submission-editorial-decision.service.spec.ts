import { describe, expect, it } from 'vitest';
import {
  buildEditorialDecision,
  buildRevisionPlan
} from './publication-submission-editorial-decision.service';

const version = 'a'.repeat(64);

describe('P20 editorial decision management', () => {
  const base = {
    submissionId: 'SUB-1',
    userId: 'USER-1',
    workspaceId: 'WS-1',
    decisionType: 'ACCEPT' as const,
    resultingStatus: 'ACCEPTED' as const,
    submissionVersionId: version,
    note: 'Accepted after editorial review.',
    lifecycleVersion: 4,
    decidedAt: '2026-10-08T16:00:00.000Z'
  };

  it('builds deterministic immutable editorial decisions', () => {
    const first = buildEditorialDecision(base);
    const second = buildEditorialDecision(base);
    expect(first.id).toBe(second.id);
    expect(first.immutableHash).toBe(second.immutableHash);
  });

  it('changes the immutable identity when the bound version changes', () => {
    const first = buildEditorialDecision(base);
    const second = buildEditorialDecision({
      ...base,
      submissionVersionId: 'b'.repeat(64)
    });
    expect(first.id).not.toBe(second.id);
    expect(first.immutableHash).not.toBe(second.immutableHash);
  });

  it('rejects decisions without a version binding', () => {
    expect(() => buildEditorialDecision({
      ...base,
      submissionVersionId: 'invalid'
    })).toThrow(/version binding/i);
  });

  it('requires a reason or external reference', () => {
    expect(() => buildEditorialDecision({
      ...base,
      note: ''
    })).toThrow(/note or external reference/i);
  });
  
  it('rejects a mismatched decision result', () => {
    expect(() => buildEditorialDecision({
      ...base,
      decisionType: 'REJECT',
      resultingStatus: 'ACCEPTED'
    })).toThrow(/does not match/i);
  });

  it('builds a structured revision plan bound to the current version', () => {
    const plan = buildRevisionPlan(
      'DEC-1',
      'SUB-1',
      'VER-1',
      'MAJOR',
      [{
        title: 'Clarify methodology',
        details: 'Add sampling and analysis details.',
        scope: 'SECTION',
        required: true
      }],
      '2026-10-08T16:00:00.000Z'
    );
    expect(plan.submissionVersionId).toBe('VER-1');
    expect(plan.tasks).toHaveLength(1);
    expect(plan.tasks[0].status).toBe('OPEN');
    expect(plan.planHash).toMatch(/^[a-f0-9]{64}$/u);
  });
});
