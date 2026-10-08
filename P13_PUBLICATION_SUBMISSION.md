# P13 — Publication Submission Package

P13 prepares a manuscript for a journal or publication workflow using a journal-specific policy supplied by the user.

## Deterministic checks

1. Journal identity and manuscript integrity.
2. Required sections.
3. Total word limit and abstract word limit.
4. Minimum and maximum keyword counts.
5. Maximum reference count.
6. Author metadata requirements.
7. Cover-letter requirement.
8. Blinded-review separation: author title-page metadata is omitted from the main package when requested.

Status values are `READY`, `REVISE`, and `BLOCKED`.

## API

`POST /api/publication-submission/:workspaceId/build`

The endpoint requires authentication and accepts the manuscript, publication policy, keywords and author metadata.

The application does not hard-code a journal's current submission rules. Current journal requirements must be supplied or verified from the journal itself before submission.

Implementation:
`src/server/services/publication-submission.service.ts`
`src/server/services/publication-submission.service.spec.ts`
`src/server/routes/publication-submission.routes.ts`
## Integrated hardening
P13 submission packages are now built only after the authenticated P9 research gate is checked. Citation verification is resolved from server-side P7 evidence before the manuscript is passed into the submission package builder. A blocked research state returns a blocked submission response rather than a misleading ready package.
