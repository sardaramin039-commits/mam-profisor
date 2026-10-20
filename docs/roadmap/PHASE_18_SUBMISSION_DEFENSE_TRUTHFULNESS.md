# Phase 18 — Submission and Defense Truthfulness

## Implemented

- New immutable submission receipts use version 2 and explicitly record `USER_REPORTED_UNVERIFIED`; the API never sets `externalSubmissionVerified` to true.
- Receipt verification is scoped to internal hash and identity binding. A valid hash is not proof that a journal received, acknowledged, or accepted a manuscript.
- Legacy receipts retain their original canonical hash format and are labeled `LEGACY_CONFIRMATION_SCOPE_UNKNOWN`, rather than being retroactively represented as externally confirmed.
- Receipt lookup distinguishes a receipt that matches the current package from a valid receipt for a historical version after resubmission. A historical receipt does not become corrupt just because a newer package exists.
- Submit and resubmit API responses explicitly state that the app only records the user's report or an internal lifecycle revision; no external journal submission is performed or verified.
- Defense rehearsal responses identify themselves as `AUTOMATED_REHEARSAL_ONLY`, mark that no human committee decision occurred, and disclose that scores are heuristic practice feedback rather than certification.
- Regression coverage checks receipt scope, tampering, legacy hash compatibility, and defense response disclosures. Tests are registered in `npm run test:server`.

## Limits

The app does not connect to a journal submission provider or verify an external journal account/receipt. An optional external reference is supplied by the user and is not independently authenticated. Readiness scores, rehearsal scores, and generated questions are assistance for preparation only; they do not certify scholarly validity, publication acceptance, or readiness for an actual defense.
