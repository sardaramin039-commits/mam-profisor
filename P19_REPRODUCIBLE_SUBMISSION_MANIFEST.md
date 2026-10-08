# P19 — Reproducible Submission Manifest

P19 یەک snapshot ـی immutable بۆ submission دروست دەکات تا لە داهاتوودا بتوانرێت بزانرێت کام policy، package، manuscript version و audit state بنەمای ناردن بوون.

## ناوەڕۆکی manifest

manifest هەڵدەگرێت: journal، manuscript type، policy snapshot، policy fingerprint، package fingerprint، manuscript fingerprint، P14 integrity fingerprint، version ID، P17 audit head، counts و کاتی capture.

خۆی manuscript ـی گەورە لە manifest ـدا duplicate ناکرێت؛ fingerprint ـەکان بە document ـە بنەڕەتییەکان پەیوەندی دروست دەکەن.

## Reproducibility

JSON ـی policy بە شێوەی canonical و key-sort کراو fingerprint دەکرێت. immutableHash ـی manifest لەسەر هەمان payload ـی canonical دروست دەکرێت.

هەر گۆڕانێکی policy یان field ـی گرنگ hash ـی manifest دەگۆڕێت و verification ـەکە `INVALID` دەکات.

## Preconditions

manifest تەنها کاتێک freeze دەکرێت کە package ـەکە P14 ـی `READY` بێت، submission lifecycle ـەکە `READY` یان `SUBMITTED` یان `RESUBMITTED` بێت، version snapshot بوونی هەبێت، و hash chain ـی P17 و P18 بە تەواوی `VERIFIED` بن.

Legacy history کە تەنها `LEGACY_RECONSTRUCTED` ـە، بۆ manifest ـی reproducible کافی نییە.

## API

`POST /api/publication-submission-manifest/:workspaceId/capture`

`GET /api/publication-submission-manifest/:workspaceId`

`GET /api/publication-submission-manifest/:workspaceId/:manifestId`

capture لە server ـدا manuscript و policy دوبارە assemble و P14 verify دەکات؛ client ناتوانێت fingerprint ـی ئارەزوومەندانە بنێرێت و بەوە manifest دروست بکات.

## سنووری دڵنیایی

P19 reproducibility ـی تۆمارەکانی ناو سیستەم دەپشکنێت. ئەمە بەڵگەی دروستی ناوەڕۆکی زانستی، قبوڵبوونی گۆڤار، یان پشتڕاستی دەرەکیی submission نییە.