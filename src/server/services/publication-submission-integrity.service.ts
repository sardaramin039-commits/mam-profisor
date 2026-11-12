import type { PublicationSubmissionPackage, SubmissionCheckStatus } from './publication-submission.service';
import { sha256 } from './text-sha256.service';

export type SubmissionIntegrityStatus = 'READY' | 'REVISE' | 'BLOCKED';

export interface SubmissionIntegrityCheck {
  rule: string;
  status: SubmissionCheckStatus;
  details: string;
  action: string;
}

export interface SubmissionIntegrityInput {
  package: PublicationSubmissionPackage;
}

export interface SubmissionIntegrityManifest {
  journalName: string;
  manuscriptType: string;
  blindedReview: boolean;
  manuscriptFingerprint: string;
  packageFingerprint: string;
  wordCount: number;
  abstractWordCount: number;
  keywordCount: number;
  referenceCount: number;
  checkCount: number;
}

export interface SubmissionIntegrityReport {
  status: SubmissionIntegrityStatus;
  readyToSubmit: boolean;
  checks: SubmissionIntegrityCheck[];
  manifest: SubmissionIntegrityManifest;
  fingerprint: string;
}

const FINGERPRINT = /^[a-f0-9]{64}$/;

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function words(value: string): number {
  return clean(value).split(/\s+/u).filter(Boolean).length;
}

function addCheck(
  checks: SubmissionIntegrityCheck[],
  rule: string,
  status: SubmissionCheckStatus,
  details: string,
  action: string
): void {
  checks.push({ rule, status, details, action });
}

function checkFingerprints(
  pkg: PublicationSubmissionPackage,
  checks: SubmissionIntegrityCheck[]
): void {
  if (!FINGERPRINT.test(pkg.fingerprint)) {
    addCheck(checks, 'Package fingerprint', 'BLOCKED', 'fingerprint ـی package نادروستە.', 'package لە سەرچاوەی server دوبارە دروست بکە.');
  }
  if (!FINGERPRINT.test(pkg.mainManuscript.integrity.fingerprint)) {
    addCheck(checks, 'Manuscript fingerprint', 'BLOCKED', 'fingerprint ـی manuscript نادروستە.', 'manuscript assembly دوبارە ئەنجام بدە.');
  }
}

function checkCounts(
  pkg: PublicationSubmissionPackage,
  checks: SubmissionIntegrityCheck[]
): void {
  const sections = pkg.mainManuscript.sections || [];
  const abstract = sections.find(section => section.type === 'abstract')?.content || '';
  const actualWords = words(sections.map(section => section.content).join(' '));
  const actualAbstractWords = words(abstract);
  const actualReferences = pkg.mainManuscript.bibliography.length;

  if (pkg.wordCount !== actualWords) {
    addCheck(checks, 'Word count consistency', 'BLOCKED', 'wordCount ـی package لەگەڵ manuscript یەکسان نییە.', 'package دوبارە assemble بکە.');
  }
  if (pkg.abstractWordCount !== actualAbstractWords) {
    addCheck(checks, 'Abstract count consistency', 'BLOCKED', 'ژمارەی وشەی پوختە یەکسان نییە.', 'package دوبارە assemble بکە.');
  }
  if (pkg.referenceCount !== actualReferences) {
    addCheck(checks, 'Reference count consistency', 'BLOCKED', 'ژمارەی سەرچاوەکان یەکسان نییە.', 'package دوبارە assemble بکە.');
  }
  if (pkg.keywordCount < 0 || pkg.wordCount < 0 || pkg.abstractWordCount < 0 || pkg.referenceCount < 0) {
    addCheck(checks, 'Count validity', 'BLOCKED', 'ژمارەیەکی نادروست لە package هەیە.', 'ژمارەکانی package ڕێکبخە.');
  }
}

function checkReviewSeparation(
  pkg: PublicationSubmissionPackage,
  checks: SubmissionIntegrityCheck[]
): void {
  if (pkg.blindedReview && pkg.titlePage !== null) {
    addCheck(checks, 'Blinded-review separation', 'BLOCKED', 'title page لە blinded review ـدا نابێت ئاشکرا بکرێت.', 'titlePage لە package بسڕەوە.');
  }
  if (!pkg.blindedReview && pkg.titlePage === null) {
    addCheck(checks, 'Title-page availability', 'REVISE', 'title page بۆ submission ـی نا-blinded نییە.', 'زانیاری title page پڕ بکەوە.');
  }
}

function mapPackageChecks(
  pkg: PublicationSubmissionPackage,
  checks: SubmissionIntegrityCheck[]
): void {
  for (const item of pkg.checks) {
    if (item.status !== 'PASS') {
      addCheck(checks, 'Package check: ' + item.rule, item.status, item.details, item.action);
    }
  }
  if (pkg.status === 'BLOCKED') {
    addCheck(checks, 'Package status', 'BLOCKED', 'package خۆی BLOCKED ـە.', 'هەموو blocker ـەکانی package چارەسەر بکە.');
  } else if (pkg.status === 'REVISE') {
    addCheck(checks, 'Package status', 'REVISE', 'package پێویستی بە چاکسازی هەیە.', 'هەموو revise ـەکان تەواو بکە.');
  }
}

export function verifyPublicationSubmissionIntegrity(
  input: SubmissionIntegrityInput
): SubmissionIntegrityReport {
  const checks: SubmissionIntegrityCheck[] = [];
  const pkg = input.package;

  if (!pkg.mainManuscript || pkg.mainManuscript.integrity.structuralStatus !== 'PASS') {
    addCheck(checks, 'Manuscript structure', 'BLOCKED', 'بونیادی manuscript پاس نەکردووە.', 'manuscript integrity چارەسەر بکە.');
  }

  checkFingerprints(pkg, checks);
  checkCounts(pkg, checks);
  checkReviewSeparation(pkg, checks);
  mapPackageChecks(pkg, checks);

  if (!clean(pkg.journalName)) {
    addCheck(checks, 'Journal identity', 'BLOCKED', 'ناوی گۆڤار لە package ـدا بەتاڵە.', 'ناوی گۆڤاری ڕاست دابین بکە.');
  }

  if (checks.length === 0) {
    addCheck(checks, 'Integrity baseline', 'PASS', 'package و manuscript لە یەک دۆخی جێگیریدا پشکنراون.', 'پێش submission policy ـی گۆڤار دووبارە بپشکنەوە.');
  }

  const hasBlocked = checks.some(check => check.status === 'BLOCKED');
  const hasRevision = checks.some(check => check.status === 'REVISE');
  const status: SubmissionIntegrityStatus = hasBlocked ? 'BLOCKED' : hasRevision ? 'REVISE' : 'READY';
  const manifest: SubmissionIntegrityManifest = {
    journalName: clean(pkg.journalName),
    manuscriptType: clean(pkg.manuscriptType) || 'article',
    blindedReview: pkg.blindedReview === true,
    manuscriptFingerprint: pkg.mainManuscript.integrity.fingerprint,
    packageFingerprint: pkg.fingerprint,
    wordCount: pkg.wordCount,
    abstractWordCount: pkg.abstractWordCount,
    keywordCount: pkg.keywordCount,
    referenceCount: pkg.referenceCount,
    checkCount: checks.length
  };

  return {
    status,
    readyToSubmit: status === 'READY',
    checks,
    manifest,
    fingerprint: sha256(JSON.stringify(manifest))
  };
}
