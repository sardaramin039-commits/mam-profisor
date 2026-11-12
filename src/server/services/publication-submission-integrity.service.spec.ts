import { describe, expect, it } from 'vitest';
import { assembleManuscript } from './manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from './publication-submission.service';
import { verifyPublicationSubmissionIntegrity } from './publication-submission-integrity.service';

function makePackage() {
  const manuscript = assembleManuscript({
    projectId: 'P14-1',
    title: 'توێژینەوەی ئەکادیمی',
    abstract: 'پوختەی توێژینەوە',
    methodology: 'میتۆد',
    chapters: [{ id: 'CH-1', title: 'بەشی یەکەم', order: 1, content: 'ناوەڕۆک' }],
    conclusion: 'ئەنجام'
  });
  return buildPublicationSubmissionPackage({
    manuscript,
    policy: {
      journalName: 'Test Journal',
      manuscriptType: 'article',
      requiredSections: ['abstract', 'methodology', 'chapter', 'conclusion']
    }
  });
}

describe('P14 publication submission integrity', () => {
  it('marks a consistent ready package as ready to submit', () => {
    const report = verifyPublicationSubmissionIntegrity({ package: makePackage() });
    expect(report.status).toBe('READY');
    expect(report.readyToSubmit).toBe(true);
    expect(report.manifest.checkCount).toBe(1);
    expect(report.fingerprint).toHaveLength(64);
  });

  it('blocks a package with a tampered word count', () => {
    const pkg = makePackage();
    const tampered = { ...pkg, wordCount: pkg.wordCount + 1 };
    const report = verifyPublicationSubmissionIntegrity({ package: tampered });
    expect(report.status).toBe('BLOCKED');
    expect(report.checks.some(item => item.rule === 'Word count consistency')).toBe(true);
  });

  it('blocks blinded-review metadata leakage', () => {
    const pkg = { ...makePackage(), blindedReview: true, titlePage: { title: 'T', authors: [] } };
    const report = verifyPublicationSubmissionIntegrity({ package: pkg });
    expect(report.status).toBe('BLOCKED');
    expect(report.checks.some(item => item.rule === 'Blinded-review separation')).toBe(true);
  });

  it('blocks an invalid package fingerprint', () => {
    const pkg = { ...makePackage(), fingerprint: 'not-a-fingerprint' };
    const report = verifyPublicationSubmissionIntegrity({ package: pkg });
    expect(report.status).toBe('BLOCKED');
    expect(report.checks.some(item => item.rule === 'Package fingerprint')).toBe(true);
  });

  it('propagates revise status without calling the package ready', () => {
    const pkg = { ...makePackage(), status: 'REVISE' as const, checks: [
      { rule: 'Test revision', status: 'REVISE' as const, details: 'revision required', action: 'revise' }
    ] };
    const report = verifyPublicationSubmissionIntegrity({ package: pkg });
    expect(report.status).toBe('REVISE');
    expect(report.readyToSubmit).toBe(false);
  });
});
