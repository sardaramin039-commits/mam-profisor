# P17 — Immutable Submission Audit Chain

P17 audit trail ـی submission لە document ـی lifecycle جیا دەکاتەوە و هەر گۆڕانێک بە hash-chain پەیوەست دەکات.

## بنەما

هەر audit event ـێک `version`، `from`، `to`، `occurredAt`، `previousHash` و `eventHash` ـی هەیە.

`eventHash` لەسەر payload ـی canonical و `previousHash` بە SHA-256 دروست دەکرێت. `auditHeadHash` ـی lifecycle record هەمیشە دەبێت بە hash ـی دوا audit event یەکسان بێت.

Audit event لە Firestore ـی جیا لە `publication_submission_lifecycle/{userId}/items/{submissionId}/audit` هەڵدەگیرێت و لەگەڵ lifecycle mutation ـەکە لە هەمان transaction ـدا نووسراوە.

## دۆخەکانی verification

`VERIFIED` واتە زنجیرەکە، state ـەکان، version ـەکان و head hash یەکسانن.

`INVALID` واتە hash، version، state یان head hash کێشەی هەیە.

`LEGACY_UNSEEDED` واتە submission ـەکە پێش P17 دروستکراوە و هێشتا audit anchor ـی نییە.

`LEGACY_RECONSTRUCTED` واتە anchor ـێکی legacy دروست کراوە؛ بەڵام مێژووی پێش P17 بە تەواوی بە `VERIFIED` پشتڕاست ناکرێت.

## Legacy migration

`POST /api/publication-submission-lifecycle/:workspaceId/:submissionId/initialize-audit`

ئەم endpoint ـە audit anchor ـێک بۆ record ـە کۆنەکان دروست دەکات. هیچ status یان lifecycle event ـێکی کۆن بە درۆ `verified` ناکرێت.

دوای anchor، transition ـە نوێکان بە hash-chain ـی P17 دەنووسرێن.

## Verification API

`GET /api/publication-submission-lifecycle/:workspaceId/:submissionId/audit`

server هەموو audit event ـەکان دەخوێنێتەوە و `verifySubmissionAuditChain` جێبەجێ دەکات. `INVALID` بە HTTP 409 دەگەڕێتەوە.

## سنووری دڵنیایی

P17 integrity ـی زنجیرەی تۆمارکراوی submission دەپشکنێت. ئەمە بە مانای پشتڕاستکردنەوەی پورتاڵی گۆڤار، email ـی editorial office، قبوڵبوونی وتار یان دروستی factual ـی خودی توێژینەوە نییە.