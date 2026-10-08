# Mam Professor — Production Release Checklist

ئەم checklist ـە بۆ پێشکەشکردنی release ـی پڕۆژەکەیە.

## Automated gates

The canonical release commands use npm and `package-lock.json`; no Bun workflow is required.

`npm ci`

`npm run line-limit`

`npm run release:check`

`npm run typecheck`

`npm test -- --watch=false`

`npm run lint`

`npm run build`

`npm run release:smoke`

`npm run e2e` (Chromium browser E2E)
`node scripts/p7-p10-research-chain-test.mjs` (integrated P7–P10 research chain)
`node scripts/p11-p15-publication-chain-test.mjs` (integrated P11–P15 publication chain)
`node scripts/p16-p20-submission-chain-test.mjs` (integrated P16–P20 submission chain)

`npm audit --omit=dev --audit-level=high`

`CI Runner Diagnostic` (manual `workflow_dispatch` when GitHub Actions jobs fail before steps appear)

## P13–P20 integrity chain

P13 submission package، P14 integrity، P15 lifecycle، P16 receipt، P17 audit chain، P18 versioning/resubmission، P19 reproducible manifest و P20 editorial/revision management دەبێت بە یەک submission version زنجیرە بکرێن.

P20 revision plan پێش resubmit verification دەکرێت و P18 لە transaction ـی خۆیدا ئەم gate ـە دووبارە پشکنێت.

## Runtime smoke invariants

API docs دەبێت وەڵامی 200 بدات.

P20 protected endpoint بەبێ auth دەبێت 401 بدات.

CORS preflight بۆ PATCH دەبێت 204 بگەڕێنێتەوە و PATCH لە allow-methods ـدا هەبێت.

Security header ـی X-Content-Type-Options دەبێت `nosniff` بێت.

## Security boundaries

Gemini key تەنها لە environment/secret ـی server بەکاربهێنرێت.

P13–P20 API ـەکان بە Firebase ID-token پارێزراون.

Firestore بە default-deny دەستپێدەکات؛ P20 collection ـەکان لە client ڕاستەوخۆ writable نین و دەبێت لە backend guard ـکراو بەڕێوەببرێن.

Production dependency audit بە CI gate کاردەکات؛ هیچ vulnerability ـی high/critical نابێت بە بێ هەڵسەنگاندنی ئاگادارانە بۆ release بگەیەنرێت.


## Browser E2E coverage

Playwright لە CI ـدا بە Chromium جێبەجێ دەکرێت و ئەم flow ـانە پشکنین دەکات: splash بۆ workspace، کردنەوەی publication workflow، دروستکردنی editorial decision لە UI، و 401 protection بۆ endpoint ـی پارێزراو. E2E ـەکان backend ـی publication بە mock route بەکاردهێنن بۆ ئەوەی test ـەکە بە database یان ئەکاونتی production پشت نەبەستێت.
