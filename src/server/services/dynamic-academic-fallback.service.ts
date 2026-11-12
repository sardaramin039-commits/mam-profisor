/**
 * Safe academic fallback.
 *
 * The fallback is a continuity scaffold only. It deliberately does not invent:
 * citations, authors, study findings, statistics, literature gaps, peer-review status,
 * plagiarism scores, or factual claims that require external evidence.
 */

export interface FallbackOptions {
  toolId?: string;
  inputText?: string;
  discipline?: string;
  academicLevel?: string;
}

function previewText(inputText: string): string {
  const value = inputText.trim();
  return value.length > 800 ? value.slice(0, 800) + '…' : value;
}

export function generateDynamicAcademicFallback(options: FallbackOptions): string {
  const {
    toolId = 'general',
    inputText = '',
    discipline = 'گشتی',
    academicLevel = 'ماستەر'
  } = options;

  const preview = previewText(inputText);

  switch (toolId) {
    case 'paraphrase':
    case 'academic_paraphrase':
      return `[OFFLINE FALLBACK — citation/claim safe]
ئەمە تەنها ڕەشنووسی پڕۆسەییە و نابێت وەک دەقی زانستیی کۆتایی دابنرێت.

ئاستی خوێندن: ${academicLevel}
کایە: ${discipline}

دەقی سەرەتایی:
${preview || 'دەقی سەرەتایی بەردەست نییە.'}

کارە پێشنیارکراوەکان:
١. پاراستنی واتای سەرەکیی دەق.
٢. ڕێکخستنی زاراوە و ڕستەسازی بەبێ زیادکردنی زانیاریی نوێ.
٣. دوای گەڕانەوەی AI، citation و هەر بانگەشەیەکی زانستی بە سەرچاوەی ڕاستەقینە پشتڕاست بکرێتەوە.`;

    case 'summarize':
    case 'abstract_generator':
      return `[OFFLINE FALLBACK — summary scaffold]
هیچ خاڵێکی نوێ یان دەرئەنجامێکی زانستی لە offline mode ـدا خەملێنراوە نییە.

بابەت: ${preview || 'دیارینەکراو'}
کایە: ${discipline}
ئاست: ${academicLevel}

پێکهاتەی پێشنیارکراوی پوختە:
١. کێشە/بابەت: لەسەر دەقی سەرەکی بنووسە.
٢. ئامانج: تەنها ئەوەی لە توێژینەوەکەدا هەیە.
٣. مێتۆد: مێتۆدی بەڕاستی بەکارهاتوو تۆمار بکە.
٤. داتا/دەرئەنجام: تەنها داتای پشتڕاستکراو.
٥. کۆتایی: تەنها ئەو دەرئەنجامانەی بەڵگەیان هەیە.`;

    case 'literature_gap':
      return `[OFFLINE FALLBACK — literature-gap scaffold]
ئەم mode ـە ناتوانێت کەلێنی ئەدەبیات پشتڕاست بکات، چونکە بۆ ئەمە پێویستی بە گەڕانی سەرچاوە و کۆمەڵە توێژینەوەی ڕاستەقینە هەیە.

بابەت: ${preview || 'دیارینەکراو'}
کایە: ${discipline}

خانە پڕنەکراوەکان:
١. کەلێنی تیۆری: ____________________
٢. کەلێنی مێتۆدۆلۆژی: ____________________
٣. کەلێنی داتا/نمونە: ____________________
٤. کەلێنی جۆغرافی یان زمانەوانی: ____________________
٥. بەڵگەی پشتگیریکەر: ____________________`;

    case 'peer_review':
      return `[OFFLINE FALLBACK — peer-review scaffold]
هیچ نمرە، verdict یان پێداچوونەوەی ئەکادیمی لە offline mode ـدا خەملێنراوە نییە.

بۆ پێداچوونەوەی ${academicLevel}:
• بەستەری بانگەشەکان بە بەڵگەکان بپشکنە.
• مێتۆد، داتا و سنووردارییەکان جیا بکەرەوە.
• citation ـەکان بە سەرچاوە دەرەکییەکان هاوتا بکە.
• هەر دەرئەنجامێک کە بەڵگەی نییە وەک «پێویستی بە پشتڕاستکردنەوە» نیشانە بکە.`;

    case 'citation_checker':
      return `[OFFLINE FALLBACK — citation audit scaffold]
هیچ citation ـێکی نوێ دروست نەکراوە و هیچ سەرچاوەیەک Verified دانەنراوە.

پشکنین:
١. هەر بانگەشەیەکی زانستی → سەرچاوەی دیاریکراو.
٢. ناوی نووسەر/ساڵ/ناونیشان → هاوتایی لە بنکەدراوەی سەرچاوە.
٣. DOI/ISBN/ISSN → پشتڕاستکردنەوەی دەرەکی.
٤. دڵنیابوون لەوەی citation ـەکە بە بانگەشەکە دەگونجێت.`;

    default:
      return `[OFFLINE FALLBACK — evidence-safe scaffold]
کایە: ${discipline}
ئاست: ${academicLevel}
ئامراز: ${toolId}

دەقی پێشکەشکراو:
${preview || 'دەقی پێشکەشکراو بەردەست نییە.'}

تێبینیی گرنگ:
ئەم وەڵامە هیچ سەرچاوە، ئامار، citation، دەرئەنجام یان بانگەشەیەکی نوێ دروست ناکات.
بۆ بەرهەمی کۆتایی، سەرچاوە ڕاستەقینەکان دەبێت بگەڕێنرێنەوە، پشتڕاست بکرێنەوە و پاشان دەقەکە synthesis بکرێت.`;
  }
}
