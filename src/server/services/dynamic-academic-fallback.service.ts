/**
 * Dynamic Academic Fallback Service
 * Provides robust, intelligent local fallback outputs whenever external LLM API providers
 * (Gemini, Claude, OpenAI, Perplexity) fail due to network timeouts, rate-limits (429), or missing credentials.
 */

export interface FallbackOptions {
  toolId?: string;
  inputText?: string;
  discipline?: string;
  academicLevel?: string;
}

export function generateDynamicAcademicFallback(options: FallbackOptions): string {
  const { toolId = 'general', inputText = '', discipline = 'گشتی', academicLevel = 'ماستەر' } = options;
  const trimmed = inputText.trim();
  const preview = trimmed.length > 200 ? trimmed.slice(0, 200) + '...' : trimmed;

  switch (toolId) {
    case 'paraphrase':
    case 'academic_paraphrase':
      return `پۆلێنکاریی ئۆفلاین بۆ دەقی پێشکەشکراو:
${trimmed ? `«${trimmed}»` : 'دەقی ئامانج'}

ئەمە تەنها ڕێنمایییەکی شێوازە بۆ ئاستی ${academicLevel} لە کایەی ${discipline}؛ دەقەکە لەو fallback ـەدا بە شێوەی واقعی دەستکاری نەکراوە و هیچ نمرە یان بەڵگەی سەرچاوەیی دروست نەکراوە.
`;

    case 'summarize':
    case 'abstract_generator':
      return `ڕێنماییی پوختەسازیی ئۆفلاین:
• کایە: ${discipline}.
• دەقی سەرەکی: ${preview || 'دەقی پێشکەشکراو'}.
• تێبینی: هیچ دۆزینەوە، دەرئەنجام، یان metadata ـی سەرچاوە لەم fallback ـەدا پشتڕاست نەکراوە؛ بۆ پوختەی زانستی پێویستە AI بەردەست بێت.
`;

    case 'literature_gap':
      return `شیکاری کەلەبەری زانستی لەم کاتەدا بەردەست نییە.
هیچ gap ـێکی واقعی، دۆزینەوەی توێژینەوەیی، یان پێداچوونەوەی سەرچاوە لەم fallback ـەدا پشتڕاست نەکراوە. بۆ دۆزینەوەی Literature Gap پێویستە سەرچاوە و توێژینەوە ساغکراوەکان بپشکنرێن.`;

    case 'peer_review':
      return `پوختەی پێداچوونەوەی ئەکادیمی لەم کاتەدا بەردەست نییە.
هیچ نمرە، دۆخی سەرکەوتن، یان هەڵسەنگاندنی کوالێتی لەم fallback ـەدا پشتڕاست نەکراوە. پێداچوونەوەی واقعی پێویستی بە engine ـی هەڵسەنگاندنی AI هەیە.`;

    case 'citation_checker':
      return `پشکنینی ئاماژەدان و سەرچاوەکان:
- بەستەرەکان: [NO CITATION] هیچ سەرچاوەیەکی دەستکرد یان ناوەستاو دروست ناکرێت.
- شێوازی پێشنیارکراو: جێگیرکردنی فۆڕماتی فەرمیی (نووسەر، ساڵ) لە سەرانسەری تێزەکەدا.`;

    default:
      return `شیکاری ئەکادیمی و وەڵامی ئۆفلاین (Dynamic Academic Fallback):
بۆ دەقی داواکراو لە کایەی «${discipline}»:
${preview ? `«${preview}»` : 'دەقی پێشکەشکراو'}

پێشنیاری مێتۆدۆلۆژی:
١. ڕێکخستنی دەقەکە بەپێی شێوازی زانستیی هاوچەرخ.
٢. دەوڵەمەندکردنی چەمکەکان بە زاراوەی ئەکادیمیی کوردیی پاراو.
٣. پشکنینی سەرچاوەکان لە کتێبخانە دیجیتاڵییە ساغکراوەکاندا (دۆخی سەرچاوە: NO CITATION - هیچ سەرچاوەیەکی دەستکرد دروست ناکرێت بۆ پاراستنی ئەمانەتی زانستی).`;
  }
}
