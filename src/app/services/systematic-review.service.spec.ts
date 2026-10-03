import { describe, expect, it } from 'vitest';
import { SystematicReviewService } from './systematic-review.service';

describe('SystematicReviewService', () => {
  const service = new SystematicReviewService();

  it('reports 27 missing items for an empty checklist', () => {
    const result = service.assess({}, {
      identified: null, duplicatesRemoved: null, screened: null,
      excludedAfterScreening: null, fullTextAssessed: null,
      excludedAfterFullText: null, included: null
    });
    expect(result.totalItems).toBe(27);
    expect(result.missingItems).toBe(27);
    expect(result.notApplicableItems).toBe(0);
    expect(result.readyForReporting).toBe(false);
  });

  it('detects inconsistent PRISMA flow arithmetic', () => {
    const result = service.assess({}, {
      identified: 100, duplicatesRemoved: 10, screened: 80,
      excludedAfterScreening: 20, fullTextAssessed: 60,
      excludedAfterFullText: 10, included: 40
    });
    expect(result.flowConsistent).toBe(false);
    expect(result.flowErrors.length).toBe(2);
  });

  it('accepts internally consistent flow counts', () => {
    const result = service.assess({}, {
      identified: 100, duplicatesRemoved: 10, screened: 90,
      excludedAfterScreening: 30, fullTextAssessed: 60,
      excludedAfterFullText: 20, included: 40
    });
    expect(result.flowConsistent).toBe(true);
  });

  it('treats explicitly not-applicable items as covered, not missing', () => {
    const statuses = Object.fromEntries(Array.from({ length: 27 }, (_, i) => [i + 1, 'not_applicable'])) as Record<number, 'not_applicable'>;
    const result = service.assess(statuses, {
      identified: null, duplicatesRemoved: null, screened: null,
      excludedAfterScreening: null, fullTextAssessed: null,
      excludedAfterFullText: null, included: null
    });
    expect(result.notApplicableItems).toBe(27);
    expect(result.missingItems).toBe(0);
    expect(result.readyForReporting).toBe(false);
  });

  it('reaches 100% only when all applicable checklist items are complete', () => {
    const statuses = Object.fromEntries(Array.from({ length: 27 }, (_, i) => [i + 1, 'complete'])) as Record<number, 'complete'>;
    const result = service.assess(statuses, {
      identified: null, duplicatesRemoved: null, screened: null,
      excludedAfterScreening: null, fullTextAssessed: null,
      excludedAfterFullText: null, included: null
    });
    expect(result.completionPercent).toBe(100);
    expect(result.readyForReporting).toBe(true);
  });
});
