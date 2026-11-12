# Phase 9 — Evidence-to-Claim Link Integrity

## Changes

- Require every proposed evidence-node text to be a verbatim normalized substring of its matched server-verified full-text source.
- Replace ungrounded context snippets with the validated excerpt rather than exposing generated context as source text.
- Require a claim's quote to occur in the exact linked evidence node, not just somewhere in a longer source record.
- Reject a claim whose declared source ID conflicts with the evidence node's source.
- Invalidate duplicate evidence IDs rather than allowing one source to silently overwrite another.
- Ignore LLM-proposed page numbers unless the matched source record itself supplies page metadata.
- Add regression cases for fabricated evidence, mismatched claim/source linkage, cross-chunk quotes, and duplicate evidence identifiers; register the graph spec in CI.

## Acceptance criteria

1. Only server-verified full-text records are eligible for claims marked verified.
2. Evidence-node text and claim quote must independently match the same linked source/excerpt.
3. Conflicting source IDs and duplicate evidence IDs fail closed.
4. Synthetic/unsupported citations stay blocked and confidence becomes zero when grounding fails.
5. No new dependencies; every modified TypeScript file stays below 500 lines.

## Limitations

Substring grounding confirms literal excerpt linkage, not the truth of a claim, the correctness of its interpretation, or full citation-style validity. Those require separate validation and human scholarly review.
