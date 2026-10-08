# P12 — Defense Rehearsal Engine

P12 provides a protected, deterministic rehearsal workflow for thesis defense preparation.

## Capabilities

1. Prepares defense questions across research question, methodology, evidence, limitations and contribution.
2. Adds targeted questions when methodology is missing or citation verification is incomplete.
3. Scores submitted answers by required conceptual elements and answer completeness.
4. Recognizes common Kurdish and English academic terminology during answer assessment.
5. Reuses the P11 readiness policy so a blocked manuscript cannot be reported as defense-ready.

## Endpoint

`POST /api/defense-rehearsal/:workspaceId`

The endpoint requires authentication and accepts manuscript structure plus optional answers. It returns readiness, defense questions, per-question assessments and an aggregate answer summary.

P12 is a rehearsal aid. It does not replace a real committee, external peer review, or institutional defense decision.