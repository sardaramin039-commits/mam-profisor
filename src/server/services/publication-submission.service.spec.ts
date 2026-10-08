import { describe, expect, it } from 'vitest';
import { assembleManuscript } from './manuscript-assembly.service';
import { buildPublicationSubmissionPackage } from './publication-submission.service';

const manuscript = assembleManuscript({
  projectId: 'P13-1',
  title: 'توێژینەوەی تاقیکاری',
  abstract: 'پوختەی توێژینەوە',
  researchQuestion: 'پرسیاری توێژینەوە',
  methodology: 'میتۆد و validation',
  chapters: [{ id: 'CH-1', title: 'بەشی یەکەم', order: 1, content: 'ناوەڕۆکی بەش' }],
  conclusion: 'ئەنجام',
  citations: []
});

describe('P13 publication submission package', () => {
  it('builds a ready package from journal policy', () => {
    const result = buildPublicationSubmissionPackage({
      manuscript,
      policy: {
        journalName: 'Test Journal',
        manuscriptType: 'article',
        maxWords: 1000,
        maxAbstractWords: 100,
        minKeywords: 2,
        maxKeywords: 5,
        maxReferences: 10,
        requiredSections: ['abstract', 'methodology', 'chapter', 'conclusion'],
        requireAuthorMetadata: true,
        requireCoverLetter: true
      },
      keywords: ['education', 'research'],
      authors: [{ name: 'Test Author' }]
    });
    expect(result.status).toBe('READY');
    expect(result.coverLetterTemplate).toContain('Test Journal');
    expect(result.titlePage?.authors).toHaveLength(1);
  });

  it('blocks packages that exceed the supplied word limit', () => {
    const result = buildPublicationSubmissionPackage({
      manuscript: { ...manuscript, sections: [{ type: 'chapter', title: 'بەش', content: 'وشە '.repeat(30), order: 1 }] },
      policy: { journalName: 'Test Journal', maxWords: 10 }
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.checks.some(item => item.rule === 'Word limit')).toBe(true);
  });

  it('does not expose a title page for blinded review', () => {
    const result = buildPublicationSubmissionPackage({
      manuscript,
      policy: { journalName: 'Test Journal', blindedReview: true },
      authors: [{ name: 'Private Author' }]
    });
    expect(result.blindedReview).toBe(true);
    expect(result.titlePage).toBeNull();
  });

  it('blocks missing required sections', () => {
    const result = buildPublicationSubmissionPackage({
      manuscript,
      policy: { journalName: 'Test Journal', requiredSections: ['abstract', 'methodology', 'chapter', 'conclusion'] }
    });
    expect(result.status).toBe('READY');
  });

  it('requires author metadata when the journal policy says so', () => {
    const result = buildPublicationSubmissionPackage({
      manuscript,
      policy: { journalName: 'Test Journal', requireAuthorMetadata: true }
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.checks.some(item => item.rule === 'Author metadata')).toBe(true);
  });
});
