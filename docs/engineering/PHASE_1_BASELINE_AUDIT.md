# Phase 1 — repository baseline audit

Date: 2026-10-20  
Repository: `sardaramin039-commits/mam-profisor`  
Audit branch: `maintenance/phase-1-audit-baseline`  
Baseline branch: `main`  
Baseline commit inspected: `cddc3626adaa0be5076fc372d0c3df260412155e`

## Scope and evidence

This first pass inspected the current `package.json`, `package-lock.json`, `angular.json`, `tsconfig.json`, `.github/workflows/ci.yml`, `.gitignore`, and the scripts for release readiness, release smoke checks, line limits, and the Phase 3 preservation gate. It also inspected `src/app/app-controller-base.ts`.

This was a repository-content review through GitHub. No local checkout or executable shell for this repository was available during this pass, so **no build, lint, test, or CI run is claimed by this report**.

## Confirmed baseline

- The repository uses npm and declares `npm@10.9.8` in `package.json`.
- `package-lock.json` exists and uses lockfile version 3.
- The project declares Node.js `>=22.22.2` and npm `>=10.9.0`.
- TypeScript strict mode and Angular strict template checks are enabled.
- `.github/workflows/ci.yml` runs `npm ci`, dependency advisory reports, the preservation gate, release-readiness checks, the 500-line source limit, academic-integrity audit, server regression tests, typecheck, production build, and production smoke check.
- The line-limit checker inspects source roots `src` and `app/applet/src` for TypeScript, JavaScript, HTML, CSS, and SCSS files over 500 lines.
- `src/app/app-controller-base.ts` currently has 317 lines, so this file does **not** breach the line-count limit. However, it aggregates many state aliases, injected services, navigation state, form setup, and backup actions; it is a reasonable candidate for a behavior-preserving cohesion review, not an automatic rewrite.
- `package.json` defines `lint` and the Angular `test` script, but the inspected CI workflow does not invoke either script. It runs the dedicated `test:server` suite instead. This is a confirmed coverage gap in the workflow configuration; it does not by itself prove that lint or tests currently fail.

## Prioritized follow-up work

### P1 — make CI coverage explicit
Decide which Angular unit tests and lint checks are stable and suitable for CI, then add them as explicit workflow steps or document a deliberate exclusion. Do not simply add a command without verifying the repository's runner configuration and expected runtime.

### P2 — establish a reproducible baseline
Run the existing workflow commands in a clean Node/npm environment and record exact results. Separate environment/setup failures from application defects. Confirm whether the current default branch has a successful recent CI run before claiming the project is green.

### P3 — refactor high-coupling controllers
Map callers, templates, services, and tests before extracting logic from `AppControllerBase`. Move one cohesive responsibility at a time; preserve the public template bindings and verify each extraction with typecheck/build and focused regression checks.

### P4 — audit agent orchestration and provider boundaries
Review timeouts, cancellation, retries, error propagation, authentication/authorization, rate limits, provenance/evidence IDs, and any paid-provider assumptions. Keep provider-independent contracts and graceful fallback behavior.

### P5 — security and dependency hygiene
Review server-side secret boundaries, production CORS, authorization on API routes, lockfile reproducibility, and current npm advisories. Do not automatically upgrade the entire dependency tree without compatibility evidence.

## Acceptance criteria

A phase is complete only when the relevant source diff is reviewed and the applicable checks have recorded outcomes. A green CI badge, passing local check, or completed refactor must not be claimed unless it is directly observed. Keep each code fix isolated and reviewable; do not merge this branch without owner review.
