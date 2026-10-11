/**
 * src/app/helpers/book-progress.ts
 *
 * Calculates overall book progress metrics comparing word counts, percentages,
 * pages, and remaining estimated writing time against targets.
 */

import { ChapterItemModel as ChapterItem } from '../domain/models';

export interface BookProgressSummary {
  totalChapters: number;
  completedChaptersCount: number;
  totalTargetWords: number;
  totalCurrentWords: number;
  bookProgressPct: number;
  totalTargetPages: number;
  totalCurrentPages: number;
  remainingWords: number;
  remainingPages: number;
  estimatedRemainingHours: number;
  estimatedRemainingMinutes: number;
  formattedRemainingTime: string;
  idealSectionsCount: number;
  underTargetSectionsCount: number;
  overTargetSectionsCount: number;
  statusBadgeLabel: string;
  statusBadgeBg: string;
  statusTextColor: string;
}

export function calculateBookProgressSummary(
  chapters: ChapterItem[],
  targetPagesInput: number,
  getChapterTargetFn: (chapter: ChapterItem) => number
): BookProgressSummary {
  const totalChapters = chapters.length;
  let totalCurrentWords = 0;
  let totalTargetWords = 0;
  let completedChaptersCount = 0;
  let idealSectionsCount = 0;
  let underTargetSectionsCount = 0;
  let overTargetSectionsCount = 0;

  const fallbackTotalTargetWords = (targetPagesInput || 10) * 350;

  for (const c of chapters) {
    const words = c.wordCount || (c.content ? c.content.trim().split(/\s+/).filter(Boolean).length : 0);
    const target = getChapterTargetFn(c) || Math.round(fallbackTotalTargetWords / (totalChapters || 1));
    
    totalCurrentWords += words;
    totalTargetWords += target;

    if (c.status === 'completed' || words >= Math.round(target * 0.85)) {
      completedChaptersCount++;
    }

    const pct = target > 0 ? Math.round((words / target) * 100) : 0;
    if (pct >= 85 && pct <= 115) {
      idealSectionsCount++;
    } else if (pct < 85) {
      underTargetSectionsCount++;
    } else {
      overTargetSectionsCount++;
    }
  }

  // Fallback if no chapters or zero target calculated
  if (totalTargetWords === 0) {
    totalTargetWords = fallbackTotalTargetWords;
  }

  const bookProgressPct = totalTargetWords > 0 ? Math.min(200, Math.round((totalCurrentWords / totalTargetWords) * 100)) : 0;
  const totalTargetPages = Number((totalTargetWords / 350).toFixed(1));
  const totalCurrentPages = Number((totalCurrentWords / 350).toFixed(1));
  
  const remainingWords = Math.max(0, totalTargetWords - totalCurrentWords);
  const remainingPages = Number((remainingWords / 350).toFixed(1));

  // Writing rate: ~250 words per hour for academic writing
  const totalRemainingMinutes = Math.ceil((remainingWords / 250) * 60);
  const estimatedRemainingHours = Math.floor(totalRemainingMinutes / 60);
  const estimatedRemainingMinutes = totalRemainingMinutes % 60;

  let formattedRemainingTime = '';
  if (remainingWords <= 0) {
    formattedRemainingTime = 'ئامانجی هەموو وشەکان پێکراوە! 🎉';
  } else if (estimatedRemainingHours === 0) {
    formattedRemainingTime = `${estimatedRemainingMinutes} خولەک کاتی ماوە`;
  } else if (estimatedRemainingMinutes === 0) {
    formattedRemainingTime = `${estimatedRemainingHours} کاتژمێر کاتی ماوە`;
  } else {
    formattedRemainingTime = `${estimatedRemainingHours} کاتژمێر و ${estimatedRemainingMinutes} خولەک کاتی ماوە`;
  }

  let statusBadgeLabel = 'لە دەستپێکدایە';
  let statusBadgeBg = 'bg-stone-100 border-stone-300';
  let statusTextColor = 'text-stone-700';

  if (bookProgressPct >= 98 && bookProgressPct <= 102) {
    statusBadgeLabel = 'توانا و ڕێژەی کارکردن لە ١٠٠٪ـدایە (ئامانجی پێوانەیی)';
    statusBadgeBg = 'bg-emerald-100 border-emerald-400';
    statusTextColor = 'text-emerald-900 font-extrabold';
  } else if (bookProgressPct >= 85 && bookProgressPct <= 115) {
    statusBadgeLabel = 'لە ئامانجدایە (تەواو بەپێی پلان)';
    statusBadgeBg = 'bg-emerald-50 border-emerald-300';
    statusTextColor = 'text-emerald-800';
  } else if (bookProgressPct > 115) {
    statusBadgeLabel = 'تێپەڕاندنی ئامانج (+٪' + (bookProgressPct - 100) + ')';
    statusBadgeBg = 'bg-amber-50 border-amber-300';
    statusTextColor = 'text-amber-800';
  } else if (bookProgressPct >= 50) {
    statusBadgeLabel = 'نیوەی بەرەوپێشچوون بڕدراوە (' + bookProgressPct + '٪)';
    statusBadgeBg = 'bg-blue-50 border-blue-300';
    statusTextColor = 'text-blue-800';
  } else if (bookProgressPct > 0) {
    statusBadgeLabel = 'لە قۆناغی گەشەپێداندایە (' + bookProgressPct + '٪)';
    statusBadgeBg = 'bg-amber-50 border-amber-300';
    statusTextColor = 'text-amber-800';
  }

  return {
    totalChapters,
    completedChaptersCount,
    totalTargetWords,
    totalCurrentWords,
    bookProgressPct,
    totalTargetPages,
    totalCurrentPages,
    remainingWords,
    remainingPages,
    estimatedRemainingHours,
    estimatedRemainingMinutes,
    formattedRemainingTime,
    idealSectionsCount,
    underTargetSectionsCount,
    overTargetSectionsCount,
    statusBadgeLabel,
    statusBadgeBg,
    statusTextColor
  };
}
