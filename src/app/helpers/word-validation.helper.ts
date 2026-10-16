import { ChapterItemModel as ChapterItem } from '../domain/models';

export interface WordValidationStatus {
  pct: number;
  currentWords: number;
  targetWords: number;
  currentPages: number;
  targetPages: number;
  deviationPct: number;
  citationCount: number;
  completionPct: number;
  status: 'ideal' | 'under_warning' | 'over_warning' | 'critical_short' | 'critical_over';
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  progressBarBg: string;
  icon: string;
}

export function calculateWordValidationStatus(
  chapter: ChapterItem | null,
  targetWordsGetter: (ch: ChapterItem | null) => number
): WordValidationStatus {
  if (!chapter) {
    return {
      pct: 0,
      currentWords: 0,
      targetWords: 0,
      currentPages: 0,
      targetPages: 0,
      deviationPct: 0,
      citationCount: 0,
      completionPct: 0,
      status: 'critical_short',
      label: 'دەق نەنووسراوە',
      badgeBg: 'bg-stone-100',
      textColor: 'text-stone-500',
      borderColor: 'border-stone-200',
      progressBarBg: '#d6d3d1',
      icon: 'help_outline'
    };
  }

  const targetWords = targetWordsGetter(chapter);
  const currentWords = chapter.wordCount || (chapter.content ? chapter.content.trim().split(/\s+/).filter(Boolean).length : 0);
  const pct = targetWords > 0 ? Math.round((currentWords / targetWords) * 100) : 0;
  const currentPages = Number((currentWords / 350).toFixed(1));
  const targetPages = Number((targetWords / 350).toFixed(1));
  const deviationPct = targetWords > 0 ? Math.round(((currentWords - targetWords) / targetWords) * 100) : 0;

  const content = chapter.content || '';
  const inTextMatches = content.match(/\(([\u0600-\u06FFa-zA-Z\s.-]+?)[،,]\s*(\d{4}|[\u0660-\u0669]{4}|n\.d\.)(?:[:\s]+([\u0660-\u0669\d-]+))?\)/g) || [];
  const footnoteMatches = content.match(/\[([\u0660-\u0669\d]+)\]/g) || [];
  const citationCount = inTextMatches.length + footnoteMatches.length;

  const wordRatio = targetWords > 0 ? Math.min(1.0, currentWords / targetWords) : 0;
  const citationRatio = Math.min(1.0, citationCount / 2);
  const completionPct = currentWords > 0 
    ? Math.min(100, Math.round((wordRatio * 80) + (citationRatio * 20)))
    : 0;

  if (currentWords === 0) {
    return {
      pct: 0,
      currentWords: 0,
      targetWords,
      currentPages: 0,
      targetPages,
      deviationPct: -100,
      citationCount: 0,
      completionPct: 0,
      status: 'critical_short',
      label: 'دەق نەنووسراوە (سفر وشە)',
      badgeBg: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-200',
      progressBarBg: '#cbd5e1',
      icon: 'edit_note'
    };
  }

  if (pct >= 85 && pct <= 115) {
    return {
      pct,
      currentWords,
      targetWords,
      currentPages,
      targetPages,
      deviationPct,
      citationCount,
      completionPct,
      status: 'ideal',
      label: `لە ئامانجدایە (تەواو ${deviationPct >= 0 ? '+' : ''}${deviationPct}٪)`,
      badgeBg: 'bg-emerald-50',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      progressBarBg: '#10b981',
      icon: 'check_circle'
    };
  } else if (pct >= 70 && pct < 85) {
    return {
      pct,
      currentWords,
      targetWords,
      currentPages,
      targetPages,
      deviationPct,
      citationCount,
      completionPct,
      status: 'under_warning',
      label: `کەمێک کەمترە لە ئامانج (${deviationPct}٪)`,
      badgeBg: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300',
      progressBarBg: '#f59e0b',
      icon: 'warning'
    };
  } else if (pct > 115 && pct <= 135) {
    return {
      pct,
      currentWords,
      targetWords,
      currentPages,
      targetPages,
      deviationPct,
      citationCount,
      completionPct,
      status: 'over_warning',
      label: `کەمێک زیاترە لە ئامانج (+${deviationPct}٪)`,
      badgeBg: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      progressBarBg: '#3b82f6',
      icon: 'info'
    };
  } else if (pct < 70) {
    return {
      pct,
      currentWords,
      targetWords,
      currentPages,
      targetPages,
      deviationPct,
      citationCount,
      completionPct,
      status: 'critical_short',
      label: `زۆر کەمترە لە ئامانج (${deviationPct}٪)`,
      badgeBg: 'bg-rose-50',
      textColor: 'text-rose-800',
      borderColor: 'border-rose-300',
      progressBarBg: '#f43f5e',
      icon: 'error_outline'
    };
  } else {
    return {
      pct,
      currentWords,
      targetWords,
      currentPages,
      targetPages,
      deviationPct,
      citationCount,
      completionPct,
      status: 'critical_over',
      label: `زۆر زیاترە لە ئامانج (+${deviationPct}٪)`,
      badgeBg: 'bg-purple-50',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-300',
      progressBarBg: '#8b5cf6',
      icon: 'trending_up'
    };
  }
}
