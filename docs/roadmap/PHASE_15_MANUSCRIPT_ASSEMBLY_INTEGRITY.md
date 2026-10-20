# Phase 15 — Manuscript Assembly Integrity

## Implemented

- Add deterministic section ordering and unique section IDs/order checks before export.
- Reject empty sections, unresolved TODO/TBD/placeholder text, oversized manuscripts, and citation IDs missing from a caller-supplied verified-citation set.
- Produce a stable SHA-256 content fingerprint only when no blocking issue exists.
- Report word count and a clearly labeled planning estimate of pages at 350 words per page; this estimate is not a promise of final page layout.
- Deduplicate repeated citation IDs with a warning; add regression tests and CI registration.

## Integration boundary

The caller must supply citation IDs that have already passed the evidence/citation verification policy. This validator cannot independently verify scholarly truth and must be wired into export/assembly handlers before it becomes a production release gate.
