# Phase 4 — Release Verification and CI Reliability

## Goal

Create a repeatable release-candidate verification run that produces inspectable evidence tied to an exact Git commit. A green build alone is not a production certification.

## Release verification workflow

`.github/workflows/release-verification.yml` runs on manual dispatch or a version tag beginning with `v`. It:

1. Checks out full Git history and selects Node.js 22.
2. Installs the exact dependency tree using `npm ci`.
3. Runs the Phase 3 preservation gate.
4. Checks release prerequisites and npm lockfile consistency.
5. Checks source-file line limits and the academic-integrity static audit.
6. Runs the focused server security/regression test suite.
7. Runs TypeScript typechecking, a production build, and the production-output smoke check.
8. Only after every previous step succeeds, writes and uploads a JSON/Markdown verification manifest alongside the production build.

The artifact name includes the commit SHA and is retained for 30 days. A failed step prevents evidence generation and artifact upload, avoiding a misleading green manifest.

## Evidence semantics

The manifest records project/version, exact commit, ref, workflow event, timestamp, Node/npm versions, and the checks that passed. It is not a signed attestation and does not prove that production deployment succeeded, secrets are configured, external providers work, the database is reachable, or every user journey passed.

The workflow reports dependency advisories in the main CI workflow, but this phase does not automatically upgrade dependencies or claim known advisories are fixed. Dependency updates must be reviewed and verified separately.

## Release decision

A release candidate may be considered for manual review only when the release-verification workflow is fully green and its artifact is available. Before production deployment, an operator must separately verify environment secrets, database migrations/backups, provider configuration, domain/CORS settings, and a small set of real end-to-end journeys.

## Scope and safety

This phase adds a separate release-verification path and evidence generator. It does not deploy the application, alter production secrets, run database migrations, change application runtime behavior, or modify dependency versions. The existing CI workflow remains the pull-request regression gate.
