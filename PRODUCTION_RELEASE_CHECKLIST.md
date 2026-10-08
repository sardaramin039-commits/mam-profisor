# Mam Professor — Production Release Checklist

ئەم checklist ـە بۆ پێشکەشکردنی release ـی پڕۆژەکەیە.

## Automated gates

Final validation marker: run the complete npm, integrity, test, build, security and smoke gates.

The canonical release commands use npm and `package-lock.json`; no Bun workflow is required.

`npm ci`

`npm run line-limit`

`npm run release:check`

`npm run typecheck`

`npm test -- --watch=false`

`npm run lint`

`npm run build`

`npm run release:smoke`

`npm audit --omit=dev --audit-level=high`

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
