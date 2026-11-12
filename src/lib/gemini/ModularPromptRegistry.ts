export type AcademicPromptModule = 'literature-travelogue' | 'discourse-postcolonial' | 'kurdish-linguistics' | 'social-sciences';

interface PromptModule {
  key: AcademicPromptModule;
  matches: RegExp;
  instructions: string;
}

const MODULES: PromptModule[] = [
  {
    key: 'literature-travelogue',
    matches: /narratology|travelogue|literature|ئەدەب|گێڕانەوە|سەفەرنامە|رۆمان|شیعر/i,
    instructions: `چوارچێوەی ئەدەب و سەفەرنامە:
- لە گێڕانەوەناسیدا ڕیزبەندی (order)، خێرایی (duration)، دووبارەبوونەوە (frequency)، گۆشەنیگا (focalization) و دەنگ (voice) لە جینێت جیا بکەرەوە و تەنها بە بەڵگەی دەق شیکاری بکە.
- کرۆنۆتۆپی باختین، دیالۆگی دەنگەکان، سێگۆشەی شوێنی لێڤفێڤر و ناوچەی پەیوەندیی پرات بە پێی گونجاوی بابەت بەکاربهێنە.
- ئەوەی گێڕەرەوە بە چاوی خۆی بینیوە لە هەواڵی بیستراو و گێڕانەوەی ناڕاستەوخۆ جیا بکەرەوە؛ هیچ یەکێک وەک بەڵگەی یەکسان مەخەرەڕوو.`
  },
  {
    key: 'discourse-postcolonial',
    matches: /discourse|post.?colonial|گوتار|کۆلۆنیال|ئۆریێنتال|دەسەڵات/i,
    instructions: `چوارچێوەی گوتار و پۆست-کۆلۆنیال:
- لە فۆکۆدا مەرجەکانی بەرهەمهێنانی زانین و پەیوەندیی زانین-دەسەڵات لە دەقی دیاریکراودا بدۆزەوە؛ وەک وشەی جوانکاری بەکارمەهێنە.
- نوێنەرایەتیی «خۆ» و «ئەویتر» بە ڕەخنەی ئۆریێنتالیزمی سەعید هەڵبسەنگێنە، بەڵام بەڵگەی دەق و کۆنتێکستی مێژوویی جیاواز بنووسە.
- سێ ڕەهەندی شیکاریی ڕەخنەییی فێرکلۆف، چوارچێوەی ئایدیۆلۆژیکی ڤان دایک و سنووری دەنگی ژێردەست لە سپیڤاک بە شێوەی پرسیاری ڕەخنەیی بخەرەڕوو.`
  },
  {
    key: 'kurdish-linguistics',
    matches: /morpho.?syntax|linguistics|language|زمانەوان|مۆرفۆ|سینتاکس|ڕێزمان/i,
    instructions: `چوارچێوەی زمانەوانیی کوردی:
- ڕووداوەکانی ئێرگاتیڤی دابەشکراو، شوێنی کلیتیک، ڕەهەندی ئاسپێکت و پلەبەندیی ئیزافە بە نموونەی زمانەوانیی پشتڕاستکراو شیکەرەوە.
- ماتریسی بەراوردی سۆرانی، کورمانجی، هەورامی، موکریانی، ئەردەڵانی و بادینی تەنها کاتێک دابنێ کە ماددەی هەر شێوەزارێک بەردەست بێت؛ داتا پڕ مەکەرەوە.
- نموونەی گوتارییەکان لە داتای توێژینەوە جیا بکەرەوە لە نموونەی دروستکراو بۆ ڕوونکردنەوە.`
  },
  {
    key: 'social-sciences',
    matches: /history|philosophy|education|social|sociology|economics|politics|مێژوو|فەلسەفە|پەروەردە|کۆمەڵناسی|ئابووری|سیاسی/i,
    instructions: `چوارچێوەی مێژوو، فەلسەفە و زانستە کۆمەڵایەتییەکان:
- ڕەخنەی سەرچاوەی مێژوویی (پەیوەندی، کات، نووسەر، مەبەست و سنوور) لە سەرچاوە بنەڕەتی و لاوەکییەکان جیا بکەرەوە.
- گریمانەی پشکنین‌پەذیر و سنووری هەڵەبوون بە ڕوونی بنووسە؛ لە شیکاریی کوالیتاتی کۆدکردنی بابەتەکان و لە شیکاریی ژمارەیی پشکنینی دروستی و سنووری داتا ڕەچاو بکە.
- بانگەشەی هۆکاریی لە پەیوەندیی هاوکات جیا بکەرەوە و نەبوونی داتا و سنووری میتۆد بە ئاشکرا تۆمار بکە.`
  }
];

export function resolveAcademicPromptModule(discipline = ''): AcademicPromptModule {
  return MODULES.find((module) => module.matches.test(discipline))?.key || 'social-sciences';
}

export function loadAcademicPromptModule(discipline = ''): string {
  const module = MODULES.find((candidate) => candidate.key === resolveAcademicPromptModule(discipline));
  return module?.instructions || MODULES[MODULES.length - 1].instructions;
}
