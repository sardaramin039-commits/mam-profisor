# P11–P15 Integrated Publication Chain

P11 تا P15 بە زنجیرەیەکی authenticated و server-gated کار دەکەن.

## P11 — Publication & Defense Readiness
پێش readiness، P9 control-plane دەخوێندرێتەوە و citation ـەکان لە P7 memory بە server verification دەسەلمێنرێن. Client ناتوانێت verification یان exportBlocked بە تەنیا بگۆڕێت.

## P12 — Defense Rehearsal
P12 manuscript structure لە server دووبارە assemble دەکات و metrics ـی citation لە manuscript ـە پشتڕاستکراوەکە وەردەگرێت. P9 gate بۆ بڕیاری کۆتایی authoritative ـە.

## P13 — Submission Package
P13 تەنها لە research state ـێکی P9 ئامادە package ـی publication دروست دەکات. Citation ـەکان پێش package build لە P7 server-side evidence ـەوە resolve دەکرێن.

## P14 — Submission Integrity
P14 package ـی P13 لە server دوبارە دروست دەکات و consistency ـی fingerprint، counts، references، status و blinded-review separation پشکنێت. P9 gate هەروەها authoritative ـە.

## P15 — Submission Lifecycle
P15 تەنها package ـێک دەباتە lifecycle کە P9 blocked نەبێت و P14 readyToSubmit بێت. generic transition ناتوانێت READY دروست بکات. mark-ready تەنها لە dedicated endpoint و دوای integrity gate دەکرێت.

## Shared security contract
`publication-research-gate.service.ts` ناوەندی server-side ـی verification ـی citation ـەکانە. evidence تەنها کاتێک verified دادەنرێت کە P7 memory evidence item ـێکی `verified: true` هەبێت و `sourceId` و `evidenceId` هاوتا بن.

## Lifecycle guarantee
هیچ دۆخێک لە P11–P15 نابێت بانگەشەی قبوڵبوونی گۆڤار، peer review، یان ناردنی ڕاستەقینەی بۆ publisher بکات. `SUBMITTED` تەنها event ـێکی تۆمارکراوی user ـە.

## Automated contract
`scripts/p11-p15-publication-chain-test.mjs` readiness، rehearsal، package، integrity و lifecycle policy پشکنێت؛ هەروەها route ـەکانی P11–P15 لە بوونی P9 gate و P7 citation gate دڵنیا دەکات.