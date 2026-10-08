# Mam Professor — Phase 4 Release Verification

## ئامانج

قۆناغی ٤ زنجیرەی release ـەکان بە contract ـێکی خودکار پشتڕاست دەکات:

**Repository contract → CI contract → Preservation contract → Academic integrity contract → Release contract**

## ئەوەی gate ـەکە دەپشکنێت

- `package.json` و `package-lock.json` ـی npm و lockfileVersion 3.
- نەبوونی `bun.lock` و `bun.lockb`.
- بوونی script ـە سەرەکییەکانی build، typecheck، lint، line-limit، release check و release smoke.
- یەکگرتوویی workflow ـەکانی CI لە Node 22.22.2، checkout/setup-node، permissions و timeout.
- بوونی quality commands: test، line-limit، release-check، typecheck، lint، build، E2E، runtime smoke و dependency audit.
- پابەندی Phase 3 preservation gate.
- پابەندی release-readiness/security contract.
- نەبوونی source deletion بەبێ مۆڵەتی `[deletion-approved]`.
- دروستکردنی JSON report لە هەر CI run ـێک.

## ڕێسای release

`PASS` تەنها ئەوکاتەیە کە هیچ contract violation ـێک نەبێت.

`WARNING` دەتوانێت هەبێت، بەڵام warning نابێت بە خۆی وەک PASS هەژمار بکرێت.

ئەم gate ـە جێگرەوەی unit test، build، E2E، security audit یان runtime smoke نییە؛ بەڵکو دڵنیایی دەدات ئەو gate ـانە بە شێوەی یەکگرتوو و بەڵگەدار بانگکراون.

## فایلەکان

`scripts/phase-4-release-verification.mjs`

`.github/workflows/phase-4-release-verification.yml`
