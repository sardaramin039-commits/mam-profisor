import { describe, expect, it } from 'vitest';
import { assembleManuscript } from './manuscript-assembly.service';

const base = {
  projectId: 'PRJ-1',
  title: 'توێژینەوەی ئەکادیمی',
  methodology: 'میتۆدی توێژینەوە',
  chapters: [{
    id: 'CH-1',
    title: 'بەشی یەکەم',
    order: 1,
    content: 'ناوەڕۆکی بەشی یەکەم',
    citationIds: ['CIT-1']
  }],
  citations: [{
    citationId: 'CIT-1',
    sourceId: 'SRC-1',
    evidenceId: 'EVI-1',
    inText: '(Bandura, 1977)',
    bibliography: 'Bandura, A. (1977). Social Learning Theory.',
    verified: true
  }]
};

describe('P10 manuscript assembly', () => {
  it('assembles ordered chapters and only referenced verified citations', () => {
    const result = assembleManuscript(base);
    expect(result.integrity.structuralStatus).toBe('PASS');
    expect(result.sections.some(section => section.type === 'chapter')).toBe(true);
    expect(result.citations).toHaveLength(1);
    expect(result.bibliography).toHaveLength(1);
    expect(result.integrity.fingerprint).toHaveLength(64);
  });

  it('rejects duplicate chapter ids and non-contiguous ordering', () => {
    const result = assembleManuscript({
      ...base,
      chapters: [
        base.chapters[0],
        { ...base.chapters[0], id: 'CH-2', order: 3, title: 'بەشی دووەم' }
      ]
    });
    expect(result.integrity.structuralStatus).toBe('REJECT');
    expect(result.integrity.errors.some(error => error.includes('contiguous'))).toBe(true);
  });

  it('rejects references to unverified citations', () => {
    const result = assembleManuscript({
      ...base,
      citations: [{ ...base.citations[0], verified: false }]
    });
    expect(result.integrity.structuralStatus).toBe('REJECT');
    expect(result.integrity.errors.some(error => error.includes('not verified'))).toBe(true);
    expect(result.citations).toHaveLength(0);
  });

  it('detects a referenced citation missing from the citation set', () => {
    const result = assembleManuscript({
      ...base,
      citations: []
    });
    expect(result.integrity.structuralStatus).toBe('REJECT');
    expect(result.integrity.errors.some(error => error.includes('missing from the citation set'))).toBe(true);
  });
});
