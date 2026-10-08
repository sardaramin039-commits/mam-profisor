import { describe, expect, it } from 'vitest';
import { defenseRehearsalService } from './defense-rehearsal.service';

const base = {
  topic: 'کاریگەرییەکانی تۆڕە کۆمەڵایەتییەکان لە خوێندندا',
  title: 'توێژینەوەی تاقیکاری',
  researchQuestion: 'پرسیاری سەرەکیی توێژینەوە',
  methodology: 'کۆکردنەوەی داتا و validation',
  conclusion: 'ئەنجامی سەرەکی',
  limitations: 'سنووردارییەکانی نموونە',
  contribution: 'بەشدارییە نوێیەکان',
  evidenceSummary: 'evidence و verification',
  chapterTitles: ['پێشەکی', 'میتۆد', 'شیکاری'],
  referencedCitationCount: 3,
  verifiedCitationCount: 3,
  bibliographyCount: 3,
  structuralStatus: 'PASS' as const,
  exportBlocked: false
};

describe('P12 defense rehearsal engine', () => {
  it('prepares a defense session with readiness and questions', () => {
    const result = defenseRehearsalService.prepare(base);
    expect(result.readiness).toBeDefined();
    expect(result.questions.length).toBeGreaterThanOrEqual(5);
    expect(result.questions.every(question => question.id.startsWith('DEF-'))).toBe(true);
  });

  it('assesses a substantial answer instead of marking it missing', () => {
    const session = defenseRehearsalService.prepare(base);
    const result = defenseRehearsalService.assess(
      session.questions[0],
      'پرسیاری سەرەکی بە دیاریکردنی سنووری توێژینەوە و ئامانجی گشتی ڕوون دەکرێتەوە و پەیوەندییەکەی بە بابەتەکە دەردەخات.'
    );
    expect(result.status).not.toBe('MISSING');
    expect(result.score).toBeGreaterThan(0);
  });

  it('marks an empty answer as missing', () => {
    const session = defenseRehearsalService.prepare(base);
    const result = defenseRehearsalService.assess(session.questions[0], '');
    expect(result.status).toBe('MISSING');
    expect(result.score).toBe(0);
  });
});
