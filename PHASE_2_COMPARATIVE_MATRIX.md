# Mam Professor — Phase 2 Comparative Matrix

## 1. مەبەست

ئەم سندە matrix ـی بەراوردکاریی قۆناغی ٢ ـە. بنەمای بەراورد باری ڕاستەقینەی repository ـی `main` ـە، و دۆخی ئامانجیش بە پێوەرەکانی production-readiness، academic integrity، Kurdish-first UX و modular architecture دیاری کراوە.

**یاسای کار:** هیچ توانایەک بە «تەواو» دانانرێت تەنها چونکە فایل یان workflow ـێکی بۆ هەیە؛ دەبێت evidence ـی جێبەجێبوون و validation هەبێت.

## 2. Comparative Matrix

| بواری هەڵسەنگاندن | باری ئێستا | دۆخی ئامانج | Gap | بڕیاری قۆناغی ٢ |
|---|---|---|---|---|
| Modular architecture | `src/app/app.ts` کەمە و logic ـەکە لە module/service ـەکان دابەش کراوە؛ بەڵام هێشتا ژمارەیەک فایل نزیک لە ٥٠٠ دێرن | هەموو logic ـە گرنگەکان بە module ـی بچووک، تایبەتمەند و تاقیکراو | Medium | پاراستنی modularization و قەدەغەکردنی گەورەبوونی نوێ |
| File-size governance | `scripts/verify-file-line-limits.mjs` سنووری ٥٠٠ دێر دیاری دەکات | هیچ فایلێکی source/template لە ٥٠٠ دێر زیاتر نەبێت | Low/verification-dependent | line-limit بە release gate بمێنێتەوە |
| npm reproducibility | `package-lock.json` هەیە و root dependency ranges لەگەڵ `package.json` هاوتان | `npm ci` لە CI و lockfile ـی یەکگرتوو | Low | npm-only بمێنێت؛ Bun lockfile نەگەڕێنرێتەوە |
| Type safety | `typecheck` workflow و script هەیە | zero TypeScript build/type errors | Medium/verification-dependent | typecheck هەر release gate بێت |
| Lint quality | `ng lint` لە CI هەیە | lint بێ error و warning ـی پێشگیری‌پێکراو | Medium/verification-dependent | lint validation بەردەوام بێت |
| Unit/contract testing | unit test، server contract test و integrity test scripts هەن | critical academic workflows coverage ـی تاقیکراو هەبێت | Medium | زیادکردنی coverage تەنها لە شوێنی risk ـدار |
| Browser E2E | Playwright + Chromium workflow هەیە؛ splash/workspace، editorial decision، resubmission و auth boundary دەپشکنێت | critical user journeys لە browser ـدا pass بن | Medium/CI-dependent | test coverage پارێزراو و بەردەوام |
| CI reliability | workflow ـەکان هەن، بەڵام دوا run ـەکان fail بوون بەبێ step/log ـی بەردەست؛ rerun ـەکانیش پێویستیان بە چاودێری هەیە | CI result باید evidence ـدار و reproducible بێت | High | کۆد لە CI outage جیا بکرێتەوە؛ release بێ pass ـی حقیقی وەلا نەکرێت |
| Academic evidence grounding | P5 evidence/citation gate و provenance contract هەیە | citation تەنها لە evidence ـی VERIFIED/full-text/server-verified-fulltext | Low/verification-dependent | gate ـەکە نەگۆڕدرێت، و test ـەکان پارێزراو بن |
| Multi-agent architecture | P6 orchestration و agent roles هەیە | agent pipeline بڕیارەکەی traceable و QA-gated بێت | Medium | agent logic لە UI جیا بمێنێتەوە |
| Security/auth boundary | release checklist و protected endpoint checks هەن | protected academic APIs بە auth و secret management پارێزراو بن | Medium/verification-dependent | endpoint contract ـەکان بەردەوام test بکرێن |
| Runtime smoke | `release:smoke` لە script/workflow ـدا هەیە | startup، docs، auth، CORS و security headers بە test پشتڕاست بکرێن | Medium | smoke gate بۆ release mandatory بێت |
| Kurdish-first localization | کۆدەکە Kurdish UI و RTL workflows لە E2E دا تاقیدەکاتەوە | Kurdish/Sorani text و RTL هەرگیز بە refactor ـی نوێ نەشکێنرێت | Low/verification-dependent | localization preservation rule بەهێز بمێنێت |
| UI/UX stability | قۆناغی ١ بە ئەنقەست UI ـی بنەڕەتی نەگۆڕیوە | هەر upgrade ـێک UX ـی بەکارهێنەر خراب نەکات | Medium | تا داواکاریی ڕاستەوخۆی UI نەبێت، redesign ناکرێت |
| Fake/synthetic citations | anti-hallucination و citation eligibility checks هەن | zero fabricated citations | Low/verification-dependent | integrity audit release gate بێت |
| Release documentation | production checklist و P13–P20 docs هەن | release decision لەسەر evidence ـی automated + manual بێت | Low | checklist یەکگرتوو بمێنێت |

## 3. زۆرترین Gap ـەکان

### A. CI ـی راستەقینە
بەرزترین gap لە ئێستادا CI verification ـە، نە بنەمای معماری. Workflow ـەکان بە شێوەیەکی پێویست دانراون، بەڵام دوا run ـەکان fail بوون بە شێوەیەک کە step/log ـی normal ـیان ناداتە دەست. بۆیە «CI configured» نابێت بە «CI passed» هەژمار بکرێت.

### B. Verification > Presence
لە repository ـەکەدا script و workflow ـی زۆر هەیە. ئەمە بەخۆی evidence ـی جێبەجێبوونی feature نییە. بۆ release، سێ ئاست دەبێت جیا بکرێنەوە:

1. **Implemented** — کۆد/contract هەیە.
2. **Validated** — test یان audit سەرکەوتووە.
3. **Release-ready** — validation لە CI ـی سەوز و reproducible ـدا دووبارەکراوەتەوە.

### C. Modularization
ئێستا architecture بەرەو modular بوونی باش چووە و `app.ts` کەمە، بەڵام هەندێک فایل هێشتا نزیک لە ceiling ـی ٥٠٠ دێرن. لە قۆناغەکانی دواتر نابێت logic ـی نوێ بخرێتە ناو ئەو فایلانە بۆ ئەوەی ceiling نەشکێت.

## 4. پێوانەی بڕیار

دۆخی قۆناغی ٢ بەم شێوەیە هەڵسەنگێنرێت:

- **GREEN:** feature implemented + test/audit passed + no regression evidence.
- **AMBER:** implementation هەیە، بەڵام verification ناتەواوە.
- **RED:** feature شکستی build/runtime/integrity دروست دەکات یان evidence ـی پێچەوانە هەیە.

لە باری ئێستادا، architecture و npm governance زۆربەیان **GREEN/AMBER** ـن؛ CI verification بەهۆی run ـە شکست‌خواردووەکان **RED تا کاتی validation ـی سەوزی نوێ** ـە.

## 5. Gate ـی چوونە قۆناغی ٣

قۆناغی ٣ دەبێت تەنها دوای ئەمانە بۆتەوە:

- source/template line-limit بەسەرچوو نەبێت.
- typecheck، lint، unit/contract tests و integrity audit pass بن.
- production build pass بێت.
- browser E2E pass بێت.
- runtime smoke pass بێت.
- dependency security audit بێ high/critical blocker بۆ release.
- هیچ fabricated citation یان provenance ـی نەناسراو لە citation pipeline ـدا ڕێگەپێدراو نەبێت.

## 6. کۆتایی

قۆناغی ٢ بە ئامانجی «زیادکردنی feature» نییە؛ بەڵکو بڕیارێکی زانستییە بۆ ئەوەی بزانرێت:

**چی بەڕاستی هەیە، چی validation ـی هەیە، چی هێشتا gap ـە، و چی نابێت بەبێ evidence بە تەواوکراو هەژمار بکرێت.**

ئەم matrix ـە بنەمای بڕیار بۆ قۆناغەکانی دواترە.
