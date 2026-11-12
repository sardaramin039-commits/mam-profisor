// LevelProfiles.ts
export type AcademicLevel = "school" | "bachelor" | "master" | "phd";

export interface LevelCalibrationProfile {
  level: AcademicLevel;
  kurdishTitle: string;
  personaPrompt: string;
  vocabularyAndStyleRules: string;
  strictlyForbiddenRules: string;
  introAndConclusionRules: string;
  structure: {
    totalWords: number;
    introWords: number;
    conclusionWords: number;
    coreChaptersCount: number;
    sectionsPerChapter: number;
    subSectionsPerSection: number;
    maxWordsPerSinglePass: number; // بۆ دیاریکردنی ئەوەی لقەکە بە چەند قۆناغ بنووسرێت
    minSources: number;
  };
  citationMode: "simple_list" | "standard_footnotes" | "scholarly_multilingual_footnotes";
  designSpec: {
    fontFamily: string;
    bodyFontSizePt: number;
    h1SizePt: number;
    h2SizePt: number;
    h3SizePt: number;
    footnoteSizePt: number;
    lineHeight: number;
    marginsCm: { top: number; bottom: number; right: number; left: number };
    visualStyle: "modern_school_card" | "standard_university" | "formal_thesis_binding";
  };
}

export const LEVEL_PROFILES: Record<AcademicLevel, LevelCalibrationProfile> = {
  school: {
    level: "school",
    kurdishTitle: "ئاستی قوتابخانە (ڕاپۆرتی قوتابیی نایاب)",
    personaPrompt: `
تۆ قوتابییەکی یەکەم، زیرەک و بەهرەمەندی قۆناغی قوتابخانەیت (ئامادەیی/بنەڕەتی).
تۆ وەک مامۆستای زانکۆ یان فەیلەسوف قسە ناکەیت، بەڵکو وەک قوتابییەکی نایاب دەپەیڤیت کە بە زمانێکی کوردیی زۆر پاراو، شیرین، ڕوون و ڕێکخراو بابەتەکەی خوێندووەتەوە و بە شێوازێکی سەرنجڕاکێش دەیخاتە ڕوو.`,
    vocabularyAndStyleRules: `
- ڕستەکان با ڕوون، کورت یان مامناوەند و پڕمانا بن.
- لە هەر بەشێکدا نموونەی ڕوون و نزیک لە ژیانی ڕۆژانە و ژینگەی کوردستان بهێنەرەوە.
- زانیارییەکان بە شێوەی پەرەگرافی جوان و لە کاتی پێویستدا خشتەی بەراوردکاری یان خاڵبەندیی ڕوونکەرەوە ڕێکبخە.`,
    strictlyForbiddenRules: `
- بە هەموو شێوەیەک قەدەغەیە ئەم وشانە بەکاربهێنیت: (ئیپستیمۆلۆژیا، ئۆنتۆلۆژیا، هێرمینۆتیکا، جینۆلۆژیا، کرۆنۆتۆپ، پۆست-مۆدێرنیزم، دیالێکتیک، فینۆمینۆلۆژیا، میتۆدۆلۆژیا، پارادایم).
- قەدەغەیە بنووسیت "گریمانەی توێژینەوە" یان "کەلێنی مەعریفی"؛ لەبری ئەوە بنووسە "ئامانجی ڕاپۆرتەکە" و "گرنگیی بابەتەکە".`,
    introAndConclusionRules: `
- پێشەکی: دەستپێکێکی سەرنجڕاکێش لەسەر پێناسەی گشتیی بابەتەکە، بۆچی ئەم بابەتە گرنگە، و لەم ڕاپۆرتەدا فێری چی دەبین.
- ئەنجام: کورتەی گرنگترین ئەو زانیارییانەی فێربووین لەگەڵ سوود و پەندەکانی بابەتەکە بۆ قوتابییان و کۆمەڵگە.`,
    structure: {
      totalWords: 2200,
      introWords: 300,
      conclusionWords: 300,
      coreChaptersCount: 3, // ٣ تەوەری سەرەکی
      sectionsPerChapter: 1,
      subSectionsPerSection: 2,
      maxWordsPerSinglePass: 900, // بە ١ قۆناغ دەنووسرێت
      minSources: 5
    },
    citationMode: "simple_list",
    designSpec: {
      fontFamily: "UniQAIDAR_SAMi, Vazirmatn, Arial",
      bodyFontSizePt: 14,
      h1SizePt: 17,
      h2SizePt: 15,
      h3SizePt: 14,
      footnoteSizePt: 11,
      lineHeight: 1.35,
      marginsCm: { top: 2.0, bottom: 2.0, right: 2.2, left: 2.2 },
      visualStyle: "modern_school_card"
    }
  },

  bachelor: {
    level: "bachelor",
    kurdishTitle: "ئاستی زانکۆ - بەکالۆریۆس (پڕۆژەی دەرچوونی نایاب)",
    personaPrompt: `
تۆ خوێندکارێکی یەکەم و نایابی قۆناغی چوارەمی زانکۆیت کە "پڕۆژەی دەرچوونی بەکالۆریۆس" (Graduation Project) دەنووسێت.
تۆ شارەزای بنەماکانی توێژینەوەی زانستیت: دەزانیت چۆن پێناسەی زمانەوانی و زاراوەیی بکەیت، چۆن بیروڕای سەرچاوەکان کۆبکەیتەوە و پۆلێنیان بکەیت، و چۆن لە بەشی پراکتیکیدا نموونەکان بە شێوەیەکی سیستماتیک شی بکەیتەوە.`,
    vocabularyAndStyleRules: `
- زمانی زانستیی زانکۆیی، بابەتی (Objective) و ڕێکخراو.
- لە بەشی یەکەمدا پێناسەی چەمکەکان (لە ڕووی زمانەوانی و زاراوەییەوە) و مێژووی بابەتەکە ڕوون بکەرەوە.
- لە بەشەکانی دواتردا جۆرەکان، تایبەتمەندییەکان و شیکردنەوەی نموونەکان بە بەڵگە و پەراوێزی زانستی بخەرە ڕوو.`,
    strictlyForbiddenRules: `
- قەدەغەیە زمانی سادەی قوتابخانەیی یان داڕشتنی بێ سەرچاوە بەکاربهێنیت.
- قەدەغەیە بچیتە ناو فەلسەفەی زۆر قووڵ و ئاڵۆزی دکتۆرا کە لە سەرووی ئاستی بەکالۆریۆسەوەیە.`,
    introAndConclusionRules: `
- دەروازە: کێشەی توێژینەوە، گرنگی، ئامانج، هۆکاری هەڵبژاردنی بابەت، سنووری توێژینەوە و میتۆدی توێژینەوە بە پوختی و ڕوونی.
- ئەنجام: گرنگترین ئەو ئەنجامانەی خوێندکار پێی گەیشتووە لە شێوەی خاڵی زانستیی ڕوون لەگەڵ چەند پێشنیارێک.`,
    structure: {
      totalWords: 12000,
      introWords: 1200,
      conclusionWords: 800,
      coreChaptersCount: 3, // ٣ بەشی سەرەکی
      sectionsPerChapter: 2, // هەر بەشێک ٢ تەوەر
      subSectionsPerSection: 2, // هەر تەوەرێک ٢ لق
      maxWordsPerSinglePass: 1200, // ١ قۆناغ بۆ هەر لقێک
      minSources: 20
    },
    citationMode: "standard_footnotes",
    designSpec: {
      fontFamily: "UniQAIDAR_AZZAM, Traditional Arabic, Arial",
      bodyFontSizePt: 14,
      h1SizePt: 16,
      h2SizePt: 15,
      h3SizePt: 14,
      footnoteSizePt: 12,
      lineHeight: 1.5,
      marginsCm: { top: 2.5, bottom: 2.5, right: 3.0, left: 2.5 },
      visualStyle: "standard_university"
    }
  },

  master: {
    level: "master",
    kurdishTitle: "ئاستی ماستەر (نامەی ماستەری نایاب)",
    personaPrompt: `
تۆ توێژەرێکی ئاستی خوێندنی باڵایت کە نامەی ماستەر (Master's Thesis) بە بەرزترین ستانداردی ئەکادیمی دەنووسێت.
تۆ توانایەکی بەرزی داڕشتنی چوارچێوەی تیۆری، بەراوردکردنی قوتابخانە ڕەخنەیی و زانستییەکان، و شیکردنەوەی وردی دەق و داتاکانت هەیە.`,
    vocabularyAndStyleRules: `
- زمانی ئەکادیمیی باڵا، شیکاری و بەراوردکاری.
- هەر پەرەگرافێک لەسەر بنەمای (بیرۆکەی تەوەرەیی + پشتڕاستکردنەوە بە تیۆری یان دەق + شیکردنەوەی توێژەر) دادەڕێژرێت.
- گرێدانی تەواوی چوارچێوەی تیۆری (بەشی یەکەم) بە شیکردنەوە پراکتیکییەکان (بەشی دووەم و سێیەم).`,
    strictlyForbiddenRules: `
- قەدەغەیە ڕیزکردنی زانیاریی مێژوویی و وەسفی بەبێ شیکردنەوەی ڕەخنەیی.
- قەدەغەیە بەکارهێنانی سەردێڕی قاڵبیی گشتی کە چەمکەکانی ناونیشانەکەی تێدا نەبێت.`,
    introAndConclusionRules: `
- دەروازە: کێشەی توێژینەوە، پرسیارەکان، ئامانج، گریمانەکان، سنوور، میتۆدۆلۆژیا، و پێداچوونەوەی ڕەخنەیی بۆ توێژینەوەکانی پێشوو (Literature Review).
- ئەنجام: وەڵامدانەوەی یەک بە یەکی پرسیارەکان و سەلماندنی گریمانەکان لەگەڵ ڕاسپاردەی زانستی.`,
    structure: {
      totalWords: 45000,
      introWords: 3500,
      conclusionWords: 2000,
      coreChaptersCount: 3,
      sectionsPerChapter: 3,
      subSectionsPerSection: 2,
      maxWordsPerSinglePass: 1300, // ٢ قۆناغ بۆ هەر لقێک (~٢٢٠٠ وشە بۆ هەر لقێک)
      minSources: 75
    },
    citationMode: "scholarly_multilingual_footnotes",
    designSpec: {
      fontFamily: "UniQAIDAR_AZZAM, Traditional Arabic, Arial",
      bodyFontSizePt: 14,
      h1SizePt: 18,
      h2SizePt: 16,
      h3SizePt: 14,
      footnoteSizePt: 12,
      lineHeight: 1.5,
      marginsCm: { top: 2.5, bottom: 2.5, right: 3.5, left: 2.5 },
      visualStyle: "formal_thesis_binding"
    }
  },

  phd: {
    level: "phd",
    kurdishTitle: "ئاستی دکتۆرا (تێزی دکتۆرای نایاب - PhD Dissertation)",
    personaPrompt: `
تۆ پڕۆفیسۆر و بیرمەندێکی ئەکادیمیی باڵایت کە تێزی دکتۆرا (PhD Dissertation) دەنووسێت.
تۆ خاوەنی ڕوانگەی ڕەخنەیی، فەلسەفی و تیۆریی قووڵیت؛ بۆشاییەکی مەعریفی (Knowledge Gap) لە کتێبخانەی کوردیدا پڕ دەکەیتەوە، تێڕوانینە باوەکان هەڵدەوەشێنیتەوە و تێز و مۆدێلێکی نوێی مەعریفی پێشکەش دەکەیت.`,
    vocabularyAndStyleRules: `
- بەرزترین ئاستی زمانی ئەکادیمی، ڕەخنەیی و فیکریی کوردی.
- گفتوگۆی قووڵ لەگەڵ تیۆریستە جیهانییەکان، شیتەڵکردنی فرەڕەهەندی دەقەکان و دەرخستنی مانا شاراوە و گوتارییەکان.
- دیاربوونی کەسایەتیی زانستیی توێژەر (Authorial Voice) لە هەڵسەنگاندن و سەنتێزی کۆتایی هەموو لقێکدا.`,
    strictlyForbiddenRules: `
- قەدەغەیە سەردێڕی قاڵبی و گشتی، یان کۆپیکردنی دەقاودەقی ناونیشانەکە لە ناو کەوانە لە کۆتایی سەردێڕەکاندا.
- قەدەغەیە تێکەڵکردنی قاڵبی ئاماری لەگەڵ توێژینەوەی ئەدەبی و فیکریدا.
- قەدەغەیە کورتبڕی و خاڵبەندیی ڕووکەش لەبری پەرەگرافی شیکاریی قووڵ.`,
    introAndConclusionRules: `
- دەروازە: داڕشتنی قووڵی کێشەی توێژینەوە، پرسیاری سەرەکی و لاوەکی، گریمانەکان، میتۆدی تێکهەڵکێش، ماتریسی هاوتابوونی ستوونی، و دەستنیشانکردنی وردی کەلێنی مەعریفی لەچاو ئەدەبیاتی کوردی و جیهانیدا.
- ئەنجام: دەرەنجامی تیۆری و پراکتیکیی نوێ، بەشداریی ڕەسەنی تێزەکە لە مەعریفەی کوردیدا (Original Contribution)، و پێشنیارکردنی پڕۆژەی توێژینەوەی داهاتوو.`,
    structure: {
      totalWords: 90000,
      introWords: 6000,
      conclusionWords: 3500,
      coreChaptersCount: 3, // ٣ بەشی گەورە (تیۆری + پراکتیکی ١ + پراکتیکی ٢)
      sectionsPerChapter: 3, // ٩ تەوەر
      subSectionsPerSection: 3, // ٢٧ لقی سەرەکی
      maxWordsPerSinglePass: 1400, // ٣ قۆناغ بۆ هەر لقێک (~٣٠٠٠ بۆ ٤٠٠٠ وشە بۆ هەر لقێک)
      minSources: 160
    },
    citationMode: "scholarly_multilingual_footnotes",
    designSpec: {
      fontFamily: "UniQAIDAR_AZZAM, Traditional Arabic, Arial",
      bodyFontSizePt: 14,
      h1SizePt: 18,
      h2SizePt: 16,
      h3SizePt: 14,
      footnoteSizePt: 12,
      lineHeight: 1.5,
      marginsCm: { top: 2.5, bottom: 2.5, right: 3.5, left: 2.5 },
      visualStyle: "formal_thesis_binding"
    }
  }
};
