# P7–P10 Integrated Research Chain

P7 تا P10 لە Mam Professor وەک یەک زنجیرەی control-plane کار دەکەن.

## P7 — Research Memory

Research memory تەنها archive نییە. بڕگەکان بە جۆرەکانی note، claim، evidence، source، summary و draft_chapter هەڵدەگیرێن. Metrics ـەکانی claim/source و evidence coverage لەسەر memory items دووبارە هەژمار دەکرێن. Evidence coverage بۆ claim ـەکان بە metadata ـی claimId/claimIds پەیوەست دەکرێت.

گەڕانی پارێزراو:
GET /api/research-memory/:projectId/search?q=...

پوختەی AI دوای دروستبوون وەک summary item هەڵدەگیرێت.

## P8 — Research Workspace

Workspace هەمان شوێنی کاری بەکارهێنەرە. autosave و version history پارێزراون. کاتێک multi-agent orchestration تەواو دەبێت، تەنها source/claim/evidence ـی server-verified بۆ memory زیاد دەکرێن.

Orchestration هەروەها دوو decision ـی traceable بۆ source selection و writing تۆمار دەکات، پاشان P9 control-plane snapshot ـی نوێ دەگەڕێنێتەوە.

## P9 — Validation

P9 fail-closed ـە. export بۆ manuscript ڕێگەپێدراو نییە تا methodology، verified evidence، decision traceability و evidence coverage ـی پێویست جێبەجێ نەکرێن.

Control-plane ئێستا blockers و readyForManuscript هەیە بۆ ئەوەی هۆکاری قفل‌بوونی export دیار بێت.

Methodology خۆکارانە دروست ناکرێت. دەبێت بە شێوەیەکی ڕوون لە memory تۆمار و بە methodology tag نیشان بدرێت.

## P10 — Manuscript Assembly & Export

P10 citation ـی client ـەکە بە verified دانانێت. Server دەبێت evidence item ـێکی verified بە هەمان sourceId و evidenceId بدۆزێتەوە، پاشان citation verified دادەنێت.

Manuscript ـێکی structurally valid و gate-approved بە SHA-256 fingerprint لە backend پاشەکەوت دەکرێت. ئەگەر persistence شکستی هێنا، export بە 503 و fail-closed وەستێت.

## Release invariant

هیچ manuscript export ـێک بە تەواوی release-ready نییە مەگەر:
- P7 memory state هەبێت.
- P8 workspace state و version trace هەبێت.
- P9 control-plane readyForManuscript=true بێت.
- P10 structural integrity PASS بێت.
- citation ـە reference کراوەکان لەلایەن server ـەوە verified بکرێن.
- manuscript fingerprint بە سەرکەوتوویی persist بکرێت.

## Test contract

scripts/p7-p10-research-chain-test.mjs policy و manuscript integrity ـی زنجیرەکە پشکنین دەکات و لە Academic Integrity CI و Quality Gate ـدا جێبەجێ دەکرێت.
