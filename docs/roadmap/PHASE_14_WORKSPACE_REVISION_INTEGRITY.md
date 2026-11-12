# Phase 14 — Workspace Revision Integrity

## Implemented

- Introduce a bounded, canonical JSON snapshot format with SHA-256 content hashes.
- Add owner-scoped workspace lookup, expected-version checks, and an explicit atomic compare-and-swap adapter contract.
- Create immutable revision envelopes with owner/workspace IDs, monotonic version, previous hash, current hash, snapshot and timestamp.
- Return a conflict on stale versions or concurrent writes; avoid duplicate revisions when content has not changed.
- Reject oversized, deeply nested, non-finite, cyclic/non-JSON snapshots and dangerous object keys.
- Add mocked regression tests and register them in CI.

## Integration gate

A durable database adapter must implement `appendRevisionAtomically` as a conditional write that updates the workspace version and appends the revision in one transaction. A read-then-write implementation is not sufficient. This policy service does not claim that a database provider or production route is connected until an adapter is wired and tested against the actual persistence provider.
