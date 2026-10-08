# Mam Professor — Phase 3 Ironclad Code Preservation

ئەم قۆناغە پاراستنی بنەڕەتی کۆد بە gate ـی خودکار دەکات.

## Gate ـەکان

1. هیچ source/template/style ـێک نابێت لە ٥٠٠ دێر زیاتر بێت.
2. marker ـەکانی truncation وەک `// ... rest of the code` قەدەغەن.
3. `bun.lock` و `bun.lockb` قەدەغەن؛ package management تەنها npm ـە.
4. سڕینەوەی فایل لە `src/` پێویستی بە مۆڵەتی ڕوون هەیە لە commit message بە `[deletion-approved]`.
5. گۆڕینی UI/template/style/component ـەکان پێویستی بە مۆڵەتی ڕوون هەیە بە `[ui-approved]`.
6. gate ـەکە هیچ کۆدی کۆنی overwrite ناکات؛ تەنها دۆخی repository پشکنین دەکات.

## Workflow

`.github/workflows/phase-3-preservation.yml`

Script:

`scripts/phase-3-preservation-gate.mjs`

## بڕیار

ئەم gate ـە یاساکانی پاراستن دەخاتە ناو CI تا گۆڕانکارییە بێ‌مۆڵەتەکان لە داهاتوودا بگرێت. ئەمە جێگرەوەی test/build نییە؛ بەڵکو پارێزەرێکی زیادەیە بۆیان.
