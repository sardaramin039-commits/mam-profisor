import { ChapterItemModel as ChapterItem } from '../domain/models';
import { generateGranularBookSections } from './academic-book-outline.helper';

export interface ThesisOutlineOptions {
  title: string;
  discipline?: string;
  writingType?: string;
  academicLevel?: string;
  targetPages?: number;
  includeDedication?: boolean;
  includeIntro?: boolean;
  includeTOC?: boolean;
  includeConclusion?: boolean;
  includeRecommendations?: boolean;
  includeReferences?: boolean;
  customSourcesOn?: boolean;
  customSourcesText?: string;
  customTOCOn?: boolean;
  customTOCText?: string;
  fieldWorkOn?: boolean;
  fieldWorkText?: string;
  thesisStructureType?: 'humanities' | 'empirical';
}

export function buildAcademicThesisOutline(options: ThesisOutlineOptions): ChapterItem[] {
  const title = (options.title || '').trim() || 'تێزی زانستی';
  const targetPages = Math.max(1, options.targetPages || 10);
  const totalTargetWords = targetPages * 350;
  const isHumanities = options.thesisStructureType !== 'empirical';

  const chapters: ChapterItem[] = [];
  let currentId = 1;

  // 1. پێشکەشە (Dedication)
  if (options.includeDedication !== false) {
    chapters.push({
      id: currentId++,
      title: 'پێشکەشە و سوپاسنامە (Dedication & Acknowledgments)',
      wordCount: 0,
      status: 'pending',
      content: `## پێشکەشە و سوپاسنامە\n\nئەم کارە زانستییە پێشکەشە بە سەرجەم ئەو مامۆستا و توێژەرە بەڕێزانەی کە ڕێگای مەعریفەیان بۆ ڕووناک کردینەوە.\n\nسوپاسی تایبەت بۆ سەرپەرشتیاری بەڕێز و سەرجەم ئەندامانی لێژنەی زانستی کە بە سەرنج و ڕەخنە بەپێزەکانیان ئەم تێزەیان دەوڵەمەندتر کرد.`,
      academicNotes: 'پێشکەشکردنی ئەکادیمی و دەربڕینی پێزانینی زانستی بەپێی نەریتی ئەکادیمی.',
      customTargetWords: 150
    });
  }

  // 2. پێڕست و ناوەڕۆک (Table of Contents)
  if (options.includeTOC !== false) {
    chapters.push({
      id: currentId++,
      title: 'پێڕستی بابەتەکان و خشتەکان (Table of Contents)',
      wordCount: 0,
      status: 'pending',
      content: `## پێڕستی گشتیی تەوەر و بەشەکان\n\n**پەیکەری تێز:** ${isHumanities ? 'زانستە مرۆڤایەتییەکان (ئەدەب، زمان، مێژوو، فەلسەفە)' : 'زانستە پەروەردەیی، کۆمەڵایەتی و ئەزموونییەکان (٥ بەشی)'}\n**قەبارەی تێز:** ${targetPages} لاپەڕە (${totalTargetWords} وشە).\n\n- پێڕستی دەروازە و بەشە سەرەکییەکان\n- پێڕستی خشتەکان و نەخشەکان\n- پێڕستی سەرچاوە و بەیبلۆگرافی`,
      academicNotes: 'پێڕستی فەرمیی تێز بەپێی ستانداردی زانکۆکانی کوردستان.',
      customTargetWords: 200
    });
  }

  if (isHumanities) {
    // === HUMANITIES STRUCTURE (زانستە مرۆڤایەتییەکان) ===
    // دەروازە: چوارچێوەی گشتی و میتۆدی توێژینەوە
    chapters.push({
      id: currentId++,
      title: 'دەروازە: چوارچێوەی گشتی و میتۆدی توێژینەوە',
      wordCount: 0,
      status: 'pending',
      content: `## دەروازە: چوارچێوەی گشتی و میتۆدی توێژینەوە\n\n### ١. کێشەی توێژینەوە (Research Problem):\nکێشەی سەرەکی بریتییە لە شیکردنەوەی چەمکسازی و ئارگیومێنتەکانی دەوری «${title}» و بۆشایی لێکۆڵینەوە لە دەقە کوردییەکاندا.\n\n### ٢. پرسیارەکانی توێژینەوە:\n- ڕەهەندە فیکری و زمانییەکانی بابەتەکە چین؟\n- دەقە دەستنیشانکراوەکان چۆن ئەم دیاردەیە نیشان دەدەن؟\n\n### ٣. گرنگی و ئامانجەکانی توێژینەوە:\nدەستنیشانکردنی پێگەی دەقیی بابەت و بەشداریی لە دەوڵەمەندکردنی کتێبخانەی نەتەوەیی.\n\n### ٤. سنووری توێژینەوە:\nسنووری بابەتی، دەقی، و مێژوویی لێکۆڵینەوە.\n\n### ٥. میتۆدی توێژینەوە:\nپەیڕەوکردنی میتۆدی وەسفی-شیکاری و هێرمۆنۆتیکی دەق.\n\n### ٦. چەمک و زاراوە سەرەکییەکان.\n\n### ٧. پێداچوونەوەی توێژینەوەکانی پێشوو (Literature Review).`,
      academicNotes: 'دەروازەی میتۆدیی زانستە مرۆڤایەتییەکان بەپێی ڕێنمایی زانکۆکانی کوردستان.',
      customTargetWords: Math.round(totalTargetWords * 0.15)
    });

    // بەشی یەکەم: چوارچێوەی تیۆری و بنەما مەعریفییەکان
    chapters.push({
      id: currentId++,
      title: 'بەشی یەکەم: چوارچێوەی تیۆری و بنەما مەعریفییەکان',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی یەکەم: چوارچێوەی تیۆری و بنەما مەعریفییەکان\n\n### تەوەری یەکەم: ڕەگوڕیشەی ئیپستۆمۆلۆژی و مێژوویی بابەتەکە\nلێرەدا بنەما فیکری و فەلسەفییەکانی «${title}» دەخرێنە بەرباس و لێکۆڵینەوە.\n\n### تەوەری دووەم: قوتابخانە و تیۆرییە ڕەخنەییە دەستنیشانکەرەکان\nشیکردنەوەی ئەو تیۆریانەی کە لە خوێندنەوەی دەقەکاندا پشتیان پێ دەبەسترێت.\n\n### تەوەری سێیەم: چەمکسازی و پەیوەندیی دەقی لە ئەدەبیاتی هاوچەرخدا.`,
      academicNotes: 'چوارچێوەی مەعریفی و بنەما تیۆرییەکان دابەشکراو بۆ تەوەرە سەرەکییەکان.',
      customTargetWords: Math.round(totalTargetWords * 0.25)
    });

    // بەشی دووەم: شیکاریی پراکتیکی - تەوەری یەکەمی دەقەکان
    chapters.push({
      id: currentId++,
      title: 'بەشی دووەم: شیکاریی پراکتیکی - تەوەری یەکەمی دەقەکان',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی دووەم: شیکاریی پراکتیکی - تەوەری یەکەمی دەقەکان\n\n### تەوەری یەکەم: شیتاڵی دەق و نموونە بەڵگەییەکان\nهەڵبژاردنی نموونەکان لە دەقە سەرەکییەکان لەسەر «${title}» و پیادەکردنی بنەماکانی ڕاڤە.\n\n### تەوەری دووەم: بونیاتنانی دەقی و مانا شاراوەکان\nشیکاریی ستایلیستی و واتایی لە ڕوانگەی ڕەخنەییەوە.`,
      academicNotes: 'شیکاریی وردی دەق و بەڵگە مێژوویی/ئەدەبییەکان.',
      customTargetWords: Math.round(totalTargetWords * 0.25)
    });

    // بەشی سێیەم: شیکاریی پراکتیکی - تەوەری دووەم و بەراوردکاری
    chapters.push({
      id: currentId++,
      title: 'بەشی سێیەم: شیکاریی پراکتیکی - تەوەری دووەم و بەراوردکاری',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی سێیەم: شیکاریی پراکتیکی - تەوەری دووەم و بەراوردکاری\n\n### تەوەری یەکەم: لێکۆڵینەوەی بەراوردکاری لەگەڵ ڕەوتە هاوشێوەکان\nبەراوردکردنی دۆزینەوەکان لەگەڵ سەرچاوە و شاکارە پەیوەندیدارەکان.\n\n### تەوەری دووەم: لێکەوتە کولتووری و فیکرییەکانی شیکارییەکان.`,
      academicNotes: 'تەوەری دووەمی شیکاری و سەنتێزی بەراوردکاری.',
      customTargetWords: Math.round(totalTargetWords * 0.20)
    });
  } else {
    // === EMPIRICAL 5-CHAPTER STRUCTURE (زانستە ئەزموونی و کۆمەڵایەتییەکان) ===
    // بەشی یەکەم: چوارچێوەی گشتی
    chapters.push({
      id: currentId++,
      title: 'بەشی یەکەم: چوارچێوەی گشتیی توێژینەوە (General Framework)',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی یەکەم: چوارچێوەی گشتیی توێژینەوە\n\n### ١. پێشەکی (Introduction)\n### ٢. کێشەی توێژینەوە (Statement of Problem)\n### ٣. گرنگیی توێژینەوە (Significance of Study)\n### ٤. ئامانجەکانی توێژینەوە (Research Objectives)\n### ٥. پرسیار و گریمانەکانی توێژینەوە (Questions & Hypotheses)\n### ٦. سنوورەکانی توێژینەوە (Delimitations & Scope)\n### ٧. پێناسەی زاراوەکان (Definition of Terms)`,
      academicNotes: 'بەشی یەکەمی ستانداردی ئەزموونی بە هەموو مەرجە زانستییەکانەوە.',
      customTargetWords: Math.round(totalTargetWords * 0.15)
    });

    // بەشی دووەم: چوارچێوەی تیۆری و ئەدەبیاتی پێشینە
    chapters.push({
      id: currentId++,
      title: 'بەشی دووەم: چوارچێوەی تیۆری و ئەدەبیاتی پێشینە (Theoretical Framework)',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی دووەم: چوارچێوەی تیۆری و توێژینەوەکانی پێشوو\n\n### تەوەری یەکەم: باکگراوندی تیۆریی بابەت\n### تەوەری دووەم: پێداچوونەوەی توێژینەوەکانی پێشوو (ناوخۆیی و جیهانی)\n### تەوەری سێیەم: دەستنیشانکردنی بۆشایی مەعریفی (Knowledge Gap)`,
      academicNotes: 'ئەدەبیاتی پێشوو بە بەڵگەداری و بەپێی APA.',
      customTargetWords: Math.round(totalTargetWords * 0.25)
    });

    // بەشی سێیەم: ڕێکار و میتۆدۆلۆژیای توێژینەوە
    chapters.push({
      id: currentId++,
      title: 'بەشی سێیەم: ڕێکار و میتۆدۆلۆژیای توێژینەوە (Methodology)',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی سێیەم: ڕێکار و میتۆدۆلۆژیای توێژینەوە\n\n### ١. میتۆدی توێژینەوە (Research Design)\n### ٢. کۆمەڵگە و نموونەی توێژینەوە (Population & Sample)\n### ٣. ئامرازەکانی کۆکردنەوەی داتا (Research Instruments)\n### ٤. ڕەوایی و جێمتمانەیی (Validity & Reliability)\n### ٥. ڕێکارە ئامارییەکان (Statistical Methods)`,
      academicNotes: 'میتۆدی داتامحوەر و پێوەرە ئامارییەکان.',
      customTargetWords: Math.round(totalTargetWords * 0.20)
    });

    // بەشی چوارەم: خستنەڕوو و شیکردنەوەی داتاکان
    chapters.push({
      id: currentId++,
      title: 'بەشی چوارەم: خستنەڕوو و شیکردنەوەی داتاکان (Data Analysis & Findings)',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی چوارەم: خستنەڕوو و شیکردنەوەی داتاکان\n\n### ١. شیکردنەوەی تایبەتمەندییە دیمۆگرافییەکان\n### ٢. تاقیکردنەوەی گریمانەکان و ئەنجامی پێوانەکان\n### ٣. خشتە ئامارییەکان و هێڵکارییەکان\n### ٤. دۆزینەوە سەرەکییەکان`,
      academicNotes: 'خشتە و دۆزینەوە وردە ئامارییەکان.',
      customTargetWords: Math.round(totalTargetWords * 0.25)
    });

    // بەشی پێنجەم: تاوتوێکردنی ئەنجامەکان و ڕاسپاردەکان
    chapters.push({
      id: currentId++,
      title: 'بەشی پێنجەم: تاوتوێکردنی ئەنجامەکان و ڕاسپاردەکان (Discussion)',
      wordCount: 0,
      status: 'pending',
      content: `## بەشی پێنجەم: تاوتوێ و ئەنجامگیری\n\n### ١. تاوتوێکردنی ئەنجامەکان لەژێر ڕۆشنایی تیۆرییەکاندا\n### ٢. دەرئەنجامە گشتییەکان (Conclusions)\n### ٣. ڕاسپاردەکان (Recommendations)\n### ٤. پێشنیار بۆ توێژینەوەی داهاتوو`,
      academicNotes: 'کۆبەندی زانستی و ڕاسپاردەی کردارەکی.',
      customTargetWords: Math.round(totalTargetWords * 0.15)
    });
  }

  // ئەنجامەکانی توێژینەوە، ڕاسپاردەکان و پوختە
  if (options.includeConclusion !== false && isHumanities) {
    chapters.push({
      id: currentId++,
      title: 'ئەنجامەکانی توێژینەوە و ڕاسپاردەکان (Conclusions & Recommendations)',
      wordCount: 0,
      status: 'pending',
      content: `## ئەنجامەکانی توێژینەوە\n\nلە کۆتایی ئەم توێژینەوەیەدا سەبارەت بە «${title}»، ئەم دەرەنجامە سەرەکییانە بەدەستهاتن:\n\n١. سەلمێنرا کە پێکهاتەی دەقی و زمانی ڕۆڵێکی یەکلاکەرەوە دەگێڕێت لە داڕشتنی واتادا.\n٢. بۆشایی پێشوو بە بەڵگەی دەقی و شیتاڵی ڕەخنەیی پڕکرایەوە.\n\n### ڕاسپاردەکان:\n- پێشنیاز دەکرێت ناوەندە ئەکادیمییەکان دەستنووس و دەقە کوردییەکان بە میتۆدی هاوچەرخ پۆلێن بکەن.`,
      academicNotes: 'کۆبەندی زانستیی ئەنجام و ڕاسپاردەکان.',
      customTargetWords: Math.round(totalTargetWords * 0.10)
    });
  }

  // پوختە بە عەرەبی و ئینگلیزی
  chapters.push({
    id: currentId++,
    title: 'پوختەی توێژینەوە بە عەرەبی و ئینگلیزی (Arabic & English Abstracts)',
    wordCount: 0,
    status: 'pending',
    content: `## المستخلص (Abstract in Arabic)\nتهدف هذه الدراسة المعنونة «${title}» إلى تحليل الأبعاد المنهجية والمعرفية وفق المعايير الأكاديمية...\n\n---\n\n## Abstract in English\nThis academic dissertation entitled "${title}" investigates the critical and theoretical framework within the scholarly context of Kurdistan universities...`,
    academicNotes: 'پوختەی فەرمیی دوو زمانە بەپێی یاسای وەزارەتی خوێندنی باڵا.',
    customTargetWords: 300
  });

  // سەرچاوەکان (References)
  if (options.includeReferences !== false) {
    chapters.push({
      id: currentId++,
      title: 'لیستی سەرچاوە و بەیبلۆگرافی (References & Bibliography)',
      wordCount: 0,
      status: 'pending',
      content: `## لیستی سەرچاوە زانستییەکان\n\n### یەکەم: سەرچاوە کوردییەکان (بەپێی ئەلفوبێ):\n\n### دووەم: سەرچاوە عەرەبییەکان:\n\n### سێیەم: سەرچاوە بیانییەکان (English / Foreign References - APA 7th / Chicago):`,
      academicNotes: 'تەواوی سەرچاوە بەکارهاتووەکانی ناو دەق بە شێوازی یاسایی و بێ هەڵبەستن.',
      customTargetWords: 400
    });
  }

  chapters.forEach(ch => {
    ch.customSourcesOn = Boolean(options.customSourcesOn);
    ch.fieldWorkOn = Boolean(options.fieldWorkOn);
  });

  return chapters;
}

