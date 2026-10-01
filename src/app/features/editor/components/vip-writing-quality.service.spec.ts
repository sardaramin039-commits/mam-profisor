import { describe, expect, it } from 'vitest';
import { VipWritingQualityService } from './vip-writing-quality.service';

describe('VipWritingQualityService', () => {
  it('does not fabricate a score for insufficient text', () => {
    const service = new VipWritingQualityService();
    const result = service.analyze('دەق', 'phd', 'humanities');
    expect(result.status).toBe('insufficient_text');
    expect(result.score).toBeNull();
    expect(result.rulesEvaluated).toBe(1111);
  });

  it('applies the selected academic level and discipline', () => {
    const service = new VipWritingQualityService();
    const text = Array.from(
      { length: 80 },
      (_, index) => `شیکردنەوەی ئەکادیمی بۆ خاڵی ${index + 1} بەڵگە و مێتۆد و ئەنجام دەخاتەڕوو.`
    ).join(' ');
    const result = service.analyze(text, 'master', 'medical');
    expect(result.status).toBe('analyzed');
    expect(result.score).not.toBeNull();
    expect(result.level).toBe('master');
    expect(result.discipline).toBe('medical');
    expect(result.rulesEvaluated).toBe(1111);
  });
});
