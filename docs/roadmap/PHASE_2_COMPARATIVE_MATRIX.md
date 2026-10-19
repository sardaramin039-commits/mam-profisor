# Phase 2 — Comparative Matrix: Current Baseline vs. Mam Professor Target

**Repository:** `sardaramin039-commits/mam-profisor`  
**Baseline commit:** `ca8256939178201891170d0d5250aaaf73ecf3d4` (merged PR #35; secure Express API and Angular SSR restoration)  
**Assessment date:** 2026-10-19  
**Purpose:** Turn the product vision into an evidence-based gap register and measurable acceptance criteria. This is a static repository review, not a claim that production runtime, security, or academic quality has been independently certified.

## How to read this matrix

- **Observed** means the named file/configuration exists in the baseline or its behavior is explicitly visible in code.
- **Partial / needs proof** means implementation exists but end-to-end behavior, coverage, deployment configuration, or independent validation has not yet been demonstrated.
- **Gap** means a concrete target is not yet sufficiently evidenced.
- **Priority:** P0 = blocks a trustworthy production release; P1 = core academic/research quality; P2 = product quality and maintainability.
- Do not mark a row complete solely because a class, route, test file, or UI exists. Completion requires the listed acceptance evidence.

## Executive summary

The baseline has a meaningful foundation: Angular SSR/Express entry points, many server route modules, auth and validation middleware, database configuration/schema, a locked npm dependency graph, static release checks, academic-integrity guardrails, and evidence/source-verification services.

The key remaining risks are not solved by adding more features. They are proving the whole request path is secure; verifying scholarly sources and claim-to-evidence relationships without overstating what a static heuristic proves; exercising persistence and provider integrations against real test doubles or staging services; understanding the npm advisories before making safe upgrades; and validating the user-facing Kurdish/RTL workflows in a browser.

## Comparative matrix

| Area | Current baseline evidence | Target state | Gap / risk to resolve | Priority | Acceptance evidence |
|---|---|---|---|---|---|
| Application/runtime architecture | `src/server.ts`, `src/main.server.ts`, `angular.json`, `package.json`; SSR production build passed in CI before PR #35 was merged | One reproducible development and production runtime; browser and server bundles resolve correctly | Post-merge CI must pass on the actual `main` merge commit; live startup and health behavior still need deployment-level proof | P0 | Main-commit CI green; staging server starts; health/readiness checks pass; browser navigation and API smoke tests pass |
| API route inventory | Express routers are mounted in `src/server.ts`; multiple route modules and route specs exist | Every route is inventoried by method, path, auth requirement, rate limit, validation schema, data sensitivity, and owner | A route file or a mounted router does not prove each endpoint has the correct authorization guard | P0 | Generated/maintained route inventory; automated unauthenticated, wrong-role, invalid-input, and allowed-role tests for each sensitive route |
| Authentication and authorization | `src/middleware/auth.ts`, `src/server/middleware/rbac.middleware.ts`, auth/security specs; selected routers are mounted behind `requireAuth` | Consistent server-enforced identity and least-privilege access for all private data and actions | Verify all library, AI, workspace, manuscript, publication, export, and research-state endpoints individually; confirm token verification and role mapping in the actual deployment | P0 | Negative and positive route-level tests; no client/localStorage-only authorization; authorization matrix reviewed |
| CORS, headers, proxy and request limits | `src/server/middleware/security.middleware.ts`; `TRUST_PROXY` opt-in; explicit allowed-origin configuration; bounded JSON body sizes | Deployment-specific exact-origin allowlist, correct proxy trust, secure cookies/session policy where used, bounded payloads and uploads | Deployment variables and real hosting topology are not verified by repository CI; confirm preflight and origin behavior in staging | P0 | Tests for allowed/disallowed origins, OPTIONS, spoofed forwarding headers, oversized JSON/OCR payloads; deployment configuration reviewed |
| Secret management | `.env.example` lists Gemini, provider, app URL, and SQL variables; no secret values should be committed | Required secrets validated at startup and injected only through host secret management | Ensure every required variable is documented, validated, and absent from Git history/logs; configure secrets in the actual host | P0 | Secret scan clean; startup fails clearly for missing required secrets; staging confirms providers initialize without exposing credentials |
| Database and migrations | `src/db/index.ts`, `src/db/schema.ts`, `src/db/users.ts`, `src/db/drizzle.config.ts`; `db:migrate` script | Versioned, repeatable migrations; least-privilege runtime account; safe migration/backfill/rollback plan; persistence across restarts | CI has not demonstrated a clean database migration and real persistence round trip; SQL credentials/permissions are environment-specific | P0 | Ephemeral PostgreSQL integration job; migration from empty DB; migration from previous schema; CRUD and restart persistence tests |
| Dependency security | `package-lock.json`, Dependabot config, CI `npm ci`; earlier install output reported 19 advisories (2 critical, 11 high, 6 moderate) | Each advisory is tied to package, severity, affected range, reachability, and a safe upgrade plan | Exact current advisory inventory and available fixes must be captured; do not auto-apply breaking upgrades without CI and review | P0 | Detailed audit artifact; direct/transitive package ownership; fixes applied in reviewed groups; production build and relevant tests green |
| Build and release gates | `scripts/release-readiness-check.mjs`, `scripts/verify-file-line-limits.mjs`, `scripts/anti-hallucination-audit.mjs`, `scripts/release-smoke-check.mjs`; CI runs typecheck and production build | Main-commit CI gates cover code, security-sensitive behavior, tests, assets, and release configuration | Current static academic audit is focused on one client file; smoke check validates emitted artifacts, not live HTTP behavior; post-merge run is required | P0 | Green CI on current main SHA; integration/security tests; staging HTTP smoke tests; retained logs/artifacts |
| Test strategy | Route/service specs exist; `test` and `test:server` scripts are defined | Fast unit tests, route contract tests, database/provider integration tests, and browser E2E tests run in CI | Existing CI workflow does not currently run the test or lint scripts; do not imply test coverage from their existence | P0 | CI test job runs deterministic tests; coverage report and explicit minimums; no skipped critical security tests |
| Source identity and metadata | `src/server/services/source-verification.service.ts`, provider helpers, citation intelligence and verification specs | DOI/ISBN/ISSN, title, authors, year, venue, and publisher checked against authoritative provider records with conflicts surfaced | Metadata matching and provider availability need adversarial tests; a lookup result alone does not establish that a source supports a particular claim | P1 | Fixtures for exact, near-match, missing, conflicting, malformed, and fabricated references; provider provenance and timestamps shown |
| Claim-to-evidence verification | `src/server/services/evidence-verification-policy.ts` and full-text evidence service; citation eligibility requires server-retrieved full text and a matching claim | Each important claim is linked to a traceable passage, page/section, source identity, retrieval provenance, and transparent verification method | The current normalized substring check is a narrow exact-match heuristic, not semantic proof of entailment or scientific truth; UI/API must describe it honestly | P0 | Tests for paraphrase, negation, contradictory evidence, partial match, language variation, and absent text; statuses distinguish metadata-verified, text-matched, and expert-reviewed |
| Full-text provenance | `src/server/services/full-text-evidence.service.ts` is used to distinguish server-retrieved text from user-supplied text | Only content retrieved through a trusted, traceable server path can receive server-verified provenance | Verify provenance cannot be forged through serialized request fields, cache reuse, or cross-user state; preserve license/robots constraints | P0 | Forged-provenance tests; source URL, retrieval time, content hash, page/chunk locator, and access-policy audit |
| Citation formatting | Citation intelligence and style-related services exist in the server tree | APA 7, MLA 9, Chicago, Harvard, IEEE output matches style rules and source type, with missing fields flagged rather than invented | Presence of a formatter does not prove full style conformance; test books, chapters, articles, websites, datasets, Kurdish names, transliteration, and missing metadata | P1 | Golden fixture suite reviewed against authoritative style examples; no invented DOI/pages/publishers; export round-trip tests |
| Research discovery and provider integrations | API routes/services exist for scholarly search and external integrations; `.env.example` documents optional providers | Provider adapters have timeouts, retry/backoff, quotas, source provenance, deduplication, and honest partial-failure states | Each integration needs live or contract-level validation; optional credentials must not silently turn provider errors into fabricated results | P1 | Contract tests for success, empty results, 429, 5xx, timeout, malformed JSON, missing keys; source records retain provider IDs/URLs |
| RAG and evidence graph | RAG, claim-evidence graph, full-text evidence, research-memory, and research-state modules exist | Retrieved chunks remain traceable to original documents; graph edges carry evidence and uncertainty; deletion and access controls are enforced | Confirm end-to-end UI/API wiring, tenant isolation, stale-index handling, chunk citations, and graph updates on source revision/deletion | P1 | Integration tests from upload/search through retrieval, claim graph, citation display, update, and deletion |
| Multi-agent workflow | Multi-agent router/orchestrator and research, writer, citation, reviewer services exist | Agents have narrow contracts, shared evidence IDs, bounded retries/costs, deterministic audit logs, and no ability to fabricate verification state | Validate orchestration failure modes, prompt boundaries, duplicate work, provider budget limits, and persistence of agent decisions | P1 | Fault-injection tests; per-agent schemas; run IDs and trace logs; budget/time limits; no “verified” state without evidence service approval |
| Academic writing quality | `academic-writing-engine.service.ts`, discipline profiles, Kurdish language/prose services; explicit degraded fallback wording | Human-readable, discipline-aware, level-aware writing with research questions, counterarguments, uncertainty, and evidence-backed claims | Fluency does not equal originality or correctness; generated quotations and empirical claims must never be invented; review Kurdish terminology and academic register | P1 | Blind expert review rubric by discipline/level; quote/source traceability; measured revision quality; fallback state visibly marked as draft |
| Research methods/statistics | Research-methods lab and statistical/analysis services exist | Computations derive from supplied datasets with validated inputs, reproducible formulas, assumptions, uncertainty, and exportable methods | Confirm every displayed chart, score, p-value, and conclusion comes from actual data/calculation and not mock or synthetic defaults | P1 | Golden datasets with known results; invalid/missing-data tests; reproducibility checks; chart data provenance; no fabricated sample sizes or significance |
| Publication/manuscript workflow | Manuscript assembly and publication-submission lifecycle/audit routes/services/specs exist | Immutable versions, explicit transitions, reviewer actions, audit trail, integrity gate, and safe resubmission | Prove persistence, concurrency behavior, ownership checks, version diffs, and transition rules against the real database adapter | P1 | Lifecycle integration tests; duplicate/parallel transition tests; tenant ownership tests; audit log assertions |
| User experience and Kurdish RTL | Angular app and Kurdish-first product scope exist | Responsive, accessible Sorani RTL interface with correct bidi behavior, readable long documents, clear error/degraded states, and coherent mobile workflows | Repository CI does not prove visual quality, accessibility, or usability on the target Android device | P2 | Browser E2E screenshots at mobile/desktop sizes; keyboard/accessibility audit; RTL review with long citations, Latin DOIs, numbers, and mixed-direction text |
| Performance and resilience | Rate limiters, SSR, and observability service exist | Measured latency, bounded memory/concurrency, cancellation, graceful shutdown, request IDs, and actionable monitoring | No load, soak, cold-start, or provider-degradation evidence is part of current release gates | P1 | Load/soak test report; p95 latency and error budget; graceful shutdown test; rate-limit and backpressure verification |
| Accessibility and localization | Kurdish-oriented text and frontend exist | Keyboard operation, semantic labels, focus handling, contrast, and consistent Sorani terminology | No accessibility/localization acceptance gate is currently evidenced | P2 | Automated accessibility scan plus manual keyboard/screen-reader and Kurdish proofreading |
| Privacy and data lifecycle | Authenticated routes and database structures exist | Clear data ownership, retention/deletion, export, audit visibility, and no cross-user access to drafts, uploads, or embeddings | Verify actual storage locations, logs, cache keys, deletion cascades, and provider data handling before production claims | P0 | Cross-user isolation tests; delete/export integration tests; PII-safe logs; documented retention and provider disclosure |
| Observability and incident response | `src/server/services/observability.service.ts` exists | Structured logs, request/correlation IDs, redaction, actionable health/readiness signals, alerting, and runbooks | A service file does not prove telemetry is wired across all routes or configured at hosting level | P1 | Correlated trace through UI/API/provider/DB; secret-redaction tests; health check and incident runbook |
| Production deployment | SSR server entry and start script are present | Repeatable deployment with runtime secrets, database connectivity, migrations, correct allowed origins, health checks, and rollback | Current CI proves build artifact creation only; it does not prove a real host has correct credentials, database permissions, or provider quotas | P0 | Staging deployment checklist signed off; real auth/provider/DB smoke tests; rollback exercise; no secrets in logs |

## Phase 2 priority order

### P0 — establish trustworthy release readiness

1. **CI on the exact merged `main` commit:** confirm the workflow triggered by merge commit `ca8256939178201891170d0d5250aaaf73ecf3d4` completes successfully.
2. **Dependency advisory inventory:** list all advisories and safe fixes before upgrading; avoid blind `npm audit fix --force`.
3. **Route-by-route authorization matrix:** inventory every mounted route and prove auth/role requirements with negative tests.
4. **Database integration proof:** migrate a clean PostgreSQL database and verify real persistence.
5. **Evidence truthfulness:** distinguish source identity, exact text match, semantic support, and human review; never present the first two as proof of truth.
6. **Deployment checklist:** validate actual secret injection, database access, CORS origin, startup, health checks, and rollback in staging.

### P1 — academic and research reliability

7. Source/provider contract tests and metadata conflict handling.
8. Citation-style golden tests and claim-to-passage traceability.
9. RAG provenance, graph consistency, and cross-user isolation.
10. Real-data statistical validation and multi-agent failure/budget tests.
11. Manuscript/publication lifecycle integration tests and auditable revisions.

### P2 — user-facing quality

12. Sorani RTL and mobile E2E review, accessibility, performance, and terminology review.

## Definition of done

A matrix item can be marked **done** only when all conditions below are met:

- Implementation is committed on a reviewable branch and all changed source files comply with the repository's 500-line limit.
- A deterministic automated check exists for the behavior or risk.
- CI passes on the exact commit being reviewed.
- Security- or research-sensitive behavior has negative tests, not only a successful-path demo.
- Any external dependency is either exercised against a controlled integration environment or clearly marked as unverified.
- UI/API wording does not claim more certainty than the evidence supports.
- Deployment-only requirements are explicitly separated from code/CI status.

## Known limitations of this assessment

- This is a repository/configuration review; it does not have the production secret values and does not execute authenticated calls against the deployed host.
- The current CI workflow runs dependency installation, release readiness, line limits, static academic-integrity audit, TypeScript typecheck, production build, and artifact smoke check. It does **not** currently run the full test suite or lint.
- Static checks can miss behavioral bugs and can also flag patterns without understanding all context. They supplement rather than replace tests and human review.
- The prior `npm ci` output reported 19 advisories (2 critical, 11 high, 6 moderate); re-run the detailed audit against the current lockfile before deciding which upgrades to apply.
- A green build is not equivalent to a production security certification or proof that every AI-generated citation is real and supports its associated claim.

## Immediate next phase

Phase 3 should preserve the known-good baseline while changes are made: establish the merge-commit CI result, keep changes on isolated branches, use small reversible patches, capture before/after evidence, and do not report a fix as complete until its acceptance checks pass.
