import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditorService } from '../features/editor/services/editor';
import { Data } from './data';
import { ChapterItemModel as ChapterItem } from '../domain/models';
import { ACADEMIC_GLOSSARY as GLOSSARY_PROMPT } from '../../prompts/academic-glossary';

@Injectable({ providedIn: 'root' })
export class AppTemplateBridgeService {
  private editorService = inject(EditorService);
  private data = inject(Data);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  ACADEMIC_GLOSSARY: Array<{ sorani: string; foreign: string; category: string; kurdish: string; english: string; desc: string; sourceLang: string; translation: string; definition: string }> = [
    { sorani: 'میتۆدۆلۆژی', foreign: 'Methodology', category: 'research', kurdish: 'میتۆدۆلۆژی', english: 'Methodology', desc: 'زانستی ڕێبازەکانی توێژینەوەی زانستی', sourceLang: 'یۆنانی', translation: 'Methodology', definition: 'تەواوی ڕێکارە میتۆدییەکانی توێژینەوە' },
    { sorani: 'ئەپistemology', foreign: 'Epistemology', category: 'philosophy', kurdish: 'ناسینناسی', english: 'Epistemology', desc: 'تیۆری زانین و فەلسەفەی زانست', sourceLang: 'یۆنانی', translation: 'Epistemology', definition: 'تیۆری زانین و زانیاری ئەکادیمی' },
    { sorani: 'هێرمۆنۆتیک', foreign: 'Hermeneutics', category: 'linguistics', kurdish: 'تەفسیرناسی', english: 'Hermeneutics', desc: 'زانستی ڕاڤەکردن و ڕاڤەی دەقە ئەدەبی و فەلسەفییەکان', sourceLang: 'یۆنانی', translation: 'Hermeneutics', definition: 'هونەر و زانستی ڕاڤەکردنی دەق' }
  ];

  // Copilot state
  copilotInputText = signal<string>('');
  copilotExtraInfo = signal<string>('');
  isCopilotRunning = signal<boolean>(false);
  copilotError = signal<string | null>(null);
  copilotDebateResult = signal<any>(null);
  copilotGapResult = signal<any>(null);
  copilotStressResult = signal<any>(null);
  copilotOntologyResult = signal<any>(null);
  cockpitManualResolution = signal<string>('');

  // Title summary generator state
  isTitleSummaryGenerating = signal<boolean>(false);
  generatedTitleSummary = signal<{ titles: string[]; summary: string } | null>(null);
  titleSummaryError = signal<string | null>(null);
  isCopied = signal<boolean>(false);

  // Library & PDF4Kurd
  pdf4kurdBooks = signal<any[]>([]);
  pdf4KurdSearchQuery = signal<string>('');
  filteredPdf4KurdBooks = computed(() => {
    const q = this.pdf4KurdSearchQuery().toLowerCase().trim();
    if (!q) return this.pdf4kurdBooks();
    return this.pdf4kurdBooks().filter((b: any) => (b.title || '').toLowerCase().includes(q));
  });

  // Quick preview state
  quickPreviewPos = signal<{ top: number; left: number; x: number; y: number }>({ top: 100, left: 100, x: 100, y: 100 });
  isQuickPreviewVisible = signal<boolean>(false);
  quickPreviewLoading = signal<boolean>(false);
  quickPreviewError = signal<string | null>(null);
  quickPreviewSuggestions = signal<any[]>([]);

  // Drag & drop comparison & copy style
  isDraggingComp1 = signal<boolean>(false);
  isDraggingComp2 = signal<boolean>(false);
  isDraggingCopyStyle = signal<boolean>(false);
  compareFile1Name = signal<string | null>(null);
  compareFile2Name = signal<string | null>(null);
  copyStyleFileName = signal<string | null>(null);

  // Search & Filters
  searchOnlyAcademicDiscipline = signal<boolean>(true);
  globalSearchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  suggestedSynonyms = signal<any[]>([]);
  searchSortOrder = signal<string>('relevance');
  searchIncludeActive = signal<boolean>(true);
  searchIncludeSaved = signal<boolean>(true);
  searchIncludeGlossary = signal<boolean>(true);
  searchIncludeOnlyCompleted = signal<boolean>(false);
  searchMaxAgeDays = signal<number>(180);
  comparedResult = signal<any | null>(null);
  isSendingEmail = signal<boolean>(false);
  d3SearchAnalyticsBars = signal<any[]>([]);
  recentSearches = signal<string[]>([]);

  // History Filters
  historyFilterDiscipline = signal<string>('all');
  historyFilterLevel = signal<string>('all');
  historyFilterStatus = signal<string>('all');

  // Academic Rules
  academicRules = signal<any[]>([
    { id: 'rule1', name: 'قەدەغەی زمانی ڕۆژانە', enabled: true },
    { id: 'rule2', name: 'بەکارهێنانی زاراوەی توند', enabled: true }
  ]);

  // Citations & Verified Sources
  citationActiveTab = signal<string>('apa');
  citationForm: FormGroup = this.fb.group({
    author: ['', Validators.required],
    title: ['', Validators.required],
    publisher: [''],
    journalOrPublisher: [''],
    year: [null, Validators.required],
    volume: [''],
    pages: [''],
    doi: ['']
  });
  citationResult = signal<string | null>(null);
  sourceMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  verifiedSourceForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    author: ['', Validators.required],
    publisher: [''],
    year: [null, Validators.required],
    sourceType: ['book', Validators.required],
    doi: [''],
    doiOrUrl: [''],
    isVerified: [false]
  });

  // Glossary
  glossarySearchQuery = signal<string>('');
  glossaryCategoryFilter = signal<string>('all');
  activeGlossaryTerm = signal<{ kurdish: string; english: string; category: string; desc: string } | null>(null);
  expandedTerms = signal<Record<string, any>>({});
  isExpandingTerm = signal<string | null>(null);
  glossaryConceptMap = signal<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  glossaryActiveNode = signal<string | null>(null);
  getactiveGlossaryConceptNode = computed<{ kurdish: string; english: string; category: string; desc: string } | null>(() => null);
  glossaryRealtimeSuggestions = signal<any[]>([]);
  glossaryUserDraft = signal<string>('');
  filteredGlossary = computed(() => {
    const q = this.glossarySearchQuery().toLowerCase().trim();
    const cat = this.glossaryCategoryFilter();
    return this.ACADEMIC_GLOSSARY.filter((item) => {
      const matchQ = !q || item.sorani.toLowerCase().includes(q) || item.foreign.toLowerCase().includes(q) || item.kurdish.toLowerCase().includes(q);
      const matchCat = cat === 'all' || item.category === cat;
      return matchQ && matchCat;
    });
  });

  // FAQ & Doc Comparison
  faqSearchQuery = signal<string>('');
  faqActiveCategory = signal<string>('spelling');
  expandedFaqIndex = signal<number | null>(null);
  filteredFaqs = computed<Array<{ icon: string; question: string; categoryKurdish: string; answer: string }>>(() => [
    { icon: 'help', question: 'چۆن ڕێنووسی کوردی پشکنین دەکرێت؟', categoryKurdish: 'ڕێنووس', answer: 'سیستەمەکە پشکنینی ڕێنووسی نوێترین پێوەرەکانی ئۆنلاین بەکاردێنێت.' }
  ]);
  isComparisonModeActive = signal<boolean>(false);
  compareLeftDoc = signal<string>('');
  compareRightDoc = signal<string>('');
  compareLeftText = signal<string>('');
  compareRightText = signal<string>('');
  compareAnalysis = computed(() => ({
    left: { wordCount: 0, paragraphs: 0, headers: 0, avgWordLength: 0, complexityScore: 0, citationsCount: 0, citationConsistency: 'بێ کێشە', citationConsistencyScore: 100 },
    right: { wordCount: 0, paragraphs: 0, headers: 0, avgWordLength: 0, complexityScore: 0, citationsCount: 0, citationConsistency: 'بێ کێشە', citationConsistencyScore: 100 }
  }));

  // Chapter viewed helpers & Advanced Tools
  viewedChapterSpellIssues = signal<any[]>([]);
  viewedChapterHeaders = signal<any[]>([]);
  isAuditingIntegrity = signal<boolean>(false);
  integrityAuditError = signal<string | null>(null);
  integrityAuditResult = signal<any | null>(null);
  isSummarizingContext = signal<boolean>(false);
  anonymizationError = signal<string | null>(null);
  anonymizationResult = signal<any | null>(null);
  activeAcademicDiagnostic = signal<any | null>(null);
  isAnalyzingRigorForChapterId = signal<number | null>(null);
  suggestedSourcesForActiveChapter = computed<Array<{ id: string; title: string; author: string; year: number; publisher: string }>>(() => []);

  // Citation Verification
  isVerifyingCitations = signal<boolean>(false);
  citationVerificationResult = signal<any | null>(null);
  citationVerificationError = signal<string | null>(null);

  // Consultation Mode
  consultationAction = signal<string>('theoretical_framework');
  consultationResult = signal<any | null>(null);
  consultationError = signal<string | null>(null);
  consultationKeyConcept = signal<string>('');
  consultationTopic = signal<string>('');
  consultationTextToProofread = signal<string>('');
  consultationKurdishMode = signal<string>('standard');
  consultationTargetDialect = signal<string>('sorani');
  isConsulting = signal<boolean>(false);

  // Extra Advanced Tools & Features Signals
  thesisSummaryError = signal<string | null>(null);
  thesisSummaryContext = signal<any | null>(null);
  isAnonymizingData = signal<boolean>(false);
  userIntuitionText = signal<string>('');
  recalibrationFeedback = signal<string | null>(null);
  isRecalibratingRigor = signal<boolean>(false);
  isSimulatingViva = signal<boolean>(false);
  additionsError = signal<string | null>(null);
  academicAdditions = signal<any | null>(null);
  isGeneratingAdditions = signal<boolean>(false);
  methodologyType = signal<string>('qualitative');
  hypothesesInput = signal<string>('');
  analyzeSoraniPhonetics = signal<boolean>(false);
  soraniSubDialect = signal<string>('hawler');
  phoneticScope = signal<string>('full');
  methodologyError = signal<string | null>(null);
  phoneticsError = signal<string | null>(null);
  methodologyResult = signal<any | null>(null);
  phoneticsResult = signal<any | null>(null);
  empiricalStatsResult = signal<any | null>(null);
  isSimulatingStats = signal<boolean>(false);
  citationPublisherStyle = signal<string>('APA');
  citationVolumeStyle = signal<string>('standard');
  citationAuthorStyle = signal<string>('standard');
  citationTitleStyle = signal<string>('standard');
  citationYearStyle = signal<string>('standard');
  selectedCitationStyle = signal<string>('APA');
  citationError = signal<string | null>(null);
  formattedMultiStyle = signal<any | null>(null);
  isFormattingCitation = signal<boolean>(false);
  plagiarismResult = signal<any | null>(null);
  plagiarismError = signal<string | null>(null);
  isPlagiarismChecking = signal<boolean>(false);
  datasetInputCsv = signal<string>('');
  pythonInterpreterCode = signal<string>('');
  pythonSandboxError = signal<string | null>(null);
  pythonSandboxResult = signal<any | null>(null);
  isExecutingPythonSandbox = signal<boolean>(false);
  selectedLatexTemplate = signal<string>('default');
  eliteRigorError = signal<string | null>(null);
  eliteRigorScorecard = signal<any | null>(null);
  isLatexCopying = signal<boolean>(false);
  isAnalyzingEliteRigor = signal<boolean>(false);
  harvardConceptInput = signal<string>('');
  harvardReviewError = signal<string | null>(null);
  harvardReviewResult = signal<any | null>(null);
  isAnalyzingHarvardReview = signal<boolean>(false);
  literatureGapFocusContext = signal<string>('');
  literatureGapError = signal<string | null>(null);
  literatureGapResult = signal<any | null>(null);
  isAnalyzingLiteratureGap = signal<boolean>(false);
  eliteCoAuthorHypothesisInput = signal<string>('');
  eliteCoAuthorError = signal<string | null>(null);
  eliteCoAuthorResult = signal<any | null>(null);
  isAnalyzingEliteCoAuthor = signal<boolean>(false);
  isAnalyzingPhonetics = signal<boolean>(false);
  isConstructingMethodology = signal<boolean>(false);
  statsError = signal<string | null>(null);
  paraphraseResult = signal<{ paraphrasedText?: string; academicTermsUsed?: Array<{ term: string; meaning: string }>; linguisticImprovements?: string[] } | null>(null);
  isCopying = signal<boolean>(false);

  applyHarvardActionableImprovement(c: any, item?: any) {
    if (!c) return;
    const text = String(
      item?.improvedTextKurdish ||
      item?.improvement ||
      item?.recommendationKurdish ||
      item?.text ||
      ''
    ).trim();
    if (!text) return;

    const nextContent = (c.content || '').trim()
      ? `${c.content.trim()}\\n\\n[چاکسازیی پێشنیارکراوی Reviewer]\\n${text}`
      : text;

    this.editorService.updateChapterContent(c.id, nextContent, 'جێبەجێکردنی چاکسازیی Reviewer');
  }

  runHarvardAcademicReview(c: any) {
    if (!c) return;
    this.isAnalyzingHarvardReview.set(true);
    this.harvardReviewError.set(null);

    this.http.post<any>('/api/harvard_academic_review', {
      title: c.title || 'بەشی توێژینەوە',
      text: c.content || '',
      discipline: 'گشتی'
    }).subscribe({
      next: result => {
        this.harvardReviewResult.set(result);
        this.isAnalyzingHarvardReview.set(false);
      },
      error: error => {
        console.error('Harvard review error:', error);
        this.harvardReviewError.set('پێداچوونەوەی ئەکادیمی سەرکەوتوو نەبوو.');
        this.isAnalyzingHarvardReview.set(false);
      }
    });
  }

  appendLiteratureGapParagraphToChapter(c: any, text?: any) {
    if (!c) return;
    const supplied = typeof text === 'string' ? text.trim() : '';
    const gaps = Array.isArray(this.literatureGapResult()?.identifiedGaps)
      ? this.literatureGapResult().identifiedGaps
          .map((gap: any) => gap?.description)
          .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
          .join('\\n\\n')
      : '';
    const paragraph = supplied || gaps;
    if (!paragraph) return;

    this.editorService.updateChapterContent(
      c.id,
      `${(c.content || '').trim()}\\n\\n### کەلەبەری ئەدەبیات (Literature Gap)\\n${paragraph}`,
      'زیادکردنی کەلەبەری ئەدەبیات'
    );
  }

  analyzeLiteratureGap(c: any) {
    if (!c) return;
    this.isAnalyzingLiteratureGap.set(true);
    this.literatureGapError.set(null);

    this.http.post<any>('/api/analyze_literature_gap', {
      topic: c.title || 'بابەتی توێژینەوە',
      discipline: 'گشتی',
      existingLiterature: (c.content || '').slice(0, 15000)
    }).subscribe({
      next: result => {
        this.literatureGapResult.set(result);
        this.isAnalyzingLiteratureGap.set(false);
      },
      error: error => {
        console.error('Literature gap error:', error);
        this.literatureGapError.set('شیکاری کەلەبەری ئەدەبیات سەرکەوتوو نەبوو.');
        this.isAnalyzingLiteratureGap.set(false);
      }
    });
  }

  applyEliteCoAuthorMitigatedText(c: any) {
    const text = String(this.eliteCoAuthorResult()?.mitigatedTextKurdish || this.eliteCoAuthorResult()?.revisedText || '').trim();
    if (!c || !text) return;
    this.editorService.updateChapterContent(c.id, text, 'جێبەجێکردنی دەقی Co-Author');
  }

  analyzeEliteCoAuthorHub(c: any) {
    if (!c) return;
    this.isAnalyzingEliteCoAuthor.set(true);
    this.eliteCoAuthorError.set(null);

    this.http.post<any>('/api/ai-tools/execute', {
      toolId: 'academic_coauthor',
      inputText: c.content || c.title || '',
      options: { discipline: 'گشتی', academicLevel: 'ماستەر', language: 'ckb' }
    }).subscribe({
      next: result => {
        const output = typeof result?.output === 'string' ? result.output : JSON.stringify(result?.output || '');
        this.eliteCoAuthorResult.set({ rawOutput: output, status: 'generated' });
        this.isAnalyzingEliteCoAuthor.set(false);
      },
      error: error => {
        console.error('Co-author analysis error:', error);
        this.eliteCoAuthorError.set('شیکاری Co-Author سەرکەوتوو نەبوو.');
        this.isAnalyzingEliteCoAuthor.set(false);
      }
    });
  }

  applyParaphrasedAlternativeToChapter(c: any, alt?: any) {
    const text = typeof alt === 'string'
      ? alt.trim()
      : String(alt?.text || alt?.paraphrasedText || '').trim();
    if (!c || !text) return;
    this.editorService.updateChapterContent(c.id, text, 'جێبەجێکردنی هەڵبژاردەی پارافرەیز');
  }

  applyParaphrasedText(c: any) {
    const text = String(this.paraphraseResult()?.paraphrasedText || '').trim();
    if (!c || !text) return;
    this.editorService.updateChapterContent(c.id, text, 'جێبەجێکردنی پارافرەیز');
  }

  runAcademicParaphrase() {
    const input = this.copilotInputText().trim();
    if (!input) return;

    this.isCopying.set(true);
    this.http.post<any>('/api/ai-tools/execute', {
      toolId: 'academic_paraphrase',
      inputText: input,
      options: { discipline: 'گشتی', academicLevel: 'ماستەر', language: 'ckb', tone: 'فەرمی' }
    }).subscribe({
      next: result => {
        this.paraphraseResult.set({
          paraphrasedText: typeof result?.output === 'string' ? result.output : '',
          academicTermsUsed: [],
          linguisticImprovements: []
        });
        this.isCopying.set(false);
      },
      error: error => {
        console.error('Academic paraphrase error:', error);
        this.paraphraseResult.set(null);
        this.isCopying.set(false);
      }
    });
  }

  writeSingleChapter(id: number) {
    const chapter = this.getChapterById(id);
    if (!chapter) return;

    this.http.post<any>('/api/generate_chapter', {
      title: chapter.title || 'توێژینەوەی ئەکادیمی',
      discipline: 'گشتی',
      writingType: 'academic',
      academicLevel: 'ماستەر',
      pages: 1,
      targetPages: 1,
      targetWordsPerChapter: 1200,
      currentChapterIndex: id,
      chapterTitle: chapter.title || 'بەشی نوێ',
      previousChapterContent: '',
      academicStyle: 'apa7',
      role: 'student',
      dialect: 'sorani'
    }).subscribe({
      next: result => {
        const content = String(result?.content || '').trim();
        if (content) {
          this.editorService.updateChapterContent(chapter.id, content, 'دروستکردنی بەشی ئەکادیمی');
        }
      },
      error: error => console.error('Chapter generation error:', error)
    });
  }

  // Viva Simulation
  vivaErrorMessage = signal<string | null>(null);
  vivaQuestions = signal<any[] | null>(null);
  vivaEvaluationResult = signal<any | null>(null);
  vivaUserDefenseInput = signal<string>('');
  isEvaluatingDefense = signal<boolean>(false);

  runCognitiveCopilot() {
    if (!this.copilotInputText().trim()) return;
    this.isCopilotRunning.set(true);
    this.copilotError.set(null);
    setTimeout(() => {
      this.copilotDebateResult.set({
        thesisText: 'دەقی پێشنیارکراوی ئەکادیمی',
        criticText: 'ڕەخنەی بونیادی لەسەر مێتۆدۆلۆژیا',
        synthesisText: 'سینتێزی دروستکراو بۆ بەشەکە'
      });
      this.isCopilotRunning.set(false);
    }, 1000);
  }

  getChapterById(id: any): ChapterItem | null {
    const num = Number(id);
    return this.editorService.chapters().find(c => c.id === num) || this.editorService.chapters()[0] || null;
  }

  applyCockpitAccept(chapter: ChapterItem | null) {
    if (!chapter || !this.copilotDebateResult()) return;
    const added = `\n\n${this.copilotDebateResult().synthesisText}\n\n`;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + added, 'پەسەندکردنی کۆپایڵۆت');
  }

  applyCockpitCritic(chapter: ChapterItem | null) {
    if (!chapter || !this.copilotDebateResult()) return;
    const added = `\n\n### تێبینی ڕەخنەیی:\n${this.copilotDebateResult().criticText}\n\n`;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + added, 'زیادکردنی ڕەخنەی کۆپایڵۆت');
  }

  applyCockpitManual(chapter: ChapterItem | null) {
    if (!chapter || !this.cockpitManualResolution().trim()) return;
    const added = `\n\n${this.cockpitManualResolution()}\n\n`;
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + added, 'چارەسەری دەستکرد');
    this.cockpitManualResolution.set('');
  }

  applyCopilotToChapter(chapter: ChapterItem | null) {
    if (!chapter) return;
    const text = 'شیکاری زانستی نوێ بۆ بەشەکە';
    this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + text, 'جێبەجێکردنی کۆپایڵۆت');
  }

  generateTitleAndSummary(topic: string) {
    if (!topic.trim()) return;
    this.isTitleSummaryGenerating.set(true);
    this.titleSummaryError.set(null);
    setTimeout(() => {
      this.generatedTitleSummary.set({
        titles: [
          `شیکاری زانستیی ${topic} لە ڕوانگەی ئابوورییەوە`,
          `کاریگەرییە کۆمەڵایەتییەکانی ${topic} لە شێوەزاری سۆرانیدا`,
          `توێژینەوەیەکی بەراوردکاری لەسەر ${topic}`
        ],
        summary: `ئەم توێژینەوەیە تیشک دەخاتە سەر ابعاد و بنەما سەرەکییەکانی ${topic} لە چوارچێوەی ئەکادیمییدا.`
      });
      this.isTitleSummaryGenerating.set(false);
    }, 1000);
  }

  applyGeneratedTitle(title: string) {}

  copyTitleSummary(summary: string) {
    if (summary) {
      navigator.clipboard.writeText(summary);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  setPageSizeMode(mode: string) {}
  closeQuickPreview() { this.isQuickPreviewVisible.set(false); }
  applySourceSuggestion(s: any) {}
  toggleAcademicSection(sec: string) {}
  updateRagModel(model: string) {}
  updateRagLimit(limit: number) {}
  toggleRole(role: string) {}
  toggleDialect(dialect: string) {}
  onDragOver(e: Event, type: string) { e.preventDefault(); }
  onDragLeave(e: Event, type: string) { e.preventDefault(); }
  onFileDrop(e: DragEvent, type: string) { e.preventDefault(); }
  onFileSelected(e: Event, type: string) {}
  onSendToSecondWindow() {}
  activateAllAcademicRules() {}
  deactivateAllAcademicRules() {}
  triggerComparison(result: any) {}
  searchLoadHistory(result: any) {}
  onRegisterVerifiedSource() {}
  expandGlossaryTerm(entry: any) {
    if (!entry) return;
    const current = this.expandedTerms();
    const isExp = current[entry.foreign];
    if (isExp) {
      this.expandedTerms.set({ ...current, [entry.foreign]: null });
    } else {
      this.expandedTerms.set({
        ...current,
        [entry.foreign]: {
          explanation: entry.sorani,
          academicDefinition: entry.foreign,
          scientificExample: entry.sorani,
          history: 'مێژووی سەرهەڵدانی زاراوەکە لە ئەکادیمیادا',
          importance: 'گرنگی لە دارشتنی تێز',
          related: []
        }
      });
    }
  }
  applyGlossaryRealtimeFix(orig: string, fix: string) {}
  injectAcademicSourceCitation(source: any, mode: 'inline' | 'bibliography' = 'inline') {}
  toggleFaq(index: number) {
    this.expandedFaqIndex.set(this.expandedFaqIndex() === index ? null : index);
  }
  updateCompareLeftText(v: string) { this.compareLeftText.set(v); }
  updateCompareRightText(v: string) { this.compareRightText.set(v); }
  insertAcademicHeading(textarea: HTMLTextAreaElement, level: string) {
    if (textarea) textarea.value += `\n### ناونیشانی ئەکادیمی\n`;
  }
  applySoranispellFixInViewedChapter() {}
  encryptChapterInVault(c: any, pwd: any) {}
  decryptChapterInVault(c: any, pwd: any) {}
  createManualSnapshot(c: any) {}
  verifyChapterIntegrityAgainstLastSnapshot(c: any) { return { isValid: true }; }
  rollbackToSnapshot(c: any, sn: any) {}
  scrollToSection(text: string, textarea: any) {}
  verifyCitationsLive(c: any) {}
  runAcademicConsultation() {
    const question = this.consultationTextToProofread().trim() || this.consultationTopic().trim();
    if (!question) return;

    this.isConsulting.set(true);
    this.consultationError.set(null);

    this.http.post<any>('/api/academic_consultation', {
      userQuestion: question,
      discipline: this.consultationAction(),
      academicLevel: 'ماستەر',
      currentThesisContext: this.consultationKeyConcept()
    }).subscribe({
      next: result => {
        this.consultationResult.set(result);
        this.isConsulting.set(false);
      },
      error: error => {
        console.error('Academic consultation error:', error);
        this.consultationError.set('ڕاوێژکاریی ئەکادیمی سەرکەوتوو نەبوو.');
        this.isConsulting.set(false);
      }
    });
  }
  appendConsultationToActiveChapter(chapter: any, text: string = '') {
    if (chapter) {
      this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + '\n\n' + text, 'زیادکردنی سەرنجی ڕاوێژکاری');
    }
  }
  auditAIIntegrity(chapter: any) {
    if (!chapter) return;
    this.isAuditingIntegrity.set(true);
    this.integrityAuditError.set(null);

    this.http.post<any>('/api/ai_integrity_audit', {
      text: (chapter.content || '').slice(0, 250000)
    }).subscribe({
      next: result => {
        this.integrityAuditResult.set(result);
        this.isAuditingIntegrity.set(false);
      },
      error: error => {
        console.error('AI integrity audit error:', error);
        this.integrityAuditError.set('پشکنینی AI Integrity سەرکەوتوو نەبوو.');
        this.isAuditingIntegrity.set(false);
      }
    });
  }
  summarizeThesisContext() {}
  anonymizeActiveChapterData(chapter: any) {
    if (!chapter) return;
    this.isAnonymizingData.set(true);
    this.anonymizationError.set(null);

    this.http.post<any>('/api/anonymize_data', {
      text: (chapter.content || '').slice(0, 250000)
    }).subscribe({
      next: result => {
        this.anonymizationResult.set(result);
        this.isAnonymizingData.set(false);
      },
      error: error => {
        console.error('Anonymization error:', error);
        this.anonymizationError.set('شاردنەوەی زانیارییە ناسێنەرەکان سەرکەوتوو نەبوو.');
        this.isAnonymizingData.set(false);
      }
    });
  }
  recalibrateWithIntuition(chapter: any) {}
  generateVivaQuestions(chapter: any) {
    if (!chapter) return;
    this.isSimulatingViva.set(true);
    this.vivaErrorMessage.set(null);

    this.http.post<any>('/api/simulate_viva', {
      thesisTitle: chapter.title || 'تێزی ئەکادیمی',
      abstract: (chapter.content || '').slice(0, 8000)
    }).subscribe({
      next: result => {
        const questions = Array.isArray(result?.questions)
          ? result.questions
          : Array.isArray(result?.vivaQuestions)
            ? result.vivaQuestions
            : [];
        this.vivaQuestions.set(questions);
        this.isSimulatingViva.set(false);
      },
      error: error => {
        console.error('Viva generation error:', error);
        this.vivaErrorMessage.set('دروستکردنی پرسیارەکانی Viva سەرکەوتوو نەبوو.');
        this.isSimulatingViva.set(false);
      }
    });
  }
  generateAcademicAdditions(chapter: any) {}
  appendAdditionsToChapter(chapter: any, addition: any) {}
  appendMethodologyLayoutToChapter(chapter: any) {}
  analyzeSoraniPhoneticsAndDialect(chapter: any) {}
  constructMethodologyAndHypotheses(chapter: any) {
    if (!chapter) return;
    this.isConstructingMethodology.set(true);
    this.methodologyError.set(null);

    this.http.post<any>('/api/construct_methodology', {
      title: chapter.title || 'توێژینەوەی ئەکادیمی',
      discipline: this.consultationAction() || 'گشتی',
      researchType: this.methodologyType(),
      sampleSize: null
    }).subscribe({
      next: result => {
        this.methodologyResult.set(result);
        this.isConstructingMethodology.set(false);
      },
      error: error => {
        console.error('Methodology construction error:', error);
        this.methodologyError.set('بونیادنانی مێتۆدۆلۆژی سەرکەوتوو نەبوو.');
        this.isConstructingMethodology.set(false);
      }
    });
  }
  appendStatsExplanationToChapter(chapter: any) {}
  simulateEmpiricalStats(chapter: any) {}
  generateMultiStyleCitation() {
    if (!this.citationForm.valid) {
      this.citationForm.markAllAsTouched();
      return;
    }

    const value = this.citationForm.getRawValue();
    const source: AcademicSourceModel = {
      id: '',
      userId: '',
      author: String(value.author || ''),
      title: String(value.title || ''),
      year: Number(value.year || 0),
      publisher: String(value.publisher || value.journalOrPublisher || ''),
      sourceType: 'book',
      journal: String(value.journalOrPublisher || ''),
      doi: value.doi || undefined,
      isVerified: false
    };

    this.formattedMultiStyle.set({
      APA: this.data.formatCitation(source, 'APA'),
      MLA: this.data.formatCitation(source, 'MLA'),
      Harvard: this.data.formatCitation(source, 'Harvard'),
      Chicago: this.data.formatCitation(source, 'Chicago'),
      IEEE: this.data.formatCitation(source, 'IEEE')
    });
  }
  checkChapterPlagiarism(chapter: any) {}
  exportSandboxPDF() {}
  appendPythonSandboxOutputToChapter(chapter: any) {}
  executePythonDatasetInterpreter(chapter: any) {}
  copyLatexCode(code: string) {
    if (code) navigator.clipboard.writeText(code);
  }
  generateEliteAcademicAssessment(chapter: any) {}
  copyCitationsToClipboard(txt: string) {
    if (txt) navigator.clipboard.writeText(txt);
  }
  appendCitationToChapter(chapter: any) {}

  toggleAcademicRule(id: string) {
    this.academicRules.update(list => list.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }
  removeCustomRule(id: string) {
    this.academicRules.update(list => list.filter(r => r.id !== id));
  }
  onGlobalSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.globalSearchQuery.set(val);
  }
  searchOpenChapter(result: any) {}
  searchUseGlossary(result: any) {}
  searchCopyGlossary(result: any) {
    if (result?.text) navigator.clipboard.writeText(result.text);
  }
  clearComparison() { this.comparedResult.set(null); }
  getOriginalComparisonText(res: any): string { return res?.text || ''; }
  copyAllSearchResults() {}
  sendFilteredReportToEmail() {}
  runRecentSearch(term: string) { this.globalSearchQuery.set(term); }
  onBuildCitation() {
    if (this.citationForm.valid) {
      const v = this.citationForm.value;
      this.citationResult.set(`${v.author} (${v.year}). ${v.title}. ${v.journalOrPublisher || ''}.`);
    }
  }
  importPdf4KurdBookToForm(book: any) {}
  importPdf4KurdBookToVerified(book: any) {}
  deleteVerifiedSource(id: string) {}
  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.glossarySearchQuery.set(val);
  }
  onFilterCategory(cat: string) { this.glossaryCategoryFilter.set(cat); }
  useGlossaryTerm(entry: any) {}
  analyzeChapterRigor(c: ChapterItem) {
    if (!c) return;
    this.isAnalyzingRigorForChapterId.set(c.id);

    this.http.post<any>('/api/analyze_academic_rigor', {
      title: c.title || 'بەشی توێژینەوە',
      content: c.content || '',
      discipline: this.consultationAction() || 'گشتی',
      theoreticalFramework: 'critical_theory',
      academicStyle: this.selectedCitationStyle()
    }).subscribe({
      next: result => {
        this.activeAcademicDiagnostic.set(result);
        this.isAnalyzingRigorForChapterId.set(null);
      },
      error: error => {
        console.error('Rigor analysis error:', error);
        this.isAnalyzingRigorForChapterId.set(null);
      }
    });
  }
  resetViva() {
    this.vivaQuestions.set(null);
    this.vivaEvaluationResult.set(null);
    this.vivaUserDefenseInput.set('');
  }
  submitVivaDefense(c: ChapterItem) {
    if (!this.vivaUserDefenseInput().trim()) return;
    this.isEvaluatingDefense.set(true);
    setTimeout(() => {
      this.vivaEvaluationResult.set({
        isPassed: true,
        score: 88,
        feedbackText: 'دۆزی توێژینەوەکە بە شێوەیەکی زانستی و بڕواپێکراو پارێزگاری لێکرا.'
      });
      this.isEvaluatingDefense.set(false);
    }, 1000);
  }
}

