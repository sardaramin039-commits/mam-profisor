import { ChapterItemModel as ChapterItem } from '../domain/models';

export interface AcademicUnitConfig {
  title: string;
  discipline?: string;
  writingType?: string;
  academicLevel?: string;
  targetPages: number;
  totalTargetWords: number;
  pagesPerResponse?: number;
  fieldWorkOn?: boolean;
}

/**
 * Calculates required substantive units by dividing target pages by single-response capacity.
 * Standard academic writing: 1 response safely outputs ~500-650 words (~1.5 to 2 academic pages).
 */
export function calculateSubstantiveUnitsCount(targetPages: number, pagesPerResponse = 2): number {
  const safePages = Math.max(1, targetPages);
  const capacity = Math.max(0.5, pagesPerResponse);
  return Math.max(2, Math.ceil(safePages / capacity));
}

/**
 * Standard academic thematic chapter templates in Kurdish for comprehensive book authoring.
 */
interface MajorChapterTheme {
  chapterIndex: number;
  kurdishOrdinal: string;
  themeTitle: string;
  subtopics: string[];
}

export function getMajorThemesForDiscipline(discipline: string, title: string): MajorChapterTheme[] {
  const cleanTitle = title || 'بابەتی لێکۆڵینەوە';
  return [
    {
      chapterIndex: 1,
      kurdishOrdinal: 'یەکەم',
      themeTitle: `چوارچێوەی چەمکسازی، تیۆری و زاراوەناسیی «${cleanTitle}»`,
      subtopics: [
        'پێناسە بنەڕەتییەکان و زاراوەناسیی ڕەخنەگرانەی بوارەکە',
        'ڕەوتی مێژوویی و قۆناغە سەرەتایییەکانی گەشەسەندنی فیکری',
        'پارادایم و تیۆرییە کلاسیکی و هاوچەرخە دەستنیشانکەرەکان',
        'پێوەندیی چەمکە سەرەکییەکان و جیاکاری لەگەڵ تێگەیشتنە باوەکان',
        'ڕەهەندە زانستی و فەلسەفییەکانی کاریگەریی بابەتەکە'
      ]
    },
    {
      chapterIndex: 2,
      kurdishOrdinal: 'دووەم',
      themeTitle: `ئەدەبیاتی پێشینە، توێژینەوە بەراوردکارییەکان و بۆشاییە مەعریفییەکان`,
      subtopics: [
        'پێداچوونەوەی ڕەخنەگرانە بە بەرهەم و سەرچاوە ناوخۆیی و هەرێمییەکان',
        'بەراوردکاری لەگەڵ توێژینەوە و سەرچاوە نێودەوڵەتییە باوەڕپێکراوەکان',
        'پۆلێنکردنی قوتابخانە فیکرییەکان و ڕوانگەی ئاراستە دژبەیەکەکان',
        'دەستنیشانکردنی دەقاودەقی بۆشایی مەعریفی (Research Gap) لە کایەکەدا',
        'سەلماندنی گرنگیی توێژینەوەی نوێ و بەشدارییە چاوەڕوانکراوەکەی'
      ]
    },
    {
      chapterIndex: 3,
      kurdishOrdinal: 'سێیەم',
      themeTitle: `میتۆدۆلۆژیا، ئامرازەکانی پشکنین و ئەندازەی بەڵگەسازیی زانستی`,
      subtopics: [
        'دیاریکردنی مێتۆدی زانستی (چۆنایەتی، چەندایەتی یان تێکەڵە)',
        'کۆمەڵگە و نموونەی لێکۆڵینەوە و پێوەرەکانی هەڵبژاردن',
        'ئامرازەکانی کۆکردنەوەی داتا، ڕاپرسی، چاوپێکەوتن یان شیتاڵی دەق',
        'پرەنسیپەکانی جێمتمانەیی (Reliability) و ڕەوایی (Validity)',
        'ڕێوشوێنە ئەخلاقییەکانی توێژینەوە و سنووردارێتییە میتۆدییەکان'
      ]
    },
    {
      chapterIndex: 4,
      kurdishOrdinal: 'چوارەم',
      themeTitle: `شیکاریی قووڵی داتاکان، خستنەڕووی دۆزینەوەکان و تاوتوێی بەڵگەدار`,
      subtopics: [
        'دەرهێنان و ڕێکخستنی داتاکان بەپێی ئامانجە دەستنیشانکراوەکان',
        'شیکاریی گۆڕاوە سەرەکییەکان و دۆزینەوەی پەیوەندییە هۆکارییەکان',
        'تاوتوێی ڕەخنەگرانەی دۆزینەوەکان لەژێر ڕۆشنایی تیۆرییە پێشینەکان',
        'شیکردنەوەی خاڵە وەرچەرخانەکان و دیاردە چاوەڕواننەکراوەکان',
        'سەلماندن یان ڕەتکردنەوەی گریمانە سەرەکییەکانی لێکۆڵینەوەکە'
      ]
    },
    {
      chapterIndex: 5,
      kurdishOrdinal: 'پێنجەم',
      themeTitle: `کاریگەرییە پراکتیکییەکان، لێکەوتە ستراتیژییەکان و ئاڵەنگارییەکان`,
      subtopics: [
        'ڕەنگدانەوەی دەرئەنجامەکان لەسەر واقیعی کردەیی و پەروەردەیی/کۆمەڵایەتی',
        'ئاڵەنگارییە زانستی، دارایی، کارگێڕی یان یاسایییەکانی جێبەجێکردن',
        'بەراوردی مۆدێلی پێشنیارکراو لەگەڵ مۆدێلە کارپێکراوە باوەکان',
        'مەترسییە شیاوەکان و میکانیزمەکانی خۆگونجاندن و چارەسەر',
        'سوودمەندانی سەرەکی و بوارەکانی بەکارهێنانی ڕاستەوخۆ'
      ]
    },
    {
      chapterIndex: 6,
      kurdishOrdinal: 'شەشەم',
      themeTitle: `دیدگای ئایندەیی، چاکسازیی پێکهاتەیی و مۆدێلی گەشەپێدانی سیستماتیک`,
      subtopics: [
        'ستراتیژیی سەردەمیانە بۆ پەرەپێدانی بەردەوامی بوارەکە',
        'داڕشتنی مۆدێلی پێشنیارکراوی توێژینەوەکە بۆ ئایندە',
        'ئاسۆکانی داهاتووی کایەی «' + cleanTitle + '» لە سەردەمی دیجیتەڵ و ژیرییدا',
        'پێوەری هەڵسەنگاندنی بەردەوام و چاودێریی کوالێتی'
      ]
    }
  ];
}

/**
 * Builds substantive granular sections based on required units formula.
 */
export function generateGranularBookSections(
  config: AcademicUnitConfig,
  startId: number,
  customTitles?: string[]
): { sections: ChapterItem[]; nextId: number; tocSummary: string[] } {
  const { title, discipline, targetPages, totalTargetWords } = config;
  const cleanTitle = (title || '').trim() || 'کتێبی زانستی';
  const requiredUnits = calculateSubstantiveUnitsCount(targetPages, config.pagesPerResponse || 2);
  const wordsPerUnit = Math.max(400, Math.round((totalTargetWords * 0.70) / requiredUnits));

  const majorThemes = getMajorThemesForDiscipline(discipline || '', cleanTitle);
  const sections: ChapterItem[] = [];
  const tocSummary: string[] = [];
  let currentId = startId;

  // If user provided custom TOC lines, honor them as base anchors
  if (customTitles && customTitles.length > 0) {
    const customCount = customTitles.length;
    // If user provided fewer custom titles than required units, expand each custom title with subtopics
    const subUnitsPerCustom = Math.max(1, Math.ceil(requiredUnits / customCount));
    
    for (let cIdx = 0; cIdx < customCount; cIdx++) {
      const baseTitle = customTitles[cIdx];
      const chapNum = cIdx + 1;
      
      if (subUnitsPerCustom === 1 || requiredUnits <= customCount) {
        const itemTitle = `بەشی ${chapNum}: ${baseTitle}`;
        tocSummary.push(itemTitle);
        sections.push(createSectionItem(
          currentId++,
          itemTitle,
          `شیکاری ورد و ئەکادیمی بۆ باسی «${baseTitle}» لە چوارچێوەی کتێبی «${cleanTitle}».`,
          wordsPerUnit,
          config.fieldWorkOn
        ));
      } else {
        tocSummary.push(`بەشی ${chapNum}: ${baseTitle}`);
        for (let sIdx = 0; sIdx < subUnitsPerCustom; sIdx++) {
          if (sections.length >= requiredUnits) break;
          const secNum = `${chapNum}.${sIdx + 1}`;
          const itemTitle = `بەشی ${chapNum} - تەوەری ${secNum}: تاوتوێی چڕی «${baseTitle}» (بڕگەی ${sIdx + 1})`;
          tocSummary.push(`  └─ ${itemTitle}`);
          sections.push(createSectionItem(
            currentId++,
            itemTitle,
            `شیکاری تێروتەسەلی تەوەری ${secNum} تایبەت بە «${baseTitle}» بەپێی سەرچاوە زانستییەکان.`,
            wordsPerUnit,
            config.fieldWorkOn
          ));
        }
      }
    }
    return { sections, nextId: currentId, tocSummary };
  }

  // Academic automatic multi-chapter & multi-subsection partition
  const numMajorChapters = Math.min(
    majorThemes.length,
    Math.max(2, Math.min(8, Math.ceil(requiredUnits / 4)))
  );
  const unitsPerChapter = Math.ceil(requiredUnits / numMajorChapters);

  let unitsGenerated = 0;
  for (let chIdx = 0; chIdx < numMajorChapters && unitsGenerated < requiredUnits; chIdx++) {
    const theme = majorThemes[chIdx % majorThemes.length];
    const chapterNum = chIdx + 1;
    const chapterHeader = `بەشی ${theme.kurdishOrdinal}: ${theme.themeTitle}`;
    tocSummary.push(chapterHeader);

    const neededInThisChapter = Math.min(unitsPerChapter, requiredUnits - unitsGenerated);

    for (let subIdx = 0; subIdx < neededInThisChapter; subIdx++) {
      const subtopicName = theme.subtopics[subIdx % theme.subtopics.length] ||
        `تەوەری شیکاریی بەراوردکاری و ئەکادیمی (بڕگەی ${subIdx + 1})`;
      const sectionNum = `${chapterNum}.${subIdx + 1}`;
      const itemTitle = `بەشی ${theme.kurdishOrdinal} - تەوەری ${sectionNum}: ${subtopicName}`;
      tocSummary.push(`  ├─ ${itemTitle} (~${wordsPerUnit} وشە / ٢ لاپەڕە)`);

      sections.push(createSectionItem(
        currentId++,
        itemTitle,
        `شیکاریی ئەکادیمی بۆ «${subtopicName}» لەژێر چەتری ${chapterHeader}. تەرکیز لەسەر بەڵگەسازی و دەستەواژەی زانستی.`,
        wordsPerUnit,
        config.fieldWorkOn
      ));
      unitsGenerated++;
    }
  }

  return { sections, nextId: currentId, tocSummary };
}

function createSectionItem(
  id: number,
  title: string,
  academicNotes: string,
  targetWords: number,
  fieldWorkOn?: boolean
): ChapterItem {
  return {
    id,
    title,
    wordCount: 0,
    status: 'pending',
    content: `## ${title}\n\nلەم تەوەرەدا بە شێوازێکی زانستی، ورد و ڕەخنەگرانە ناوەڕۆکی بابەتەکە تاوتوێ دەکرێت.\n\n### پرسیارە سەرەکییەکانی ئەم تەوەرە:\n1. ئاراستە و دەرکەوتە جەوهەرییەکانی ئەم بەشە چین؟\n2. سەرچاوە و بەڵگە زانستییەکان چۆن ڕاڤەی دەکەن؟\n\n### خاڵە جەوهەرییەکانی شیتاڵکردن:\n- دەستنیشانکردنی پێوەرە تیۆری و پراکتیکییەکان.\n- بەراوردکاریی ڕەخنەگرانە لەگەڵ توێژینەوە باوەڕپێکراوەکان.`,
    academicNotes: fieldWorkOn
      ? `${academicNotes} پێویستە داتای مەیدانی و تێبینی ڕاستەوخۆ پشتڕاست بکرێنەوە.`
      : academicNotes,
    customTargetWords: targetWords,
    axes: []
  };
}
