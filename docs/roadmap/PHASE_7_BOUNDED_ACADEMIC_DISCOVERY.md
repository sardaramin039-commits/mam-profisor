# Phase 7 — Bounded Academic Discovery

## Changes

- Normalize search input with Unicode NFKC normalization, whitespace cleanup, and a 500-character ceiling.
- Reject blank/oversized input before external provider requests.
- Clamp per-provider result limits to 1–50 and apply the same bounded limit semantics to unified search.
- Preserve the distinction between search discovery metadata and full-text source verification: returned search results are candidate records, not verified citation evidence.
- Add offline mocked regression tests for invalid input, Unicode/whitespace normalization, and result-limit boundaries; include the suite in CI.

## Acceptance criteria

1. No provider request is sent for blank or overlong queries.
2. Each external provider receives an integer result limit between 1 and 50.
3. Non-finite limits use the method's documented default; negative values clamp to 1.
4. Existing DOI/ISBN deduplication and distinct-author preservation behavior remains covered by the existing spec.
5. No new dependencies or live API credentials are required for the regression tests.

## Limitations

This is request and resource bounding, not proof of provider uptime or source accuracy. Provider outages still produce an empty result list at the current service boundary, so callers must not interpret an empty result as proof that no scholarly works exist.
