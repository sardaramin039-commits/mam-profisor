# Phase 6 — Provider Identifier Integrity

## Changes

- Normalize DOI resolver prefixes such as `doi:`, `https://doi.org/`, and `https://dx.doi.org/`; reject malformed DOI identifiers before network access.
- Validate both ISBN-10 and ISBN-13 check digits before calling Open Library.
- Normalize ISSN separators consistently and preserve the existing ISSN-8 check-digit validation.
- Add offline mocked regression cases for valid and invalid DOI, ISBN, and ISSN inputs; register the spec in the existing CI server-regression command.

## Acceptance criteria

1. Invalid identifiers fail before any provider request.
2. Valid ISBN-10/ISBN-13 values pass checksum verification and retain canonical digits.
3. ISSN values containing spaces or punctuation normalize to the canonical `NNNN-NNNN` representation.
4. DOI parsing removes common resolver prefixes without fabricating metadata or treating a provider outage as verification.
5. New source and spec files remain below 500 lines; no dependencies are changed.

## Limitations

A syntactically valid DOI/ISBN/ISSN is not proof that the record exists or matches the requested work. Provider response matching and evidence eligibility remain separate verification steps.
