import { describe, expect, it } from 'vitest';
import { ManuscriptAssemblyIntegrityService } from './manuscript-assembly-integrity.service';

const service = new ManuscriptAssemblyIntegrityService();

describe('manuscript assembly integrity', () => {
  it('orders sections deterministically and calculates word/page estimates', () => {
    const result = service.validate([
      { sectionId: 'sec-2', title: 'Conclusion', order: 2, body: 'Final synthesis of evidence.' },
      { sectionId: 'sec-1', title: 'Introduction', order: 1, body: 'Research problem and context.' }
    ], []);
    expect(result.readyForExport).toBe(true);
    expect(result.orderedSections.map(section => section.sectionId)).toEqual(['sec-1', 'sec-2']);
    expect(result.wordCount).toBe(7);
    expect(result.estimatedPagesAt350Words).toBe(1);
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('blocks duplicate section IDs and duplicate order values', () => {
    const result = service.validate([
      { sectionId: 's1', title: 'Intro', order: 0, body: 'Research intro.' },
      { sectionId: 's1', title: 'Duplicate ID', order: 1, body: 'Another section.' },
      { sectionId: 's2', title: 'Same order', order: 0, body: 'Duplicate order.' }
    ], []);
    expect(result.readyForExport).toBe(false);
    expect(result.issues.some(issue => issue.code === 'duplicate_section')).toBe(true);
    expect(result.issues.some(issue => issue.code === 'invalid_order')).toBe(true);
    expect(result.contentHash).toBeNull();
  });

  it('blocks unresolved placeholder language and citations absent from the verified set', () => {
    const result = service.validate([{
      sectionId: 's1', title: 'Results', order: 1,
      body: 'The effect was positive [citation needed].',
      citationIds: ['CIT-UNVERIFIED']
    }], []);
    expect(result.readyForExport).toBe(false);
    expect(result.issues.some(issue => issue.code === 'placeholder_text')).toBe(true);
    expect(result.issues.some(issue => issue.code === 'unverified_citation')).toBe(true);
  });

  it('permits only citation IDs present in the supplied verified set', () => {
    const result = service.validate([{
      sectionId: 's1', title: 'Literature review', order: 1,
      body: 'Previous work provides context.', citationIds: ['CIT-1']
    }], ['CIT-1']);
    expect(result.readyForExport).toBe(true);
  });

  it('warns and deduplicates repeated citation identifiers', () => {
    const result = service.validate([{
      sectionId: 's1', title: 'Review', order: 1,
      body: 'A concise review.', citationIds: ['CIT-1', 'CIT-1']
    }], ['CIT-1']);
    expect(result.readyForExport).toBe(true);
    expect(result.orderedSections[0]?.citationIds).toEqual(['CIT-1']);
    expect(result.issues.some(issue => issue.code === 'duplicate_citation' && issue.severity === 'warning')).toBe(true);
  });

  it('blocks malformed and oversized input', () => {
    expect(service.validate([], []).readyForExport).toBe(false);
    expect(service.validate(Array.from({ length: 251 }, (_, index) => ({
      sectionId: 's' + index, title: 'Section', order: index, body: 'Body.'
    })), []).issues[0]?.code).toBe('oversized_manuscript');
    const huge = service.validate([{
      sectionId: 's1', title: 'Long', order: 1, body: 'x'.repeat(1_000_001)
    }], []);
    expect(huge.readyForExport).toBe(false);
  });

  it('produces stable hashes independent of citation ID input order', () => {
    const first = service.validate([{
      sectionId: 's1', title: 'Methods', order: 1, body: 'Study design.',
      citationIds: ['CIT-2', 'CIT-1']
    }], ['CIT-1', 'CIT-2']);
    const second = service.validate([{
      sectionId: 's1', title: 'Methods', order: 1, body: 'Study design.',
      citationIds: ['CIT-1', 'CIT-2']
    }], ['CIT-2', 'CIT-1']);
    expect(first.contentHash).toBe(second.contentHash);
  });
});
