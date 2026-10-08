# P15 — Publication Submission Lifecycle

P15 submission ـی P13/P14 دەخاتە ناو lifecycle ـێکی پارێزراوی server-side بۆ بەڕێوەبردنی دۆخی ناردن.

## دۆخەکان

DRAFT، READY، SUBMITTED، UNDER_REVIEW، REVISION_REQUESTED، RESUBMITTED، ACCEPTED، REJECTED، WITHDRAWN

دۆخە کۆتاییەکان `ACCEPTED`، `REJECTED` و `WITHDRAWN` ـن و transition ـی تر بۆیان ڕێگەپێدراو نییە.

## پاراستنی integrity

`READY` بە transition ـی ئاسایی دروست ناکرێت. بۆ DRAFT، endpoint ـی `mark-ready` دەبێت package ـەکە لە server ـدا دوبارە assemble و P14 integrity ـی لەسەر بکرێت. تەنها کاتێک P14 `readyToSubmit=true` دەدات، fingerprint ـی نوێ لە lifecycle تۆمار دەکرێت.

ئەم جیاکردنەوەیە ڕێگری دەکات client بە گۆڕینی status تەنها package ـەکە بە READY ناوببێت.

## Firestore

داتا لە collection ـی `publication_submission_lifecycle/{userId}/items` هەڵدەگیرێت. هەر record ـێک version، currentStatus، submissionFingerprint و تا 100 event ـی کۆتایی هەڵدەگرێت.

transaction ـی Firestore بۆ transition بەکاردێت تا دوو گۆڕانکاریی هاوکات lifecycle ـەکە تێکنەدەن.

## API

`GET /api/publication-submission-lifecycle/:workspaceId`

`POST /api/publication-submission-lifecycle/:workspaceId/create`

`POST /api/publication-submission-lifecycle/:workspaceId/transition`

`POST /api/publication-submission-lifecycle/:workspaceId/:submissionId/mark-ready`

Endpoint ـەکان authenticated ـن.

## سنووری دڵنیایی

P15 بەڵگەی قبوڵبوونی گۆڤار نییە. `SUBMITTED` تەنها دۆخێکی تۆمارکراوی lifecycle ـە کە بەکارهێنەر بە external reference یان تێبینی دەگۆڕێت؛ ئەپەکە بە خۆی ناردن بۆ گۆڤار ناکات.

Implementation:
- src/server/services/publication-submission-lifecycle.policy.ts
- src/server/services/publication-submission-lifecycle.policy.spec.ts
- src/server/services/publication-submission-lifecycle.service.ts
- src/server/routes/publication-submission-lifecycle.routes.ts