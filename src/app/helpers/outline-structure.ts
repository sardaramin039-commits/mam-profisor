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

export function toKurdishDigits(num: number | string): string {
  const d = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (m) => d[parseInt(m, 10)]);
}

export function formatTocLine(title: string, pageLabel: string, indentSpaces = 0): string {
  const indent = ' '.repeat(indentSpaces);
  const cleanTitle = `${indent}${title.trim()}`;
  const totalWidth = 78;
  const dotsCount = Math.max(6, totalWidth - cleanTitle.length - pageLabel.length);
  const dots = '.'.repeat(dotsCount);
  return `${cleanTitle} ${dots} ${pageLabel}`;
}

export function generateClassicKurdishTOC(chapters: ChapterItem[], totalTargetWords = 3500): string {
  const lines: string[] = [];
  const entries: { title: string; page: string; level: 'front' | 'chapter' | 'section' | 'subsection' | 'end' }[] = [];
  const wordsPerPage = 350;

  lines.push('## پێڕستی بابەتەکان\n');
  lines.push('```text');
  lines.push(formatTocLine('بابەت', 'لاپەڕە', 0));
  lines.push('─'.repeat(80));

  // Front matter
  entries.push({ title: 'پێشکەشکردن و سوپاسنامە', page: 'أ', level: 'front' });
  lines.push(formatTocLine('پێشکەشکردن و سوپاسنامە', 'أ', 0));

  entries.push({ title: 'پوختەی توێژینەوە (Abstract)', page: 'ب', level: 'front' });
  lines.push(formatTocLine('پوختەی توێژینەوە (Abstract)', 'ب', 0));

  let currentPage = 1;

  for (const ch of chapters) {
    // Skip front matter chapters from page body calculation
    if (ch.title.includes('پێشکەشە') || ch.title.includes('پێڕستی بابەتەکان') || ch.title.includes('Abstracts')) {
      continue;
    }

    const chPageStr = toKurdishDigits(currentPage);
    entries.push({ title: ch.title, page: chPageStr, level: ch.axes && ch.axes.length > 0 ? 'chapter' : 'end' });
    lines.push(formatTocLine(ch.title, chPageStr, 0));

    if (ch.axes && ch.axes.length > 0) {
      for (const axis of ch.axes) {
        const axisPageStr = toKurdishDigits(currentPage);
        const axisTitle = `${axis.code}: ${axis.title}`;
        entries.push({ title: axisTitle, page: axisPageStr, level: 'section' });
        lines.push(formatTocLine(axisTitle, axisPageStr, 2));

        for (const branch of axis.branches) {
          const branchPageStr = toKurdishDigits(currentPage);
          const branchTitle = `${branch.code} ${branch.title}`;
          entries.push({ title: branchTitle, page: branchPageStr, level: 'subsection' });
          lines.push(formatTocLine(branchTitle, branchPageStr, 4));

          const branchWords = branch.targetWords || 400;
          const branchPages = Math.max(1, Math.round(branchWords / wordsPerPage));
          currentPage += branchPages;
        }
      }
    } else {
      const chWords = ch.customTargetWords || 500;
      currentPage += Math.max(1, Math.round(chWords / wordsPerPage));
    }
  }

  lines.push('```');

  // Printable / Exportable HTML Structure
  const htmlRows = [
    `<div class="academic-toc-wrapper" dir="rtl">`,
    `<div class="toc-header-row"><span class="toc-col-title">بابەت</span><span class="toc-col-page">لاپەڕە</span></div>`,
    ...entries.map(
      (e) =>
        `<div class="toc-row toc-${e.level}">` +
        `<span class="toc-title">${e.title}</span>` +
        `<span class="toc-leader"></span>` +
        `<span class="toc-page">${e.page}</span>` +
        `</div>`
    ),
    `</div>`
  ].join('\n');

  return `${lines.join('\n')}\n\n${htmlRows}`;
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
      content: `## پێشکەشکردن\n\n«پێشکەشە بەو زاتە پاکانەی کە چرای زانست و مەعریفیان لە دڵدا هەڵگیرساند و ڕێگەی تاریکیی نەزانییان بە فکری رۆشن ڕووناک کردەوە؛\nبە گیانی پاکی مامۆستایانی دڵسۆز و پێشەنگانی زمانی کوردی کە لە پێناوی گەشەپێدان و پاراستنی ناسنامەی نەتەوەییدا ماندوونووبوون؛\nو بە هەموو ئەو توێژەر و خۆشەویستانەی خزمەت بە کتێبخانەی کوردی دەکەن؛\nئەم بەرهەمە ئەکادیمییە پێشکەش بە ئاراستەی زانست و وشیاریی نەتەوەیی دەکەین.»\n\n---\n\n## سوپاس و پێزانین\n\n«سوپاس بۆ خودای مەزن کە توانای پێبەخشین تا ئەم کارە ئەکادیمییە بخەینە خزمەت مەعریفی کوردییەوە.\nهەروەها، لە قووڵایی دڵمانەوە سوپاس و پێزانینی بێپایان ئاراستەی سەرجەم ئەو مامۆستا و ڕێنیشاندەرە ئەکادیمییە بەڕێزانە دەکەین کە لە کاتی داڕشتن، سەرپەرشتیکردن و پێداچوونەوەی ئەم تێزەدا، بە ڕێنماییە زانستییەکانیان هاوکارمان بوون. هەروەها دەستخۆشی لەو دەزگا و ناوەندە رۆشنبیری و دیجیتالییانە دەکەین کە سەرچاوە و زانیاریی پێویستیان بۆ توێژەر دابین کرد، بەتایبەت سیستەمی زیرەکی پلاتفۆرمی (Mam Professor) کە لە ڕێکخستنی میتۆدۆلۆژی و داڕشتنی بابەتییدا پشتیوانێکی کارا بوو.»`,
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
      content: '', // Will be generated after chapters are formed
      academicNotes: 'پێڕستی فەرمیی تێز بەپێی ستانداردی زانکۆکانی کوردستان (بابەت .......... لاپەڕە).',
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

  // Populate formatted Table of Contents (بابەت .......... لاپەڕە)
  const tocCh = chapters.find(ch => ch.title.includes('پێڕستی بابەتەکان'));
  if (tocCh) {
    tocCh.content = generateClassicKurdishTOC(chapters, totalTargetWords);
    tocCh.wordCount = countKurdishWords(tocCh.content);
    tocCh.status = 'completed';
  }

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

  // نوێکردنەوەی ژمارەی لاپەڕە و پێڕستی بابەتەکان بە شێوازی کلاسیكی کوردی لەگەڵ هەر دەستکارییەک
  const liveTocCh = chapters.find(ch => ch.title.includes('پێڕستی بابەتەکان'));
  if (liveTocCh) {
    liveTocCh.content = generateClassicKurdishTOC(chapters);
    liveTocCh.wordCount = countKurdishWords(liveTocCh.content);
  }
}

export function buildChaptersFromAcademicBlueprint(blueprint: any, title = 'تێزی ئەکادیمی'): ChapterItem[] {
  const chapters: ChapterItem[] = [];
  let currentId = 1;
  const isSchool = blueprint.level === 'school';

  // 1. پێشکەشکردن
  if (!isSchool && blueprint.frontMatterAndIntro?.dedicationMarkdown) {
    chapters.push({
      id: currentId++,
      title: 'پێشکەشکردن (Dedication)',
      wordCount: countKurdishWords(blueprint.frontMatterAndIntro.dedicationMarkdown),
      status: 'completed',
      content: `## پێشکەشکردن\n\n${blueprint.frontMatterAndIntro.dedicationMarkdown}`,
      academicNotes: 'پێشکەشکردنی ئەکادیمی بە زمانی کوردیی باڵا.',
      customTargetWords: 150,
      axes: []
    });
  }

  // 2. سوپاس و پێزانین
  if (!isSchool && blueprint.frontMatterAndIntro?.acknowledgmentMarkdown) {
    chapters.push({
      id: currentId++,
      title: 'سوپاس و پێزانین (Acknowledgments)',
      wordCount: countKurdishWords(blueprint.frontMatterAndIntro.acknowledgmentMarkdown),
      status: 'completed',
      content: `## سوپاس و پێزانین\n\n${blueprint.frontMatterAndIntro.acknowledgmentMarkdown}`,
      academicNotes: 'سوپاس و پێزانین بۆ سەرپەرشتیار و لێژنەی زانستی.',
      customTargetWords: 150,
      axes: []
    });
  }

  // 3. پوختە بە ٣ زمان
  if (!isSchool && (blueprint.frontMatterAndIntro?.abstractKurdish || blueprint.frontMatterAndIntro?.abstractEnglish)) {
    const absContent = [
      `## پوختەی توێژینەوە بە زمانی کوردی\n${blueprint.frontMatterAndIntro.abstractKurdish || ''}`,
      `---\n## Abstract in English\n${blueprint.frontMatterAndIntro.abstractEnglish || ''}`,
      blueprint.frontMatterAndIntro.abstractArabic ? `---\n## المستخلص باللغة العربية\n${blueprint.frontMatterAndIntro.abstractArabic}` : ''
    ].filter(Boolean).join('\n\n');

    chapters.push({
      id: currentId++,
      title: 'پوختەی توێژینەوە بە کوردی، ئینگلیزی و عەرەبی (Abstracts)',
      wordCount: countKurdishWords(absContent),
      status: 'completed',
      content: absContent,
      academicNotes: 'پوختەی فەرمی بەپێی یاسای وەزارەتی خوێندنی باڵا.',
      customTargetWords: 350,
      axes: []
    });
  }

  // 4. پێڕستی بابەتەکان
  chapters.push({
    id: currentId++,
    title: 'پێڕستی بابەتەکان و خشتەکان (Table of Contents)',
    wordCount: countKurdishWords(blueprint.tocMarkdown || ''),
    status: 'completed',
    content: blueprint.tocMarkdown || '## پێڕستی بابەتەکان\n',
    academicNotes: 'پێڕستی فەرمیی تێز بە شێوازی کلاسیكی کوردی (بابەت .......... لاپەڕە).',
    customTargetWords: 200,
    axes: []
  });

  // 5. پێشەکی / دەروازەی گشتی
  const introTitle = isSchool ? 'پێشەکی' : 'دەروازەی گشتیی توێژینەوە';
  chapters.push({
    id: currentId++,
    title: `${introTitle}: چوارچێوەی گشتی و میتۆدی لێکۆڵینەوە`,
    wordCount: countKurdishWords(blueprint.frontMatterAndIntro?.fullIntroductionMarkdown || ''),
    status: blueprint.frontMatterAndIntro?.fullIntroductionMarkdown ? 'completed' : 'pending',
    content: blueprint.frontMatterAndIntro?.fullIntroductionMarkdown
      ? `## ${introTitle}\n\n${blueprint.frontMatterAndIntro.fullIntroductionMarkdown}`
      : '',
    academicNotes: 'دەروازەی سەرەکی و بنەما میتۆدییەکانی توێژینەوە.',
    customTargetWords: isSchool ? 350 : 2500,
    axes: []
  });

  // 6. بەشە سەرەکییەکان، تەوەرەکان و لقەکان
  if (Array.isArray(blueprint.chapters)) {
    blueprint.chapters.forEach((ch: any, cIdx: number) => {
      const axes: AxisItem[] = (ch.sections || []).map((sec: any, sIdx: number) => {
        const axId = `${cIdx + 1}.${sIdx + 1}`;
        const branches: SubBranchItem[] = (sec.subSections || []).map((sub: any, bIdx: number) => ({
          id: `${axId}.${bIdx + 1}`,
          code: sub.code || `${cIdx + 1}.${sIdx + 1}.${bIdx + 1}`,
          title: sub.title || `لقی ${bIdx + 1}`,
          targetWords: sub.targetWords || 600,
          wordCount: 0,
          content: '',
          status: 'pending' as const
        }));

        return {
          id: axId,
          code: `تەوەری ${['یەکەم', 'دووەم', 'سێیەم', 'چوارەم', 'پێنجەم'][sIdx] || sIdx + 1}`,
          title: sec.title,
          targetWords: sec.targetWords || 1200,
          wordCount: 0,
          branches
        };
      });

      chapters.push({
        id: currentId++,
        title: ch.title,
        wordCount: 0,
        status: 'pending',
        content: '',
        academicNotes: ch.chapterObjective || 'بەشی زانستیی تێز.',
        customTargetWords: ch.targetWords || 3000,
        axes
      });
    });
  }

  // 7. ئەنجامەکان
  const conclusionTitle = isSchool ? 'ئەنجامی ڕاپۆرت' : 'ئەنجامەکانی توێژینەوە (Findings)';
  chapters.push({
    id: currentId++,
    title: conclusionTitle,
    wordCount: 0,
    status: 'pending',
    content: '',
    academicNotes: 'کۆبەندی دۆزینەوە و ئەنجامە سەلمێنراوەکان.',
    customTargetWords: isSchool ? 300 : 1500,
    axes: []
  });

  // 8. ڕاسپاردە و پێشنیارەکان
  const recTitle = isSchool ? 'پێشنیار و سوودەکان' : 'ڕاسپاردە و پێشنیارەکان (Recommendations)';
  chapters.push({
    id: currentId++,
    title: recTitle,
    wordCount: 0,
    status: 'pending',
    content: '',
    academicNotes: 'ڕاسپاردەی زانستی و کرداری بۆ لایەنە پەیوەندیدارەکان.',
    customTargetWords: isSchool ? 200 : 1000,
    axes: []
  });

  // 9. فەرهەنگۆکی زاراوەکان
  if (blueprint.glossaryMarkdown || (blueprint.glossaryTerms && blueprint.glossaryTerms.length > 0)) {
    chapters.push({
      id: currentId++,
      title: 'فەرهەنگۆکی زاراوە زانستییەکان (Glossary)',
      wordCount: countKurdishWords(blueprint.glossaryMarkdown || ''),
      status: 'completed',
      content: blueprint.glossaryMarkdown || '',
      academicNotes: 'زاراوە سەرەکییەکانی توێژینەوەکە بە کوردی، ئینگلیزی و عەرەبی.',
      customTargetWords: 300,
      axes: []
    });
  }

  // 10. سەرچاوە و بیبلۆگرافیا
  const bibTitle = isSchool ? 'سەرچاوەکانی ڕاپۆرت' : 'لیستی سەرچاوە و بیبلۆگرافیا (Bibliography)';
  chapters.push({
    id: currentId++,
    title: bibTitle,
    wordCount: 0,
    status: 'pending',
    content: `## ${bibTitle}\n\n### یەکەم: سەرچاوە کوردییەکان\n\n### دووەم: سەرچاوە عەرەبییەکان\n\n### سێیەم: سەرچاوە بیانییەکان (Foreign / English References)`,
    academicNotes: 'سەرچاوە ڕاستەقینە بەکارهاتووەکان بەپێی ستانداردی ئەکادیمی.',
    customTargetWords: 400,
    axes: []
  });

  syncLiveTOCWordCounts(chapters);
  return chapters;
}

