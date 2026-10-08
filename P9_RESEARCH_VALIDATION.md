# P9 — Research Validation & Export Integrity

P9 makes the research control plane fail closed before export.

## Export gates

Export is blocked unless all conditions are satisfied:

1. Methodology is explicitly present.
2. At least one verified evidence item is available.
3. Research decisions are traceable in the decision ledger.
4. No unresolved evidence-coverage review is required.

The policy is isolated in:
`src/server/services/research-validation-policy.ts`

Its behavior is covered by:
`src/server/services/research-validation-policy.spec.ts`

This gate does not claim that a project is academically correct. It only prevents the system from treating an incomplete research state as export-ready.
## Integrated hardening
P9 now exposes explicit blockers and readyForManuscript in the control-plane gate. Detailed metrics include sources, claims, evidence, verified evidence, decisions and evidence coverage.

The evidence gate requires at least one source, at least one verified evidence item, and (when claims exist) at least 80% evidence coverage. The methodology gate requires an explicitly recorded non-empty memory item tagged methodology; it is not fabricated automatically by orchestration.
