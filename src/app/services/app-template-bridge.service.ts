import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditorService } from '../features/editor/services/editor';
import { Data } from './data';
import { ChapterItemModel as ChapterItem } from '../domain/models';
import { ACADEMIC_GLOSSARY as GLOSSARY_PROMPT } from '../../prompts/academic-glossary';
import { AuthenticatedApiService } from '../core/services/authenticated-api.service';
import { encryptText, decryptText, verifyChapterIntegrity } from '../helpers/academic-vault';

@Injectable({ providedIn: 'root' })
export class AppTemplateBridgeService {
  private editorService = inject(EditorService);
  private data = inject(Data);
  private fb = inject(FormBuilder);
  private api = inject(AuthenticatedApiService);

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
    year: [new Date().getFullYear(), Validators.required],
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
    year: [new Date().getFullYear(), Validators.required],
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
    if (!c || !item) return;
    const text = typeof item === 'string' ? item : item.improvedText || item.replacement || item.text || '';
    if (!text) return;
    this.editorService.updateChapterContent(
      c.id,
      text,
      'جێبەجێکردنی چاکسازیی پێداچوونەوەی ئەکادیمی'
    );
  }

  runHarvardAcademicReview(c: any) {
    if (!c?.content?.trim()) return;
    this.isAnalyzingHarvardReview.set(true);
    this.harvardReviewError.set(null);
    this.api.post<any>('/api/harvard_academic_review', {
      title: c.title || this.refineForm.get('title')?.value || 'تێزی ئەکادیمی',
      text: c.content,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی'
    }).then(result => {
      this.harvardReviewResult.set(result);
    }).catch(error => {
      console.error('Harvard review request failed:', error);
      this.harvardReviewError.set('پێداچوونەوەی هارڤەرد سەرکەوتوو نەبوو.');
    }).finally(() => {
      this.isAnalyzingHarvardReview.set(false);
    });
  }

  appendLiteratureGapParagraphToChapter(c: any, text?: any) {
    if (!c || !text || !String(text).trim()) return;
    this.editorService.updateChapterContent(
      c.id,
      (c.content || '') + '\n\n' + String(text).trim(),
      'زیادکردنی پەرەگرافی بۆشایی ئەدەبیات'
    );
  }

  analyzeLiteratureGap(c: any) {
    if (!c?.content?.trim()) return;
    this.isAnalyzingLiteratureGap.set(true);
    this.literatureGapError.set(null);
    this.api.post<any>('/api/analyze_literature_gap', {
      topic: c.title || this.refineForm.get('title')?.value || 'تێزی ئەکادیمی',
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      existingLiterature: this.refineForm.get('customSourcesText')?.value || ''
    }).then(result => {
      this.literatureGapResult.set(result);
    }).catch(error => {
      console.error('Literature gap request failed:', error);
      this.literatureGapError.set('شیکاریی بۆشایی ئەدەبیات سەرکەوتوو نەبوو.');
    }).finally(() => {
      this.isAnalyzingLiteratureGap.set(false);
    });
  }

  applyEliteCoAuthorMitigatedText(c: any) {
    const result = this.eliteCoAuthorResult();
    const text = result?.mitigatedText || result?.revisedText || result?.content;
    if (!c || !text) return;
    this.editorService.updateChapterContent(c.id, String(text), 'جێبەجێکردنی دەقی چاککراوی هاونوسەر');
  }

  analyzeEliteCoAuthorHub(c: any) {
    if (!c?.content?.trim()) return;
    this.isAnalyzingEliteCoAuthor.set(true);
    this.eliteCoAuthorError.set(null);
    this.api.post<any>('/api/ai_peer_review', {
      title: c.title || this.refineForm.get('title')?.value || 'تێزی ئەکادیمی',
      text: c.content,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی'
    }).then(result => {
      this.eliteCoAuthorResult.set(result);
    }).catch(error => {
      console.error('Peer review request failed:', error);
      this.eliteCoAuthorError.set('پێداچوونەوەی هاونوسەر سەرکەوتوو نەبوو.');
    }).finally(() => {
      this.isAnalyzingEliteCoAuthor.set(false);
    });
  }

  applyParaphrasedAlternativeToChapter(c: any, alt?: any) {
    const text = typeof alt === 'string' ? alt : alt?.paraphrasedText || alt?.text;
    if (!c || !text) return;
    this.editorService.updateChapterContent(c.id, String(text), 'جێبەجێکردنی هەڵبژاردەی پارافرەیز');
  }

  applyParaphrasedText(c: any) {
    const text = this.paraphraseResult()?.paraphrasedText;
    if (!c || !text) return;
    this.editorService.updateChapterContent(c.id, text, 'جێبەجێکردنی پارافرەیزی ئەکادیمی');
  }

  runAcademicParaphrase() {
    const chapter = this.getChapterById(this.editorService.activeChapterId());
    const content = chapter?.content?.trim();
    if (!content) return;
    this.isCopying.set(true);
    this.paraphraseResult.set(null);
    this.api.post<any>('/api/refine', {
      text: content,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      tone: 'academic',
      goal: 'پارافرەیزی زانستی'
    }).then(result => {
      this.paraphraseResult.set({
        paraphrasedText: result?.refinedText || result?.content || '',
        academicTermsUsed: result?.terminology || [],
        linguisticImprovements: result?.academicNotes || []
      });
    }).catch(error => {
      console.error('Academic paraphrase request failed:', error);
      this.paraphraseResult.set(null);
    }).finally(() => {
      this.isCopying.set(false);
    });
  }

  writeSingleChapter(id: number) {
    const chapter = this.editorService.chapters().find(c => c.id === id);
    if (!chapter) return;
    const value = this.refineForm.value;
    this.editorService.activeChapterId.set(id);
    this.api.post<any>('/api/generate_chapter', {
      title: value.title,
      discipline: value.discipline,
      writingType: value.writingType,
      academicLevel: value.academicLevel,
      pages: value.size,
      sizeMode: value.sizeMode,
      minPages: value.minPages,
      maxPages: value.maxPages,
      targetPages: value.targetPages,
      totalWordsCount: value.targetPages * 350,
      minWordsCount: value.minPages * 350,
      maxWordsCount: value.maxPages * 350,
      targetWordsPerChapter: this.editorService.calculateChapterTargetWords(
        chapter.title,
        value.targetPages * 350,
        this.editorService.chapters().length
      ),
      currentChapterIndex: Math.max(0, this.editorService.chapters().findIndex(c => c.id === id)),
      chapterTitle: chapter.title,
      previousChapterContent: '',
      role: 'scholar',
      dialect: value.dialectThesis ? 'sorani' : 'standard',
      copyStyleText: value.copyStyleText,
      temperature: value.temperature,
      thesisDefense: value.thesisDefense,
      thinkingTokens: value.thinkingTokens,
      writingTokens: value.writingTokens,
      humanizeMode: false,
      compareAspect: value.compareAspect,
      compareFile1: value.compareFile1,
      compareFile2: value.compareFile2,
      activeRules: this.academicRules().filter(r => r.enabled).map(r => r.name),
      academicStyle: value.academicStyle,
      customSourcesOn: value.customSourcesOn,
      customSourcesText: value.customSourcesText,
      customTOCOn: value.customTOCOn,
      customTOCText: value.customTOCText,
      fieldWorkOn: value.fieldWorkOn,
      fieldWorkText: value.fieldWorkText,
      selectedBook: value.selectedBook
    }).then(result => {
      const content = String(result?.content || '').trim();
      if (!content) throw new Error('هیچ ناوەڕۆکێک لەلایەن سێرڤەرەوە نەگەڕێندرایەوە.');
      this.editorService.updateChapterContent(
        id,
        content,
        'نووسینی ڕاستەوخۆی بەش لە سێرڤەر'
      );
    }).catch(error => {
      console.error('Single chapter generation failed:', error);
    });
  }

  // Viva Simulation
  vivaErrorMessage = signal<string | null>(null);
  vivaQuestions = signal<any[] | null>(null);
  vivaEvaluationResult = signal<any | null>(null);
  vivaUserDefenseInput = signal<string>('');
  isEvaluatingDefense = signal<boolean>(false);

  runCognitiveCopilot() {
    const topic = this.copilotInputText().trim();
    if (!topic) return;

    this.isCopilotRunning.set(true);
    this.copilotError.set(null);
    const chapter = this.getChapterById(this.editorService.activeChapterId() || 0);

    this.api.post<any>('/api/multi-agent/orchestrate', {
      topic,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      draftText: chapter?.content || this.copilotExtraInfo().trim(),
      rawSources: this.data.sourcesList().map(source => ({
        title: source.title,
        author: source.author,
        year: String(source.year),
        publisher: source.publisher,
        doi: source.doi,
        isbn: source.isbn
      }))
    }).then(result => {
      this.copilotDebateResult.set({
        thesisText: result?.thesisStructurePlan?.thesisStatement || '',
        criticText: result?.reviewerReport?.summaryCritiqueKurdish || '',
        synthesisText: result?.finalThesisDraftKurdish || ''
      });
      this.copilotGapResult.set(result?.qaGateResult || null);
    }).catch(error => {
      console.error('Cognitive Copilot request failed:', error);
      this.copilotError.set('کۆپایڵۆتی زانستی لەم کاتەدا بەردەست نییە.');
      this.copilotDebateResult.set(null);
    }).finally(() => {
      this.isCopilotRunning.set(false);
    });
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

  applyGeneratedTitle(title: string) {
    const value = String(title || '').trim();
    if (value) this.refineForm.patchValue({ title: value });
  }

  copyTitleSummary(summary: string) {
    if (summary) {
      navigator.clipboard.writeText(summary);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  setPageSizeMode(mode: string) {
    const value = String(mode || '').trim();
    if (value) this.refineForm.patchValue({ sizeMode: value });
  }
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
  activateAllAcademicRules() {
    this.academicRules.update(rules => rules.map(rule => ({ ...rule, enabled: true })));
  }
  deactivateAllAcademicRules() {
    this.academicRules.update(rules => rules.map(rule => ({ ...rule, enabled: false })));
  }
  triggerComparison(result: any) {
    this.comparedResult.set(result || null);
    this.isComparisonModeActive.set(!!result);
  }
  searchLoadHistory(result: any) {
    if (!result) return;
    this.globalSearchQuery.set(String(result.title || result.query || '').trim());
  }
  onRegisterVerifiedSource() {}
  expandGlossaryTerm(entry: any) {
    if (!entry?.foreign) return;
    const key = String(entry.foreign);

    if (this.expandedTerms()[key]) {
      const current = { ...this.expandedTerms() };
      delete current[key];
      this.expandedTerms.set(current);
      return;
    }

    this.isExpandingTerm.set(key);
    this.api.post<any>('/api/expand_glossary_term', {
      term: key,
      definition: entry.definition || entry.desc || '',
      category: entry.category || 'گشتی'
    }).then(result => {
      this.expandedTerms.set({ ...this.expandedTerms(), [key]: result });
    }).catch(error => {
      console.error('Glossary expansion failed:', error);
      this.expandedTerms.set({
        ...this.expandedTerms(),
        [key]: { error: 'فراوانکردنی زاراوە لەم کاتەدا بەردەست نییە.' }
      });
    }).finally(() => {
      this.isExpandingTerm.set(null);
    });
  }
  applyGlossaryRealtimeFix(orig: string, fix: string) {
    const chapter = this.getChapterById(this.editorService.activeChapterId() || 0);
    const from = String(orig || '');
    const to = String(fix || '');
    if (!chapter || !from || !to) return;
    this.editorService.updateChapterContent(
      chapter.id,
      (chapter.content || '').split(from).join(to),
      'چاککردنی ڕێنووسی زاراوە'
    );
  }
  injectAcademicSourceCitation(source: any, mode: 'inline' | 'bibliography' = 'inline') {
    if (!source?.title) return;
    const author = String(source.author || 'نادیار').trim();
    const year = source.year ? String(source.year).trim() : '';
    const title = String(source.title).trim();
    const citation = mode === 'bibliography'
      ? `${author}. (${year}). ${title}. ${source.publisher || ''}.`
      : `(${author}, ${year})`;
    const chapter = this.getChapterById(this.editorService.activeChapterId() || 0);
    if (!chapter) return;
    this.editorService.updateChapterContent(
      chapter.id,
      (chapter.content || '') + ` ${citation}`,
      'زیادکردنی ئاماژەی سەرچاوە'
    );
  }
  toggleFaq(index: number) {
    this.expandedFaqIndex.set(this.expandedFaqIndex() === index ? null : index);
  }
  updateCompareLeftText(v: string) { this.compareLeftText.set(v); }
  updateCompareRightText(v: string) { this.compareRightText.set(v); }
  insertAcademicHeading(textarea: HTMLTextAreaElement, level: string) {
    if (textarea) textarea.value += `\n### ناونیشانی ئەکادیمی\n`;
  }
  applySoranispellFixInViewedChapter() {}
  async encryptChapterInVault(c: any, pwd: any) {
    if (!c || c.isEncryptedInVault || !String(pwd || '').trim()) return;
    try {
      const encrypted = await encryptText(String(c.content || ''), String(pwd));
      this.editorService.updateChapterContent(c.id, encrypted, 'شەپۆلی AES-GCM بۆ Vault');
      this.editorService.chapters.update(list =>
        list.map(ch => ch.id === c.id ? { ...ch, isEncryptedInVault: true } : ch)
      );
      this.sourceMessage.set({ type: 'success', text: 'ناوەڕۆکی بەش بە AES-GCM پارێزرا.' });
    } catch (error) {
      console.error('Vault encryption failed:', error);
      this.sourceMessage.set({ type: 'error', text: 'پاراستنی Vault سەرکەوتوو نەبوو.' });
    }
  }
  async decryptChapterInVault(c: any, pwd: any) {
    if (!c || !c.isEncryptedInVault || !String(pwd || '').trim()) return;
    try {
      const decrypted = await decryptText(String(c.content || ''), String(pwd));
      this.editorService.updateChapterContent(c.id, decrypted, 'کردنەوەی AES-GCM لە Vault');
      this.editorService.chapters.update(list =>
        list.map(ch => ch.id === c.id ? { ...ch, isEncryptedInVault: false } : ch)
      );
      this.sourceMessage.set({ type: 'success', text: 'ناوەڕۆکی Vault بە سەرکەوتوویی کرایەوە.' });
    } catch (error) {
      console.error('Vault decryption failed:', error);
      this.sourceMessage.set({ type: 'error', text: 'وشەی نهێنی هەڵەیە یان داتاکە دەستکاری کراوە.' });
    }
  }
  createManualSnapshot(c: any) {
    if (!c) return;
    const content = String(c.content || '');
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const snapshot = {
      timestamp: new Date().toISOString(),
      content,
      wordCount,
      trigger: 'Manual Snapshot'
    };
    this.editorService.updateChapterSnapshots(c.id, [snapshot, ...(c.snapshots || []).slice(0, 19)]);
  }
  verifyChapterIntegrityAgainstLastSnapshot(c: any) {
    if (!c) return { isValid: false, currentHash: '', expectedHash: '' };
    return verifyChapterIntegrity(c);
  }
  rollbackToSnapshot(c: any, sn: any) {
    if (!c || !sn || typeof sn.content !== 'string') return;
    this.editorService.updateChapterContent(c.id, sn.content, 'گەڕانەوە بۆ snapshot');
  }
  scrollToSection(text: string, textarea: any) {}
  verifyCitationsLive(c: any) {}
  runAcademicConsultation() {
    const question = (this.consultationTopic() || this.consultationKeyConcept() || '').trim();
    if (!question) return;

    this.isConsulting.set(true);
    this.consultationError.set(null);
    this.api.post<any>('/api/academic_consultation', {
      userQuestion: question,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      academicLevel: this.refineForm.get('academicLevel')?.value || 'ماستەر',
      currentThesisContext: this.consultationTextToProofread()
    }).then(result => {
      this.consultationResult.set(result);
    }).catch(error => {
      console.error('Academic consultation failed:', error);
      this.consultationError.set('ڕاوێژکاریی ئەکادیمی لەم کاتەدا بەردەست نییە.');
      this.consultationResult.set(null);
    }).finally(() => {
      this.isConsulting.set(false);
    });
  }
  appendConsultationToActiveChapter(chapter: any, text: string = '') {
    if (chapter) {
      this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + '\n\n' + text, 'زیادکردنی سەرنجی ڕاوێژکاری');
    }
  }
  auditAIIntegrity(chapter: any) {
    if (!chapter?.content?.trim()) return;
    this.isAuditingIntegrity.set(true);
    this.integrityAuditError.set(null);
    this.api.post<any>('/api/ai_integrity_audit', {
      text: chapter.content
    }).then(result => {
      this.integrityAuditResult.set(result);
    }).catch(error => {
      console.error('AI integrity audit failed:', error);
      this.integrityAuditError.set('پشکنینی AI Integrity لەم کاتەدا بەردەست نییە.');
      this.integrityAuditResult.set(null);
    }).finally(() => {
      this.isAuditingIntegrity.set(false);
    });
  }
  summarizeThesisContext() {}
  anonymizeActiveChapterData(chapter: any) {
    if (!chapter?.content?.trim()) return;
    this.isAnonymizingData.set(true);
    this.anonymizationError.set(null);
    this.api.post<any>('/api/anonymize_data', {
      text: chapter.content
    }).then(result => {
      this.anonymizationResult.set(result);
    }).catch(error => {
      console.error('Anonymize data failed:', error);
      this.anonymizationError.set('شاردنەوەی زانیاریی کەسی لەم کاتەدا بەردەست نییە.');
      this.anonymizationResult.set(null);
    }).finally(() => {
      this.isAnonymizingData.set(false);
    });
  }
  recalibrateWithIntuition(chapter: any) {}
  generateVivaQuestions(chapter: any) {
    if (!chapter?.content?.trim()) return;
    this.isSimulatingViva.set(true);
    this.vivaErrorMessage.set(null);
    this.api.post<any>('/api/simulate_viva', {
      thesisTitle: chapter.title || this.refineForm.get('title')?.value || 'تێزی ئەکادیمی',
      abstract: chapter.content.slice(0, 5000)
    }).then(result => {
      this.vivaQuestions.set(result?.questions || result?.vivaQuestions || result);
    }).catch(error => {
      console.error('Viva generation failed:', error);
      this.vivaErrorMessage.set('دروستکردنی پرسیارەکانی Viva لەم کاتەدا بەردەست نییە.');
      this.vivaQuestions.set(null);
    }).finally(() => {
      this.isSimulatingViva.set(false);
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
    this.api.post<any>('/api/construct_methodology', {
      title: chapter.title || this.refineForm.get('title')?.value || 'توێژینەوە',
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      researchType: this.methodologyType(),
      sampleSize: this.hypothesesInput().trim() || undefined
    }).then(result => {
      this.methodologyResult.set(result);
    }).catch(error => {
      console.error('Methodology construction failed:', error);
      this.methodologyError.set('بونیادنانی مێتۆدۆلۆژی لەم کاتەدا بەردەست نییە.');
      this.methodologyResult.set(null);
    }).finally(() => {
      this.isConstructingMethodology.set(false);
    });
  }
  appendStatsExplanationToChapter(chapter: any) {}
  simulateEmpiricalStats(chapter: any) {}
  generateMultiStyleCitation() {}
  checkChapterPlagiarism(chapter: any) {
    if (!chapter?.content?.trim()) return;
    this.isPlagiarismChecking.set(true);
    this.plagiarismError.set(null);
    this.api.post<any>('/api/plagiarism_check', {
      content: chapter.content,
      title: chapter.title
    }).then(result => {
      this.plagiarismResult.set(result);
    }).catch(error => {
      console.error('Chapter plagiarism check failed:', error);
      this.plagiarismError.set('پشکنینی هاوشێوەیی لەم کاتەدا بەردەست نییە.');
      this.plagiarismResult.set(null);
    }).finally(() => {
      this.isPlagiarismChecking.set(false);
    });
  }
  exportSandboxPDF() {}
  appendPythonSandboxOutputToChapter(chapter: any) {}
  executePythonDatasetInterpreter(chapter: any) {}
  copyLatexCode(code: string) {
    if (code) navigator.clipboard.writeText(code);
  }
  generateEliteAcademicAssessment(chapter: any) {
    if (!chapter?.content?.trim()) return;
    this.isAnalyzingEliteRigor.set(true);
    this.eliteRigorError.set(null);
    this.api.post<any>('/api/elite_academic_assessment', {
      title: chapter.title || this.refineForm.get('title')?.value || 'تێزی ئەکادیمی',
      content: chapter.content,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      academicLevel: this.refineForm.get('academicLevel')?.value || 'ماستەر'
    }).then(result => {
      this.eliteRigorScorecard.set(result);
    }).catch(error => {
      console.error('Elite assessment failed:', error);
      this.eliteRigorError.set('هەڵسەنگاندنی ئەکادیمی لەم کاتەدا بەردەست نییە.');
      this.eliteRigorScorecard.set(null);
    }).finally(() => {
      this.isAnalyzingEliteRigor.set(false);
    });
  }
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
    if (!c?.content?.trim()) return;
    this.isAnalyzingRigorForChapterId.set(c.id);
    this.api.post<any>('/api/analyze_academic_rigor', {
      title: c.title,
      content: c.content,
      discipline: this.refineForm.get('discipline')?.value || 'گشتی',
      theoreticalFramework: this.refineForm.get('theoreticalFramework')?.value || 'critical_theory',
      academicStyle: this.refineForm.get('academicStyle')?.value || 'harvard'
    }).then(result => {
      this.activeAcademicDiagnostic.set(result);
    }).catch(error => {
      console.error('Chapter rigor analysis failed:', error);
      this.activeAcademicDiagnostic.set({
        error: 'پشکنینی قووڵی ئاستی ئەکادیمی لەم کاتەدا بەردەست نییە.'
      });
    }).finally(() => {
      this.isAnalyzingRigorForChapterId.set(null);
    });
  }
  resetViva() {
    this.vivaQuestions.set(null);
    this.vivaEvaluationResult.set(null);
    this.vivaUserDefenseInput.set('');
  }
  submitVivaDefense(c: ChapterItem) {
    const answer = this.vivaUserDefenseInput().trim();
    const questions = this.vivaQuestions();
    const question = Array.isArray(questions) && questions.length > 0
      ? String(questions[0]?.question || questions[0]?.text || questions[0])
      : '';

    if (!answer || !question) {
      this.vivaErrorMessage.set('پێش هەڵسەنگاندن، دەبێت پرسیارێکی Viva و وەڵامی توێژەر هەبێت.');
      return;
    }

    this.isEvaluatingDefense.set(true);
    this.vivaErrorMessage.set(null);
    this.api.post<any>('/api/evaluate_viva_defense', {
      thesisTitle: c.title || this.refineForm.get('title')?.value || 'تێزی ئەکادیمی',
      chapterContext: c.content || '',
      question,
      answer,
      academicLevel: this.refineForm.get('academicLevel')?.value || 'ماستەر'
    }).then(result => {
      this.vivaEvaluationResult.set(result);
    }).catch(error => {
      console.error('Viva defense evaluation failed:', error);
      this.vivaEvaluationResult.set(null);
      this.vivaErrorMessage.set('هەڵسەنگاندنی وەڵامی Viva لەم کاتەدا بەردەست نییە.');
    }).finally(() => {
      this.isEvaluatingDefense.set(false);
    });
  }
}

