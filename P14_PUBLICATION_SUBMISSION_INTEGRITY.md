# P14 — Publication Submission Integrity Gate

P14 کۆتا پشکنینی deterministic ـە پێش ناردنی package ـی بڵاوکردنەوە. ئەم قۆناغە policy ـی گۆڤار دروست ناکات؛ package ـی P13 دوبارە assemble دەکات و consistency ـی داتاکە پشکنێت.

## پشکنینەکان

1. manuscript integrity دەبێت PASS بێت.
2. fingerprint ـی manuscript و package دەبێت SHA-256 ـی دروست بن.
3. word count، abstract word count و reference count دەبێت لەگەڵ manuscript یەکسان بن.
4. status و checks ـی P13 نابێت هیچ BLOCKED یان REVISE ـێکی هەبێت بۆ دۆخی READY.
5. blinded review دەبێت title page ـی نووسەران نەخاتە ناو package ـی blinded.
6. ناوی گۆڤار دەبێت بوونی هەبێت.

## دۆخەکان

READY واتە لە ڕووی ئەم gate ـەوە package ـەکە ئامادەی submission ـە.

REVISE واتە پێویستی بە چاکسازی هەیە و نابێت وەک readyToSubmit مامەڵەی لەگەڵ بکرێت.

BLOCKED واتە package ـەکە پێش submission ڕێگری کراوە.

## API

POST /api/publication-submission-integrity/:workspaceId/integrity

Endpoint ـەکە authenticated ـە و manuscript، policy، keywords و author metadata وەردەگرێت. لە server ـدا package ـی P13 دوبارە دروست دەکات، پاشان P14 integrity gate جێبەجێ دەکات. بەم شێوەیە client ناتوانێت تەنها status یان count ـەکان spoof بکات.

## سنووری دڵنیایی

P14 تەنها consistency و integrity ـی package پشکنێت. READY بە مانای قبوڵکردنی وتار لەلایەن گۆڤار نییە و جێگرەوەی policy ـی تازەی گۆڤار، peer review یان بڕیاری سەرنووسەر نییە.

Implementation:
- src/server/services/publication-submission-integrity.service.ts
- src/server/services/publication-submission-integrity.service.spec.ts
- src/server/routes/publication-submission-integrity.routes.ts
- src/server/services/text-sha256.service.ts
- src/server/services/text-sha256.service.spec.ts
## Integrated hardening
P14 now repeats the P9 research gate and server-side P7 citation verification before rebuilding the P13 package. The integrity response therefore evaluates a package produced from the current authenticated research state, not a client-supplied status or citation-verification flag.
