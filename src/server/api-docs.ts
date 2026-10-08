import { Router, Request, Response } from 'express';

export function createApiDocsRouter(): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const html = `<!DOCTYPE html>
<html lang="km" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harvard Academic AI Studio - API Documentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
  <div class="max-w-5xl mx-auto space-y-8">
    <div class="border-b border-slate-800 pb-6">
      <span class="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-mono font-bold">API OpenAPI v2.5.0</span>
      <h1 class="text-3xl font-bold mt-3 text-amber-400 font-serif">بەڵگەنامەی فەرمیی API (Harvard Academic AI Studio)</h1>
      <p class="text-slate-400 text-sm mt-1">سەرجەم ڕاوتەکانی Backend بۆ شیکاریی زانستی، کتێبخانەی دیجیتاڵی، و ئامرازە ژیرەکان.</p>
    </div>

    <!-- API Route Card 1 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-emerald-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/ai-tools/execute</code>
      </div>
      <p class="text-slate-300 text-xs">جێبەجێکردنی ٢٠ ئامرازی ژیریی دەستکردی توێژینەوە (ئامرازەکانی 61 بۆ 80).</p>
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
        Payload: { "toolId": "auto_citation_fixer" | "abstract_generator" | ..., "inputText": "...", "options": { "style": "APA" } }
      </div>
    </div>

    <!-- API Route Card 2 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-blue-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">GET</span>
        <code class="text-amber-300 font-mono text-sm">/api/library/search</code>
      </div>
      <p class="text-slate-300 text-xs">گەڕانی سەرانسەری لە کتێبخانەی دیجیتاڵی و سەرچاوە کراوەکان.</p>
      <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-blue-400">
        Query Params: ?q=machine+learning&category=all&page=1
      </div>
    </div>

    <!-- API Route Card 3 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-purple-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/search</code>
      </div>
      <p class="text-slate-300 text-xs">مۆتۆڕی گەڕانی زانستیی تەواوکار (Semantic Scholar / CrossRef / ArXiv / OpenAlex).</p>
    </div>

    <!-- API Route Card 4 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-rose-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-integrity/:workspaceId/integrity</code>
      </div>
      <p class="text-slate-300 text-xs">P14 پشکنینی کۆتاییی integrity بۆ manuscript و submission package؛ دۆخەکان READY / REVISE / BLOCKED.</p>
    </div>

    <!-- API Route Card 5 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-cyan-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/transition</code>
      </div>
      <p class="text-slate-300 text-xs">P15 lifecycle ـی submission؛ تەنها transition ـە یاسادارەکان وەردەگرێت و READY بە ڕێگای P14 ـەوە پارێزراوە.</p>
    </div>

    <!-- API Route Card 6 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-amber-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">GET</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/:submissionId/receipt</code>
      </div>
      <p class="text-slate-300 text-xs">P16 immutable submission receipt؛ fingerprint و کاتی ناردن و بەڵگەی ناردن بە یەک hash ـی پارێزراو پەیوەستە.</p>
    </div>

    <!-- API Route Card 7 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-indigo-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">GET</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/:submissionId/audit</code>
      </div>
      <p class="text-slate-300 text-xs">P17 immutable audit-chain verification؛ version، state، previousHash و auditHeadHash دەپشکنێت.</p>
    </div>

    <!-- API Route Card 8 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-sky-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/:submissionId/initialize-audit</code>
      </div>
      <p class="text-slate-300 text-xs">بۆ submission ـە کۆنەکان legacy audit anchor دادەنێت؛ مێژووی پێش P17 بە VERIFIED ناژمێرێت.</p>
    </div>

    <!-- API Route Card 9 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-violet-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/:submissionId/resubmit</code>
      </div>
      <p class="text-slate-300 text-xs">P18 دووبارەناردنی integrity-gated؛ package ـی نوێ دەبێت P14 پاس بکات و fingerprint ـی جیاواز هەبێت.</p>
    </div>

    <!-- API Route Card 10 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-fuchsia-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">GET</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/:submissionId/versions</code>
      </div>
      <p class="text-slate-300 text-xs">مێژووی version ـەکانی package و verification ـی chain ـی fingerprint.</p>
    </div>

    <!-- API Route Card 11 -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
      <div class="flex items-center gap-3">
        <span class="bg-teal-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">POST</span>
        <code class="text-amber-300 font-mono text-sm">/api/publication-submission-lifecycle/:workspaceId/:submissionId/initialize</code>
      </div>
      <p class="text-slate-300 text-xs">P15 ـی کۆن بۆ P18؛ legacy version snapshot دروست دەکات بەبێ بانگەشەی verification ـی مێژووی کۆن.</p>
    </div>

    <div class="text-center text-slate-500 text-xs pt-6 border-t border-slate-800">
      Harvard Academic AI Platform &copy; 2026. All security & proxy headers configured.
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  return router;
}
