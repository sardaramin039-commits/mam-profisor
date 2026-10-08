# P11 — Publication & Defense Readiness

P11 adds a deterministic readiness layer after manuscript assembly.

## Publication readiness

The system checks title, chapter presence, manuscript structural integrity, export state, methodology, citation verification, bibliography coverage, abstract, research question, conclusion, QA score and critical violations.

Status values are `READY`, `REVISE`, or `BLOCKED`.

`READY` means the package passed this application's internal readiness policy. It is not a journal acceptance decision, peer-review outcome, accreditation, or guarantee of publication.

## Defense readiness

The system prepares five structured defense questions covering research question, methodology, evidence, limitations and contribution. It does not invent empirical results or sources.

## API

`POST /api/publication-defense/:workspaceId/readiness`

The endpoint is protected by authentication and also validates the manuscript structure before returning readiness.

Implementation:
`src/server/services/publication-defense-readiness.service.ts`
`src/server/services/publication-defense-readiness.service.spec.ts`
`src/server/routes/publication-defense-readiness.routes.ts`
## Integrated hardening
P11 now reads the authenticated P9 research control-plane before reporting publication or defense readiness. The route resolves citation verification from server-side P7 research memory and does not trust client-provided verification flags or exportBlocked status. A blocked P9 research state keeps publication readiness blocked.

The readiness service itself remains deterministic; it does not claim journal acceptance, committee approval, or academic correctness. QA data from another subsystem must not be presented as independently recomputed by P11 unless it is explicitly supplied and verified by the server.
