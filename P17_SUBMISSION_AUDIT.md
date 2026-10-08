# P17 — Immutable Submission Audit Chain

P17 هەر lifecycle transition ـێک بە audit event ـێکی hash-chained پەیوەست دەکات.

## Contract
- هەر event ـێک version و previousHash و eventHash ـی هەیە.
- eventHash لە canonical event payload دروست دەکرێت.
- زنجیرەکە sequence، previousHash، state continuity، head hash و event immutability دەپشکنێت.
- duplicate event ID و duplicate version ڕەت دەکرێنەوە.
- transition ـی هەر event ـێک دەبێت لەگەڵ P15 lifecycle policy گونجاو بێت.

## Legacy
record ـی کۆن دەتوانێت legacy anchor هەبێت، بەڵام دۆخی `LEGACY_RECONSTRUCTED` بە مانای verification ـی تەواوی مێژووی کۆن نییە.

## Security boundary
Audit event ـەکان لە backend transaction ـەکاندا زیاد دەکرێن. API ـی گشتی بۆ overwrite ـکردنی audit chain نییە.

P17 دڵنیایی لە integrity و traceability دەدات؛ factual correctness یان قبوڵبوونی publication پشتڕاست ناکات.
## Hardening
Audit verification ئێستا duplicate event ID/version، submission identity، first-event invariant، hash chain، lifecycle state continuity و validity ـی transition ـەکان لەگەڵ P15 policy دەپشکنێت.
