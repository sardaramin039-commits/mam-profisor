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