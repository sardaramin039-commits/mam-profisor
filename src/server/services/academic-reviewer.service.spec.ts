import { describe, expect, it, vi } from 'vitest';
import { AcademicReviewerService } from './academic-reviewer.service';

describe('academic reviewer result honesty', () => {
  it('does not fabricate a zero score or verdict when the model is unavailable', async () => {
    const service = new AcademicReviewerService();
    const getClient = () => ({
      models: {
        generateContent: vi.fn().mockRejectedValue(new Error('provider unavailable'))
      }
    } as never);

    const result = await service.evaluateThesis(
      'Draft text for a test.',
      'Test topic',
      getClient
    );

    expect(result).toMatchObject({
      status: 'degraded',
      overallScore: null,
      thesisDefenseSimulatedPassed: null,
      criteria: []
    });
    expect(result.summaryCritiqueKurdish).toContain('هیچ نمرە یان بڕیاری بەرگری دروست نەکرا');
  });

  it('does not turn a missing model score into zero', async () => {
    const service = new AcademicReviewerService();
    const getClient = () => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            summaryCritiqueKurdish: 'Review summary',
            criteria: [{
              category: 'Evidence',
              severity: 'medium',
              findingKurdish: 'Finding',
              recommendationKurdish: 'Recommendation'
            }]
          })
        })
      }
    } as never);

    const result = await service.evaluateThesis(
      'Draft text for a test.',
      'Test topic',
      getClient
    );

    expect(result.status).toBe('generated');
    expect(result.overallScore).toBeNull();
    expect(result.criteria[0]?.score).toBeNull();
  });
});
