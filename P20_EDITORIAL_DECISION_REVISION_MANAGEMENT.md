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

## API

`POST /api/publication-submission-editorial/:workspaceId/:submissionId/decision`

`GET /api/publication-submission-editorial/:workspaceId/:submissionId/decisions`

`GET /api/publication-submission-editorial/:workspaceId/:submissionId/revision`

`PATCH /api/publication-submission-editorial/:workspaceId/:submissionId/revision/:taskId`

هەموو endpoint ـەکان بە `requireAuth` پارێزراون.
## Authorization

هەموو API ـەکان بە requireAuth پارێزراون. بەڵام write ـی بڕیاری editorial (POST /api/publication-submission-editorial/:workspaceId/:submissionId/decision) جیاوازە و تەنها بۆ Firebase custom claim ـی role بە یەکێک لەم نرخانە ڕێگەپێدراوە: admin، professor، editor. ئەمە ڕێگری دەکات لەوەی خاوەنی submission بە تەنیا خۆی بتوانێت بڕیاری قبول، ڕەتکردنەوە یان revision تۆمار بکات.

PATCH ـی revision task هێشتا بۆ خاوەنی submission ـی authenticated بەستراوە، چونکە ئەو کارە بەشێکە لە جێبەجێکردنی revision ـی خۆی.

## UI

app-publication-workflow-panel ئێستا توانای هەیە جۆری بڕیار، note، external reference و revision task ـە structured ـەکان دروست بکات، پاشان submissions و decision history و revision gate نوێ بکاتەوە. ئەگەر user ـەکە role ـی editorial نەبێت، API بە 403 وەڵام دەدات.
## Hardening
P20 بۆ ACCEPT/REJECT receipt ـی P16 بە hash و current version verification دەکات. Revision plan ـیش count، task ID، task order، task content، required flag، plan hash و computed status دەپشکنێت. ئەمە ڕێگری لە plan ـێکی دەستکاریکراو یان inconsistent دەکات.
