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

* **`VERIFIED` Source + Evidence Chunk** ➔ `citationEligible: true`, Citation generated.
* **`PARTIALLY_VERIFIED` Source** ➔ `citationEligible: false`, Citation blocked.
* **`UNVERIFIED` Source or Missing Chunk** ➔ `citationEligible: false`, Citation blocked, `gapDetected: true` flagged.

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
