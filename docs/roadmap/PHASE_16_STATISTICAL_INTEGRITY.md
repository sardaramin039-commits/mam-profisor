# Phase 16 — Research Methods and Statistics Integrity

## Implemented

- Adds a deterministic, server-hosted Statistical Integrity mode with bounded input and no external provider dependency.
- Connects the existing Research Methods Lab UI to a real same-origin API route rather than returning a permanent “not configured” error.
- Validates sample/event bounds, reported percentages, p-value and alpha ranges, confidence levels and intervals, summary statistics, group sample sizes, standard deviations, and power-analysis inputs.
- Calculates event percentages even for impossible event counts so the report exposes both the invalid count and percentage mismatch.
- Uses the conventional boundary `p ≤ alpha` for the labeled significance assessment; invalid p/alpha values yield `not_assessed`.
- Blocks the approximate power calculation when parameters are invalid rather than silently clamping those inputs. Reports that pass validation still use an explicitly approximate power method.
- Adds route and service regression coverage and registers it in `npm run test:server`.

## Limits and interpretation

This is a consistency/preflight gate, not a full statistical engine. It does not recompute a researcher-supplied inferential test, model design effects, adjust multiplicity, estimate power for every design, or establish causality. A “valid” response means only that the supplied values passed these deterministic checks; it is not a certification of scientific validity. Results contain no saved user data, and the endpoint sets `Cache-Control: no-store`.
