import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getGeminiClient: vi.fn(),
  generateContent: vi.fn()
}));

vi.mock('../server/services/gemini.service', () => ({
  getGeminiClient: mocks.getGeminiClient
}));

import { academicAgentsService } from './academic-agents.service';

describe('AcademicAgentsService failure honesty', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getGeminiClient.mockReturnValue({
      models: { generateContent: mocks.generateContent }
    });
  });

  it('returns generated status only when the provider returns text', async () => {
    mocks.generateContent.mockResolvedValue({ text: 'شیکاریی تاقیکراو.' });

    await expect(
      academicAgentsService.runAgent('literature-review', 'بابەتی تاقیکردنەوە')
    ).resolves.toEqual({ status: 'generated', content: 'شیکاریی تاقیکراو.' });
  });

  it('returns an explicit degraded result when the provider throws', async () => {
    mocks.generateContent.mockRejectedValue(new Error('quota exceeded'));

    const result = await academicAgentsService.runAgent(
      'literature-review',
      'بابەتی تاقیکردنەوە'
    );

    expect(result.status).toBe('degraded');
    expect(result.content).toContain('شیکارییەک');
    expect(result.content).toContain('سەرچاوەکان پشتڕاست نەکراونەتەوە');
    expect(result.content).toContain('شیکارییەک لەسەر داواکارییەکەت ئەنجام نەدرا');
  });

  it('handles client setup failures as degraded responses', async () => {
    mocks.getGeminiClient.mockImplementation(() => {
      throw new Error('GEMINI_API_KEY is missing');
    });

    const result = await academicAgentsService.runAgent(
      'literature-review',
      'بابەتی تاقیکردنەوە'
    );

    expect(result.status).toBe('degraded');
    expect(result.content).toContain('وەڵامی AI بەردەست نییە');
  });

  it('does not mark an empty provider response as generated', async () => {
    mocks.generateContent.mockResolvedValue({ text: '   ' });

    const result = await academicAgentsService.runAgent(
      'literature-review',
      'بابەتی تاقیکردنەوە'
    );

    expect(result.status).toBe('degraded');
    expect(result.content).toContain('هیچ ڕاپۆرتێکی ئەکادیمی دروست نەکراوە');
  });
});
