# P16–P20 Integrated Submission Chain

P16 تا P20 submission ـەکە لە event ـێکی تەنیا بۆ زنجیرەیەکی immutable و version-aware دەگۆڕن.

## P16 — Receipt
Receipt بە package fingerprint و optional version ID دەبەسترێت. immutableHash و receipt ID هەردووکیان verify دەکرێن. Identity binding لە submission، user و workspace دەپشکنێت.

## P17 — Audit
هەر lifecycle transition ـێک event ـێکی hash-chained ـە. verifier hash، sequence، duplicate IDs، duplicate versions، submission identity، state continuity و lifecycle transition policy دەپشکنێت.

## P18 — Versioning
هەر READY یان RESUBMISSION snapshot version ID، cycle، package fingerprint، previous fingerprint و immutable hash هەڵدەگرێت. Version chain submission identity و kind/status consistency ـیش دەپشکنێت.

## P19 — Reproducible Manifest
Manifest policy، package، manuscript، integrity، version و audit head لە یەک snapshot ـدا کۆدەکات. Capture تەنها دوای P9، P14، P17 و P18 verification دەکرێت و latest version/fingerprint لەگەڵ lifecycle record دەگونجێنێت.

## P20 — Editorial & Revision
Editorial decision بە current P18 version و P17 audit chain دەبەسترێت. ACCEPT/REJECT receipt verification ـی P16 پێویستە. Revision plan task ID، order، content، required flag، hash و status دەپشکنێت و resubmission تا required task ـەکان تەواو نەبن قفڵە.

## End-to-end invariants
- Client cannot promote a submission to READY by status alone.
- A submitted package must match the READY version fingerprint.
- A receipt must match the submitted version and immutable hash.
- An audit chain must match lifecycle state and head hash.
- A manifest must match current version and audit head.
- An editorial decision must bind to an existing current version and valid receipt when required.
- A resubmission must use a new package fingerprint and a verified completed revision plan.

## Test contract
`scripts/p16-p20-submission-chain-test.mjs` verifies the core P16–P20 chain and source-level trust-boundary wiring. The contract runs in the Academic Integrity CI, Quality Gate and canonical Mam Professor Quality workflow.

## Scope
ئەم زنجیرەیە integrity و traceability ـی ناوخۆی application دەسەلمێنێت. پێشکەشکردنی ڕاستەقینە بۆ publisher، قبوڵبوونی paper، peer review و journal policy ـی live بانگەشە ناکرێت.