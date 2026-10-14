/**
 * Evidence-safe academic fallback for service outages.
 *
 * This module preserves workflow continuity without generating invented:
 * scholarly sources, quotations, statistics, findings, literature gaps,
 * peer-review claims, or unsupported factual assertions.
 */

interface FallbackParams {
  chapterTitle: string;
  discipline: string;
  academicLevel: string;
  targetWords: number;
  documentTitle: string;
  currentChapterIndex: number;
}

function clean(value: string, max = 500): string {
  const trimmed = (value || '').trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
}

export function isMockResponseDisabled(): boolean {
  return true;
}

export function getKurdishNetworkError(): string {
  return 'پەیوەندی لەگەڵ بزوێنەری ئەکادیمی لەم ساتەدا پچڕاوە یان کلیل چالاک نییە. بەپێی یاساکانی ئەمانەتی زانستی، هیچ دەقێکی ساختە یان دروستکراو بەبێ مۆدێل دانانرێت.';
}

export function generateDynamicAcademicFallback(params: FallbackParams): {
  content: string;
  wordCount: number;
  academicNotes: string;
} {
  const chapterTitle = clean(params.chapterTitle, 300);
  const discipline = clean(params.discipline, 120);
  const academicLevel = clean(params.academicLevel, 120);
  const documentTitle = clean(params.documentTitle, 300);

  const content = `[ئاگاداریی ئەمانەتی زانستی]:
پەیوەندی لەگەڵ مۆدێلی ژیریی دەستکرد لەم ساتەدا بەردەست نییە بۆ نووسینی تەواوی بەشی «${chapterTitle || 'توێژینەوە'}» لە کایەی «${discipline || 'گشتی'}».
بۆ پاراستنی ڕەسەنایەتی و دەستپاکی، سیستەم هیچ تێکستێکی خەیاڵی یان دروستکراوی ئەزموونی لە خۆیەوە تۆمار ناکات. تکایە دوای دڵنیابوونەوە لە هێڵی ئینتەرنێت، دووبارە فەرمانی داڕشتن ئەنجام بدەرەوە.`;

  return {
    content,
    wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    academicNotes: getKurdishNetworkError()
  };
}
