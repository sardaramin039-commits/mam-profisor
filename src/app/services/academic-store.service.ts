import { Injectable, signal } from '@angular/core';
import { ChapterItemModel as ChapterItem, StructureReviewResult, AcademicSourceModel } from '../domain/models';
import { ResearchCorpusCard, VerticalAlignmentMatrixItem } from '../helpers/thesis-context-map';

@Injectable({
  providedIn: 'root'
})
export class AcademicStoreService {
  // Navigation & View State
  public viewMode = signal<'splash' | 'workspace'>('splash');
  public mainTab = signal<'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive'>('editor');
  public activeSubTab = signal<'editor' | 'review' | 'glossary' | 'citations' | 'chunks' | 'pulse' | 'health_check' | 'timeline' | 'grammar_panel'>('editor');
  
  // Modals & Panels
  public isSettingsOpen = signal<boolean>(false);
  public isAdminOpen = signal<boolean>(false);
  public isBookmarksOpen = signal<boolean>(false);
  
  // Feature Panels
  public isDailyPulseOpen = signal<boolean>(true);
  public isCitationHealthCheckOpen = signal<boolean>(false);
  public isChapterTimelineOpen = signal<boolean>(false);
  public isGrammarPanelOpen = signal<boolean>(false);

  // Dark mode
  public academicDarkMode = signal<boolean>(false);

  // Dynamic Writing State
  public manuscriptTitle = signal<string>('تێزی ئەکادیمی');
  public chapters = signal<ChapterItem[]>([]);
  public sources = signal<AcademicSourceModel[]>([]);
  public viewedChapter = signal<ChapterItem | null>(null);
  public activeReview = signal<StructureReviewResult | null>(null);

  // Primary Corpus & Research Cards Box (سندوقی دەقی بنەڕەتی و فیشەکانی خوێندنەوە)
  public researchCorpusCards = signal<ResearchCorpusCard[]>(this.loadCorpusCards());

  // Vertical Alignment Matrix (هاوتابوونی ستوونیی تێز: پرسیار ⬅️ ئامانج ⬅️ تەوەر ⬅️ دەرئەنجام)
  public verticalAlignmentMatrix = signal<VerticalAlignmentMatrixItem[]>(this.loadAlignmentMatrix());

  // Progress indicators
  public isWritingProgress = signal<boolean>(false);
  public isHumanizingProgress = signal<boolean>(false);
  public isSingleWritingProgress = signal<number | null>(null);

  // Feedback notifications & logs
  public feedbackMessage = signal<string | null>(null);
  public systemLogs = signal<string[]>([]);

  private loadCorpusCards(): ResearchCorpusCard[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('MAM_RESEARCH_CORPUS_CARDS');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'card-1',
        sourceTitle: 'دیوانی نالی (دەستنووس و چاپی لێکۆڵراوە)',
        author: 'مەلا خدر ئەحمەدی نالی (لێکۆڵینەوەی مەسعوود محەممەد)',
        pageNumber: '٨٤',
        targetChapterId: 2,
        excerptText: 'قوربانی تۆزی ڕێگەتم ئەی بادەکەی سەحەر / وەختی درەوشە، ڕۆژ بە کەسی دەرکەوتووە؟',
        analyticalNote: 'شیکاریی گوتاری دەق لەسەر خوازەی (با و دووری) و ڕەنگدانەوەی لە شوناسی دەربەدەری و بونیادی گێڕانەوەی کلاسیزمی کوردی.',
        createdAt: 'ئەمڕۆ',
        category: 'poetry',
        tags: ['شێعر', 'نالی', 'کۆنفرانسی_دەق']
      },
      {
        id: 'card-2',
        sourceTitle: 'گەشتنامەی ڕیچ بۆ کوردستان (1820)',
        author: 'Claudius James Rich',
        pageNumber: '١٤٢',
        targetChapterId: 3,
        excerptText: 'میرنشینی بابان و شاری سلێمانی خاوەن سیستمێکی تایبەتی بەڕێوەبردن و زمانی دیپلۆماسی و ئەدەبیی سۆرانی بوون کە جیاواز بوو لە شارەکانی تری عوسمانی.',
        analyticalNote: 'بەڵگەی ئەرشیفی بۆ سەلماندنی پێگەی دامەزراوەیی شێوەزاری سۆرانی پێش گۆڕانکارییە مۆدێرنەکانی سەدەی بیستەم.',
        createdAt: 'دوێنێ',
        category: 'travelogue',
        tags: ['گەشتنامە', 'مێژوو', 'بابان']
      }
    ];
  }

  private loadAlignmentMatrix(): VerticalAlignmentMatrixItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('MAM_VERTICAL_ALIGNMENT_MATRIX');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'align-1',
        questionNumber: 1,
        questionText: 'پەیکەری گوتاری ئەدەبی چۆن لە دەقە کلاسیکییەکاندا بونیات نراوە؟',
        objectiveText: 'دەستنیشانکردنی بنەما ئیپستۆمۆلۆژی و مێژووییەکانی گوتاری کلاسیزمی کوردی.',
        targetChapterId: 2,
        targetChapterTitle: 'بەشی دووەم: شیکاریی پراکتیکی - تەوەری یەکەمی دەقەکان',
        expectedFindingSummary: 'ساغکردنەوەی کارکردی خوازە و شوناسی نەتەوەیی لە دەقی کلاسیکدا.',
        status: 'aligned'
      },
      {
        id: 'align-2',
        questionNumber: 2,
        questionText: 'ئایا شێوەزاری سۆرانی چۆن لەژێر کاریگەریی مۆدێرنیتە و گەشتنامەکاندا گۆڕانی بەسەردا هاتووە؟',
        objectiveText: 'شیکردنەوەی بەراوردکاریی نێوان ئەرشیفی مێژوویی و دەقە ئەزموونییەکان.',
        targetChapterId: 3,
        targetChapterTitle: 'بەشی سێیەم: شیکاریی پراکتیکی - تەوەری دووەم و بەراوردکاری',
        expectedFindingSummary: 'پشتڕاستکردنەوەی مۆدێلی پارادایمی هاوچەرخ و پاراستنی ڕەسەنایەتی زمانەوانی.',
        status: 'aligned'
      }
    ];
  }

  public addCorpusCard(card: Omit<ResearchCorpusCard, 'id' | 'createdAt'>): void {
    const newCard: ResearchCorpusCard = {
      ...card,
      id: `card-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('ckb')
    };
    this.researchCorpusCards.update(cards => [newCard, ...cards]);
    this.saveCorpusCards();
    this.addLog(`فیشی کۆرپەس بۆ بەشی ${card.targetChapterId} زیادکرا.`);
  }

  public deleteCorpusCard(id: string): void {
    this.researchCorpusCards.update(cards => cards.filter(c => c.id !== id));
    this.saveCorpusCards();
  }

  public saveCorpusCards(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('MAM_RESEARCH_CORPUS_CARDS', JSON.stringify(this.researchCorpusCards()));
      } catch {}
    }
  }

  public setVerticalAlignmentMatrix(matrix: VerticalAlignmentMatrixItem[]): void {
    this.verticalAlignmentMatrix.set(matrix);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('MAM_VERTICAL_ALIGNMENT_MATRIX', JSON.stringify(matrix));
      } catch {}
    }
  }

  public addLog(log: string): void {
    console.log(`[AcademicStoreLog] ${log}`);
    this.systemLogs.update(prev => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] ${log}`]);
  }

  public setFeedback(msg: string | null, timeoutMs = 3000): void {
    this.feedbackMessage.set(msg);
    if (msg && timeoutMs > 0) {
      setTimeout(() => {
        if (this.feedbackMessage() === msg) {
          this.feedbackMessage.set(null);
        }
      }, timeoutMs);
    }
  }
}
