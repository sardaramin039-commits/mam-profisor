# Phase 12 — Kurdish Academic Language QA

## Changes

- Normalize and bound source text before model calls; blank or overlong text returns a degraded response without calling the model.
- Protect citation markers, author-date citations, DOI, URLs, ISBN/ISSN, dates, percentages, and numeric tokens using exact occurrence counts.
- Discard rewrites that change protected content and return the original text without a score or approval.
- Accept scores only when finite and within 0–100; malformed issue objects are filtered against a type enum and field-size limits.
- Add offline mocked regression coverage and register this spec in CI.

## Acceptance criteria

1. Citation/identifier/date/numeric fragments remain unchanged with the same occurrence count.
2. Any protected-fragment mismatch fails closed to the original input.
3. Missing or invalid scores become null and do not grant model approval.
4. Oversized input is not sent to the model.
5. No new dependencies; source and spec stay below 500 lines.

## Limitations

Protected-token checks do not prove semantic equivalence or grammatical correctness. Scores and issue reports are model suggestions, not an independent measure of Sorani language quality. Human review remains appropriate before publication.
