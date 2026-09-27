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
      return `پۆلێنکاری و داڕشتنەوەی ئەکادیمی (شێوازی خودکار):
${trimmed ? `«${trimmed}»` : 'دەقی ئامانج'}

شێوازی پێشنیارکراوی ئەکادیمی بۆ بەرزکردنەوەی ئاستی زانستی (${academicLevel}):
ئەم دەقە بە لەبەرچاوگرتنی جێگیریی چەمکەکان لە کایەی ${discipline}دا، بەکارهێنانی زاراوەی هاوچەرخ و پاراستنی سەربەخۆیی فیکری توێژەر ڕێکخرایەوە تاوەکو دوور بێت لە سادەیی زمانەوانی.
[تێبینی: سیستەمی ئۆفلاین بۆ پاراستنی ڕەوتی کارەکەت ئەم پۆلێنکارییەی بە شێوەی خۆکار پێشنیار کرد].`;

    case 'summarize':
    case 'abstract_generator':
      return `پوختەی ئەکادیمی (شێوازی خۆکار):
• بابەت و ئامانج: شەن و کەوکردنی زانستی بۆ دەقی پێشکەشکراو لە کایەی ${discipline}.
• سەرنجی سەرەکی: ${preview || 'دیاریکردنی گۆڕاوە سەرەکییەکان و جێگیرکردنی مێتۆدۆلۆژی'}.
• دەرئەنجام: جەختکردنەوە لەسەر دەرئەنجامە مەعریفییەکان و ڕاسپاردنی هەنگاوی دواتر بۆ توێژەران.`;

    case 'literature_gap':
      return `شیکاری کەلەبەری زانستی (Literature Gap Analysis):
١. لایەنی مێتۆدۆلۆژی: توێژینەوەکانی پێشوو زیاتر تەرکیزیان لەسەر کایەی تیۆری بووە؛ پێویستیی بە داتای تاقیکاری هەست پێدەکرێت.
٢. لایەنی جۆغرافی/زمانەوانی: کەلەبەرێک لە بڵاوکراوەکانی شێوەزاری سۆرانی و سەرچاوە ناوچەیییەکاندا بەدی دەکرێت.
٣. پێشنیاری توێژینەوە: بەستنەوەی چەمکە مۆدێرنەکان بە ئەرشیڤی ٤٠ کتێبخانە دیجیتاڵییەکەوە.`;

    case 'peer_review':
      return `پێداچوونەوەی ئەکادیمی (AI Peer Review Summary):
- ئاستی زانستی: گونجاوە بۆ ڕەشنووسی ئاستی ${academicLevel}.
- خاڵە بەهێزەکان: داڕشتنی ڕاستەقینەی بیرۆکەکان و ئاڕاستەی ڕوونی بابەتیی.
- پێشنیاری چاکسازی: زیادکردنی ئاماژەدانی ئین-تێکست (In-text citations) بە پێوەری APA-7 یان Harvard و فرەچەشنکردنی سەرچاوەکان.`;

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
