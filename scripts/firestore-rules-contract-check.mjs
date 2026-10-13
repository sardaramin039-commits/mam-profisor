import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const rules = readFileSync('firestore.rules', 'utf8');

assert.match(rules, /match\s*\/\{document=\*\*\}[\s\S]*?allow read, write: if false;/,
  'Firestore must keep the global default-deny rule.');
assert.match(rules, /function canReviewSubmission\(data\)[\s\S]*?request\.auth\.token\.get\('role', ''\) in \['reviewer', 'professor', 'admin'\]/,
  'Peer-review writes must require reviewer/professor/admin claims.');
assert.match(rules, /function canReviewSubmission\(data\)[\s\S]*?peer_submissions\/\$\(data\.submissionId\)[\s\S]*?\.data\.userId != request\.auth\.uid/,
  'Reviewers must not review their own submission.');
assert.match(rules, /allow create: if isVerifiedUser\(\)[\s\S]*?isValidReview\(request\.resource\.data\)[\s\S]*?canReviewSubmission\(request\.resource\.data\)/,
  'Peer-review creation must validate the review and submission authorization.');
assert.match(rules, /request\.resource\.data\.reviewerId == resource\.data\.reviewerId[\s\S]*?request\.resource\.data\.submissionId == resource\.data\.submissionId/,
  'Peer-review updates must not reassign the reviewer or change its submission.');
assert.match(rules, /data\.year is int && data\.year >= 1000 && data\.year <= 2100/,
  'Source year validation must not use a stale fixed current-year cutoff.');

console.log('Firestore security contract checks passed.');
