import { Injectable, signal, computed, inject } from '@angular/core';
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

  applyHarvardActionableImprovement(c: any, item?: any) {}
  runHarvardAcademicReview(c: any) {}
  appendLiteratureGapParagraphToChapter(c: any, text?: any) {}
  analyzeLiteratureGap(c: any) {}
  applyEliteCoAuthorMitigatedText(c: any) {}
  analyzeEliteCoAuthorHub(c: any) {}
  applyParaphrasedAlternativeToChapter(c: any, alt?: any) {}
  applyParaphrasedText(c: any) {}
  runAcademicParaphrase() {}
  writeSingleChapter(id: number) {}

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
    this.isConsulting.set(true);
    setTimeout(() => {
      this.consultationResult.set('ئامۆژگاری و دەرئەنجامی ڕاوێژکاری ئەکادیمی');
      this.isConsulting.set(false);
    }, 800);
  }
  appendConsultationToActiveChapter(chapter: any, text: string = '') {
    if (chapter) {
      this.editorService.updateChapterContent(chapter.id, (chapter.content || '') + '\n\n' + text, 'زیادکردنی سەرنجی ڕاوێژکاری');
    }
  }
  auditAIIntegrity(chapter: any) {}
  summarizeThesisContext() {}
  anonymizeActiveChapterData(chapter: any) {}
  recalibrateWithIntuition(chapter: any) {}
  generateVivaQuestions(chapter: any) {}
  generateAcademicAdditions(chapter: any) {}
  appendAdditionsToChapter(chapter: any, addition: any) {}
  appendMethodologyLayoutToChapter(chapter: any) {}
  analyzeSoraniPhoneticsAndDialect(chapter: any) {}
  constructMethodologyAndHypotheses(chapter: any) {}
  appendStatsExplanationToChapter(chapter: any) {}
  simulateEmpiricalStats(chapter: any) {}
  generateMultiStyleCitation() {}
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
  analyzeChapterRigor(c: ChapterItem) {}
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

