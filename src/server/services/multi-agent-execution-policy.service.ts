import { createHash } from 'node:crypto';

export type AgentStageStatus = 'succeeded' | 'failed' | 'timed_out' | 'cancelled';
export type HandoffEvidenceProvenance = 'server-verified-fulltext' | 'mixed' | 'none';
export type ConflictResolutionPolicy =
  | 'retain-findings-and-require-human-review'
  | 'no-conflict-reported-not-consensus';

export interface AgentStageReceipt {
  stageId: string;
  agentName: string;
  status: AgentStageStatus;
  attempts: number;
  retryCount: number;
  timeoutMs: number;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  inputFingerprint: string;
  errorCode?: 'timeout' | 'cancelled' | 'stage_failed';
}

export interface AgentStageOutcome<T> {
  status: AgentStageStatus;
  value?: T;
  receipt: AgentStageReceipt;
}

export interface AgentStageOptions<T> {
  stageId: string;
  agentName: string;
  operation: (signal: AbortSignal) => Promise<T>;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
  retrySafe?: boolean;
  inputFingerprint?: string;
}

export interface AgentHandoffInput {
  fromStage: string;
  toStage: string;
  sourceIds: string[];
  citationEligibleSourceIds: string[];
  conflictCount?: number;
}

export interface AgentHandoffManifest {
  fromStage: string;
  toStage: string;
  sourceIds: string[];
  citationEligibleSourceIds: string[];
  evidenceProvenance: HandoffEvidenceProvenance;
  conflictCount: number;
  humanReviewRequired: boolean;
  conflictResolutionPolicy: ConflictResolutionPolicy;
  fingerprint: string;
}

const DEFAULT_STAGE_TIMEOUT_MS = 45_000;
const MAX_STAGE_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 1;

class StageControlError extends Error {
  constructor(readonly stageStatus: 'timed_out' | 'cancelled') {
    super(stageStatus === 'timed_out' ? 'Agent stage timed out.' : 'Agent stage cancelled.');
    this.name = 'StageControlError';
  }
}

export class AgentStageExecutionError extends Error {
  constructor(readonly receipt: AgentStageReceipt) {
    super(`Agent stage "${receipt.stageId}" ${receipt.status}.`);
    this.name = 'AgentStageExecutionError';
  }

  get httpStatus(): number {
    if (this.receipt.status === 'timed_out') return 504;
    if (this.receipt.status === 'cancelled') return 499;
    return 502;
  }
}

export function fingerprintStageInput(value: unknown): string {
  let serialized: string;
  try {
    serialized = JSON.stringify(value) ?? String(value);
  } catch {
    serialized = String(value);
  }
  return createHash('sha256').update(serialized).digest('hex');
}

function finiteBoundedTimeout(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_STAGE_TIMEOUT_MS;
  return Math.max(1, Math.min(MAX_STAGE_TIMEOUT_MS, Math.trunc(value as number)));
}

function isTransientFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|fetch failed|temporarily unavailable|\b(429|502|503|504)\b/iu.test(message);
}

function statusForAbortReason(reason: unknown): 'timed_out' | 'cancelled' {
  const message = reason instanceof Error ? reason.message : String(reason ?? '');
  return /timeout|timed out|deadline exceeded/iu.test(message) ? 'timed_out' : 'cancelled';
}

export class MultiAgentExecutionPolicyService {
  public async execute<T>(options: AgentStageOptions<T>): Promise<AgentStageOutcome<T>> {
    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();
    const timeoutMs = finiteBoundedTimeout(options.timeoutMs);
    const retrySafe = options.retrySafe === true;
    const retryLimit = retrySafe
      ? Math.max(0, Math.min(MAX_RETRIES, Math.trunc(options.maxRetries ?? 0)))
      : 0;
    const inputFingerprint = options.inputFingerprint ||
      fingerprintStageInput({ stageId: options.stageId, agentName: options.agentName });
    let attempts = 0;
    let terminalStatus: AgentStageStatus = 'failed';
    let terminalErrorCode: AgentStageReceipt['errorCode'] = 'stage_failed';
    let successfulValue: T | undefined;

    while (attempts <= retryLimit) {
      if (options.signal?.aborted) {
        terminalStatus = statusForAbortReason(options.signal.reason);
        terminalErrorCode = terminalStatus === 'timed_out' ? 'timeout' : 'cancelled';
        break;
      }

      attempts += 1;
      const localController = new AbortController();
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      let externalAbortHandler: (() => void) | undefined;
      let rejectControl!: (error: Error) => void;
      const control = new Promise<never>((_resolve, reject) => { rejectControl = reject; });

      if (options.signal) {
        externalAbortHandler = () => {
          localController.abort(options.signal?.reason);
          rejectControl(new StageControlError(statusForAbortReason(options.signal?.reason)));
        };
        options.signal.addEventListener('abort', externalAbortHandler, { once: true });
      }

      timeoutHandle = setTimeout(() => {
        localController.abort(new Error('Agent stage timeout'));
        rejectControl(new StageControlError('timed_out'));
      }, timeoutMs);

      try {
        const operation = Promise.resolve().then(() => {
          if (localController.signal.aborted) {
            throw new StageControlError(statusForAbortReason(localController.signal.reason));
          }
          return options.operation(localController.signal);
        });
        successfulValue = await Promise.race([operation, control]);
        terminalStatus = 'succeeded';
        terminalErrorCode = undefined;
        break;
      } catch (error: unknown) {
        if (error instanceof StageControlError) {
          terminalStatus = error.stageStatus;
          terminalErrorCode = terminalStatus === 'timed_out' ? 'timeout' : 'cancelled';
          break;
        }
        terminalStatus = options.signal?.aborted
          ? statusForAbortReason(options.signal.reason)
          : 'failed';
        terminalErrorCode = terminalStatus === 'timed_out'
          ? 'timeout'
          : terminalStatus === 'cancelled' ? 'cancelled' : 'stage_failed';

        if (
          terminalStatus === 'failed' &&
          retrySafe &&
          attempts <= retryLimit &&
          isTransientFailure(error)
        ) {
          continue;
        }
        break;
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (options.signal && externalAbortHandler) {
          options.signal.removeEventListener('abort', externalAbortHandler);
        }
      }
    }

    const finishedAtMs = Date.now();
    const receipt: AgentStageReceipt = {
      stageId: options.stageId,
      agentName: options.agentName,
      status: terminalStatus,
      attempts,
      retryCount: Math.max(0, attempts - 1),
      timeoutMs,
      durationMs: Math.max(0, finishedAtMs - startedAtMs),
      startedAt,
      finishedAt: new Date(finishedAtMs).toISOString(),
      inputFingerprint,
      ...(terminalErrorCode ? { errorCode: terminalErrorCode } : {})
    };
    return {
      status: terminalStatus,
      ...(terminalStatus === 'succeeded' ? { value: successfulValue as T } : {}),
      receipt
    };
  }
}

export function createAgentHandoffManifest(input: AgentHandoffInput): AgentHandoffManifest {
  const sourceIds = [...new Set(input.sourceIds.map(String).map(id => id.trim()).filter(Boolean))].sort();
  const eligible = new Set(
    input.citationEligibleSourceIds.map(String).map(id => id.trim()).filter(Boolean)
  );
  const citationEligibleSourceIds = [...eligible].sort();
  const evidenceProvenance: HandoffEvidenceProvenance = citationEligibleSourceIds.length === 0
    ? 'none'
    : citationEligibleSourceIds.length === sourceIds.length &&
      sourceIds.every(id => eligible.has(id))
      ? 'server-verified-fulltext'
      : 'mixed';
  const conflictCount = Number.isSafeInteger(input.conflictCount) && Number(input.conflictCount) > 0
    ? Math.min(10_000, Number(input.conflictCount))
    : 0;
  const humanReviewRequired = conflictCount > 0;
  const conflictResolutionPolicy: ConflictResolutionPolicy = humanReviewRequired
    ? 'retain-findings-and-require-human-review'
    : 'no-conflict-reported-not-consensus';
  const core = {
    fromStage: input.fromStage,
    toStage: input.toStage,
    sourceIds,
    citationEligibleSourceIds,
    evidenceProvenance,
    conflictCount,
    humanReviewRequired,
    conflictResolutionPolicy
  };
  return { ...core, fingerprint: fingerprintStageInput(core) };
}

export const multiAgentExecutionPolicyService = new MultiAgentExecutionPolicyService();
