# Phase 11 — Academic Writing Pipeline Guardrails

## Changes

- Treat topic and discipline as bounded, normalized user data and short-circuit invalid or overlong input.
- Never return model-generated `evidenceQuotes` from a planner that receives no verified source records.
- Bound model output lengths and list sizes, trim blank entries, and return an explicitly degraded draft when generation fails or produces malformed output.
- Keep research question, thesis statement, and conclusion framed as proposals, not verified findings.
- Add offline mocked regression tests and include the writing-engine spec in CI.

## Acceptance criteria

1. No generated quote, statistic, DOI, or citation is surfaced as evidence by this planner.
2. Inputs above configured limits do not reach the model.
3. Model output lists and long strings are bounded.
4. Degraded output is marked `status: 'degraded'` and makes no evidence-verification claim.
5. No new dependencies; modified source and spec files remain below 500 lines.

## Limitations

This planner still produces candidate academic structure and prose. It does not replace source retrieval, evidence verification, factual review, or human supervisory judgment.
