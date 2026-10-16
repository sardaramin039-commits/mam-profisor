import { Directive, signal, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Data } from './services/data';
import { EditorService } from './features/editor/services/editor';
import { AiAssistantService } from './features/ai-assistant/services/ai-assistant';
import { RagResearchService } from './features/rag-research/services/rag-research';
import { PdfProcessorService } from './features/pdf-processor/services/pdf-processor';
import { CitationManagerService } from './features/citation-manager/services/citation-manager';
import { SettingsService } from './features/settings/services/settings';
import { AnalyticsService } from './services/analytics';
import { WordExportService } from './services/word-export';
import { PlagiarismService } from './services/plagiarism';
import { PythonSandboxService } from './services/python-sandbox';
import { ReviewsService } from './services/reviews';
import { GlossaryService } from './services/glossary';
import { LatexService } from './services/latex';
import { SearchService } from './services/search';
import { AppDashboardStateService } from './services/app-dashboard-state.service';
import { AppTemplateBridgeService } from './services/app-template-bridge.service';
import { FormalityToneConfig } from './features/editor/components/formality-tone-control.component';
import { TextLineageNode } from './features/editor/components/text-lineage-connector.component';
import { AppNotificationsService } from './core/app.notifications';
import { BottomDockActionsService } from './services/bottom-dock-actions.service';
import { DigitalLibraryService } from './services/digital-library.service';
import { AcademicStoreService } from './services/academic-store.service';
import { ApplicationStartupService } from './core/startup';
import { AppUiActionsService } from './services/app-ui-actions.service';
import { AppEditorControllerService } from './services/app-editor-controller.service';
import { AppSearchControllerService } from './services/app-search-controller.service';
import { AppStateFacadeService } from './services/app-state-facade.service';
import { ACADEMIC_GLOSSARY } from '../prompts/academic-glossary';
import { calculateBookProgressSummary, BookProgressSummary } from './helpers/book-progress';
import { ChapterItemModel as ChapterItem, StructureReviewResult } from './domain/models';
import { calculateChapterTargetWords } from './helpers/chapter-calculator';
import { EditorFocusModeService } from './services/editor-focus-mode.service';
import { EditorSyncFeedbackService } from './services/editor-sync-feedback.service';

@Directive()
export abstract class AppControllerBase implements OnInit {

  readonly Math = Math;
  readonly view = this;
  private startupService = inject(ApplicationStartupService);
  private fb = inject(FormBuilder);

  public appUiActions = inject(AppUiActionsService);
  public editorController = inject(AppEditorControllerService);
  public searchController = inject(AppSearchControllerService);
  public appStateFacade = inject(AppStateFacadeService);
  public dashboardState = inject(AppDashboardStateService);
  public bridge = inject(AppTemplateBridgeService);
  public toastService = inject(AppNotificationsService);
  public bottomDockActions = inject(BottomDockActionsService);

  copilotInputText = this.bridge.copilotInputText; copilotExtraInfo = this.bridge.copilotExtraInfo;
  isCopilotRunning = this.bridge.isCopilotRunning; copilotError = this.bridge.copilotError;
  copilotDebateResult = this.bridge.copilotDebateResult; copilotGapResult = this.bridge.copilotGapResult;
  copilotStressResult = this.bridge.copilotStressResult; copilotOntologyResult = this.bridge.copilotOntologyResult;
  cockpitManualResolution = this.bridge.cockpitManualResolution;
  isTitleSummaryGenerating = this.bridge.isTitleSummaryGenerating; generatedTitleSummary = this.bridge.generatedTitleSummary;
  titleSummaryError = this.bridge.titleSummaryError; isCopied = this.bridge.isCopied;
  pdf4kurdBooks = this.bridge.pdf4kurdBooks; pdf4KurdSearchQuery = this.bridge.pdf4KurdSearchQuery; filteredPdf4KurdBooks = this.bridge.filteredPdf4KurdBooks;
  quickPreviewLoading = this.bridge.quickPreviewLoading; quickPreviewError = this.bridge.quickPreviewError; quickPreviewSuggestions = this.bridge.quickPreviewSuggestions;
  isDraggingComp1 = this.bridge.isDraggingComp1; isDraggingComp2 = this.bridge.isDraggingComp2; isDraggingCopyStyle = this.bridge.isDraggingCopyStyle;
  compareFile1Name = this.bridge.compareFile1Name; compareFile2Name = this.bridge.compareFile2Name; copyStyleFileName = this.bridge.copyStyleFileName;
  searchOnlyAcademicDiscipline = this.bridge.searchOnlyAcademicDiscipline; globalSearchQuery = this.bridge.globalSearchQuery;
  searchResults = this.bridge.searchResults; suggestedSynonyms = this.bridge.suggestedSynonyms;
  searchSortOrder = this.bridge.searchSortOrder; searchIncludeActive = this.bridge.searchIncludeActive;
  searchIncludeSaved = this.bridge.searchIncludeSaved; searchIncludeGlossary = this.bridge.searchIncludeGlossary;
  searchIncludeOnlyCompleted = this.bridge.searchIncludeOnlyCompleted; searchMaxAgeDays = this.bridge.searchMaxAgeDays;
  comparedResult = this.bridge.comparedResult; isSendingEmail = this.bridge.isSendingEmail;
  d3SearchAnalyticsBars = this.bridge.d3SearchAnalyticsBars; recentSearches = this.bridge.recentSearches;
  historyFilterDiscipline = this.bridge.historyFilterDiscipline; historyFilterLevel = this.bridge.historyFilterLevel; historyFilterStatus = this.bridge.historyFilterStatus;
  academicRules = this.bridge.academicRules; citationActiveTab = this.bridge.citationActiveTab;
  citationForm = this.bridge.citationForm; citationResult = this.bridge.citationResult; sourceMessage = this.bridge.sourceMessage;
  verifiedSourceForm = this.bridge.verifiedSourceForm; glossarySearchQuery = this.bridge.glossarySearchQuery;
  glossaryCategoryFilter = this.bridge.glossaryCategoryFilter; expandedTerms = this.bridge.expandedTerms;
  isExpandingTerm = this.bridge.isExpandingTerm;
  glossaryConceptMap = this.bridge.glossaryConceptMap; glossaryActiveNode = this.bridge.glossaryActiveNode;
  getactiveGlossaryConceptNode = this.bridge.getactiveGlossaryConceptNode;
  glossaryRealtimeSuggestions = this.bridge.glossaryRealtimeSuggestions; glossaryUserDraft = this.bridge.glossaryUserDraft;
  filteredGlossary = this.bridge.filteredGlossary; faqActiveCategory = this.bridge.faqActiveCategory;
  faqSearchQuery = this.bridge.faqSearchQuery;
  expandedFaqIndex = this.bridge.expandedFaqIndex; filteredFaqs = this.bridge.filteredFaqs;
  isComparisonModeActive = this.bridge.isComparisonModeActive; compareLeftDoc = this.bridge.compareLeftDoc;
  compareRightDoc = this.bridge.compareRightDoc; compareLeftText = this.bridge.compareLeftText;
  compareRightText = this.bridge.compareRightText; compareAnalysis = this.bridge.compareAnalysis;
  viewedChapterSpellIssues = this.bridge.viewedChapterSpellIssues; viewedChapterHeaders = this.bridge.viewedChapterHeaders;
  isAuditingIntegrity = this.bridge.isAuditingIntegrity; integrityAuditError = this.bridge.integrityAuditError;
  integrityAuditResult = this.bridge.integrityAuditResult; isSummarizingContext = this.bridge.isSummarizingContext;
  anonymizationError = this.bridge.anonymizationError; anonymizationResult = this.bridge.anonymizationResult;
  activeAcademicDiagnostic = this.bridge.activeAcademicDiagnostic; isAnalyzingRigorForChapterId = this.bridge.isAnalyzingRigorForChapterId;
  suggestedSourcesForActiveChapter = this.bridge.suggestedSourcesForActiveChapter;
  isVerifyingCitations = this.bridge.isVerifyingCitations; citationVerificationResult = this.bridge.citationVerificationResult;
  citationVerificationError = this.bridge.citationVerificationError;
  consultationAction = this.bridge.consultationAction; consultationResult = this.bridge.consultationResult;
  consultationError = this.bridge.consultationError; consultationKeyConcept = this.bridge.consultationKeyConcept;
  consultationTopic = this.bridge.consultationTopic; consultationTextToProofread = this.bridge.consultationTextToProofread;
  consultationKurdishMode = this.bridge.consultationKurdishMode; consultationTargetDialect = this.bridge.consultationTargetDialect;
  isConsulting = this.bridge.isConsulting;
  thesisSummaryError = this.bridge.thesisSummaryError; thesisSummaryContext = this.bridge.thesisSummaryContext;
  isAnonymizingData = this.bridge.isAnonymizingData; userIntuitionText = this.bridge.userIntuitionText;
  recalibrationFeedback = this.bridge.recalibrationFeedback; isRecalibratingRigor = this.bridge.isRecalibratingRigor;
  isSimulatingViva = this.bridge.isSimulatingViva; additionsError = this.bridge.additionsError;
  academicAdditions = this.bridge.academicAdditions; isGeneratingAdditions = this.bridge.isGeneratingAdditions;
  methodologyType = this.bridge.methodologyType; hypothesesInput = this.bridge.hypothesesInput;
  analyzeSoraniPhonetics = this.bridge.analyzeSoraniPhonetics; soraniSubDialect = this.bridge.soraniSubDialect;
  phoneticScope = this.bridge.phoneticScope; methodologyError = this.bridge.methodologyError;
  phoneticsError = this.bridge.phoneticsError; methodologyResult = this.bridge.methodologyResult;
  phoneticsResult = this.bridge.phoneticsResult; empiricalStatsResult = this.bridge.empiricalStatsResult;
  isSimulatingStats = this.bridge.isSimulatingStats; citationPublisherStyle = this.bridge.citationPublisherStyle;
  citationVolumeStyle = this.bridge.citationVolumeStyle; selectedCitationStyle = this.bridge.selectedCitationStyle;
  citationError = this.bridge.citationError; formattedMultiStyle = this.bridge.formattedMultiStyle;
  plagiarismResult = this.bridge.plagiarismResult; isPlagiarismChecking = this.bridge.isPlagiarismChecking;
  activeGlossaryTerm = this.bridge.activeGlossaryTerm;
  isAnalyzingHarvardReview = this.bridge.isAnalyzingHarvardReview;
  literatureGapFocusContext = this.bridge.literatureGapFocusContext;
  literatureGapError = this.bridge.literatureGapError;
  literatureGapResult = this.bridge.literatureGapResult;
  isAnalyzingLiteratureGap = this.bridge.isAnalyzingLiteratureGap;
  eliteCoAuthorHypothesisInput = this.bridge.eliteCoAuthorHypothesisInput;
  eliteCoAuthorError = this.bridge.eliteCoAuthorError;
  eliteCoAuthorResult = this.bridge.eliteCoAuthorResult;
  isAnalyzingEliteCoAuthor = this.bridge.isAnalyzingEliteCoAuthor;
  paraphraseResult = this.bridge.paraphraseResult;
  isCopying = this.bridge.isCopying;
  datasetInputCsv = this.bridge.datasetInputCsv; pythonInterpreterCode = this.bridge.pythonInterpreterCode;
  pythonSandboxError = this.bridge.pythonSandboxError; pythonSandboxResult = this.bridge.pythonSandboxResult;
  isExecutingPythonSandbox = this.bridge.isExecutingPythonSandbox; selectedLatexTemplate = this.bridge.selectedLatexTemplate;
  eliteRigorError = this.bridge.eliteRigorError; eliteRigorScorecard = this.bridge.eliteRigorScorecard;
  isLatexCopying = this.bridge.isLatexCopying; isAnalyzingEliteRigor = this.bridge.isAnalyzingEliteRigor;
  harvardConceptInput = this.bridge.harvardConceptInput; harvardReviewError = this.bridge.harvardReviewError;
  harvardReviewResult = this.bridge.harvardReviewResult; isAnalyzingPhonetics = this.bridge.isAnalyzingPhonetics;
  isConstructingMethodology = this.bridge.isConstructingMethodology; statsError = this.bridge.statsError;
  citationAuthorStyle = this.bridge.citationAuthorStyle; citationTitleStyle = this.bridge.citationTitleStyle;
  citationYearStyle = this.bridge.citationYearStyle; isFormattingCitation = this.bridge.isFormattingCitation;
  plagiarismError = this.bridge.plagiarismError;
  vivaErrorMessage = this.bridge.vivaErrorMessage; vivaQuestions = this.bridge.vivaQuestions;
  vivaEvaluationResult = this.bridge.vivaEvaluationResult; vivaUserDefenseInput = this.bridge.vivaUserDefenseInput;
  isEvaluatingDefense = this.bridge.isEvaluatingDefense; ACADEMIC_GLOSSARY = this.bridge.ACADEMIC_GLOSSARY;

  d3ComplexityBars = this.dashboardState.d3ComplexityBars; d3KurdishTimeline = this.dashboardState.d3KurdishTimeline;
  selectedMythId = this.dashboardState.selectedMythId; mythComparisons = this.dashboardState.mythComparisons;
  userVoiceSampleText = this.dashboardState.userVoiceSampleText; calibrationError = this.dashboardState.calibrationError;
  calibratedVoiceProfile = this.dashboardState.calibratedVoiceProfile; isCalibratingVoice = this.dashboardState.isCalibratingVoice;
  copilotActiveTab = this.dashboardState.copilotActiveTab; pageRangeWords = this.dashboardState.pageRangeWords;
  autoBreakdownAnalysis = this.dashboardState.autoBreakdownAnalysis; isQuickPreviewVisible = this.dashboardState.isQuickPreviewVisible;
  quickPreviewPos = this.dashboardState.quickPreviewPos; filteredHistoryList = this.dashboardState.filteredHistoryList;
  filteredRetrievedChunks = this.dashboardState.filteredRetrievedChunks;

  public digitalLibraryService = inject(DigitalLibraryService);
  public academicStoreService = inject(AcademicStoreService);
  public editorService = inject(EditorService);
  public aiAssistantService = inject(AiAssistantService);
  public ragResearchService = inject(RagResearchService);
  public pdfProcessorService = inject(PdfProcessorService);
  public citationManagerService = inject(CitationManagerService);
  public settingsService = inject(SettingsService);
  public analyticsService = inject(AnalyticsService);
  public wordExportService = inject(WordExportService);
  public plagiarismService = inject(PlagiarismService);
  public pythonSandboxService = inject(PythonSandboxService);
  public reviewsService = inject(ReviewsService);
  public glossaryService = inject(GlossaryService);
  public latexService = inject(LatexService);
  public searchService = inject(SearchService);
  public data = inject(Data);
  public editorFocusMode = inject(EditorFocusModeService);
  public editorSyncFeedback = inject(EditorSyncFeedbackService);
  isFocusMode = this.editorFocusMode.isFocusMode;
  toggleFocusMode = () => this.editorFocusMode.toggleFocusMode();
  exitFocusMode = () => this.editorFocusMode.exitFocusMode();

  // Core navigation view state
  viewMode = signal<'splash' | 'workspace'>('splash');
  mainTab = signal<'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive' | 'platform'>('editor');
  isSettingsOpen = signal<boolean>(false);
  isAdminOpen = signal<boolean>(false);
  isBookmarksOpen = signal<boolean>(false);
  isReadingModeOpen = signal<boolean>(false);
  activeSubTab = signal<'editor' | 'review' | 'glossary' | 'citations' | 'chunks' | 'pulse' | 'health_check' | 'timeline' | 'grammar_panel'>('editor');
  sources = this.academicStoreService.sources;

  // Title and Active Chapter State
  manuscriptTitle = computed(() => this.refineForm?.get('title')?.value || 'تێزی ئەکادیمی');
  activeChapter = computed(() => {
    const activeId = this.editorService.activeChapterId();
    if (activeId !== null) {
      return this.editorService.chapters().find(c => c.id === activeId) || null;
    }
    return this.editorService.chapters()[0] || null;
  });

  selectedFormalityConfig = signal<FormalityToneConfig>({ formalityLevel: 'strictly_formal', depthLevel: 'deep_analysis' });
  selectedLineageParent = signal<TextLineageNode | null>(null);

  chapterCrossData = this.dashboardState.chapterCrossData;
  dashboardManuscriptSummary = this.dashboardState.dashboardManuscriptSummary;

  currentUser = this.data.currentUser;
  historyList = this.data.historyList;
  isHistoryLoading = this.data.isHistoryLoading;
  isFirebaseSaving = this.data.isFirebaseSaving;

  academicDarkMode = signal<boolean>(false);
  chapters = signal<ChapterItem[]>([]);
  activeReview = signal<StructureReviewResult | null>(null);
  isReviewingStructure = signal<boolean>(false);
  isWritingProgress = signal<boolean>(false);
  isHumanizingProgress = signal<boolean>(false);
  isExportingWord = signal<boolean>(false);
  isSingleWritingProgress = signal<number | null>(null);
  viewedChapter = signal<ChapterItem | null>(null);

  hasLocalDraft = signal<boolean>(false);
  lastAutoSaveTime = signal<string>('');
  searchFeedbackMessage = signal<string | null>(null);
  errorStr = signal<string | null>(null);

  // Paraphrasing and Copilot state signals
  academicParaphraseInput = signal<string>('');
  academicParaphraseDiscipline = signal<string>('general');
  academicParaphraseTone = signal<string>('formal');
  isParaphrasing = signal<boolean>(false);
  paraphraseError = signal<string | null>(null);
  semanticDBResults = signal<any>(null);

  getChapterTargetWords(chapter: ChapterItem, list: ChapterItem[], totalWords: number): number {
    return calculateChapterTargetWords(chapter, list, totalWords);
  }

  getChapterTarget(c: ChapterItem | null): number {
    if (!c) return 0;
    const list = this.chapters();
    const totalPages = this.refineForm?.get('targetPages')?.value || this.refineForm?.get('size')?.value || 10;
    return this.getChapterTargetWords(c, list, totalPages * 350);
  }

  targetWordsPerChapter = computed(() => {
    const list = this.chapters();
    if (list.length === 0) return 0;
    const totalPages = Math.max(1, this.refineForm?.get('targetPages')?.value || this.refineForm?.get('size')?.value || 10);
    return Math.round((totalPages * 350) / (list.length || 1));
  });

  bookProgressSummary = computed<BookProgressSummary>(() => {
    const list = this.chapters();
    const targetPages = this.refineForm?.get('targetPages')?.value || this.refineForm?.get('size')?.value || 10;
    return calculateBookProgressSummary(list, targetPages, (c) => this.getChapterTarget(c));
  });

  refineForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    discipline: ['humanities', Validators.required],
    writingType: ['book', Validators.required],
    academicLevel: ['bachelor', Validators.required],
    taskGoal: ['writing'],
    writingStyle: ['academic'],
    aiPersona: ['scholar'],
    academicStyle: ['chicago'],
    sourceFilter: ['all'],
    sizeMode: ['target', Validators.required],
    size: [10, [Validators.required, Validators.min(1)]],
    targetPages: [10, [Validators.required, Validators.min(1)]],
    minPages: [9, [Validators.required, Validators.min(1)]],
    maxPages: [11, [Validators.required, Validators.min(1)]],
    selectedBook: [''],
    roleAuthor: [true], roleCritic: [false], roleReviewer: [false],
    dialectThesis: [true], dialectAntithesis: [false], dialectSynthesis: [false],
    copyStyleText: [''], compareFile1: [''], compareFile2: [''], compareAspect: [''],
    customSourcesOn: [false], customSourcesText: [''],
    fieldWorkOn: [false], fieldWorkText: [''],
    customTOCOn: [false], customTOCText: [''],
    includeDedication: [true], includeIntro: [true], includeTOC: [true],
    includeConclusion: [true], includeRecommendations: [true], includeReferences: [true],
    thesisStructureType: ['humanities'],
    ragModel: ['gemini-3.1-pro-preview'], ragLimit: [8],
    temperature: [0.7], thinkingTokens: [2048], writingTokens: [8192],
    thesisDefense: [false]
  });


  ngOnInit(): void {
    this.bridge.refineForm = this.refineForm;
    this.startupService.init();
  }

}
