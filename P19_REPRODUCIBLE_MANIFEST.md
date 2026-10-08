# P19 — Reproducible Submission Manifest

P19 snapshot ـێکی immutable لە submission package دروست دەکات تا policy، version، fingerprint و audit state دووبارە بتوانرێت verify بکرێت.

## Manifest contents
- submission و workspace identity
- journal و manuscript type
- canonical policy fingerprint
- package، manuscript و P14 integrity fingerprints
- P18 version ID
- P17 audit head hash
- word، abstract، keyword و reference counts
- capture timestamp
- immutable manifest hash

## Capture gate
Manifest تەنها بۆ package ـێکی READY دروست دەکرێت. P9 research gate، P7 server-side citation verification، P14 integrity، P17 audit chain و P18 version chain پێش capture پشکنراون.

لە capture ـدا current lifecycle fingerprint و version ID دەبێت لەگەڵ latest P18 version یەکسان بێت.

## Verification
`verifySubmissionManifest` policy fingerprint و immutable hash دووبارە حساب دەکات. `GET` ـی manifest verification دەگەڕێنێتەوە.

## Scope
P19 reproducibility ـی package ـی ناوخۆی ئەپەکە دەسەلمێنێت؛ دڵنیایی لە policy ـی live ـی publisher یان قبوڵبوونی journal نییە.