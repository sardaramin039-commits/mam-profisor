import { createHash, randomUUID } from 'node:crypto';

export interface WorkspaceSnapshotRecord {
  workspaceId: string;
  ownerId: string;
  version: number;
  snapshotHash?: string;
}

export interface WorkspaceRevision {
  revisionId: string;
  workspaceId: string;
  ownerId: string;
  version: number;
  previousRevisionHash: string | null;
  snapshotHash: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface WorkspaceRevisionStore {
  loadWorkspaceForOwner(workspaceId: string, ownerId: string): Promise<WorkspaceSnapshotRecord | null>;
  appendRevisionAtomically(input: {
    workspaceId: string;
    ownerId: string;
    expectedVersion: number;
    revision: WorkspaceRevision;
  }): Promise<'saved' | 'conflict' | 'not_found'>;
}

export type WorkspaceSaveResult =
  | { status: 'saved'; revision: WorkspaceRevision }
  | { status: 'unchanged'; version: number; snapshotHash: string }
  | { status: 'conflict'; currentVersion: number }
  | { status: 'not_found' }
  | { status: 'invalid'; reason: string };

const MAX_SNAPSHOT_BYTES = 1_000_000;
const MAX_DEPTH = 16;
const MAX_NODES = 30_000;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function canonicalize(
  value: unknown,
  state: { nodes: number },
  depth = 0
): unknown {
  state.nodes += 1;
  if (state.nodes > MAX_NODES) throw new Error('snapshot contains too many values');
  if (depth > MAX_DEPTH) throw new Error('snapshot is nested too deeply');

  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('snapshot contains a non-finite number');
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => canonicalize(item, state, depth + 1));
  }
  if (!isPlainObject(value)) throw new Error('snapshot contains a non-JSON object');

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('snapshot contains a forbidden object key');
    const item = value[key];
    if (item === undefined || typeof item === 'function' || typeof item === 'symbol' || typeof item === 'bigint') {
      throw new Error('snapshot contains an unsupported value');
    }
    result[key] = canonicalize(item, state, depth + 1);
  }
  return result;
}

function normalizeId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeWorkspaceSnapshot(value: unknown): {
  snapshot: Record<string, unknown>;
  canonicalJson: string;
  snapshotHash: string;
} {
  if (!isPlainObject(value)) throw new Error('snapshot must be a plain object');
  const canonical = canonicalize(value, { nodes: 0 }) as Record<string, unknown>;
  const canonicalJson = JSON.stringify(canonical);
  if (Buffer.byteLength(canonicalJson, 'utf8') > MAX_SNAPSHOT_BYTES) {
    throw new Error('snapshot exceeds the 1 MB size limit');
  }
  return {
    snapshot: JSON.parse(canonicalJson) as Record<string, unknown>,
    canonicalJson,
    snapshotHash: createHash('sha256').update(canonicalJson).digest('hex')
  };
}

export class WorkspaceRevisionLedgerService {
  public async saveRevision(
    command: {
      workspaceId: string;
      actorId: string;
      expectedVersion: number;
      snapshot: unknown;
      createdAt?: string;
    },
    store: WorkspaceRevisionStore
  ): Promise<WorkspaceSaveResult> {
    const workspaceId = normalizeId(command.workspaceId);
    const actorId = normalizeId(command.actorId);
    if (!workspaceId || workspaceId.length > 160 || !actorId || actorId.length > 160) {
      return { status: 'invalid', reason: 'workspaceId and actorId are required and must be bounded.' };
    }
    if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
      return { status: 'invalid', reason: 'expectedVersion must be a non-negative safe integer.' };
    }

    let normalized: ReturnType<typeof normalizeWorkspaceSnapshot>;
    try {
      normalized = normalizeWorkspaceSnapshot(command.snapshot);
    } catch (error: unknown) {
      return {
        status: 'invalid',
        reason: error instanceof Error ? error.message : 'snapshot is not valid JSON data.'
      };
    }

    const current = await store.loadWorkspaceForOwner(workspaceId, actorId);
    if (!current || current.workspaceId !== workspaceId || current.ownerId !== actorId) {
      return { status: 'not_found' };
    }
    if (!Number.isSafeInteger(current.version) || current.version < 0) {
      return { status: 'invalid', reason: 'stored workspace version is invalid.' };
    }
    if (current.version !== command.expectedVersion) {
      return { status: 'conflict', currentVersion: current.version };
    }
    if (current.snapshotHash === normalized.snapshotHash) {
      return { status: 'unchanged', version: current.version, snapshotHash: normalized.snapshotHash };
    }

    const revision: WorkspaceRevision = {
      revisionId: randomUUID(),
      workspaceId,
      ownerId: actorId,
      version: current.version + 1,
      previousRevisionHash: current.snapshotHash || null,
      snapshotHash: normalized.snapshotHash,
      snapshot: normalized.snapshot,
      createdAt: command.createdAt && !Number.isNaN(Date.parse(command.createdAt))
        ? new Date(command.createdAt).toISOString()
        : new Date().toISOString()
    };

    const saved = await store.appendRevisionAtomically({
      workspaceId,
      ownerId: actorId,
      expectedVersion: current.version,
      revision
    });
    if (saved === 'conflict') {
      return { status: 'conflict', currentVersion: current.version };
    }
    if (saved === 'not_found') return { status: 'not_found' };
    return { status: 'saved', revision };
  }
}

export const workspaceRevisionLedgerService = new WorkspaceRevisionLedgerService();
