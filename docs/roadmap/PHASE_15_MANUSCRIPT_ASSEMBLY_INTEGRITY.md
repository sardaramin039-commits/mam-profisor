# Phase 15 — Manuscript Assembly Integrity

## Implemented

- Validate the complete manuscript section set (abstract, research question, methodology, chapters, and conclusion) in the authenticated assembly endpoint before persistence/export.
- Enforce non-empty sections, unique section identifiers/order values, unresolved placeholder rejection, and the one-million-character / 250-section limits.
- Permit citation IDs only when the API resolves their evidence ID and source ID against the current user's server-owned research memory; ignore the caller's `verified` boolean as proof.
- Expose structured integrity findings in the API response and fail closed with HTTP 409 when a blocker is present.
- Produce a stable SHA-256 content fingerprint only when no blocking issue exists and report word count plus a planning-only page estimate at 350 words/page.
- Add unit and route regression coverage, registered in `npm run test:server`.

## Release boundary

This gate blocks assembly/persistence through the manuscript API when integrity validation fails. It does not prove the claims are scientifically true, replace independent citation review, or certify the rendered layout. Production acceptance still depends on the exact-head CI workflow. No dependency changes are needed.
