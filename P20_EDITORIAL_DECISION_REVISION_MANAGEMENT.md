# P20 — Editorial Decision & Revision Management

P20 بەڕێوەبردنی بڕیاری editorial و revision بۆ publication submission زیاد دەکات بە بەستنەوەی هەر بڕیارێک بە P18 submission version و P17 audit chain.

## Editorial decisions

Decision ـە پشتڕاستکراوەکان:
- `MINOR_REVISION`، `REVISION_REQUESTED`
- `MAJOR_REVISION`، `REVISION_REQUESTED`
- `ACCEPT`، `ACCEPTED`
- `REJECT`، `REJECTED`
- `WITHDRAW`، `WITHDRAWN`

بڕیار پێویستی بە note یان external reference هەیە و immutable hash ـی هەیە. ACCEPT و REJECT پێویستیان بە submission receipt هەیە؛ لە دۆخی `SUBMITTED` receipt دەبێت بە current P18 version ببەسترێت.

## Revision plan

MINOR و MAJOR revision دەبێت لانیکەم یەک task ـی structured هەبێت. هەر task:
- scope
- title و details
- required
- status: OPEN / IN_PROGRESS / DONE / WAIVED
- optional dueAt و completionNote

Plan ـەکە hash ـی هەیە و لەگەڵ decisionId و submissionVersionId بەندە.

## Resubmission gate

لە کاتی `REVISION_REQUESTED`:
- structured revision plan دەبێت بوونی هەبێت.
- هەموو required task ـەکان دەبێت `DONE` یان `WAIVED` بن.
- پاشان P18 resubmit دەتوانێت بەردەوام بێت و P14 integrity دووبارە دەکرێت.

P20 هیچ بانگەشەیەک لەسەر یاسای live ـی گۆڤار ناکات؛ policy و بڕیاری editorial دەبێت لەلایەن بەکارهێنەر یان سیستەمی publisher دابین بکرێت.

پێوانەی integrity ـی P20: هەر decision و revision plan دەبێت بە current submission version و audit chain ـی هەنووکەیی ببەسترێت.

## API

`POST /api/publication-submission-editorial/:workspaceId/:submissionId/decision`

`GET /api/publication-submission-editorial/:workspaceId/:submissionId/decisions`

`GET /api/publication-submission-editorial/:workspaceId/:submissionId/revision`

`PATCH /api/publication-submission-editorial/:workspaceId/:submissionId/revision/:taskId`

هەموو endpoint ـەکان بە `requireAuth` پارێزراون.
