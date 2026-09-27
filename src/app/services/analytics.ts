import { Injectable } from '@angular/core';

export interface D3BarData {
  label: string;
  value: number;
}

export interface ChapterProgressMetric {
  chapterId: number;
  title: string;
  wordCount: number;
  targetWords: number;
  completionPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  calculateChapterProgressMetrics(
    chapters: { id: number; title: string; wordCount: number }[],
    getTargetWordsFn: (ch: { id: number; title: string; wordCount: number }) => number
  ): ChapterProgressMetric[] {
    return chapters.map((ch) => {
      const target = getTargetWordsFn(ch) || 2500;
      const pct = Math.min(100, Math.round((ch.wordCount / target) * 100));
      return {
        chapterId: ch.id,
        title: ch.title,
        wordCount: ch.wordCount,
        targetWords: target,
        completionPercentage: pct
      };
    });
  }

  computeTotalWordCount(chapters: { wordCount: number }[]): number {
    return chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0);
  }

  calculateAcademicReadabilityScore(text: string): {
    score: number;
    level: string;
    avgSentenceLength: number;
  } {
    if (!text || !text.trim()) {
      return { score: 100, level: 'سەرەتایی', avgSentenceLength: 0 };
    }
    const sentences = text.split(/[.؟!]/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
    const avgLen = sentences.length > 0 ? words.length / sentences.length : 0;
    const score = Math.max(10, Math.min(100, Math.round(100 - avgLen * 1.5)));
    let level = 'گوتاری لێکۆڵینەوەیی ئاسایی';
    if (avgLen > 25) level = 'تێزی دکتۆرا / فەلسەفەیی باڵا';
    else if (avgLen > 18) level = 'ماستەر / ئەکادیمی پێشکەوتوو';
    else level = 'بەکالۆریۆس / هەڵسەنگاندنی گشتی';

    return { score, level, avgSentenceLength: Math.round(avgLen * 10) / 10 };
  }
}

