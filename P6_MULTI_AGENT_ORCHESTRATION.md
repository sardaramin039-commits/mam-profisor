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
