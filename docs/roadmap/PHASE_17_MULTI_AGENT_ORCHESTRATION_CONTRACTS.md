# Phase 17 — Multi-Agent Orchestration Contracts

## Implemented

- Defines typed per-stage receipts with state, bounded attempts, timeout, duration, timestamps, input fingerprint, and a stable error code; receipts never include raw prompt/source content.
- Caps retries to one and requires an explicit retry-safe declaration. The pipeline only opts into retry for read-only source discovery; model-writing/review stages are not automatically retried.
- Enforces per-stage deadlines and an overall pipeline deadline, and accepts a request-abort signal to stop scheduling later stages.
- Carries a typed handoff manifest between evidence-aware stages with source IDs, citation-eligible source IDs, evidence provenance, and a fingerprint.
- Makes the conflict policy explicit: retain reported conflicts and require human review; no reported conflict is not treated as proof of consensus.
- Returns bounded execution receipts and handoff metadata in the pipeline result and exposes stage timeout/cancellation errors from the orchestration endpoint.

## Limits

A timed-out stage stops the orchestrator from waiting for and scheduling subsequent work. Third-party operations that do not consume the supplied AbortSignal may continue in the provider SDK or HTTP stack until their own timeout. This control plane is not a guarantee that every provider call is physically cancelled. No dependencies changed; regression coverage is registered in `npm run test:server`.
