# P10 — Manuscript Assembly & Export Contract

P10 turns the research workspace into a deterministic manuscript package.

## Pipeline

Workspace chapters and research metadata are assembled into ordered manuscript sections. Only citations explicitly referenced by chapters and marked verified are included in the manuscript bibliography.

The assembly layer also rejects:
- duplicate chapter identifiers;
- duplicate or non-contiguous chapter order;
- empty chapters;
- missing referenced citations;
- referenced citations that are not verified.

## Protected endpoint

`POST /api/manuscript/:workspaceId/assemble`

The endpoint first reads the research control plane. Manuscript assembly is considered export-ready only when the control-plane gates pass and the manuscript structural integrity status is `PASS`.

A rejected manuscript returns HTTP `409` and includes both the control-plane state and deterministic manuscript integrity report.

The implementation is split into:
- `src/server/services/manuscript-assembly.service.ts`
- `src/server/services/manuscript-assembly.service.spec.ts`
- `src/server/routes/manuscript-assembly.routes.ts`

The manuscript fingerprint is a SHA-256 digest of the assembled sections, included verified citations, bibliography, project identity, and structural status. The fingerprint is an integrity identifier, not proof of academic correctness.
## Integrated hardening
P10 no longer trusts the client's verified citation flag. Before assembly, the server resolves each referenced citation against P7 memory and marks it verified only when a matching server-recorded evidence item exists with verified: true and the same sourceId.

A structurally valid, gate-approved manuscript is persisted under the authenticated user's research manuscript workspace with its SHA-256 fingerprint and persistence timestamp. A persistence failure returns a fail-closed 503 instead of claiming a successful export.
