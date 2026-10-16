/**
 * src/app/helpers/polyphonic-synthesis.helper.ts
 *
 * Enforces Polyphonic Literature Synthesis & Critical Voice across all analytical sections.
 * Ensures every paragraph weaves a critical dialogue between multiple scholars (فرەدەنگی و دیالۆگی ڕەخنەیی):
 * 1. Scholar A's theoretical claim (بانگەشەی تیۆریی سەرچاوەی یەکەم)
 * 2. Contrasted or complemented with Scholar B's perspective (دیدگای سەرچاوەی دووەم)
 * 3. Researcher's own analytical synthesis and critical evaluation (کەسایەتی و هەڵوێستی ڕەخنەیی توێژەر)
 */

export const POLYPHONIC_SYNTHESIS_DIRECTIVES = `
[ڕێسای فرەدەنگی لە ئەدەبیاتی پێشوو و دەنگی ڕەخنەیی توێژەر - POLYPHONIC LITERATURE SYNTHESIS]:
١. بەستنەوەی فرەدەنگی (Dialectic Dialogue Between Scholars):
   - لە هەر پەڕەگرافێکی شیکاریدا، بە تەنیا بۆچوونی یەک سەرچاوە مەیگێڕەوە. پێویستە دیالۆگێکی ڕەخنەیی لەنێوان دوو زانا یان زیاتر بهۆنرێتەوە (بۆ نموونە: «لە کاتێکدا Scholar A جەخت لەسەر بنەمای مادیی دیاردەکە دەکاتەوە، لە بەرامبەردا Scholar B لە گۆشەنیگای گوتاری زمانییەوە پێناسەی دەکات»).
٢. دەنگی سەربەخۆ و پێگەی ڕەخنەیی توێژەر (Researcher's Critical Evaluative Voice):
   - پەڕەگراف بە گێڕانەوەی ڕووتی سەرچاوەکان کۆتایی نایەت؛ بەڵکو دەبێت بە سەنتێز، هەڵسەنگاندن و بڕیاری زانستیی خودی توێژەر کۆتایی پێ بهێنرێت (بۆ نموونە: «لەم نێوەندەدا، ئەم توێژینەوەیە لەسەر ئەو بنەمایە ڕادەوەستێت کە ئەم دوو ڕوانگەیە نەک ناکۆک، بەڵکو تەواوکەری یەکترن بۆ تێگەیشتن لە کەلێنی مەعریفیی تێزەکە»).
٣. ڕەتکردنەوەی گێڕانەوەی کۆگایی (No Monophonic Summary Dump):
   - نووسینی زنجیرەیەک پەڕەگرافی بێ دەنگ کە تەنها کورتەی کتێبێک دوای کتێبێکی تر بن، بە تەواوی قەدەغەیە.
`.trim();

export function injectPolyphonicDirectives(basePrompt: string, topic?: string): string {
  const topicContext = topic ? `\nتەوەری شیکاری: «${topic}»` : '';
  return `${basePrompt}\n\n${POLYPHONIC_SYNTHESIS_DIRECTIVES}${topicContext}`;
}

export function buildPolyphonicParagraphTemplate(scholarA: string, scholarB: string, coreTension: string): string {
  return `لەم ڕوانگەیەوە، ${scholarA} پێی وایە کە ${coreTension} بە شێوەیەکی بنەڕەتی پەیوەستە بە پێکهاتە سەرەکییەکان؛ لە بەرامبەردا، ${scholarB} دیدگایەکی جیاوازتر دەخاتەڕوو و ئاماژە بەوە دەکات کە ئەم کایەیە پێویستی بە خوێندنەوەی فرەڕەهەند هەیە. بە هەڵسەنگاندنی ئەم دوو ڕوانگەیە، توێژەر بەو دەرەنجامە دەگات کە لە چوارچێوەی ئەم لێکۆڵینەوەیەدا، تێکەڵکردنی هەردوو ڕوانگە دەبێتە هۆی ساغکردنەوەی کێشەی زانستیی تێزەکە بە بەڵگەی سەلمێنراو.`;
}
