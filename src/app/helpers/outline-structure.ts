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
}

export function buildAcademicThesisOutline(options: ThesisOutlineOptions): ChapterItem[] {
  const title = (options.title || '').trim() || 'تێزی زانستی';
  const targetPages = Math.max(1, options.targetPages || 10);
  const totalTargetWords = targetPages * 350;

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

  // Generate granular academic book sections based on targetPages / pagesPerResponse capacity formula
  let customTitles: string[] | undefined = undefined;
  if (options.customTOCOn && options.customTOCText?.trim()) {
    const userLines = options.customTOCText
      .split('\n')
      .map(line => line.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter(line => line.length > 2);
    if (userLines.length > 0) {
      customTitles = userLines;
    }
  }

  const { sections, tocSummary } = generateGranularBookSections(
    {
      title,
      discipline: options.discipline,
      writingType: options.writingType,
      academicLevel: options.academicLevel,
      targetPages,
      totalTargetWords,
      pagesPerResponse: 2,
      fieldWorkOn: options.fieldWorkOn
    },
    currentId + 10,
    customTitles
  );

  // 2. پێڕست و ناوەڕۆک (Table of Contents)
  if (options.includeTOC !== false) {
    const formattedToc = tocSummary.length > 0
      ? tocSummary.join('\n')
      : '- پێشەکیی گشتی و گرنگیی بابەت\n- بەشی تیۆری و چەمکسازیی چەقی توێژینەوە\n- میتۆدۆلۆژیا و ڕێکارە پەیڕەوکراوەکان\n- شیکردنەوەی داتا و خستنەڕووی دەرئەنجامەکان';

    chapters.push({
      id: currentId++,
      title: 'پێڕستی بابەتەکان و خشتەکان (Table of Contents)',
      wordCount: 0,
      status: 'pending',
      content: `## پێڕستی گشتیی تەوەر و بەشەکان\n\n**ئەندازەی پلاندانراوی کتێب:** ${targetPages} لاپەڕە (${totalTargetWords} وشە)، دابەشکراو بەسەر ${sections.length} تەوەری ئەکادیمیدا (توانای هەموو وەڵامێک ~٢ لاپەڕە).\n\n${formattedToc}\n\n- ئەنجام و کۆبەندی لێکۆڵینەوە\n- ڕاسپاردە و پێشنیارەکان\n- پێڕستی سەرچاوە و بەیبلۆگرافی`,
      academicNotes: 'پێڕستی تەواوی بەشە سەرەکییەکان و تەوەرە وردەکان بە ئاماژەی قەبارە.',
      customTargetWords: 200
    });
  }

  // 3. پێشەکی (Introduction)
  if (options.includeIntro !== false) {
    chapters.push({
      id: currentId++,
      title: 'پێشەکی: کێشە، گرنگی و ئامانجەکانی توێژینەوە (Introduction)',
      wordCount: 0,
      status: 'pending',
      content: `## پێشەکی\n\nتوێژینەوەی دەستنیشانکراو بە ناونیشانی «${title}» هەوڵێکی ڕەخنەگرانە و زانستییە بۆ شیکردنەوەی ڕەهەندە سەرەکییەکان و وەڵامدانەوەی پرسیارە جەوهەرییەکانی کایەکە.\n\n### پرسیاری سەرەکیی توێژینەوە:\nچۆن دەکرێت ئاستەنگ و گۆڕاوە سەرەکییەکان بە شێوازێکی زانستی ڕاڤە بکرێن و ڕێگەچارەی زانستی بۆ دابڕێژرێت؟\n\n### گرنگیی توێژینەوەکە:\nئەم لێکۆڵینەوەیە پڕکردنەوەی بۆشاییەکی مەعریفییە لە کتێبخانەی ئەکادیمی و پێشکەشکردنی داتای سەردەمیانەیە بە مێتۆدی زانستی.`,
      academicNotes: 'پێناسەکردنی ڕوون و ڕەوانی ئامانجەکان، پرسیارەکان، و سنووری بابەت.',
      customTargetWords: Math.max(400, Math.round(totalTargetWords * 0.10))
    });
  }

  // 4. بەشە سەرەکی و تەوەرە ئەکادیمییەکان (Core Substantive Sections)
  for (const section of sections) {
    chapters.push({
      ...section,
      id: currentId++
    });
  }

  // 5. ئەنجام (Conclusion)
  if (options.includeConclusion !== false) {
    chapters.push({
      id: currentId++,
      title: 'ئەنجام و کۆبەندی لێکۆڵینەوە (Conclusion)',
      wordCount: 0,
      status: 'pending',
      content: `## ئەنجام\n\nلە کۆتایی ئەم توێژینەوەیەدا، دەرکەوت کە پرۆسەی شیکاری بەڵگەداری بابەتی «${title}» دەمانگەیەنێتە ئەو دەرئەنجامە زانستییەی کە تیۆری و کردار پێکەوە پەیوەستن و پێویستیان بە چوارچێوەیەکی ستراتیژیی گونجاوە.`,
      academicNotes: 'پوختەی دەستکەوتە زانستییەکان و وەڵامی ڕاستەوخۆ بۆ پرسیارەکانی پێشەکی.',
      customTargetWords: Math.max(300, Math.round(totalTargetWords * 0.12))
    });
  }

  // 6. ڕاسپاردەکان (Recommendations)
  if (options.includeRecommendations !== false) {
    chapters.push({
      id: currentId++,
      title: 'ڕاسپاردە و پێشنیارەکان بۆ توێژینەوەی داهاتوو (Recommendations)',
      wordCount: 0,
      status: 'pending',
      content: `## ڕاسپاردە و پێشنیارەکان\n\n1. بەردەوامیدان بە لێکۆڵینەوە لەسەر ئەو بۆشایییە زانستییانەی کە پێویستیان بە داتای زەمینەیی زیاترە.\n2. پەیڕەوکردنی میتۆدۆلۆژیای هاوچەرخ لە ناوەندە ئەکادیمییەکاندا بۆ دەوڵەمەندکردنی بابەتی «${title}».\n3. گرنگیدانی تایبەت بە چاپ و بڵاوکردنەوەی سەرچاوەی زیاتر بە زمانی کوردی.`,
      academicNotes: 'پێشنیارە زانستی و پڕاکتیکییەکان بۆ بوارەکە.',
      customTargetWords: 250
    });
  }

  // 7. سەرچاوەکان (References)
  if (options.includeReferences !== false) {
    chapters.push({
      id: currentId++,
      title: 'لیستی سەرچاوە و بەیبلۆگرافی (References & Bibliography)',
      wordCount: 0,
      status: 'pending',
      content: `## لیستی سەرچاوە زانستییەکان\n\n- سەرچاوە کوردییەکان بەپێی ئەلفوبێ ڕێکدەخرێن.\n- سەرچاوە بیانییەکان (Harvard / APA 7th Edition) پشکنین و پشتڕاست دەکرێنەوە.`,
      academicNotes: 'تەواوی سەرچاوە بەکارهاتووەکانی ناو دەق بە شێوازی یاسایی.',
      customTargetWords: 350
    });
  }

  chapters.forEach(ch => {
    ch.customSourcesOn = Boolean(options.customSourcesOn);
    ch.fieldWorkOn = Boolean(options.fieldWorkOn);
  });

  return chapters;
}
