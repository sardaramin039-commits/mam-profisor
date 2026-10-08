# P16 — Immutable Submission Receipt

P16 receipt ـی ناردنی submission بە شێوەیەکی immutable record دروست دەکات.

## Contract
- Receipt بە submission ID، user، workspace، journal، manuscript type، package fingerprint و optional submission version ID دەبەسترێت.
- note یان external reference پێویستە بۆ دروستکردنی receipt.
- immutableHash لەسەر canonical payload دروست دەکرێت.
- `verifySubmissionReceipt` hash ـی receipt و binding ـە سەرەکییەکان دووبارە دەپشکنێت.

## Runtime
Receipt لە transaction ـی P15 `SUBMITTED` دروست دەکرێت و GET ـی receipt پێش گەڕاندنەوە verification دەکات.

## Security
P20 بڕیاری ACCEPT/REJECT تەنها کاتێک تۆمار دەکرێت کە receipt ـەکە لە server ـدا verify کراوە و بە current submission version ـەوە گرێدراوە.

P16 receipt بەڵگەی وەرگرتنی ڕاستەقینەی گۆڤار نییە؛ تەنها event ـێکی تۆمارکراوی سیستەمە.