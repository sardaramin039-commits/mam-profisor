import { describe, expect, it, vi } from 'vitest';
import { KurdishAcademicLanguageService } from './kurdish-academic-language.service';

function mockClient(payload: unknown) {
  return {
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify(payload) })
    }
  } as any;
}

describe('Kurdish language analysis safety', () => {
  it('returns degraded without an invented score when client initialization fails', async () => {
    const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
      'دەقی تاقیکردنەوە',
      () => { throw new Error('GEMINI_API_KEY is missing'); }
    );
    expect(result).toMatchObject({
      status: 'degraded',
      overallLanguageScore: null,
      academicTonePassed: false,
      issues: [],
      refinedTextKurdish: 'دەقی تاقیکردنەوە'
    });
  });

  it('returns null score and no approval when model score is omitted', async () => {
    const original = 'دەقی سەرەتایی 2024';
    const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
      original,
      () => mockClient({
        refinedTextKurdish: 'دەقی چاککراو 2024',
        academicTonePassed: true,
        issues: [],
        kurdishSummary: 'پێداچوونەوەی زمان ئەنجامدرا.'
      })
    );
    expect(result.status).toBe('generated');
    expect(result.overallLanguageScore).toBeNull();
    expect(result.academicTonePassed).toBe(false);
    expect(result.refinedTextKurdish).toBe('دەقی چاککراو 2024');
  });

  it.each([101, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'does not clamp an invalid score (%s) into a plausible score',
    async score => {
      const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
        'دەقی سەرەتایی',
        () => mockClient({
          refinedTextKurdish: 'دەقی چاککراو',
          overallLanguageScore: score,
          academicTonePassed: true,
          issues: [],
          kurdishSummary: 'پێداچوونەوەی زمان ئەنجامدرا.'
        })
      );
      expect(result.overallLanguageScore).toBeNull();
      expect(result.academicTonePassed).toBe(false);
    }
  );

  it('rejects rewrites that remove citations, DOI, URL, dates or numerical tokens', async () => {
    const original = 'داتا (Bandura, 1977) و DOI: 10.1000/abc بەرواری 2024-05-12، ڕێژەی 42.5% و [1, 3]. https://example.org/x';
    const candidate = 'داتا و DOI: 10.1000/abc بەرواری 2024-05-12، ڕێژەی 42.5% و [1, 3]. https://example.org/x';
    const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
      original,
      () => mockClient({
        refinedTextKurdish: candidate,
        overallLanguageScore: 94,
        academicTonePassed: true,
        issues: [],
        kurdishSummary: 'چاکسازی'
      })
    );
    expect(result.status).toBe('degraded');
    expect(result.refinedTextKurdish).toBe(original);
    expect(result.overallLanguageScore).toBeNull();
    expect(result.academicTonePassed).toBe(false);
  });

  it('accepts wording refinement when protected material is unchanged', async () => {
    const original = 'ئەم ڕاپۆرتە زانیارییەکانی 2024 لەخۆدەگرێت (Bandura, 1977).';
    const refined = 'ئەم ڕاپۆرتە، زانیارییەکانی 2024 لەخۆدەگرێت (Bandura, 1977).';
    const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
      original,
      () => mockClient({
        refinedTextKurdish: refined,
        overallLanguageScore: 88,
        academicTonePassed: true,
        issues: [{
          type: 'grammar',
          originalText: 'ئەم ڕاپۆرتە',
          suggestedText: 'ئەم ڕاپۆرتە،',
          explanationKurdish: 'پێشنیاری خاڵبەندی.'
        }],
        kurdishSummary: 'چاکسازیی خاڵبەندی.'
      })
    );
    expect(result.status).toBe('generated');
    expect(result.refinedTextKurdish).toBe(refined);
    expect(result.overallLanguageScore).toBe(88);
    expect(result.academicTonePassed).toBe(true);
    expect(result.issues).toHaveLength(1);
  });

  it('filters malformed issue objects and caps untrusted issue lists', async () => {
    const validIssue = {
      type: 'spelling', originalText: 'x', suggestedText: 'y', explanationKurdish: 'z'
    };
    const malformedIssues = [
      { type: 'unknown', originalText: 'x', suggestedText: 'y', explanationKurdish: 'z' },
      { type: 'spelling', originalText: '', suggestedText: 'y', explanationKurdish: 'z' },
      validIssue
    ];
    const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
      'دەقی سەرەتایی',
      () => mockClient({
        refinedTextKurdish: 'دەقی چاککراو',
        overallLanguageScore: 80,
        academicTonePassed: true,
        issues: [...malformedIssues, ...Array.from({ length: 120 }, () => malformedIssues[0])],
        kurdishSummary: 'پێداچوونەوە'
      })
    );
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.type).toBe('spelling');
  });

  it('short-circuits blank and oversized input before calling the model', async () => {
    const client = mockClient({});
    const service = new KurdishAcademicLanguageService();
    const blank = await service.analyzeAndRefineLanguage(' \n\t ', () => client);
    const hugeText = 'x'.repeat(80_001);
    const oversized = await service.analyzeAndRefineLanguage(hugeText, () => client);

    expect(blank.status).toBe('degraded');
    expect(oversized.status).toBe('degraded');
    expect(client.models.generateContent).not.toHaveBeenCalled();
    expect(oversized.refinedTextKurdish).toBe(hugeText);
  });

  it('returns degraded output for malformed model JSON', async () => {
    const result = await new KurdishAcademicLanguageService().analyzeAndRefineLanguage(
      'دەقی سەرەتایی',
      () => ({
        models: { generateContent: vi.fn().mockResolvedValue({ text: 'not JSON' }) }
      } as never)
    );
    expect(result.status).toBe('degraded');
    expect(result.refinedTextKurdish).toBe('دەقی سەرەتایی');
    expect(result.overallLanguageScore).toBeNull();
  });
});
