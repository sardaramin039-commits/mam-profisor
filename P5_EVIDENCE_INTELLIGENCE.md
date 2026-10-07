# 🏛️ P5 — Evidence Intelligence & Citation-Grounded Generation Engine

## 🎯 ئامانج و فەلسەفەی P5

قۆناغی **P5** بەستنەوەی زنجیرەی **`RAG 2.0 ➔ Evidence ➔ Claim ➔ Citation ➔ Writer`** جێبەجێ دەکات لە ژێر ڕێڕەوی **Citation Eligibility Gate**.

ئەم بزوێنەرە گەرەنتی دەکات کە:
1. **هیچ Citationێکی دەستکرد (Synthetic/Fake Citation)** بەرهەم نەهێنرێت.
2. تەنها ئەو بەڵگانەی کە دارای باری **`VERIFIED`** بن مافی بەکارهێنانیان هەیە وەک Citation.
3. هەر بانگەشەیەک کە لە دەقدا هەیە و سەرچاوەی VERIFIEDی بۆ نەدۆزرایەوە، وەک **Evidence Gap (`Evidence Required`)** تۆمار دەکرێت.

---

## 📐 ئارکیتێکچەری زنجیرەی P5 (Pipeline Architecture)

```text
       Persistent RAG / Vector Store
                     │
                     ▼
          Extracted Evidence Chunks
                     │
                     ▼
      Citation Eligibility Gate (P1 Filter)
          /                     \
         ▼                       ▼
  [UNVERIFIED]             [VERIFIED]
         │                       │
         ▼                       ▼
 ❌ Block Citation        ✅ Validated Evidence
 (Flag Evidence Gap)              │
                                 ▼
                     P2 Claim–Evidence Graph
                                 │
                                 ▼
                 Evidence-Grounded Writer API
```

---

## 🔐 یاساکانی Citation Eligibility Gate

* **`VERIFIED` + `full-text` + `server-verified-fulltext`** ➔ `citationEligible: true`.
* **`VERIFIED` + abstract/snippet** ➔ evidence may be useful for research, but `citationEligible: false`.
* **`PARTIALLY_VERIFIED`** or **`UNVERIFIED`** or missing provenance ➔ `citationEligible: false`, citation blocked, `gapDetected: true`.

---

## 🛠️ API & Services

### Service:
`src/server/services/evidence-grounding.service.ts`

### Route Endpoint:
`POST /api/writing/grounded_generate`

**Request Payload:**
```json
{
  "topic": "زمانەوانیی سۆرانی",
  "prompt": "شیکاری ڕێزمانی سۆرانی بکە",
  "evidenceChunks": [
    {
      "sourceId": "SRC-001",
      "sourceTitle": "فەرهەنگی سۆرانی",
      "chunkText": "بەشەکانی ئاخاوتن لە سۆرانیدا...",
      "verificationStatus": "verified",
      "author": "سەعید",
      "year": "2023"
    }
  ]
}
```

**Response Payload:**
```json
{
  "paragraphs": [
    {
      "paragraphIndex": 1,
      "text": "بەشەکانی ئاخاوتن لە سۆرانیدا رۆڵی سەرەکی دەگێڕن (سەعید، ٢٠٢٣).",
      "claims": [
        {
          "claimId": "CLM-001",
          "sentenceText": "بەشەکانی ئاخاوتن لە سۆرانیدا رۆڵی سەرەکی دەگێڕن",
          "sourceId": "SRC-001",
          "verificationStatus": "verified",
          "citationEligible": true,
          "citationText": "(سەعید، ٢٠٢٣)",
          "confidence": 95,
          "gapDetected": false
        }
      ]
    }
  ],
  "verifiedCitations": [...],
  "evidenceGaps": [...],
  "integrityMetrics": {
    "totalClaims": 1,
    "verifiedClaims": 1,
    "citationEligibleClaims": 1,
    "blockedSyntheticCitations": 0,
    "evidenceCoveragePercentage": 100,
    "eligibilityGateStatus": "PASS"
  }
}
```

---

## 🧪 تاقیکردنەوەکان

فایلی تاقیکردنەوە:
`scripts/p5-evidence-intelligence-test.mjs`

لێدان و ئەنجام:
`node scripts/p5-evidence-intelligence-test.mjs` ➔ **PASS ✅**


## 🔒 Strict Evidence Provenance Contract

ئێستا `Evidence Verified` بە تەنیا مافی Citation ـی کۆتایی نادات. بۆ ئەوەی Claim ـێک `citationEligible: true` بێت، هەمان Evidence دەبێت هەموو ئەمانەی هەبێت:
1. `verificationStatus = verified`
2. `evidenceType = full-text`
3. `provenance = server-verified-fulltext`

`abstract` و `snippet` بۆ discovery و grounding candidate بەکاردێن، بەڵام نابنە citation ـی کۆتایی تا full-text ـی لەلایەن server ـەوە خوێندراو و پشتڕاستکراو بەردەست بێت.
