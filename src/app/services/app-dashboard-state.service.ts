import { Injectable, signal, computed, inject } from '@angular/core';
import { EditorService } from '../features/editor/services/editor';
import { Data } from './data';
import { ChapterItemModel as ChapterItem, SavedManuscriptModel as SavedManuscript, RetrievedChunkModel as RetrievedChunk } from '../domain/models';

export interface MythComparisonItem {
  title: string;
  region: string;
  latitude: number;
  longitude: number;
  mythSummary: string;
  scientificConcept: string;
  scienceSummary: string;
  synthesis: string;
}

@Injectable({ providedIn: 'root' })
export class AppDashboardStateService {
  private editorService = inject(EditorService);
  private data = inject(Data);

  // D3 Bar chart data for vocabulary complexity
  d3ComplexityBars = computed(() => {
    const list = this.editorService.chapters();
    if (!list || list.length === 0) {
      return [
        { chapterId: 1, x: 80, y: 10, width: 220, height: 18, score: 65 },
        { chapterId: 2, x: 80, y: 50, width: 280, height: 18, score: 82 },
        { chapterId: 3, x: 80, y: 90, width: 190, height: 18, score: 55 }
      ];
    }
    return list.map((ch, idx) => {
      const words = (ch.content || '')
        .toLocaleLowerCase('ckb-IQ')
        .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);

      const uniqueWords = new Set(words);
      const score = words.length > 0
        ? Math.round((uniqueWords.size / words.length) * 100)
        : 0;
      const width = Math.floor((Math.min(100, score) / 100) * 340);

      return {
        chapterId: ch.id,
        x: 80,
        y: idx * 40 + 10,
        width,
        height: 18,
        score
      };
    });
  });

  // D3 Timeline data for myths
  d3KurdishTimeline = computed(() => [
    { id: 0, x: 60, era: 'سەردەمی کۆن', title: 'داستانی کاوە و زوحاک' },
    { id: 1, x: 200, era: 'سەدەی ناوەڕاست', title: 'داستانی مەم و زین' },
    { id: 2, x: 340, era: 'سەدەی نۆزدەیەم', title: 'داستانی قەڵای دمدم' },
    { id: 3, x: 440, era: 'سەردەمی نوێ', title: 'شانامەی کوردی' }
  ]);

  selectedMythId = signal<number>(0);

  mythComparisons = signal<MythComparisonItem[]>([
    {
      title: 'داستانی کاوە و زوحاک (Kawa & Zahhak)',
      region: 'چیاکانی زاگرۆس - کرماشان',
      latitude: 34.3142,
      longitude: 47.065,
      mythSummary: 'چیرۆکی ڕاپەڕین و سەرکەوتنی ڕووناکی بەسەر تاریکیدا و جەژنگرتنی نەورۆز بە هەڵکردنی ئاگر لە لوتکەی چیاکاندا.',
      scientificConcept: 'دیالەکتیکی گۆڕانی کۆمەڵایەتی و ڕووکاری زەوی (Geomorphology)',
      scienceSummary: 'شیکردنەوەی چۆنیەتی دروستبوونی شێوازی شارستێنی لە دەشتی زاگرۆس و ڕۆڵی زانستی لە دروستکردنی پەناگە و بەکارهێنانی ئاگر.',
      synthesis: 'لە نێوان ئەفسانەی زوحاک و لێکۆڵینەوە جیۆمۆرفۆلۆژییەکاندا، هێمای ئاگر نیشاندەری ڕزگاربوونی ئینسانی کۆنە لە تاریکی ئەشکەوتەکان بەرەو شارستێنی دەشتایەکانی کوردستان.'
    },
    {
      title: 'داستانی مەم و زین (Mem & Zin)',
      region: 'بۆتان - جەزیرە',
      latitude: 37.3333,
      longitude: 42.1833,
      mythSummary: 'داستانی ئینی خۆشەویستی پاک و پیرۆز لە نێوان مەم و زیندا کە تیایدا ستەمکاری دەبێتە ڕێگر لە شادبوونیان.',
      scientificConcept: 'سۆسیۆلۆژیای خێزان و بنەماکانی باوکسالاری (Sociology of Patriarchy)',
      scienceSummary: 'شیکردنەوەی پێکهاتەی سۆسیۆ-ئابووری کۆمەڵگەی دەرەبەگایەتی و لێکۆڵینەوە لە کۆتە کۆمەڵایەتییەکانی جێندەر.',
      synthesis: 'داستانی مەم و زین تەنها داستانێکی ئەڤینداری نییە، بەڵکو بەستێنێکی ئەنتڕۆپۆلۆژی دەوڵەمەندە بۆ تێگەیشتن لە پێکهاتەی هۆزگەری و دەرەبەگایەتی سەدەکانی ناوەڕاست لە ناوچەی بۆتان.'
    },
    {
      title: 'داستانی قەڵای دمدم (Dimdim Castle)',
      region: 'ورمێ - ڕۆژهەڵاتی کوردستان',
      latitude: 37.5528,
      longitude: 45.0758,
      mythSummary: 'بەردەوامی و بەرگریی بێوێنەی خانای چەنگزێڕین لە بەرامبەر سوپای ئیمپراتۆریەتدا.',
      scientificConcept: 'ستراتیژیی سەربازی و جیۆپۆلۆتیکی قەڵاکان (Geopolitics of Fortresses)',
      scienceSummary: 'لێکۆڵینەوە لە پێکهاتەی ئەندازیاری و هەڵکەوتەی تاکتیکی قەڵا سەربازییەکانی زاگرۆس لە ڕوانگەی جیۆپۆلۆتیکەوە.',
      synthesis: 'داستانی دمدم بەرجەستەکەرەوەی ململانێی ڕێکخستنی ناوخۆیی هۆزە کوردییەکان و ئیمپراتۆریەتە ئیقلیمییەکانە لە سەدەی حەڤدەهەمدا.'
    },
    {
      title: 'شانامەی کوردی و ڕەستاکانی (Kurdish Shahnameh)',
      region: 'هەورامان و گۆران',
      latitude: 35.1833,
      longitude: 46.25,
      mythSummary: 'کۆمەڵە داستانێکی حەمەسی کە بە زاراوەی گۆرانی-هەورامی تۆمارکراون.',
      scientificConcept: 'زمانەوانی بەراوردکاری و میتۆلۆژیای هیندۆ-ئەوروپی (Comparative Linguistics)',
      scienceSummary: 'لێکۆڵینەوەی پێکهاتەی فۆنۆلۆژی و مۆرفۆلۆژی تێکستە کەڤنارەکانی زمانی کوردی بە بەراورد لەگەڵ زانستی ڕەوانبێژیدا.',
      synthesis: 'تۆمارەکانی شانامەی کوردی نیشاندەری ڕەسەنایەتی زمانی هەورامی و پەیوەندییە مێژووییەکانی زانستی میتۆلۆژیان لە ناوچەی ڕۆژهەڵاتی ناوەڕاستدا.'
    }
  ]);

  userVoiceSampleText = signal<string>('');
  calibrationError = signal<string | null>(null);
  calibratedVoiceProfile = signal<any>(null);
  isCalibratingVoice = signal<boolean>(false);

  copilotActiveTab = signal<string>('multi_agent_debate');

  // Local draft & custom options
  isQuickPreviewVisible = signal<boolean>(false);
  quickPreviewPos = signal<{ top: number; left: number; x: number; y: number }>({ top: 0, left: 0, x: 0, y: 0 });

  // History and Chunk Filtering
  retrievedChunks = signal<RetrievedChunk[]>([]);
  chunkSearchQuery = signal<string>('');

  filteredRetrievedChunks = computed(() => {
    const query = this.chunkSearchQuery().toLowerCase().trim();
    const chunks = this.retrievedChunks();
    if (!query) return chunks;
    return chunks.filter(c => 
      (c.text && c.text.toLowerCase().includes(query)) ||
      (c.sourceTitle && c.sourceTitle.toLowerCase().includes(query)) ||
      (c.author && c.author.toLowerCase().includes(query))
    );
  });

  filteredHistoryList = computed(() => {
    const list = this.data.historyList();
    return list;
  });

  pageRangeWords = computed(() => {
    return { minWords: 2800, targetWords: 3500, maxWords: 4200 };
  });

  chapterCrossData = computed(() => {
    const chs = this.editorService.chapters();
    if (!chs || chs.length === 0) {
      return {
        names: ['بەشی ١: پێشەکی', 'بەشی ٢: مێتۆدۆلۆژی', 'بەشی ٣: داتا', 'سەرچاوەی Harvard'],
        matrix: [[0, 15, 20, 25], [15, 0, 30, 10], [20, 30, 0, 18], [25, 10, 18, 0]]
      };
    }
    const names = chs.map(c => c.title || `بەشی ${c.id}`);
    const n = names.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const wordsI = (chs[i].content || '').length;
          const wordsJ = (chs[j].content || '').length;
          matrix[i][j] = Math.min(35, Math.floor((wordsI + wordsJ) / 200) + (i + j + 5));
        }
      }
    }
    return { names, matrix };
  });

  dashboardManuscriptSummary = computed(() => {
    const list = this.editorService.chapters();
    const targetPages = 10;
    const goalWords = targetPages * 350;

    let totalWords = 0;
    let completedChapters = 0;
    let activeWritingChapters = 0;
    let pendingChapters = 0;

    for (const ch of list) {
      const wc = ch.wordCount || (ch.content ? ch.content.trim().split(/\s+/).filter(Boolean).length : 0);
      totalWords += wc;
      if (ch.status === 'completed') {
        completedChapters++;
      } else if (ch.status === 'writing' || ch.status === 'humanizing') {
        activeWritingChapters++;
      } else {
        pendingChapters++;
      }
    }

    const completionPercentage = goalWords > 0 ? Math.min(100, Math.round((totalWords / goalWords) * 100)) : 0;
    const estimatedPages = Math.round(totalWords / 350);

    let progressStatus = 'ڕەشنووسی سەرەتایی';
    if (completionPercentage >= 100) {
      progressStatus = 'تەواوکراو و تەواو پشکنراو';
    } else if (completionPercentage > 50) {
      progressStatus = 'لە پێشکەوتنی باڵادایە';
    } else if (completionPercentage > 0) {
      progressStatus = 'خەریکی کارکردن';
    }

    return {
      progressStatus,
      completionPercentage,
      goalWords,
      totalWords,
      estimatedPages,
      completedChapters,
      activeWritingChapters,
      pendingChapters
    };
  });

  autoBreakdownAnalysis = computed(() => {
    return {
      words: 3500,
      minWords: 3150,
      maxWords: 3850,
      minParagraphs: 20,
      maxParagraphs: 30,
      minCitations: 15,
      maxCitations: 25,
      estTablesFigures: 3,
      sectionCount: 5,
      sectionList: [
        'پێشەکی و چوارچێوەی گشتی',
        'پێداچوونەوەی ئەدەبیات',
        'مێتۆدۆلۆژیا و ڕێبازەکانی توێژینەوە',
        'شیکاری داتا و دۆزینەوەکان',
        'دەرئەنجام و پێشنیارەکان'
      ]
    };
  });

  calibrateAuthorVoice() {
    if (!this.userVoiceSampleText().trim()) return;
    this.isCalibratingVoice.set(true);
    this.calibrationError.set(null);
    setTimeout(() => {
      this.calibratedVoiceProfile.set({
        formality: 92,
        academicRigor: 88,
        kurdishVocabularyDensity: 'دەوڵەمەند (سۆرانی سەرەکی)',
        tone: 'زانستی، بەڵگەدار، بێلایەن'
      });
      this.isCalibratingVoice.set(false);
    }, 1200);
  }

  insertMythologicalSynthesisToChapter(chapter: ChapterItem | null, myth: MythComparisonItem) {
    if (!chapter || !myth) return;
    const textToInsert = `\n\n### شیکردنەوەی سینتێز بۆ ${myth.title}:\n${myth.synthesis}\n\n`;
    const updatedContent = (chapter.content || '') + textToInsert;
    this.editorService.updateChapterContent(chapter.id, updatedContent, 'زیادکردنی شیکردنەوەی ئەفسانەیی');
  }

  toggleChunkUsage(chunkId: string) {
    const list = this.retrievedChunks();
    const updated = list.map(c => c.id === chunkId ? { ...c, isUsed: !c.isUsed } : c);
    this.retrievedChunks.set(updated);
  }

  verifyChunkSource(chunk: RetrievedChunk) {
    chunk.isVerified = true;
  }
}
