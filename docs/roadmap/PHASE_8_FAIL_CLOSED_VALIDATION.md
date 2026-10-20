# Phase 8 — Fail-Closed Research Validation Gates

## Changes

- Validate supplied source/claim/evidence/decision counts as finite, non-negative safe integers.
- Reject evidence coverage values outside the 0–100 range, including non-finite values, instead of clamping invalid values into a passable percentage.
- When a positive claim count is supplied, require explicit evidence count and coverage metrics; block export for zero evidence or coverage below 80%.
- Treat unknown review state as a blocker; explicit zero source/decision counts also block readiness.
- Expand the validation policy regression spec and register it in the CI server-regression suite.

## Acceptance criteria

1. Invalid metrics produce explicit blockers and can never lead to `readyForManuscript=true`.
2. A valid, fully gated input can still pass.
3. Existing base gate behavior for explicit missing methodology, evidence, traceability, and required review remains blocking.
4. The policy has no external dependencies and all modified files remain under 500 lines.

## Limitations

The gate validates the consistency of supplied metrics; it does not independently calculate claim-evidence coverage or prove that a human reviewer actually completed a review. Callers must source these fields from the persisted research evidence system, not model-generated self-reports.
