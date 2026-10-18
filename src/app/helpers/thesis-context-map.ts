import { ChapterItemModel, AcademicSourceModel, GlossaryEntry } from '../domain/models';

export interface ConceptNodeModel {
  id: string;
  name: string;
  kurdishTranslation: string;
  category: 'methodology' | 'hypothesis' | 'evidence' | 'theory' | 'gap' | 'finding' | 'general';
  definition: string;
  sourceLang?: string;
  importance?: 'critical' | 'high' | 'medium';
}

export interface ConceptLinkModel {
  source: string;
  target: string;
  relation: string;
  relationKurdish?: string;
}

export interface ThesisContextMapModel {
  version: string;
  exportTimestamp: string;
  projectMetadata: {
    title: string;
    discipline: string;
    academicLevel: string;
    targetPages: number;
    targetWords: number;
    language: string;
    authorEmail?: string;
  };
  chapters: ChapterItemModel[];
  methodology: {
    approach: string;
    tools: string[];
    dataSources: string[];
    kurdishNotes?: string;
  };
  gapAnalysis: {
    identifiedGaps: string[];
    proposedNovelties: string[];
  };
  conceptMap: {
    nodes: ConceptNodeModel[];
    links: ConceptLinkModel[];
  };
  bibliography: AcademicSourceModel[];
  glossary: GlossaryEntry[];
}

/**
 * Downloads the given thesis context map as a formatted JSON file.
 */
export function exportThesisContextMap(mapData: ThesisContextMapModel, customFileName?: string): void {
  const jsonStr = JSON.stringify(mapData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedTitle = (mapData.projectMetadata.title || 'thesis')
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
    
  const fileName = customFileName || `${sanitizedTitle}_context_map.json`;
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses a thesis context map JSON file.
 */
export function parseThesisContextMapFile(file: File): Promise<ThesisContextMapModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('فایلی نەخشەی تێزەکە نەگونجاوە (Invalid JSON structure)');
        }
        if (!parsed.projectMetadata || !parsed.chapters) {
          throw new Error('پێکهاتەی فایلی نەخشەی تێزەکە تەواو نییە (Missing required metadata or chapters)');
        }
        
        resolve(parsed as ThesisContextMapModel);
      } catch (err: any) {
        reject(new Error(err.message || 'هەڵە لە خوێندنەوەی فایلی JSON'));
      }
    };
    reader.onerror = () => reject(new Error('شکست لە خوێندنەوەی فایلی ئامادەکراو'));
    reader.readAsText(file);
  });
}

/**
 * Primary Corpus & Research Cards Box (سندوقی دەقی بنەڕەتی و فیشەکانی خوێندنەوە)
 */
export interface ResearchCorpusCard {
  id: string;
  sourceTitle: string;
  title?: string;
  author: string;
  pageNumber?: string | number;
  targetChapterId: number;
  excerptText: string;
  analyticalNote?: string;
  createdAt: string;
  category?: 'literary_passage' | 'poetry' | 'travelogue' | 'archival' | 'field_data' | 'corpus';
  tags?: string[];
}

/**
 * Vertical Alignment Matrix Item (هاوتابوونی ستوونیی تێز: پرسیار ⬅️ ئامانج ⬅️ تەوەر ⬅️ دەرئەنجام)
 */
export interface VerticalAlignmentMatrixItem {
  id: string;
  questionNumber: number;
  questionText: string;
  objectiveText: string;
  targetChapterId: number;
  targetChapterTitle: string;
  expectedFindingSummary?: string;
  status?: 'aligned' | 'in_progress';
}

/**
 * Injects assigned Corpus Cards into the writing prompt, mandating close textual & discourse analysis.
 */
export function buildChapterCorpusPromptContext(cards: ResearchCorpusCard[], targetChapterId: number): string {
  const chapterCards = (cards || []).filter(c => c.targetChapterId === targetChapterId);
  if (chapterCards.length === 0) return '';

  const formatted = chapterCards.map((c, idx) => 
    `[فیشی ژمارە ${idx + 1} - دەقی سەرەکیی کۆرپەس]:
سەرچاوە: «${c.sourceTitle}» (${c.author}، لاپەڕە: ${c.pageNumber})
دەقی دەقاودەقی وەرگیراو:
«${c.excerptText}»
تێبینیی شیکاری و مەبەستی توێژەر: ${c.analyticalNote}`
  ).join('\n---\n');

  return `
[سندوقی دەقی بنەڕەتی و فیشەکانی کۆرپەس - PRIMARY CORPUS & RESEARCH CARDS]:
تێبینیی گرنگ بۆ شیکاریی پراکتیکی: پێویستە لەم بەشەدا شیکاریی وردی دەق و گوتار (Close Textual & Discourse Analysis) ڕاستەوخۆ لەسەر ئەم دەقە بنەڕەتییانەی خوارەوە ئەنجام بدەیت نەک گشتاندنی گشتی و ناڕوون. هەر فیشێک بە وەرگرتنی دەقاودەق «...» بهێنە ناو دەق و لەسەر مۆرفۆلۆژیا، مانای دەلالەت، و گوتاری دەقەکە ڕابوەستە:
${formatted}
`.trim();
}

/**
 * Enforces 1-to-1 Vertical Alignment between Research Questions, Objectives, Chapters, and Conclusions.
 */
export function buildVerticalAlignmentConclusionsPromptDirectives(matrix: VerticalAlignmentMatrixItem[]): string {
  if (!matrix || matrix.length === 0) return '';
  const rows = matrix.map(m => 
    `پرسیاری ${m.questionNumber}: «${m.questionText}»
ئامانجی پەیوەست: «${m.objectiveText}»
تەوەر/بەشی لێکۆڵینەوە: بەشی ${m.targetChapterId} («${m.targetChapterTitle}»)`
  ).join('\n---\n');

  return `
[ماتریسی هاوتابوونی ستوونیی تێز - VERTICAL ALIGNMENT MATRIX (پرسیار ⬅️ ئامانج ⬅️ تەوەر ⬅️ دەرئەنجام)]:
پێویستە بەشی ئەنجامەکان (Findings & Conclusions) بە شێوەیەکی نەگۆڕ لە وەڵامێکی ڕاستەوخۆ و ژمارەیی 1-بە-1 بۆ هەریەک لە پرسیارە سەرەکی و لاوەکییەکان دابڕێژرێت:
${rows}

ڕێسای زانستیی لیژنەی بەرگری (Viva Alignment):
- بۆ هەر پرسیارێک بڕگەیەکی جیاواز دابنێ بەم شێوازە: «لە وەڵامی پرسیاری ژمارە (...)ی توێژینەوەدا سەبارەت بە (...): دەرەنجامە مەیدانی و تیۆرییەکان دەریانخست کە...».
- دەبێت هاوتابوونی سەدا سەد لە نێوان پرسیاری دەروازە و ئەنجامی کۆتایی هەبێت بەبێ لادان لە سنووری پرسیارەکان.
`.trim();
}

/**
 * Cross-Chapter Rolling Memory (یادگەی زنجیرەیی نێوان بەشەکان)
 * Maintains compact summary of key arguments written in previous chapters,
 * forbids repeating earlier definitions, and mandates scholarly cross-referencing.
 */
export function buildCrossChapterRollingMemory(chapters: ChapterItemModel[], currentChapterId: number): string {
  const previousChapters = (chapters || []).filter(c => c.id < currentChapterId && (c.content || '').trim().length > 50);
  if (previousChapters.length === 0) return '';

  const summaries = previousChapters.map(c => {
    const words = (c.content || '').trim().split(/\s+/).slice(0, 80).join(' ');
    return `- لە «${c.title}» (بەشی ${c.id}): بنەمای تیۆری و شیکاری دانراوە (${words.slice(0, 100)}...).`;
  }).join('\n');

  return `
[یادگەی زنجیرەیی نێوان بەشەکان - CROSS-CHAPTER ROLLING MEMORY]:
ئەم تەوەرانەی خوارەوە لە بەشەکانی پێشوودا شی کراونەتەوە:
${summaries}
قەدەغەکردنی ڕەها: بە هیچ شێوەیەک پێناسە و چەمکە تیۆرییە شیکراوەکانی بەشەکانی پێشوو دووبارە مەکەرەوە. بەڵکو بەستەری ئەکادیمی بدە (نموونە: «بە پشتبەستن بەو چوارچێوە تیۆرییەی لە بەشەکانی پێشوودا شی کرایەوە...»).
`.trim();
}

