# 🏛️ P6 — Multi-Agent Academic Orchestration Engine

## 🎯 ئامانج و فەلسەفەی P6

قۆناغی **P6** دەستەیەک لە 10 بریکاری ئەی ئای فێرکاری و زانستی پێشکەش دەکات کە بە ڕیزبەند و شێوازی Pipeline لەسەر تێکستی ئەکادیمی کار دەکەن بۆ مسۆگەرکردنی بەرزترین ئاستی ڕاستیی زانستی، دارشتنی زمانی کوردی، هەڵسەنگاندنی هارفەرد، و کۆنترۆڵی جۆریی QA Gate.

---

## 📐 زنجیرەی بریکارەکان (Agent Pipeline)

1. **Research Planner Agent**: داڕشتنی نەخشەی توێژینەوە و هەیکەلی تێزەکە.
2. **Literature Discovery Agent**: دۆزینەوەی سەرچاوە زانستییەکان.
3. **Kurdish Knowledge Graph Agent**: بەستنەوەی چەمکە ڕەسەنەکانی سۆرانی.
4. **Source Verification Agent**: پشکنینی ئاستی متمانەی سەرچاوەکان (P1).
5. **Evidence Extraction Agent**: دەرهێنانی Chunks لە RAG 2.0 (P3/P4).
6. **Claim-Evidence Graph Agent**: داڕشتنی گرافی ادعا-بەڵگەکان (P2).
7. **Kurdish Academic Writer Agent**: نووسینی تێکستی فەرمی بە زمانی کوردیی زانستی (P5).
8. **Harvard Academic Reviewer Agent**: هەڵسەنگاندنی ئەکادیمی بە پێوەرەکانی هارفەرد.
9. **Kurdish Language & Grammar Agent**: ڕاستکردنەوەی ناوخۆیی و زمانی کوردیی سۆرانی.
10. **Academic QA & Integrity Gate Agent**: ڕادەستکردنی بڕیاری کۆتایی (PASS / REJECT / REVISE).

---

## 🛠️ API & Endpoint

### Endpoint:
`POST /api/multi-agent/orchestrate`

**Payload:**
```json
{
  "topic": "زمانەوانیی سۆرانی",
  "discipline": "زمانەوانی",
  "draftText": "پێشەکی توێژینەوە..."
}
```


## Production hardening — Phase 6

P6 ـی ئێستا لە production flow ـدا بە شێوەیەکی پارێزراو جێبەجێ کراوە:

- `POST /api/multi-agent/orchestrate` بە Firebase `requireAuth` پارێزراوە.
- Source Verification پێش Evidence-Grounded Writer جێبەجێ دەکرێت.
- Claim-Evidence Graph تەنها source ـە citation-eligible ـەکان و evidence ـی `full-text` + `server-verified-fulltext` وەردەگرێت.
- source ـی unverified نابێت بە provenance ـی server-verified خۆی بنووسرێت.
- P6 contract test pipeline roles، integrity score و source-count invariants دەپشکنێت.
- Browser E2E بێ authentication بۆ Multi-Agent endpoint چاوەڕێی `401` دەکات.
- P6 contract test لە Academic Integrity CI ـدا mandatory ـە.

### P6 integrity invariant

**No authenticated request → no orchestration.**

**No citation-eligible evidence → no verified claim/citation.**

**No successful QA Gate → final export must remain blocked according to the QA result.**
