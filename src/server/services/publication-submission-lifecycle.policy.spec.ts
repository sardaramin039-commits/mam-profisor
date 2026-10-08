import { describe, expect, it } from 'vitest';
import {
  allowedNextStatuses,
  canTransition,
  initialSubmissionStatus,
  isTerminalSubmissionStatus
} from './publication-submission-lifecycle.policy';

describe('P15 submission lifecycle policy', () => {
  it('allows the valid ready-to-submitted path', () => {
    expect(canTransition('READY', 'SUBMITTED').allowed).toBe(true);
    expect(canTransition('SUBMITTED', 'UNDER_REVIEW').allowed).toBe(true);
    expect(canTransition('UNDER_REVIEW', 'REVISION_REQUESTED').allowed).toBe(true);
    expect(canTransition('REVISION_REQUESTED', 'RESUBMITTED').allowed).toBe(true);
  });

  it('does not allow DRAFT to become READY without the integrity gate', () => {
    expect(canTransition('DRAFT', 'READY').allowed).toBe(false);
  });

  it('rejects impossible terminal-state transitions', () => {
    expect(canTransition('ACCEPTED', 'SUBMITTED').allowed).toBe(false);
    expect(canTransition('REJECTED', 'UNDER_REVIEW').allowed).toBe(false);
    expect(canTransition('WITHDRAWN', 'READY').allowed).toBe(false);
  });

  it('does not accept a no-op transition', () => {
    expect(canTransition('READY', 'READY').allowed).toBe(false);
  });

  it('marks only final statuses as terminal', () => {
    expect(isTerminalSubmissionStatus('ACCEPTED')).toBe(true);
    expect(isTerminalSubmissionStatus('REJECTED')).toBe(true);
    expect(isTerminalSubmissionStatus('WITHDRAWN')).toBe(true);
    expect(isTerminalSubmissionStatus('UNDER_REVIEW')).toBe(false);
  });

  it('derives initial status from P14 readiness', () => {
    expect(initialSubmissionStatus(true)).toBe('READY');
    expect(initialSubmissionStatus(false)).toBe('DRAFT');
  });

  it('exposes only the next valid statuses', () => {
    expect(allowedNextStatuses('READY')).toEqual(['SUBMITTED', 'DRAFT', 'WITHDRAWN']);
  });
});
