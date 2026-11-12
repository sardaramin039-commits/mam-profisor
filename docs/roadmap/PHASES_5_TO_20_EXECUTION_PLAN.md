# Mam Professor: Phases 5–20 Execution Roadmap

This roadmap is an ordered engineering sequence, not a statement that the listed capabilities are already complete. Each phase must be implemented on its own branch, reviewed against its acceptance criteria, and merged only after its current-head CI and preservation gates pass. Existing code is reused where it is sound; duplicate implementations and fabricated completion signals are not acceptable.

| Phase | Focus | Required outcome / release gate |
|---|---|---|
| 5 | Server-owned evidence pipeline | Caller-supplied text and provenance cannot become trusted evidence; verified server evidence is actually connected to grounded generation. |
| 6 | Provider adapters and source identity | Normalize DOI, ISBN, ISSN, PMID/PMCID and OpenAlex identifiers; enforce timeouts, bounded retries, provider-specific errors, and match thresholds. |
| 7 | Research discovery | Make discovery provider-backed and traceable; distinguish search-result metadata, abstract/snippet, and retrieved full text. No result may be called verified because it ranked highly. |
| 8 | Research validation | Apply one consistent validation policy to sources, claims, methodology, decisions, and export readiness; expose blockers rather than silently downgrading them. |
| 9 | Evidence synthesis | Preserve source-to-claim-to-quote links, track uncertainty and contradictions, and prevent unsupported paraphrases from receiving citations. |
| 10 | Citation styles | Audit APA 7, MLA 9, Chicago Author–Date, Chicago Notes–Bibliography, Harvard, and IEEE against style-specific examples and missing metadata. |
| 11 | Academic writing pipeline | Separate outline, draft, revision, and evidence validation; preserve user constraints and report unsupported claims instead of inventing material. |
| 12 | Scholarly prose and Kurdish quality | Improve Sorani/Arabic-script normalization, academic register, terminology consistency, and language-specific quality checks without claiming prose is undetectably AI-written. |
| 13 | Reviewer and contradiction analysis | Make review findings reproducible, severity-coded, evidence-linked, and actionable; do not invent scores or claim peer review occurred. |
| 14 | Research workspace and persistence | Verify ownership, access control, durable persistence, version history, and explicit failure responses for research state and decisions. |
| 15 | Manuscript assembly | Link chapters, citations, tables, figures, and evidence manifests; preserve heading hierarchy and deterministic export requirements. |
| 16 | Methods and statistical lab | Validate inputs, disclose assumptions, distinguish computed statistics from generated interpretation, and attach reproducible calculations and limitations. |
| 17 | Multi-agent orchestration | Define typed handoffs, bounded retries, cancellation/timeouts, provenance preservation, and conflict-resolution rules across specialist agents. |
| 18 | Defense and publication lifecycle | Validate submission/version receipts, reviewer revisions, defense rehearsals, and readiness gates without simulating a successful external submission. |
| 19 | Security, accessibility, and performance | Recheck auth boundaries, SSRF, rate limits, secrets, dependency exposure, RTL/mobile accessibility, loading/error states, and resource ceilings. |
| 20 | Release certification | Require current-head CI, release verification artifact, dependency risk review, migration/backup review, and explicit human production smoke checks. |

## Shared quality gates

- Keep every modified source file under 500 lines; split modules instead of expanding oversized components.
- Do not update dependencies as incidental cleanup; review lockfile and advisories separately.
- Do not claim external-provider, database, deployment, or manual end-to-end success from static checks alone.
- Run the repository's CI regression suite on the pull request; merge only if the exact head SHA is current, required checks are green, and the PR is mergeable.
- Keep known blockers visible. A blocked gate is a useful result, not a reason to bypass verification.
