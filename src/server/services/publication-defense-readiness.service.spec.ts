import { describe, expect, it } from 'vitest';
import { evaluatePublicationDefenseReadiness } from './publication-defense-readiness.service';

const base = {
  title: 'توێژینەوەی تاقیکاری',
  abstract: 'پوختەی توێژینەوە',
  researchQuestion: 'پرسیاری سەرەکی',
  methodology: 'میتۆدی توێژینەوە',
  conclusion: 'ئەنجامی سەرەکی',
  chapterCount: 3,
  referencedCitationCount: 2,
  verifiedCitationCount: 2,
  bibliographyCount: 2,
  structuralStatus: 'PASS' as const,
  exportBlocked: false,
  topic: 'بابەتی توێژینەوە'
};

describe('P11 publication and defense readiness', () => {
  it('reports ready when all publication gates are satisfied', () => {
    const result = evaluatePublicationDefenseReadiness(base);
    expect(result.publicationStatus).toBe('READY');
    expect(result.defenseStatus).toBe('READY');
    expect(result.publicationScore).toBeGreaterThanOrEqual(85);
    expect(result.defenseQuestions).toHaveLength(5);
  });

  it('blocks publication when export gate is blocked', () => {
    const result = evaluatePublicationDefenseReadiness({ ...base, exportBlocked: true });
    expect(result.publicationStatus).toBe('BLOCKED');
    expect(result.blockers.some(item => item.includes('export gate'))).toBe(true);
  });

  it('blocks publication when referenced citations are not verified', () => {
    const result = evaluatePublicationDefenseReadiness({
      ...base,
      verifiedCitationCount: 1
    });
    expect(result.publicationStatus).toBe('BLOCKED');
    expect(result.blockers.some(item => item.includes('verified'))) .toBe(true);
  });

  it('requires revision when abstract and conclusion are missing', () => {
    const result = evaluatePublicationDefenseReadiness({
      ...base,
      abstract: '',
      conclusion: ''
    });
    expect(result.revisions.length).toBeGreaterThanOrEqual(2);
  });
});

describe('P11 readiness trust boundary', () => {
  it('does not depend on client-supplied QA scores', () => {
    const result = evaluatePublicationDefenseReadiness(base);
    expect(result.publicationStatus).toBe('READY');
    expect(result.defenseStatus).toBe('READY');
  });
});
