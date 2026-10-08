# P16 — Immutable Publication Submission Receipt

P16 دوای P14 و P15، بەڵگەی ناردنی submission بە fingerprint ـی package ـی READY پەیوەست دەکات و receipt ـێکی write-once دروست دەکات.

## Receipt

هەر receipt ـێک submissionId، workspaceId، userId، journal، manuscript type، submission fingerprint، کات، note یان external reference و immutableHash ـی هەیە.

`immutableHash` لەسەر payload ـێکی canonical بە SHA-256 دروست دەکرێت.

## Atomic submit

`READY → SUBMITTED` لە transaction ـێکی Firestore ـدا ئەنجام دەدرێت.

پێش گۆڕینی status، server پشکنین دەکات کە fingerprint ـی نێردراو بە fingerprint ـی READY یەکسانە. پاشان receipt و lifecycle event و status update لە هەمان transaction ـدا تۆمار دەکرێن.

بەم شێوەیە client ناتوانێت package ـێکی جیاواز بە fingerprint ـی package ـی ئامادەکراو بۆ status ـی SUBMITTED بناسێنێت.

## Receipt retrieval

`GET /api/publication-submission-lifecycle/:workspaceId/:submissionId/receipt`

تەنها receipt ـی هەمان user و workspace دەگەڕێنێتەوە.

## Submission endpoint

`POST /api/publication-submission-lifecycle/:workspaceId/transition`

کاتێک `to=SUBMITTED` ـە، `submissionFingerprint` پێویستە و server method ـی atomic submit بەکاردێت.

## سنووری دڵنیایی

Receipt بەڵگەی پەیوەندیداربوونی ناردنە لە ناو سیستەمەکە؛ بەڵگەی سەربەخۆی portal ـی گۆڤار یان قبوڵکردنی وتار نییە. external reference لە کاتی ناردنەوەی بەکارهێنەرە و ئەپەکە بۆ خۆی پشتڕاستی ناکات.

Implementation:
- src/server/services/publication-submission-receipt.service.ts
- src/server/services/publication-submission-receipt.service.spec.ts
- src/server/services/publication-submission-lifecycle.service.ts
- src/server/routes/publication-submission-lifecycle.routes.ts