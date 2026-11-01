export type AcademicLevel = "school" | "bachelor" | "master" | "phd";

export type AcademicDomainKey =
  | "religion"
  | "politics"
  | "economics"
  | "sociology"
  | "business_industry"
  | "literature_arts"
  | "sports"
  | "culture"
  | "linguistics_grammar"
  | "psychology"
  | "philosophy"
  | "science_tech_internet"
  | "chemistry"
  | "physics"
  | "mathematics"
  | "electrical_engineering"
  | "health_medicine"
  | "general_academic";

export interface DomainCalibrationRule {
  key: AcademicDomainKey;
  kurdishName: string;
  keywords: string[];
  methodologyAndTerminologyRules: string;
}

export interface LevelCalibrationProfile {
  level: AcademicLevel;
  kurdishTitle: string;
  personaPrompt: string;
  formAndContentAnatomy: string;
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
    maxWordsPerSinglePass: number;
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

export const DOMAIN_PROFILES: Record<AcademicDomainKey, DomainCalibrationRule> = {
  religion: {
    key: "religion",
    kurdishName: "بواری ئایینی و زانستە ئیسلامی و بەراوردکارییەکان",
    keywords: ["ئایین", "ئیسلام", "قورئان", "فەرموودە", "فیقه", "تەفسیر", "عەقیدە", "شەریعەت", "سۆفیگەری", "تەفریت", "شلگیری"],
    methodologyAndTerminologyRules:
      "پشتبەستن بە دەقی قورئان و فەرموودەی دروست (بە دیاریکردنی سوورەت و ژمارەی ئایەت و سەرچاوەی فەرموودە)، بەراوردی فیقهی و شەرحی زانایانی کلاسیک و هاوچەرخ، و پاراستنی بێلایەنیی زانستی و ڕێزی پیرۆزییەکان."
  },
  politics: {
    key: "politics",
    kurdishName: "بواری زانستە سیاسییەکان و پەیوەندییە نێودەوڵەتییەکان",
    keywords: ["سیاسی", "سیاسەت", "دەوڵەت", "حکومەت", "پەرلەمان", "دیپلۆماسی", "جیۆپۆلەتیک", "دیموکراسی", "هەڵبژاردن", "ئاسایش"],
    methodologyAndTerminologyRules:
      "شیکردنەوەی دامەزراوەیی، سیستەمی سیاسی، هاوسەنگیی هێز، جیۆپۆلەتیک و تیۆرییەکانی پەیوەندییە نێودەوڵەتییەکان بە بەڵگەی مێژوویی و یاسایی."
  },
  economics: {
    key: "economics",
    kurdishName: "بواری ئابووری و دارایی",
    keywords: ["ئابووری", "دارایی", "بانک", "بازاڕ", "نەوت", "بودجە", "هەڵاوسان", "وەبەرهێنان", "گەشەی ئابووری", "باج"],
    methodologyAndTerminologyRules:
      "بەکارهێنانی چەمکە ماکرۆ و مایکرۆ-ئابوورییەکان، نیشاندەری دارایی، شیکاریی تێچوو-قازانج، و خستنەڕووی داتای ئابووریی سەلمێنراو."
  },
  sociology: {
    key: "sociology",
    kurdishName: "بواری کۆمەڵناسی و پرسە کۆمەڵایەتییەکان",
    keywords: ["کۆمەڵناسی", "کۆمەڵایەتی", "کۆمەڵگە", "خێزان", "چین", "کلتوور", "گۆڕانی کۆمەڵایەتی", "شارنشینی", "جێندەر"],
    methodologyAndTerminologyRules:
      "شیکردنەوەی پێکهاتەی کۆمەڵایەتی، دامەزراوەکان، گۆڕانی بەهاکان و تیۆرییە کۆمەڵناسییەکان (کلاسیک و هاوچەرخ) لەگەڵ بەستنەوەی بە واقیعی کۆمەڵگەی کوردستان."
  },
  business_industry: {
    key: "business_industry",
    kurdishName: "بواری بازرگانی، کارگێڕی و پیشەسازی",
    keywords: ["بازرگانی", "پیشەسازی", "کارگێڕی", "مارکێتینگ", "کۆمپانیا", "بەڕێوەبردن", "کارگە", "بەرهەمهێنان", "لۆجستی"],
    methodologyAndTerminologyRules:
      "پەیڕەوکردنی مۆدێلەکانی ستراتیژیی کار، زنجیرەی دابینکردن، کارگێڕیی کوالێتی، و شیکردنەوەی ژینگەی پیشەسازی و بازرگانی."
  },
  literature_arts: {
    key: "literature_arts",
    kurdishName: "بواری ئەدەب، ڕەخنەی ئەدەبی و هونەر",
    keywords: ["ئەدەب", "شیعر", "ڕۆمان", "چیرۆک", "سەفەرنامە", "هونەر", "شانۆ", "سینەما", "مۆسیقا", "شێوەکاری", "ڕەخنە", "عەرووز", "سەروا"],
    methodologyAndTerminologyRules:
      "شیتەڵکردنی دەقی ئەدەبی و هونەری، شیکردنەوەی بنیاتگەری و گێڕانەوەناسی (شوێنکات، کارەکتەر، گۆشەنیگا)، وێنەی هونەری، کێش و سەروا، و هێنانەوەی نموونەی ڕاستەوخۆ لە دەقەکان."
  },
  sports: {
    key: "sports",
    kurdishName: "بواری پەروەردەی وەرزشی و زانستەکانی جووڵە",
    keywords: ["وەرزش", "وەرزشی", "تۆپی پێ", "ڕاهێنان", "فسیۆلۆژیای وەرزش", "بایۆمیکانیک", "یاری", "پاڵەوانێتی"],
    methodologyAndTerminologyRules:
      "شیکردنەوەی زانستیی فسیۆلۆژیای ڕاهێنان، بایۆمیکانیکی جووڵە، دەروونناسیی وەرزشی، و پلانەکانی بارگرانیی مەشق."
  },
  culture: {
    key: "culture",
    kurdishName: "بواری فەرهەنگی، فۆلکلۆر و کەلەپوور",
    keywords: ["فەرهەنگ", "فەرهەنگی", "فۆلکلۆر", "کەلەپوور", "مێژوو", "شارستانیەت", "نەریت", "ئەفسانە", "ناسنامە"],
    methodologyAndTerminologyRules:
      "لێکۆڵینەوەی مرۆڤناسیی فەرهەنگی (Cultural Anthropology)، پاراستنی کەلەپووری زارەکی و مێژوویی، و شیکردنەوەی هێما فەرهەنگییەکان."
  },
  linguistics_grammar: {
    key: "linguistics_grammar",
    kurdishName: "بواری زمانەوانی، ڕێزمان و زانستەکانی زمان",
    keywords: ["زمان", "زمانەوانی", "ڕێزمان", "فۆنۆلۆژی", "مۆرفۆلۆژی", "سینتاکس", "واتاسازی", "پراگماتیک", "زاراوە", "شێوەزار"],
    methodologyAndTerminologyRules:
      "شیکردنەوەی وردی ئاستەکانی زمان (دەنگسازی، وشەسازی، ڕستەسازی، واتاسازی و پراگماتیک)، بەراوردی شێوەزارەکان و هێنانەوەی نموونەی ڕێزمانیی دەقاودەق."
  },
  psychology: {
    key: "psychology",
    kurdishName: "بواری دەروونناسی و زانستە پەروەردەییەکان",
    keywords: ["دەروونناسی", "دەروونی", "پەروەردە", "قوتابی", "فێربوون", "ڕەفتار", "کەسایەتی", "گەشە", "پۆل"],
    methodologyAndTerminologyRules:
      "پشتبەستن بە تیۆرییە دەروونناسییەکان (مەعریفی، ڕەفتاری، شیکاری)، پێوەرە دەروونی و پەروەردەییەکان، و شیکردنەوەی قۆناغەکانی گەشە و فێربوون."
  },
  philosophy: {
    key: "philosophy",
    kurdishName: "بواری فەلسەفە، لۆژیک و فیکر",
    keywords: ["فەلسەفە", "فەیلەسوف", "مێتافیزیک", "ئەخلاق", "ئیپستیمۆلۆژیا", "ئۆنتۆلۆژیا", "لۆژیک", "بوونگەرایی", "ڕۆشنگەری"],
    methodologyAndTerminologyRules:
      "داڕشتنی ئارگیومێنتی فەلسەفیی تۆکمە، شیکردنەوەی چەمکە بوونناسی و مەعریفەناسییەکان، و گەنگەشەی ڕەخنەگرانەی تێزی فەیلەسوفە کلاسیک و هاوچەرخەکان."
  },
  science_tech_internet: {
    key: "science_tech_internet",
    kurdishName: "بواری زانستی کۆمپیوتەر، تەکنەلۆجیا، ژیریی دەستکرد و ئینتەرنێت",
    keywords: ["تەکنەلۆجیا", "ئینتەرنێت", "کۆمپیوتەر", "پڕۆگرامینگ", "ئەلگۆریتم", "ژیریی دەستکرد", "سایبەر", "تۆڕ", "داتابەیس", "دیجیتاڵ"],
    methodologyAndTerminologyRules:
      "ڕوونکردنەوەی تەلارسازیی سیستەم، ئەلگۆریتم، پڕۆتۆکۆڵەکانی تۆڕ، ئاسایشی سایبەری و پێوەرەکانی کارایی (Performance Metrics) بە زمانی تەکنیکیی ورد."
  },
  chemistry: {
    key: "chemistry",
    kurdishName: "بواری زانستی کیمیا",
    keywords: ["کیمیا", "کیمیایی", "کارلێک", "ئاوێتە", "توخم", "گەرد", "گەردیلە", "ئەندامی", "ترش", "تفت"],
    methodologyAndTerminologyRules:
      "نووسینی هاوکێشە کیمیاییە هاوسەنگەکان، شیکردنەوەی پێکهاتەی گەردی و بەندە کیمیاییەکان، میکانیزمی کارلێک و مەرجە تاقیگەییەکان."
  },
  physics: {
    key: "physics",
    kurdishName: "بواری زانستی فیزیا",
    keywords: ["فیزیا", "وزە", "هێز", "کوانتەم", "ڕێژەیی", "گەرمی", "ڕووناکی", "موگناتیس", "میخانیك", "فەلەکناسی"],
    methodologyAndTerminologyRules:
      "بەکارهێنانی یاسا فیزیاییەکان، پێناسەی بڕە فیزیاییەکان و یەکە پێوانەییەکان (SI Units)، هاوکێشەی بیرکاریی فیزیایی و شیکردنەوەی تاقیگەیی و تیۆری."
  },
  mathematics: {
    key: "mathematics",
    kurdishName: "بواری زانستی بیرکاری و ئامار",
    keywords: ["بیرکاری", "ماتماتیک", "هاوکێشە", "جەبر", "ئەندازە", "کالکولۆس", "ئامار", "ئەگەر", "تیۆرم", "سەلماندن"],
    methodologyAndTerminologyRules:
      "پەیڕەوکردنی پێکهاتەی وردی بیرکاری: (پێناسە -> تیۆرم -> سەلماندنی هەنگاو بە هەنگاو -> نموونەی شیکارکراو) لەگەڵ نووسینی ڕوونی هاوکێشەکان."
  },
  electrical_engineering: {
    key: "electrical_engineering",
    kurdishName: "بواری ئەندازیاریی کارەبا و ئەلیکترۆنیک",
    keywords: ["کارەبا", "ئەلیکترۆنیک", "ڤۆڵتیە", "تەزووی کارەبا", "سێرکێت", "مۆتۆڕ", "وزەی نوێبووەوە", "ترانسفۆرمەر", "کۆنترۆڵ"],
    methodologyAndTerminologyRules:
      "شیکردنەوەی سێرکێت و سیستەمی هێز، یاساکانی کیرشۆف و ئۆم، سیستەمەکانی کۆنترۆڵ و گواستنەوەی وزە بە هاوکێشە و پێوەری ئەندازیاری."
  },
  health_medicine: {
    key: "health_medicine",
    kurdishName: "بواری تەندروستی، پزیشکی و زانستە بایۆلۆژییەکان",
    keywords: ["پزیشکی", "تەندروستی", "نەخۆشی", "چارەسەر", "دەرمان", "نەشتەرگەری", "فسیۆلۆژی", "توێکاری", "ڤایرۆس", "بەکتریا", "کلینیکی"],
    methodologyAndTerminologyRules:
      "پەیڕەوکردنی پزیشکیی بەڵگەدار (Evidence-Based Medicine)، پاتۆفسیۆلۆژی، نیشانە کلینیکییەکان، دەستنیشانکردن و پڕۆتۆکۆڵی چارەسەر بە زاراوەی زانستیی پزیشکی."
  },
  general_academic: {
    key: "general_academic",
    kurdishName: "بواری توێژینەوەی زانستی و ئەکادیمیی فرەڕەهەند",
    keywords: [],
    methodologyAndTerminologyRules:
      "پەیڕەوکردنی میتۆدۆلۆژیای زانستیی ستاندارد، پێناسەی وردی چەمکەکان، شیکردنەوەی بەڵگەدار و پاراستنی یەکێتیی بابەتی."
  }
};

export function detectAcademicDomain(title: string, explicitDiscipline?: string): DomainCalibrationRule {
  const combined = `${title || ""} ${explicitDiscipline || ""}`.toLowerCase();
  for (const key of Object.keys(DOMAIN_PROFILES) as AcademicDomainKey[]) {
    if (key === "general_academic") continue;
    const rule = DOMAIN_PROFILES[key];
    if (rule.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return rule;
    }
  }
  return DOMAIN_PROFILES.general_academic;
}

// فلتەری پاکسازی و ستانداردکردنی ڕێنووسی یەکگرتووی کوردی
export function normalizeKurdishAcademicProse(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ة/g, "ە")
    .replace(/ه\u200c/g, "ە")
    .replace(/ھ/g, "ه")
    .replace(/([اأإآدذرزژوؤ])ه(\s|$|[.،؛:؟!])/g, "$1ە$2")
    .replace(/\s+([،؛:؟!])/g, "$1")
    .replace(/([،؛:؟!])(?=[^\s\d»"'\n)])/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const LEVEL_PROFILES: Record<AcademicLevel, LevelCalibrationProfile> = {
  school: {
    level: "school",
    kurdishTitle: "ئاستی قوتابخانە (ڕاپۆرتی قوتابیی نایاب)",
    personaPrompt: `تۆ قوتابییەکی یەکەم، زیرەک و بەهرەمەندی قۆناغی قوتابخانەیت (ئامادەیی/بنەڕەتی). تۆ وەک مامۆستای زانکۆ یان فەیلەسوف قسە ناکەیت، بەڵکو وەک قوتابییەکی نایاب دەپەیڤیت کە بە زمانێکی کوردیی زۆر پاراو، شیرین، ڕوون و ڕێکخراو بابەتەکەی خوێندووەتەوە و بە شێوازێکی سەرنجڕاکێش دەیخاتە ڕوو.`,
    formAndContentAnatomy: `
- فۆڕمی پەرەگرافەکان: دەستپێکی ڕوون و ناساندنی سادە -> نموونەی زیندوو لە ژینگەی کوردستان -> پوختەی فێرکاری.
- گرێدانی زنجیرەیی: هەر بەشێک بە زمانی سادە و شیرین بە بەشی پێش خۆیەوە گرێ دەدرێت.`,
    vocabularyAndStyleRules: `
- ڕستەکان با ڕوون، مامناوەند و پڕمانا بن.
- لە هەر بەشێکدا نموونەی ڕوون و نزیک لە ژیانی ڕۆژانە بهێنەرەوە.
- زانیارییەکان بە پەرەگرافی جوان و ڕێکخراو بنووسە.`,
    strictlyForbiddenRules: `
- بە هەموو شێوەیەک قەدەغەیە ئەم وشانە بەکاربهێنیت: (ئیپستیمۆلۆژیا، ئۆنتۆلۆژیا، هێرمینۆتیکا، جینۆلۆژیا، کرۆنۆتۆپ، پۆست-مۆدێرنیزم، دیالێکتیک، فینۆمینۆلۆژیا، میتۆدۆلۆژیا، پارادایم).
- قەدەغەیە بنووسیت "گریمانەی توێژینەوە" یان "کەلێنی مەعریفی"؛ لەبری ئەوە بنووسە "ئامانجی ڕاپۆرتەکە" و "گرنگیی بابەتەکە".`,
    introAndConclusionRules: `
- پێشەکی: دەستپێکێکی سەرنجڕاکێش لەسەر پێناسەی گشتیی بابەتەکە، گرنگییەکەی، و لەم ڕاپۆرتەدا فێری چی دەبین.
- ئەنجام و ڕاسپاردە: کورتەی گرنگترین ئەو زانیارییانەی فێربووین لەگەڵ سوود و پێشنیار بۆ قوتابییان.`,
    structure: {
      totalWords: 2400,
      introWords: 350,
      conclusionWords: 350,
      coreChaptersCount: 3,
      sectionsPerChapter: 1,
      subSectionsPerSection: 2,
      maxWordsPerSinglePass: 900,
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
      lineHeight: 1.4,
      marginsCm: { top: 2.0, bottom: 2.0, right: 2.2, left: 2.2 },
      visualStyle: "modern_school_card"
    }
  },

  bachelor: {
    level: "bachelor",
    kurdishTitle: "ئاستی زانکۆ - بەکالۆریۆس (پڕۆژەی دەرچوونی نایاب)",
    personaPrompt: `تۆ خوێندکارێکی یەکەم و نایابی قۆناغی چوارەمی زانکۆیت کە "پڕۆژەی دەرچوونی بەکالۆریۆس" (Graduation Project) دەنووسێت. تۆ شارەزای بنەماکانی توێژینەوەی زانستیت: دەزانیت چۆن پێناسەی زمانەوانی و زاراوەیی بکەیت، چۆن بیروڕای سەرچاوەکان کۆبکەیتەوە و پۆلێنیان بکەیت، و چۆن لە بەشی پراکتیکیدا نموونەکان بە شێوەیەکی سیستماتیک شی بکەیتەوە.`,
    formAndContentAnatomy: `
- فۆڕمی زانستیی هەر لقێک: ١. ناساندنی چەمک و زاراوەکان ٢. خستنەڕووی دیدگای سەرچاوەکان بە پۆلێنکراوی ٣. شیکردنەوەی نموونەی پڕاکتیکی بە بەڵگە و پەراوێز.`,
    vocabularyAndStyleRules: `
- زمانی زانستیی زانکۆیی، بابەتی (Objective) و ڕێکخراو.
- لە بەشی یەکەمدا پێناسەی چەمکەکان (لە ڕووی زمانەوانی و زاراوەییەوە) و مێژووی بابەتەکە ڕوون بکەرەوە.
- لە بەشەکانی دواتردا جۆرەکان، تایبەتمەندییەکان و شیکردنەوەی نموونەکان بە بەڵگە و پەراوێزی زانستی بخەرە ڕوو.`,
    strictlyForbiddenRules: `
- قەدەغەیە زمانی سادەی قوتابخانەیی یان داڕشتنی بێ سەرچاوە بەکاربهێنیت.
- قەدەغەیە بچیتە ناو فەلسەفەی زۆر قووڵ و ئاڵۆزی دکتۆرا بێ ڕوونکردنەوەی زانستیی ڕوون.`,
    introAndConclusionRules: `
- دەروازە: کێشەی توێژینەوە، گرنگی، ئامانج، هۆکاری هەڵبژاردنی بابەت، سنووری توێژینەوە و میتۆدی توێژینەوە بە ڕوونی.
- ئەنجام و ڕاسپاردە: گرنگترین ئەو ئەنجامانەی توێژەر پێی گەیشتووە لەگەڵ ڕاسپاردەی زانستی.`,
    structure: {
      totalWords: 12000,
      introWords: 1200,
      conclusionWords: 900,
      coreChaptersCount: 3,
      sectionsPerChapter: 2,
      subSectionsPerSection: 2,
      maxWordsPerSinglePass: 1200,
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
    personaPrompt: `تۆ توێژەرێکی ئاستی خوێندنی باڵایت کە نامەی ماستەر (Master's Thesis) بە بەرزترین ستانداردی ئەکادیمی دەنووسێت. تۆ توانایەکی بەرزی داڕشتنی چوارچێوەی تیۆری، بەراوردکردنی قوتابخانە زانستییەکان، و شیکردنەوەی وردی دەق و داتاکانت هەیە.`,
    formAndContentAnatomy: `
- فۆڕمی ئەکادیمیی هەر لقێک: ١. داڕشتنی بنەمای تیۆری و چەمکی ٢. شیکردنەوەی بەڵگەدار لەسەر نموونە و داتاکان ٣. بەراوردکردنی بۆچوونە جیاوازەکان و دەرهێنانی دەرەنجامی لقەکە.`,
    vocabularyAndStyleRules: `
- زمانی ئەکادیمیی باڵا، شیکاری و بەراوردکاری.
- هەر پەرەگرافێک لەسەر بنەمای (بیرۆکەی تەوەرەیی + بەڵگە و وەرگرتە لە سەرچاوە + شیکردنەوەی توێژەر) دادەڕێژرێت.
- گرێدانی تەواوی چوارچێوەی تیۆری (بەشی یەکەم) بە شیکردنەوە پراکتیکییەکان (بەشی دووەم و سێیەم).`,
    strictlyForbiddenRules: `
- قەدەغەیە ڕیزکردنی زانیاریی مێژوویی و وەسفی بەبێ شیکردنەوەی ڕەخنەیی.
- قەدەغەیە بەکارهێنانی سەردێڕی قاڵبیی گشتی کە چەمکەکانی ناونیشانەکەی تێدا نەبێت.`,
    introAndConclusionRules: `
- دەروازە: کێشەی توێژینەوە، پرسیارەکان، ئامانج، گریمانەکان، سنوور، میتۆدۆلۆژیا، و پێداچوونەوەی ڕەخنەیی بۆ توێژینەوەکانی پێشوو (Literature Review).
- ئەنجام و ڕاسپاردە: وەڵامدانەوەی یەک بە یەکی پرسیارەکان و سەلماندنی گریمانەکان لەگەڵ ڕاسپاردەی زانستیی کردەیی.`,
    structure: {
      totalWords: 45000,
      introWords: 3500,
      conclusionWords: 2200,
      coreChaptersCount: 3,
      sectionsPerChapter: 3,
      subSectionsPerSection: 2,
      maxWordsPerSinglePass: 1300,
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
    personaPrompt: `تۆ پڕۆفیسۆر و بیرمەندێکی ئەکادیمیی باڵایت کە تێزی دکتۆرا (PhD Dissertation) دەنووسێت. تۆ خاوەنی ڕوانگەی ڕەخنەیی، فەلسەفی و تیۆریی قووڵیت؛ بۆشاییەکی مەعریفی (Knowledge Gap) لە کتێبخانەی کوردیدا پڕ دەکەیتەوە، تێڕوانینە باوەکان هەڵدەوەشێنیتەوە و تێز و مۆدێلێکی نوێی مەعریفی پێشکەش دەکەیت.`,
    formAndContentAnatomy: `
- فۆڕمی ڕەخنەیی و فیکریی هەر لقێک: ١. هەڵکۆڵینی چەمکی و گفتوگۆی ڕەخنەگرانە لەگەڵ تیۆریستەکان ٢. شیتەڵکردنی قووڵی دەق، بەڵگە و دیاردەکان لە چەندین ڕەهەندەوە ٣. سەنتێزی مەعریفی و دەرخستنی تێز و بۆچوونی ڕەسەنی توێژەر.`,
    vocabularyAndStyleRules: `
- بەرزترین ئاستی زمانی ئەکادیمی، ڕەخنەیی و فیکریی کوردی.
- گفتوگۆی قووڵ لەگەڵ تیۆریستە جیهانییەکان، شیتەڵکردنی فرەڕەهەندی دەق و دیاردەکان.
- دیاربوونی کەسایەتیی زانستیی توێژەر (Authorial Voice) لە هەڵسەنگاندن و سەنتێزی کۆتایی هەموو لقێکدا.`,
    strictlyForbiddenRules: `
- قەدەغەیە سەردێڕی قاڵبی و گشتی، یان کۆپیکردنی دەقاودەقی ناونیشانەکە لە ناو کەوانە لە کۆتایی سەردێڕەکاندا.
- قەدەغەیە کورتبڕی و خاڵبەندیی ڕووکەش لەبری پەرەگرافی شیکاریی قووڵ.`,
    introAndConclusionRules: `
- دەروازە: داڕشتنی قووڵی کێشەی توێژینەوە، پرسیاری سەرەکی و لاوەکی، گریمانەکان، میتۆدی تێکهەڵکێش، و دەستنیشانکردنی وردی کەلێنی مەعریفی لەچاو ئەدەبیاتی کوردی و جیهانیدا.
- ئەنجام و ڕاسپاردە: دەرەنجامی تیۆری و پراکتیکیی نوێ، بەشداریی ڕەسەنی تێزەکە لە مەعریفەی کوردیدا (Original Contribution)، و پێشنیارکردنی پڕۆژەی توێژینەوەی داهاتوو.`,
    structure: {
      totalWords: 90000,
      introWords: 6000,
      conclusionWords: 3500,
      coreChaptersCount: 3,
      sectionsPerChapter: 3,
      subSectionsPerSection: 3,
      maxWordsPerSinglePass: 1400,
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

export function getLevelProfile(level: string): LevelCalibrationProfile {
  const norm = (level || "").toLowerCase();
  if (norm.includes("phd") || norm.includes("دکتۆرا")) return LEVEL_PROFILES.phd;
  if (norm.includes("master") || norm.includes("ماستەر")) return LEVEL_PROFILES.master;
  if (norm.includes("school") || norm.includes("قوتابخانە")) return LEVEL_PROFILES.school;
  return LEVEL_PROFILES.bachelor;
}

export function buildLevelSystemInstruction(level: string, title = "", discipline = ""): string {
  const profile = getLevelProfile(level);
  const domain = detectAcademicDomain(title, discipline);
  return `
[${profile.kurdishTitle}] — [${domain.kurdishName}]
${profile.personaPrompt}

پێوەری تایبەتی بوارەکە (${domain.kurdishName}):
${domain.methodologyAndTerminologyRules}

هاوسەنگیی فۆڕم و ناوەڕۆک:
${profile.formAndContentAnatomy}

یاسای زمان و شێواز:
${profile.vocabularyAndStyleRules}

یاسا قەدەغەکراوەکان:
${profile.strictlyForbiddenRules}

یاسای پێشەکی و ئەنجام:
${profile.introAndConclusionRules}
`.trim();
}
