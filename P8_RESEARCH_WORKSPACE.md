# 🏛️ P8 — Research Workspace Engine

## 🎯 ئامانج و فەلسەفەی P8

بزوێنەری **P8** ئامرازی سەرەکیی واڕکسپەیسی توێژینەوەی ئەکادیمییە. تەواوی دەرچووەکانی 10 بریکارەکە، بزوێنەری RAG، گرافی ادعا و بەڵگەکان و پاشەکەوتی خودکاری بەشەکانی تێزەکە لەم شوێنەدا یەکدەگرن.

---

## 🛠️ API & Endpoints

* `GET /api/workspace/:workspaceId`
* `POST /api/workspace/:workspaceId/save`
* `POST /api/workspace/:workspaceId/orchestrate`
## Integrated P7/P8/P9 handoff
Workspace orchestration now hydrates the research memory first, runs the academic multi-agent pipeline, and stores only server-verified source/claim/evidence artifacts back into P7 memory. It also records traceable AI decisions for source selection and writing, creates the research version, and returns the fresh P9 control-plane snapshot in the orchestration response.

The handoff is deliberately fail-closed: unverified sources are not promoted into research memory as verified evidence, and the workspace integrity score is zero while either the academic QA gate or the research export gate is blocked.
