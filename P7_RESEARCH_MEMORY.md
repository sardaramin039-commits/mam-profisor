# 🧠 P7 — Research Memory Engine

## 🎯 ئامانج و فەلسەفەی P7

بزوێنەری **P7** بەرپەرسە لە هێشتنەوە و پایداریی یادگەی توێژینەوەی بەکارهێنەر لە سەرانسەری دانیشتنەکاندا (Multi-session persistence). ئەم بزوێنەرە هەموو تێبینی، ئیدعا، بەڵگە، سەرچاوە و پوختەکان لەناو یادگەیەکی ناوەندیی بەڕێوەچوودا هەڵدەگرێت.

---

## 🛠️ API & Endpoints

* `GET /api/research-memory/:projectId`
* `POST /api/research-memory/:projectId/items`
* `POST /api/research-memory/:projectId/summarize`
## Integrated hardening
- Memory metrics are recalculated from stored items, including claim/source counts and evidence coverage linked through metadata.claimId or metadata.claimIds.
- GET /api/research-memory/:projectId/search?q=...&type=claim,evidence provides authenticated retrieval for project memory.
- AI summaries are persisted back into memory as summary items so later sessions can reuse the derived research context.
- Firestore persistence remains fail-safe: an item is added to the in-memory state only after the database batch succeeds.
