import { describe, expect, it, vi } from 'vitest';
import { KurdishAcademicLanguageService } from './kurdish-academic-language.service';

describe('Kurdish language analysis factuality', () => {
  it('returns degraded without an invented score when client initialization fails', async () => {
    const service = new KurdishAcademicLanguageService();
    const getClient = () => {
      throw new Error('GEMINI_API_KEY is missing');
    };

    const result = await service.analyzeAndRefineLanguage('دەقی تاقیکردنەوە', getClient);

    expect(result).toMatchObject({
      status: 'degraded',
      overallLanguageScore: null,
      academicTonePassed: false,
      issues: [],
      refinedTextKurdish: 'دەقی تاقیکردنەوە'
    });
    expect(result.kurdishSummary).toContain('هیچ نمرە یان پەسەندکردنێک دروست نەکرا');
  });

  it('does not infer score zero when the model response omits the score', async () => {
    const service = new KurdishAcademicLanguageService();
    const getClient = () => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            refinedTextKurdish: 'دەقی چاککراو',
            academicTonePassed: true,
            issues: [],
            kurdishSummary: 'پێداچوونەوەی زمان ئەنجامدرا.'
          })
        })
      }
    } as never);

    const result = await service.analyzeAndRefineLanguage('دەقی سەرەتایی', getClient);

    expect(result.status).toBe('generated');
    expect(result.overallLanguageScore).toBeNull();
    expect(result.refinedTextKurdish).toBe('دەقی چاککراو');
  });
});
