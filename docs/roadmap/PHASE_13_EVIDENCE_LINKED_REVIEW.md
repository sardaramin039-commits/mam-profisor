# Phase 13 — Evidence-Linked Contradiction Review

## Changes

- Only pass claims into contradiction analysis when the claim is marked verified, its quote appears in a unique server-verified full-text source, its evidence ID and source ID are present, and synthetic citations are not blocked.
- Require source identity, evidence verification, full-text type, server-owned provenance and explicit existence verification on each source.
- Bind an AI-proposed finding to a unique claim only when both its reference and normalized full claim text match; source ID alone no longer selects an arbitrary claim.
- Bound topic, claims, source lists, finding count and model-returned text; malformed output fails closed.
- Add offline regression tests and register them in CI.

## Acceptance criteria

1. Unsupported, fabricated or unverified claims do not reach the model as grounded contradiction candidates.
2. A finding is retained only when both exact claims and their unique source references match eligible data.
3. Provider failure or malformed response returns `insufficient_evidence`, not an assertion that no contradiction exists.
4. No new dependencies; service and spec remain below 500 lines.

## Limitations

A supported finding means the two claim records and their evidence links passed deterministic checks; it does not mean the contradiction is semantically certain. A qualified researcher must determine whether the claims truly conflict after considering population, methods, context and study limitations.
