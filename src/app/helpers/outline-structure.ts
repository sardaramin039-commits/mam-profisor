import { ChapterItemModel as ChapterItem, AxisItem, SubBranchItem } from '../domain/models';
import { countKurdishWords } from '../services/data';

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

function distributeQuota(total: number, itemsCount: number): number[] {
  if (itemsCount <= 0) return [];
  const base = Math.floor(total / itemsCount);
  const remainder = total % itemsCount;
  return Array.from({ length: itemsCount }, (_, i) => base + (i === 0 ? remainder : 0));
}

function createAxis(
  id: string,
  code: string,
  title: string,
  axisTargetWords: number,
  branchDefs: { code: string; title: string }[]
): AxisItem {
  const branchQuotas = distributeQuota(axisTargetWords, branchDefs.length);
  const branches: SubBranchItem[] = branchDefs.map((def, idx) => ({
    id: `${id}.${idx + 1}`,
    code: def.code,
    title: def.title,
    targetWords: branchQuotas[idx] || 400,
    wordCount: 0,
    status: 'pending' as const
  }));

  return {
    id,
    code,
    title,
    targetWords: axisTargetWords,
    wordCount: 0,
    branches
  };
}

export function buildAcademicThesisOutline(options: ThesisOutlineOptions): ChapterItem[] {
  const title = (options.title || '').trim() || 'تێزی زانستی';
  const targetPages = Math.max(1, options.targetPages || 10);
  const totalTargetWords = targetPages * 350;
  const isHumanities = options.thesisStructureType !== 'empirical';

  const chapters: ChapterItem[] = [];
  let currentId = 1;

  // 1. پێشکەشە و سوپاسنامە
  if (options.includeDedication !== false) {
    chapters.push({
      id: currentId++,
      title: 'پێشکەشە و سوپاسنامە (Dedication & Acknowledgments)',
      wordCount: 0,
      status: 'pending',
      content: `## پێشکەشە و سوپاسنامە\n\nئەم کارە زانستییە پێشکەشە بە سەرجەم ئەو مامۆستا و توێژەرە بەڕێزانەی کە ڕێگای مەعریفەیان بۆ ڕووناک کردینەوە.\n\nسوپاسی تایبەت بۆ سەرپەرشتیاری بەڕێز و سەرجەم ئەندامانی لێژنەی زانستی کە بە سەرنج و ڕەخنە بەپێزەکانیان ئەم تێزەیان دەوڵەمەندتر کرد.`,
      academicNotes: 'پێشکەشکردنی ئەکادیمی و دەربڕینی پێزانینی زانستی بەپێی نەریتی ئەکادیمی.',
      customTargetWords: 150,
      axes: []
    });
  }

  // 2. پێڕست و ناوەڕۆک
  if (options.includeTOC !== false) {
    chapters.push({
      id: currentId++,
      title: 'پێڕستی بابەتەکان و خشتەکان (Table of Contents)',
      wordCount: 0,
      status: 'pending',
      content: `## پێڕستی گشتیی تەوەر و بەشەکان\n\n**پەیکەری تێز:** ${isHumanities ? 'زانستە مرۆڤایەتییەکان (ئەدەب، زمان، مێژوو، فەلسەفە)' : 'زانستە پەروەردەیی، کۆمەڵایەتی و ئەزموونییەکان (٥ بەشی)'}\n**قەبارەی تێز:** ${targetPages} لاپەڕە (${totalTargetWords} وشە).\n\n- پێڕستی دەروازە و بەشە سەرەکییەکان\n- پێڕستی خشتەکان و نەخشەکان\n- پێڕستی سەرچاوە و بەیبلۆگرافی`,
      academicNotes: 'پێڕستی فەرمیی تێز بەپێی ستانداردی زانکۆکانی کوردستان.',
      customTargetWords: 200,
      axes: []
    });
  }

  if (isHumanities) {
    // === HUMANITIES 3-LEVEL STRUCTURE ===
    // 3. دەروازە (15% of total words)
    const ch1Words = Math.round(totalTargetWords * 0.15);
    const ch1AxisQuotas = distributeQuota(ch1Words, 3);
    chapters.push({
      id: currentId++,
      title: 'دەروازە: چوارچێوەی گشتی و میتۆدی توێژینەوە',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'دەروازەی میتۆدیی زانستە مرۆڤایەتییەکان بەپێی ڕێنمایی زانکۆکانی کوردستان.',
      customTargetWords: ch1Words,
      axes: [
        createAxis('1.1', 'تەوەری یەکەم', `کێشە، پرسیار و گرنگیی لێکۆڵینەوە لەسەر «${title}»`, ch1AxisQuotas[0], [
          { code: '١.١.١', title: 'کێشەی سەرەکی و پاساوی هەڵبژاردنی بابەتەکە' },
          { code: '١.١.٢', title: 'پرسیارە سەرەکی و لاوەکییەکانی لێکۆڵینەوە' },
          { code: '١.١.٣', title: 'گرنگیی زانستی و پێگەی بابەت لە کتێبخانەی نەتەوەیی' }
        ]),
        createAxis('1.2', 'تەوەری دووەم', 'سنوور، میتۆدۆلۆژیا و زاراوەناسیی توێژینەوە', ch1AxisQuotas[1], [
          { code: '١.٢.١', title: 'سنووری بابەتی، دەقی، کاتی و شوێنیی لێکۆڵینەوە' },
          { code: '١.٢.٢', title: 'میتۆدی شیکاری و ڕێبازی ڕاڤەکردنی دەقەکان' },
          { code: '١.٢.٣', title: 'چەمکسازی و پێناسەی زاراوە سەرەکییەکان' }
        ]),
        createAxis('1.3', 'تەوەری سێیەم', 'پێداچوونەوەی ڕەخنەگرانەی ئەدەبیاتی پێشوو و بۆشایی مەعریفی', ch1AxisQuotas[2], [
          { code: '١.٣.١', title: 'پێداچوونەوەی لێکۆڵینەوە و شاکارە پێشینە کوردییەکان' },
          { code: '١.٣.٢', title: 'توێژینەوە عەرەبی و نێودەوڵەتییە پەیوەندیدارەکان' },
          { code: '١.٣.٣', title: 'دەستنیشانکردنی دەقاودەقی کەلەبەری مەعریفی (Knowledge Gap)' }
        ])
      ]
    });

    // 4. بەشی یەکەم (25% of total words)
    const ch2Words = Math.round(totalTargetWords * 0.25);
    const ch2AxisQuotas = distributeQuota(ch2Words, 3);
    chapters.push({
      id: currentId++,
      title: 'بەشی یەکەم: چوارچێوەی تیۆری و بنەما مەعریفییەکان',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'چوارچێوەی مەعریفی و بنەما تیۆرییەکان دابەشکراو بۆ تەوەرە سەرەکییەکان.',
      customTargetWords: ch2Words,
      axes: [
        createAxis('2.1', 'تەوەری یەکەم', `ڕەگوڕیشەی ئیپستۆمۆلۆژی و مێژوویی «${title}»`, ch2AxisQuotas[0], [
          { code: '٢.١.١', title: 'پاشخانی فیکری و قۆناغە سەرەتایییەکانی گەشەسەندنی چەمکەکە' },
          { code: '٢.١.٢', title: 'وەرچەرخانە فەلسەفی و ڕەخنەییەکان لە دەوری بابەتەکە' },
          { code: '٢.١.٣', title: 'ڕوانگە و ئارگیومێنتی قوتابخانە فیکرییە پێشەنگەکان' }
        ]),
        createAxis('2.2', 'تەوەری دووەم', 'قوتابخانە و تیۆرییە ڕەخنەییە دەستنیشانکەرەکان', ch2AxisQuotas[1], [
          { code: '٢.٢.١', title: 'بنەما سەرەکییەکانی تیۆریی پەسەندکراو بۆ شیکاری' },
          { code: '٢.٢.٢', title: 'ئامراز و مۆدێلە ڕاڤەکارییەکانی هەڵسەنگاندن' },
          { code: '٢.٢.٣', title: 'سەنتێزی تیۆری و پێوەری بەراوردکاریی گوتارەکان' }
        ]),
        createAxis('2.3', 'تەوەری سێیەم', 'چەمکسازی و پێوەندیی دەقی لە ئەدەبیاتی هاوچەرخدا', ch2AxisQuotas[2], [
          { code: '٢.٣.١', title: 'جیاکاریی چەمکسازی لەگەڵ تێگەیشتن و زاراوە باوەکان' },
          { code: '٢.٣.٢', title: 'دەنگدانەوەی تیۆرییەکان لە سەرچاوە و دەقە کوردییەکاندا' },
          { code: '٢.٣.٣', title: 'بونیاتنانی چوارچێوەی شیکاری بۆ دەقە هەڵبژێردراوەکان' }
        ])
      ]
    });

    // 5. بەشی دووەم (25% of total words)
    const ch3Words = Math.round(totalTargetWords * 0.25);
    const ch3AxisQuotas = distributeQuota(ch3Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی دووەم: شیکاریی پراکتیکی - تەوەری یەکەمی دەقەکان',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'شیکاریی وردی دەق و بەڵگە مێژوویی/ئەدەبییەکان.',
      customTargetWords: ch3Words,
      axes: [
        createAxis('3.1', 'تەوەری یەکەم', `شیتاڵی دەق و نموونە بەڵگەییەکان لەسەر «${title}»`, ch3AxisQuotas[0], [
          { code: '٣.١.١', title: 'هەڵبژاردنی نموونە و دەقە بنەڕەتییەکان و پاساوی بەڵگەیی' },
          { code: '٣.١.٢', title: 'شیکاریی ستایلیستی، فۆڕمی و زمانیی دەقەکان' },
          { code: '٣.١.٣', title: 'مانا شاراوەکان و فرەدەنگی لە دەقە شیکراوەکاندا' }
        ]),
        createAxis('3.2', 'تەوەری دووەم', 'لێکەوتە واتایی، گوتاری و دەلالەتە فیکرییەکان', ch3AxisQuotas[1], [
          { code: '٣.٢.١', title: 'ئارگیومێنتە ناوەکییەکان و وێنەسازیی دەقی' },
          { code: '٣.٢.٢', title: 'بەراوردی دەلالەتەکان لەنێوان دەقە جیاوازەکاندا' },
          { code: '٣.٢.٣', title: 'سەلماندنی گریمانەکان لەژێر ڕۆشنایی بەڵگە دەقییەکاندا' }
        ])
      ]
    });

    // 6. بەشی سێیەم (20% of total words)
    const ch4Words = Math.round(totalTargetWords * 0.20);
    const ch4AxisQuotas = distributeQuota(ch4Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی سێیەم: شیکاریی پراکتیکی - تەوەری دووەم و بەراوردکاری',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'تەوەری دووەمی شیکاری و سەنتێزی بەراوردکاری.',
      customTargetWords: ch4Words,
      axes: [
        createAxis('4.1', 'تەوەری یەکەم', 'لێکۆڵینەوەی بەراوردکاری لەگەڵ ڕەوت و دەقە هاوشێوەکان', ch4AxisQuotas[0], [
          { code: '٤.١.١', title: 'بەراوردکاریی دۆزینەوەکان لەگەڵ سەرچاوە هاوچەرخەکان' },
          { code: '٤.١.٢', title: 'شیکردنەوەی خاڵە جیاواز و هاوبەشەکان بەپێی بەڵگە' },
          { code: '٤.١.٣', title: 'لێکەوتە کولتووری، فیکری و کۆمەڵایەتییەکانی شیکارییەکان' }
        ]),
        createAxis('4.2', 'تەوەری دووەم', 'هەڵسەنگاندنی ڕەخنەیی و سەنتێزی مەعریفی', ch4AxisQuotas[1], [
          { code: '٤.٢.١', title: 'ڕەخنەی ڕوانگە نەریتییەکان لەسەر کێشەی توێژینەوەکە' },
          { code: '٤.٢.٢', title: 'خستنەڕووی مۆدێلی پێشنیارکراوی توێژەر' },
          { code: '٤.٢.٣', title: 'سەنتێزی کۆتایی شیکارییە دەقییەکان' }
        ])
      ]
    });

    // 7. ئەنجام و ڕاسپاردەکان (10% of total words)
    if (options.includeConclusion !== false) {
      const ch5Words = Math.round(totalTargetWords * 0.10);
      const ch5AxisQuotas = distributeQuota(ch5Words, 2);
      chapters.push({
        id: currentId++,
        title: 'ئەنجامەکانی توێژینەوە و ڕاسپاردەکان (Conclusions & Recommendations)',
        wordCount: 0,
        status: 'pending',
        content: '',
        academicNotes: 'کۆبەندی زانستیی ئەنجام و ڕاسپاردەکان.',
        customTargetWords: ch5Words,
        axes: [
          createAxis('5.1', 'تەوەری یەکەم', 'پوختەی دۆزینەوە و ئەنجامە سەرەکییەکان', ch5AxisQuotas[0], [
            { code: '٥.١.١', title: 'وەڵامی پرسیارەکانی توێژینەوە و بەدیهاتنی ئامانجەکان' },
            { code: '٥.١.٢', title: 'سەلماندنی گریمانەکان و بەشدارییە نوێیەکانی تێز' }
          ]),
          createAxis('5.2', 'تەوەری دووەم', 'ڕاسپاردە زانستییەکان و ئاسۆی توێژینەوەی داهاتوو', ch5AxisQuotas[1], [
            { code: '٥.٢.١', title: 'ڕاسپاردە کردارەکییەکان بۆ دامەزراوە و ناوەندە زانستییەکان' },
            { code: '٥.٢.٢', title: 'پێشنیارەکان بۆ توێژینەوەی فراوانتر و لێکۆڵینەوەی داهاتوو' }
          ])
        ]
      });
    }
  } else {
    // === EMPIRICAL 5-CHAPTER 3-LEVEL STRUCTURE ===
    // بەشی ١ (15%)
    const eCh1Words = Math.round(totalTargetWords * 0.15);
    const eCh1AxisQuotas = distributeQuota(eCh1Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی یەکەم: چوارچێوەی گشتیی توێژینەوە (General Framework)',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'بەشی یەکەمی ستانداردی ئەزموونی بە هەموو مەرجە زانستییەکانەوە.',
      customTargetWords: eCh1Words,
      axes: [
        createAxis('1.1', 'تەوەری یەکەم', 'کێشە، گرنگی و ئامانجەکانی توێژینەوە', eCh1AxisQuotas[0], [
          { code: '١.١.١', title: 'پێشەکی و باکگراوندی دیاردەی لێکۆڵراو' },
          { code: '١.١.٢', title: 'کێشەی سەرەکیی توێژینەوە و پاساوەکان' },
          { code: '١.١.٣', title: 'گرنگی و ئامانجە زانستییەکانی لێکۆڵینەوە' }
        ]),
        createAxis('1.2', 'تەوەری دووەم', 'پرسیار، گریمانە، سنوور و زاراوەکان', eCh1AxisQuotas[1], [
          { code: '١.٢.١', title: 'پرسیارە سەرەکییەکان و گریمانە زانستییەکان' },
          { code: '١.٢.٢', title: 'سنوورەکانی توێژینەوە (بابەتی، کاتی، شوێنی و مرۆیی)' },
          { code: '١.٢.٣', title: 'پێناسەی چەمکە تیۆری و کردارەکییەکان (Operational Definitions)' }
        ])
      ]
    });

    // بەشی ٢ (25%)
    const eCh2Words = Math.round(totalTargetWords * 0.25);
    const eCh2AxisQuotas = distributeQuota(eCh2Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی دووەم: چوارچێوەی تیۆری و ئەدەبیاتی پێشینە (Theoretical Framework)',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'ئەدەبیاتی پێشوو بە بەڵگەداری و بەپێی APA.',
      customTargetWords: eCh2Words,
      axes: [
        createAxis('2.1', 'تەوەری یەکەم', 'باکگراوندی تیۆری و پارادایمە فیکرییەکان', eCh2AxisQuotas[0], [
          { code: '٢.١.١', title: 'تیۆری و پارادایمە بنەڕەتییە دەستنیشانکەرەکان' },
          { code: '٢.١.٢', title: 'ڕەهەند و پێکهاتەکانی گۆڕاوە سەرەکییەکانی توێژینەوە' },
          { code: '٢.١.٣', title: 'مۆدێلە ڕوونکەرەوەکان لە ئەدەبیاتی زانستیدا' }
        ]),
        createAxis('2.2', 'تەوەری دووەم', 'پێداچوونەوەی توێژینەوەکانی پێشوو و بۆشایی مەعریفی', eCh2AxisQuotas[1], [
          { code: '٢.٢.١', title: 'پێداچوونەوەی لێکۆڵینەوە ناوخۆیی و هەرێمییەکان' },
          { code: '٢.٢.٢', title: 'پێداچوونەوەی لێکۆڵینەوە نێودەوڵەتییە هاوچەرخەکان' },
          { code: '٢.٢.٣', title: 'بەراوردکاری، ڕەخنەی زانستی و دەستنیشانکردنی Research Gap' }
        ])
      ]
    });

    // بەشی ٣ (20%)
    const eCh3Words = Math.round(totalTargetWords * 0.20);
    const eCh3AxisQuotas = distributeQuota(eCh3Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی سێیەم: ڕێکار و میتۆدۆلۆژیای توێژینەوە (Methodology)',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'میتۆدی داتامحوەر و پێوەرە ئامارییەکان.',
      customTargetWords: eCh3Words,
      axes: [
        createAxis('3.1', 'تەوەری یەکەم', 'دیزاین، کۆمەڵگە و نموونەی توێژینەوە', eCh3AxisQuotas[0], [
          { code: '٣.١.١', title: 'میتۆدی پەسەندکراوی توێژینەوە (Research Design)' },
          { code: '٣.١.٢', title: 'کۆمەڵگەی توێژینەوە و تایبەتمەندییە دیمۆگرافییەکان' },
          { code: '٣.١.٣', title: 'شێوازی هەڵبژاردنی نموونە و پاساوی قەبارەکەی' }
        ]),
        createAxis('3.2', 'تەوەری دووەم', 'ئامرازەکانی داتا، ڕەوایی و ڕێکارە ئامارییەکان', eCh3AxisQuotas[1], [
          { code: '٣.٢.١', title: 'ئامرازەکانی کۆکردنەوەی داتا (ڕاپرسی، چاوپێکەوتن یان تاقیکردنەوە)' },
          { code: '٣.٢.٢', title: 'ڕەوایی (Validity) و جێمتمانەیی (Reliability)ی ئامرازەکان' },
          { code: '٣.٢.٣', title: 'ڕێکار و پێوەرە ئامارییە بەکارهاتووەکان (Statistical Analysis)' }
        ])
      ]
    });

    // بەشی ٤ (25%)
    const eCh4Words = Math.round(totalTargetWords * 0.25);
    const eCh4AxisQuotas = distributeQuota(eCh4Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی چوارەم: خستنەڕوو و شیکردنەوەی داتاکان (Data Analysis & Findings)',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'خشتە و دۆزینەوە وردە ئامارییەکان.',
      customTargetWords: eCh4Words,
      axes: [
        createAxis('4.1', 'تەوەری یەکەم', 'وەسفی ئاماری و وەڵامی پرسیارەکانی توێژینەوە', eCh4AxisQuotas[0], [
          { code: '٤.١.١', title: 'شیکاریی تایبەتمەندییە دیمۆگرافییەکان لە ڕێگەی خشتەوە' },
          { code: '٤.١.٢', title: 'شیکاریی وەسفیی پرسیار و میحوەرەکانی ڕاپرسی' }
        ]),
        createAxis('4.2', 'تەوەری دووەم', 'تاقیکردنەوەی گریمانەکان و شیکاریی پەیوەندییەکان', eCh4AxisQuotas[1], [
          { code: '٤.٢.١', title: 'تاقیکردنەوەی ئاماریی گریمانە سەرەکی و لاوەکییەکان' },
          { code: '٤.٢.٢', title: 'شیکردنەوەی پەیوەندییە هۆکاری و جیاوازییە ئامارییەکان' },
          { code: '٤.٢.٣', title: 'کۆبەندی دۆزینەوە سەرەکییە سەلمێنراوەکان' }
        ])
      ]
    });

    // بەشی ٥ (15%)
    const eCh5Words = Math.round(totalTargetWords * 0.15);
    const eCh5AxisQuotas = distributeQuota(eCh5Words, 2);
    chapters.push({
      id: currentId++,
      title: 'بەشی پێنجەم: تاوتوێکردنی ئەنجامەکان و ڕاسپاردەکان (Discussion)',
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: 'کۆبەندی زانستی و ڕاسپاردەی کردارەکی.',
      customTargetWords: eCh5Words,
      axes: [
        createAxis('5.1', 'تەوەری یەکەم', 'تاوتوێی دەرەنجامەکان لەژێر ڕۆشنایی ئەدەبیاتدا', eCh5AxisQuotas[0], [
          { code: '٥.١.١', title: 'تاوتوێکردنی ئەنجامەکان بە بەراورد لەگەڵ تیۆرییەکان' },
          { code: '٥.١.٢', title: 'بەراوردی دۆزینەوەکان لەگەڵ ئەنجامی توێژینەوەکانی پێشوو' },
          { code: '٥.١.٣', title: 'سەنتێز و پێگەی دۆزینەوەکان لە کایەی زانستیدا' }
        ]),
        createAxis('5.2', 'تەوەری دووەم', 'دەرئەنجامە گشتییەکان، ڕاسپاردەکان و پێشنیارەکان', eCh5AxisQuotas[1], [
          { code: '٥.٢.١', title: 'دەرئەنجامە گشتییە دەستنیشانکراوەکان (Conclusions)' },
          { code: '٥.٢.٢', title: 'ڕاسپاردە زانستی، کارگێڕی و کۆمەڵایەتییەکان' },
          { code: '٥.٢.٣', title: 'پێشنیارەکان بۆ توێژەرانی داهاتوو' }
        ])
      ]
    });
  }

  // پوختە بە دوو زمان
  chapters.push({
    id: currentId++,
    title: 'پوختەی توێژینەوە بە عەرەبی و ئینگلیزی (Arabic & English Abstracts)',
    wordCount: 0,
    status: 'pending',
    content: `## المستخلص (Abstract in Arabic)\nتهدف هذه الدراسة المعنونة «${title}» إلى تحليل الأبعاد المنهجية والمعرفية وفق المعايير الأكاديمية...\n\n---\n\n## Abstract in English\nThis academic dissertation entitled "${title}" investigates the critical and theoretical framework within the scholarly context of Kurdistan universities...`,
    academicNotes: 'پوختەی فەرمیی دوو زمانە بەپێی یاسای وەزارەتی خوێندنی باڵا.',
    customTargetWords: 300,
    axes: []
  });

  // سەرچاوەکان
  if (options.includeReferences !== false) {
    chapters.push({
      id: currentId++,
      title: 'لیستی سەرچاوە و بەیبلۆگرافی (References & Bibliography)',
      wordCount: 0,
      status: 'pending',
      content: `## لیستی سەرچاوە زانستییەکان\n\n### یەکەم: سەرچاوە کوردییەکان (بەپێی ئەلفوبێ):\n\n### دووەم: سەرچاوە عەرەبییەکان:\n\n### سێیەم: سەرچاوە بیانییەکان (English / Foreign References - APA 7th / Chicago):`,
      academicNotes: 'تەواوی سەرچاوە بەکارهاتووەکانی ناو دەق بە شێوازی یاسایی و بێ هەڵبەستن.',
      customTargetWords: 400,
      axes: []
    });
  }

  chapters.forEach(ch => {
    ch.customSourcesOn = Boolean(options.customSourcesOn);
    ch.fieldWorkOn = Boolean(options.fieldWorkOn);
  });

  syncLiveTOCWordCounts(chapters);
  return chapters;
}

export function syncLiveTOCWordCounts(chapters: ChapterItem[]): void {
  for (const ch of chapters) {
    const chContent = ch.content || '';
    const directWords = countKurdishWords(chContent);
    ch.wordCount = directWords;

    if (ch.axes && ch.axes.length > 0) {
      let accumulatedChWords = 0;
      for (const axis of ch.axes) {
        let axisTotal = 0;
        for (const branch of axis.branches) {
          if (branch.content) {
            branch.wordCount = countKurdishWords(branch.content);
          } else {
            const escapedCode = branch.code.replace(/\./g, '\\.');
            const pattern = new RegExp(`(?:###|####)\\s*${escapedCode}[^\\n]*\\n([\\s\\S]*?)(?=(?:###|####|##|$))`, 'i');
            const match = chContent.match(pattern);
            if (match && match[1]) {
              branch.wordCount = countKurdishWords(match[1]);
              branch.content = match[1].trim();
            } else {
              branch.wordCount = 0;
            }
          }
          branch.status = branch.wordCount >= branch.targetWords * 0.95
            ? 'completed'
            : (branch.wordCount > 0 ? 'writing' : 'pending');
          axisTotal += branch.wordCount;
        }
        axis.wordCount = axisTotal;
        accumulatedChWords += axisTotal;
      }
      if (accumulatedChWords > 0) {
        ch.wordCount = accumulatedChWords;
      }
    }
  }
}
