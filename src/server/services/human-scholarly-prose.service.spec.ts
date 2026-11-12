import { describe, expect, it } from 'vitest';
import { HumanScholarlyProseService } from './human-scholarly-prose.service';

describe('human scholarly prose safety', () => {
  it('accepts stylistic refinement when protected citations are preserved', () => {
    const service = new HumanScholarlyProseService();
    expect(
      service.isSafeRefinement(
        'ئەم داتا پشتیوانی لە ئەنجامەکە دەکات (Bandura, 1977).',
        'داتا نوێکراوەکە پشتگیریی بەهێزتر لە ئەنجامەکە پیشان دەدات (Bandura, 1977).',
        ['(Bandura, 1977)']
      )
    ).toBe(true);
  });

  it('rejects refinement that drops a protected citation', () => {
    const service = new HumanScholarlyProseService();
    expect(
      service.isSafeRefinement(
        'ئەم ئەنجامە لەگەڵ ئەدەبیاتەکە هاوتایە (Bandura, 1977).',
        'ئەم ئەنجامە لەگەڵ ئەدەبیاتەکە هاوتایە.',
        ['(Bandura, 1977)']
      )
    ).toBe(false);
  });

  it('automatically protects numbered citation markers', () => {
    const service = new HumanScholarlyProseService();
    expect(
      service.isSafeRefinement(
        'بەڵگەکە پشتیوانی لەم دیدگایە دەکات [1, 3].',
        'بەڵگەکە پشتیوانی لەم دیدگایە بە شێوەیەکی ڕوون دەکات.',
        []
      )
    ).toBe(false);
  });
});
