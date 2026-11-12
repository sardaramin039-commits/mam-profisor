# Phase 10 — Citation Style Fidelity

## Changes

- Add distinct formatting paths for APA 7, MLA 9, Chicago Author–Date, Chicago Notes–Bibliography, Harvard, and IEEE using source metadata available in the current schema.
- Format author names using style-oriented family-name/initial conventions where full names are supplied.
- Format journal metadata (journal, volume, issue, pages, DOI) when available; do not invent missing fields.
- Provide Chicago NB superscript note markers and footnote text; number IEEE references consistently by source and include the number in the bibliography.
- Reject unsupported runtime styles rather than silently formatting them as APA.
- Add metadata warnings and style-specific regression coverage to CI.

## Acceptance criteria

1. All six supported styles produce distinct in-text/reference formats.
2. IEEE numbers remain stable for repeated uses of the same source.
3. Chicago NB emits note markers and footnote text instead of IEEE-style bracket markers.
4. Evidence eligibility checks remain mandatory before a citation can be returned as verified.
5. Missing metadata is disclosed rather than fabricated.

## Limitations

This is a best-effort renderer because current source records may not contain every field required by the official style manuals, and rules vary by source type and edition. Metadata warnings and human scholarly review remain necessary before publication.
