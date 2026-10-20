import { describe, expect, it, vi } from 'vitest';
import {
  normalizeWorkspaceSnapshot,
  WorkspaceRevisionLedgerService,
  type WorkspaceRevisionStore
} from './workspace-revision-ledger.service';

function makeStore(overrides: Partial<WorkspaceRevisionStore> = {}) {
  const current = {
    workspaceId: 'ws-1',
    ownerId: 'user-1',
    version: 2,
    snapshotHash: 'previous-hash'
  };
  const store: WorkspaceRevisionStore = {
    loadWorkspaceForOwner: vi.fn(async () => current),
    appendRevisionAtomically: vi.fn(async () => 'saved'),
    ...overrides
  };
  return { store, current };
}

describe('workspace revision ledger integrity', () => {
  it('canonicalizes object key order so equivalent snapshots produce the same hash', () => {
    const first = normalizeWorkspaceSnapshot({ b: 2, a: { y: true, x: 1 } });
    const second = normalizeWorkspaceSnapshot({ a: { x: 1, y: true }, b: 2 });
    expect(first.canonicalJson).toBe(second.canonicalJson);
    expect(first.snapshotHash).toBe(second.snapshotHash);
  });

  it('stores an immutable next revision linked to the previous snapshot hash', async () => {
    const { store } = makeStore();
    const result = await new WorkspaceRevisionLedgerService().saveRevision({
      workspaceId: 'ws-1',
      actorId: 'user-1',
      expectedVersion: 2,
      snapshot: { title: 'Updated', chapters: ['one', 'two'] },
      createdAt: '2026-10-20T04:00:00.000Z'
    }, store);
    expect(result.status).toBe('saved');
    if (result.status !== 'saved') return;
    expect(result.revision).toMatchObject({
      workspaceId: 'ws-1',
      ownerId: 'user-1',
      version: 3,
      previousRevisionHash: 'previous-hash',
      createdAt: '2026-10-20T04:00:00.000Z'
    });
    expect(result.revision.snapshotHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(store.appendRevisionAtomically).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: 2,
      revision: expect.objectContaining({ version: 3 })
    }));
  });

  it('does not reveal whether a workspace belongs to another user', async () => {
    const { store } = makeStore({
      loadWorkspaceForOwner: vi.fn(async () => null)
    });
    const result = await new WorkspaceRevisionLedgerService().saveRevision({
      workspaceId: 'ws-private',
      actorId: 'attacker',
      expectedVersion: 2,
      snapshot: { title: 'test' }
    }, store);
    expect(result).toEqual({ status: 'not_found' });
    expect(store.appendRevisionAtomically).not.toHaveBeenCalled();
  });

  it('rejects stale versions and delegates atomic compare-and-swap to the adapter', async () => {
    const { store, current } = makeStore();
    current.version = 5;
    const result = await new WorkspaceRevisionLedgerService().saveRevision({
      workspaceId: 'ws-1', actorId: 'user-1', expectedVersion: 4, snapshot: { title: 'latest?' }
    }, store);
    expect(result).toEqual({ status: 'conflict', currentVersion: 5 });
    expect(store.appendRevisionAtomically).not.toHaveBeenCalled();
  });

  it('does not append a revision for an identical snapshot', async () => {
    const existing = normalizeWorkspaceSnapshot({ title: 'same' });
    const { store } = makeStore({
      loadWorkspaceForOwner: vi.fn(async () => ({
        workspaceId: 'ws-1', ownerId: 'user-1', version: 2, snapshotHash: existing.snapshotHash
      }))
    });
    const result = await new WorkspaceRevisionLedgerService().saveRevision({
      workspaceId: 'ws-1', actorId: 'user-1', expectedVersion: 2, snapshot: { title: 'same' }
    }, store);
    expect(result.status).toBe('unchanged');
    expect(store.appendRevisionAtomically).not.toHaveBeenCalled();
  });

  it('rejects prototype-pollution keys, circular/non-JSON values, and oversized payloads', async () => {
    const polluted = JSON.parse('{"__proto__":{"polluted":true}}');
    expect(() => normalizeWorkspaceSnapshot(polluted)).toThrow(/forbidden/u);
    expect(() => normalizeWorkspaceSnapshot({ value: Number.NaN })).toThrow(/non-finite/u);
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    expect(() => normalizeWorkspaceSnapshot(cyclic)).toThrow();
    expect(() => normalizeWorkspaceSnapshot({ body: 'x'.repeat(1_000_001) })).toThrow(/1 MB/u);
  });

  it('fails closed when the atomic adapter reports a concurrent write', async () => {
    const { store } = makeStore({
      appendRevisionAtomically: vi.fn(async () => 'conflict')
    });
    const result = await new WorkspaceRevisionLedgerService().saveRevision({
      workspaceId: 'ws-1', actorId: 'user-1', expectedVersion: 2, snapshot: { title: 'race' }
    }, store);
    expect(result.status).toBe('conflict');
  });

  it('validates a non-negative safe integer version', async () => {
    const { store } = makeStore();
    const result = await new WorkspaceRevisionLedgerService().saveRevision({
      workspaceId: 'ws-1', actorId: 'user-1', expectedVersion: -1, snapshot: {}
    }, store);
    expect(result.status).toBe('invalid');
    expect(store.loadWorkspaceForOwner).not.toHaveBeenCalled();
  });
});
