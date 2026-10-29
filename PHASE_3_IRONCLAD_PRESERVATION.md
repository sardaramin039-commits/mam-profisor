# Mam Professor — Phase 3 Ironclad Code Preservation

ئەم قۆناغە گەیتێکی خودکار بۆ پاراستنی بنەمای کۆد زیاد دەکات. گەیتەکە تەنها دۆخی repository دەپشکنێت؛ هیچ فایلێک ناگۆڕێت، ناگەڕێنێتەوە و overwrite ناکات.

## یاساکانی گەیت

1. فایلەکانی source، template و style لە `src/` و `app/applet/src/` نابێت لە ٥٠٠ دێڕ زیاتر بن.
2. marker ـەکانی کۆدی ناتەواو یان truncation وەک `// ... rest of the code` و marker ـە کوردییە ناسراوەکان ڕەت دەکرێنەوە.
3. هەر lockfile ـێکی package manager ـی تر ڕێگەپێدراو نییە؛ بەڕێوەبردنی وابەستەییەکان تەنها بە npm و `package-lock.json` دەبێت.
4. سڕینەوەی فایل لە `src/` یان `app/applet/src/` پێویستی بە `[deletion-approved]` لە نامەی commit ـی سڕینەوەکە هەیە.
5. گۆڕینی UI/template/style/component پێویستی بە `[ui-approved]` لە نامەی هەر commit ـێک هەیە کە ئەو فایلە دەگۆڕێت.
6. گەیتەکە read-only ـە؛ هیچ ڕێکخستن، restore، auto-fix یان overwrite ناکات.

## Workflow و جێبەجێکردن

Workflow: `.github/workflows/phase-3-preservation.yml`

Script: `scripts/phase-3-preservation-gate.mjs`

جێبەجێکردن بە npm:

```bash
npm run phase3:preserve
```

Workflow ـەکە لە push، pull request بۆ `main` و `workflow_dispatch` کار دەکات. CI ـی سەرەکییش هەمان گەیت جێبەجێ دەکات، بۆیە تاقیکردنەوەکە تەنها بە دەستی بەکارهێنەر پشتبەستوو نییە.

## مەرجی تەواوبوون

قۆناغی ٣ تەنها کاتێک سەرکەوتووە کە گەیتەکە لە workflow ـی تایبەتی و CI ـی سەرەکی هەردووکیاندا سەوز بێت، و هەر جۆرە سڕینەوە یان گۆڕینی UI بە marker ـی مۆڵەتدار پشتڕاست کرابێتەوە.

ئەم گەیتە جێگرەوەی test، typecheck، build، security review یان تاقیکردنەوەی runtime نییە؛ پارێزەرێکی زیادەیە بۆیان.
