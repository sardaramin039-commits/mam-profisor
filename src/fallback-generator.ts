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

export function generateDynamicAcademicFallback(params: FallbackParams): {
  content: string;
  wordCount: number;
  academicNotes: string;
} {
  const chapterTitle = clean(params.chapterTitle, 300);
  const discipline = clean(params.discipline, 120);
  const academicLevel = clean(params.academicLevel, 120);
  const documentTitle = clean(params.documentTitle, 300);
  const targetWords = Number.isFinite(params.targetWords) && params.targetWords > 0
    ? Math.round(params.targetWords)
    : 0;

  const content = `[OFFLINE FALLBACK — EVIDENCE SAFE]

ناونیشانی بەش: «${chapterTitle || 'دیارینەکراو'}»
کایەی زانستی: «${discipline || 'دیارینەکراو'}»
ئاستی ئەکادیمی: «${academicLevel || 'دیارینەکراو'}»
ناونیشانی کار: «${documentTitle || 'دیارینەکراو'}»

ئەم دەقە ڕەشنووسێکی پڕۆسەییە، نەک دەقی زانستیی کۆتایی. لە کاتی نەبوونی خزمەتگوزاریی ژیریی دەستکرد، سیستەم بە ئەنقەست هیچ بانگەشەیەکی پەسەندکراوی زانستی، citation، quote، ئامار، دەرئەنجام، یان سەرچاوەی نوێ دروست ناکات.

پێکهاتەی پێشنیارکراو بۆ پڕکردنەوە:
١. پێناسە و سنووری بابەت: ______________________________
٢. چەمکە سەرەکییەکان: _________________________________
٣. چوارچێوەی تیۆری و سەرچاوەی پشتیوان: __________________
٤. مێتۆد و داتا: ________________________________________
٥. شیکردنەوە و بەڵگە: __________________________________
٦. دەرئەنجامە پشتڕاستکراوەکان: __________________________
٧. سنووردارییەکان: ______________________________________
٨. citation ـە پشتڕاستکراوەکان: __________________________

ئامانجی وشە: ${targetWords > 0 ? targetWords : 'دیارینەکراو'}
ژمارەی بەشی کار: ${Number.isFinite(params.currentChapterIndex) ? params.currentChapterIndex : 0}
`;

  return {
    content,
    wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    academicNotes: 'Offline fallback بە مەبەستی پاراستنی ئەمانەتی زانستی تەنها scaffold دروست دەکات؛ هیچ سەرچاوە یان بانگەشەی نوێ لێی پشتڕاست نەکراوە.'
  };
}
