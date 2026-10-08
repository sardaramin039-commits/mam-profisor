# P18 — Submission Versioning & Resubmission Integrity

P18 بەشی submission لە lifecycle ـێکی تەنها status دەگۆڕێت بۆ lifecycle ـێکی version-aware. هەر package ـێکی `READY` یان `RESUBMISSION` ـی پاسکراو fingerprint ـی خۆی هەڵدەگرێت.

## Version snapshots

هەر version ـێک `cycle`، `kind`، `statusAtCapture`، `packageFingerprint`، `previousFingerprint` و `immutableHash` ـی هەیە.

version ـەکان لە `publication_submission_lifecycle/{userId}/items/{submissionId}/versions` هەڵدەگیرێن.

`currentVersionId` و `versionCount` لە lifecycle record ـدا نوێترین version ـەکە دیاری دەکەن.

## Resubmission

`REVISION_REQUESTED` تەنها بە endpoint ـی تایبەتی `resubmit` دەتوانێت بگۆڕدرێت.

package ـی نوێ لە server ـدا assemble دەکرێت و P14 integrity gate ـی لەسەر جێبەجێ دەکرێت. journal و manuscript type دەبێت لەگەڵ submission ـی بنەڕەتی یەکسان بن.

fingerprint ـی نوێ دەبێت جیاواز بێت لە fingerprint ـی version ـی پێشوو. version ـی نوێ و audit event ـەکە لە هەمان Firestore transaction ـدا تۆمار دەکرێن.

`SUBMITTED` ـیش بە version ID ـی هەمان package ـی READY ـەوە بە receipt ـەکە پەیوەستە.

## Legacy migration

`POST /api/publication-submission-lifecycle/:workspaceId/:submissionId/initialize`

بۆ record ـەکانی P15 کە version history ـیان نییە، snapshot ـێکی `LEGACY_READY` دروست دەکات.

ئەم snapshot ـە تەنها fingerprint ـی هەمان lifecycle record پشتڕاست دەکات؛ payload ـی manuscript ـی کۆن لێرەدا نییە. بۆیە verification ـەکە `LEGACY_RECONSTRUCTED` ـە، نەک `VERIFIED`.

## Version verification

`GET /api/publication-submission-lifecycle/:workspaceId/:submissionId/versions`

server chain ـی version ـەکان، cycle، previous fingerprint، immutable hash و پەیوەندییەکەی بە lifecycle record دەپشکنێت.

## سنووری دڵنیایی

P18 دڵنیایی لە consistency و version lineage ـی package دەدات. ئەمە بەڵگەی factual correctness ـی manuscript، قبوڵبوونی گۆڤار، یان پشتڕاستی portal ـی دەرەکی نییە.