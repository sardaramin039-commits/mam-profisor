# Phase 20 — Release Certification

## Automated release-candidate gate

The release-verification workflow runs on manual dispatch, version tags beginning with `v`, and pushes to `release-candidate/**`. Candidate branches let maintainers verify a release without creating a public version tag.

The workflow must pass all of the following against the exact candidate commit before it produces the SHA-bound artifact:

1. `npm ci` using the committed npm lockfile.
2. Phase 3 preservation gate.
3. Release prerequisite and lockfile consistency check.
4. Source-file line limit and academic-integrity audit.
5. Focused server security/regression suite.
6. TypeScript typecheck and production build.
7. Production-output smoke check.
8. Generation and upload of JSON/Markdown release evidence plus the production build.

A failed prerequisite prevents evidence generation. A green ordinary pull-request workflow is not a substitute for this release-specific run.

## Required human release checks

These checks cannot be honestly certified by static code inspection or CI alone. A release operator must record their result before production deployment:

- [ ] Confirm required environment secrets exist in the target environment without exposing their values.
- [ ] Verify database migration order, backup availability, and a tested recovery procedure.
- [ ] Confirm provider credentials, quotas, and external API configuration in the target environment.
- [ ] Confirm deployed domain, HTTPS, CORS allowlist, and authentication configuration.
- [ ] Run real end-to-end smoke journeys for sign-in/access control, academic source search, writing, citation/evidence review, manuscript export, and mobile/RTL rendering.
- [ ] Review current dependency advisories and decide whether any are release-blocking.
- [ ] Inspect the evidence artifact and confirm its commit SHA matches the intended candidate.

## Release decision

Status is **pending until the release-verification workflow passes on the current candidate SHA and the human checks above are completed**. A generated evidence manifest proves only the checks listed in that manifest; it does not prove deployment success, provider availability, database health, external journal submission, or complete accessibility conformance.

No deployment, secret changes, migrations, or dependency updates are performed by this phase.
