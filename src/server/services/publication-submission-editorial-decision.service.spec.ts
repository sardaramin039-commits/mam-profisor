import { describe, expect, it } from 'vitest';
import {
  buildEditorialDecision
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
});
