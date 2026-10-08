import { sha256 } from './text-sha256.service';
import type { ManuscriptDocument } from './manuscript-assembly.service';

export type SubmissionStatus = 'READY' | 'REVISE' | 'BLOCKED';
export type SubmissionCheckStatus = 'PASS' | 'REVISE' | 'BLOCKED';

export interface PublicationSubmissionPolicy {
  journalName: string;
  manuscriptType?: 'article' | 'review' | 'thesis' | 'book-chapter';
  maxWords?: number;
  maxAbstractWords?: number;
  minKeywords?: number;
  maxKeywords?: number;
  maxReferences?: number;
  blindedReview?: boolean;
  requiredSections?: Array<'abstract' | 'research-question' | 'methodology' | 'chapter' | 'conclusion'>;
  requireCoverLetter?: boolean;
  requireAuthorMetadata?: boolean;
}

export interface SubmissionAuthor {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
}

export interface SubmissionCheck {
  rule: string;
  status: SubmissionCheckStatus;
  details: string;
  action: string;
}

export interface PublicationSubmissionInput {
  manuscript: ManuscriptDocument;
  policy: PublicationSubmissionPolicy;
  keywords?: string[];
  authors?: SubmissionAuthor[];
}

export interface PublicationSubmissionPackage {
  journalName: string;
  manuscriptType: string;
  status: SubmissionStatus;
  checks: SubmissionCheck[];
  wordCount: number;
  abstractWordCount: number;
  keywordCount: number;
  referenceCount: number;
  mainManuscript: ManuscriptDocument;
  titlePage: { title: string; authors: SubmissionAuthor[] } | null;
  coverLetterTemplate: string | null;
  blindedReview: boolean;
  fingerprint: string;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function words(value: string): number {
  return clean(value).split(/\s+/u).filter(Boolean).length;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function makeCoverLetter(journalName: string, title: string, language: 'ku' | 'en' = 'en'): string {
  if (language === 'ku') {
    return `بۆ سەرنووسەری ${journalName}\n\nناونیشانی وتار: ${title}\n\nئەمە نامەی پێشکەشکردنی manuscript ـە. ناوەڕۆکی ئەم نامەیە تەنها template ـە و هیچ بانگەشەیەکی تایبەت بە novelty، peer review، یان یەکەمین بڵاوکردنەوە لەخۆ ناگرێت. تکایە پێش ناردن، زانیارییە تایبەتەکانی نووسەر و policy ـی گۆڤار پڕ بکەرەوە.\n\nلەگەڵ ڕێز،\nتیمی توێژینەوە`;
  }
  return `Dear Editor of ${journalName},\n\nManuscript title: ${title}\n\nPlease find the manuscript prepared for submission. This is a neutral submission template; it does not assert novelty, exclusivity, peer-review status, authorship, or acceptance. Complete any journal-specific declarations before submission.\n\nSincerely,\nResearch Team`;
}

export function buildPublicationSubmissionPackage(input: PublicationSubmissionInput): PublicationSubmissionPackage {
  const policy = input.policy || { journalName: '' };
  const manuscript = input.manuscript;
  const checks: SubmissionCheck[] = [];
  const journalName = clean(policy.journalName);
  const keywords = unique(input.keywords || []);
  const authors = Array.isArray(input.authors) ? input.authors : [];
  const sections = manuscript.sections || [];
  const abstract = sections.find(section => section.type === 'abstract')?.content || '';
  const contentParts = sections.map(section => section.content);
  const wordCount = words(contentParts.join(' '));
  const abstractWordCount = words(abstract);
  const referenceCount = manuscript.bibliography.length;

  if (
    policy.minKeywords !== undefined &&
    policy.maxKeywords !== undefined &&
    policy.minKeywords > policy.maxKeywords
  ) {
    checks.push({
      rule: 'Keyword range',
      status: 'BLOCKED',
      details: 'کەمترین ژمارەی keyword لە زۆرترین ژمارە گەورەترە.',
      action: 'policy ـی keyword range چاک بکە.'
    });
  }

  if (!journalName) checks.push({ rule: 'Journal identity', status: 'BLOCKED', details: 'ناوی گۆڤار نەدراوە.', action: 'ناوی ڕاستیی گۆڤار دابین بکە.' });
  if (manuscript.integrity.structuralStatus !== 'PASS') checks.push({ rule: 'Manuscript integrity', status: 'BLOCKED', details: 'بونیادی manuscript پاس نەکردووە.', action: 'هەڵەکانی manuscript integrity چارەسەر بکە.' });
  if (policy.requiredSections?.length) {
    for (const required of unique(policy.requiredSections)) {
      const exists = sections.some(section => section.type === required && clean(section.content));
      if (!exists) checks.push({ rule: 'Required section: ' + required, status: 'BLOCKED', details: 'بەشی داواکراو نەدۆزرایەوە.', action: 'ئەم بەشە پڕ بکەوە پێش submission.' });
    }
  }
  if (policy.maxWords !== undefined && wordCount > policy.maxWords) checks.push({ rule: 'Word limit', status: 'BLOCKED', details: 'ژمارەی وشەکان ' + wordCount + ' ـە و سەقف ' + policy.maxWords + ' ـە.', action: 'دەقەکە بە سەقفی گۆڤار بگەیەنە.' });
  if (policy.maxAbstractWords !== undefined && abstractWordCount > policy.maxAbstractWords) checks.push({ rule: 'Abstract word limit', status: 'BLOCKED', details: 'پوختە ' + abstractWordCount + ' وشەیە و سەقف ' + policy.maxAbstractWords + ' ـە.', action: 'پوختە کورتتر بکە.' });
  if (!clean(abstract)) checks.push({ rule: 'Abstract presence', status: 'REVISE', details: 'پوختە لە package ـەکەدا نییە.', action: 'پوختەی ڕوون و کورت زیاد بکە.' });
  if (policy.minKeywords !== undefined && keywords.length < policy.minKeywords) checks.push({ rule: 'Minimum keywords', status: 'REVISE', details: 'تەنها ' + keywords.length + ' keyword هەیە.', action: 'بگەیەنە بە کەمترین ژمارەی keyword ـی policy.' });
  if (policy.maxKeywords !== undefined && keywords.length > policy.maxKeywords) checks.push({ rule: 'Maximum keywords', status: 'BLOCKED', details: 'ژمارەی keyword ـەکان زۆرە.', action: 'keyword ـەکان کەم بکە.' });
  if (policy.maxReferences !== undefined && referenceCount > policy.maxReferences) checks.push({ rule: 'Reference limit', status: 'BLOCKED', details: 'ژمارەی سەرچاوەکان ' + referenceCount + ' ـە.', action: 'پێڕستی سەرچاوەکان بەپێی policy کەم بکە.' });
  if (policy.requireAuthorMetadata && authors.length === 0) checks.push({ rule: 'Author metadata', status: 'BLOCKED', details: 'زانیاری نووسەران نییە.', action: 'ناوی نووسەر و زانیاریی پێویست زیاد بکە.' });
  if (policy.requireCoverLetter && !journalName) checks.push({ rule: 'Cover letter', status: 'BLOCKED', details: 'نامەی پێشکەشکردن بێ ناوی گۆڤار دروست ناکرێت.', action: 'ناوی گۆڤار دابین بکە.' });

  if (checks.length === 0) checks.push({ rule: 'Submission baseline', status: 'PASS', details: 'هیچ شکستی policy ـی ناردراو نەدۆزرایەوە.', action: 'هەر پێش ناردن، policy ـی گۆڤار دووبارە پشکنەوە.' });
  const hasBlocked = checks.some(check => check.status === 'BLOCKED');
  const hasRevision = checks.some(check => check.status === 'REVISE');
  const status: SubmissionStatus = hasBlocked ? 'BLOCKED' : hasRevision ? 'REVISE' : 'READY';
  const blindedReview = policy.blindedReview === true;
  const titlePage = blindedReview ? null : { title: manuscript.title, authors } ;
  const coverLetterTemplate = policy.requireCoverLetter ? makeCoverLetter(journalName, manuscript.title, 'en') : null;
  const fingerprint = sha256(JSON.stringify({
    journalName,
    policy,
    keywords,
    authors,
    manuscriptFingerprint: manuscript.integrity.fingerprint,
    status
  }));

  return {
    journalName,
    manuscriptType: policy.manuscriptType || 'article',
    status,
    checks,
    wordCount,
    abstractWordCount,
    keywordCount: keywords.length,
    referenceCount,
    mainManuscript: manuscript,
    titlePage,
    coverLetterTemplate,
    blindedReview,
    fingerprint
  };
}
