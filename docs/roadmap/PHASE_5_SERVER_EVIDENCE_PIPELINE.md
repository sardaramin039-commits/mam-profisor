# Phase 5 — Server-owned Evidence Pipeline

## Problem found

The `/grounded_generate` route accepted a caller-supplied `chunkText` and a provenance label, then passed the original request chunk forward. The source-verification service intentionally does not trust JSON provenance flags, so caller-provided text could never legitimately become citation-eligible through this route. The route also did not invoke the server full-text retriever to obtain eligible evidence, making the grounding path effectively fail closed without a way to recover.

## Changes

- Retrieve open-access evidence server-side for each claim/source pair using the existing SSRF-aware full-text enrichment service.
- Add validated, bounded source identifiers for PubMed, Europe PMC, OpenAlex, and DOAJ retrieval.
- Cap the route at 10 evidence chunks per request to bound concurrent outbound work.
- Keep the legacy `chunkText` request field for compatibility, but do not use it as proof or as model context.
- Feed the generation step only evidence text that appears in a citation-eligible server verification report with the expected full-text provenance.
- Add route-level regression tests for spoofed provenance, server evidence handoff, and the request-size limit.

## Acceptance criteria

1. Client-provided `provenance='server-verified-fulltext'` is insufficient on its own.
2. Caller-provided `chunkText` never becomes grounding context.
3. Failure to retrieve or verify full text results in zero eligible context and the existing safe fallback.
4. Successful server retrieval is passed forward only when the source-verification report remains citation-eligible.
5. CI runs the new regression spec through `npm run test:server`; no new dependencies are added.

## Limitations

This route's successful evidence retrieval depends on available open-access provider records and matching claim text. It does not prove that all external providers are online, nor does it replace independent human citation review.
