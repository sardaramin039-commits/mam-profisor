# Phase 16 — Research Methods and Statistics Integrity

## Implemented

- Validate sample size and event count bounds; calculate a deterministic event percentage and reject material disagreement with a reported percentage.
- Validate p-values, alpha, confidence level and confidence interval order/range.
- Keep significance results conditional on valid p and alpha; never infer significance from the presence of a p-value alone.
- Flag potential causal-language overreach for observational, cross-sectional and descriptive research designs.
- Warn about common method/design mismatches without automatically rejecting qualitative work.
- Add offline regression tests and register the spec in CI.

## Limitations

This is an integrity/consistency gate, not a full statistical analysis engine. It does not recompute inferential tests, assess power, adjust for multiplicity, or certify causal identification. Published claims still need a methods-aware reviewer.
