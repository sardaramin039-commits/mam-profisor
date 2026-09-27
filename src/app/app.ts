import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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

import { SearchEngineComponent } from './features/search-engine/search-engine';
import { PlagiarismComponent } from './features/plagiarism/plagiarism';
import { PythonSandboxComponent } from './features/python-sandbox/python-sandbox';
import { HarvardReviewComponent } from './features/harvard-review/harvard-review';
import { EliteReviewComponent } from './features/elite-review/elite-review';
import { ResearchFeatureComponent } from './features/rag-research/research.component';
import { GlossaryComponent } from './features/glossary/glossary';
import { ExportWordComponent } from './features/export-word/export-word';
import { LatexComponent } from './features/latex/latex';
import { CitationFeatureComponent } from './features/citation-manager/citation.component';
import { VivaSimulationComponent } from './features/viva-simulation/viva-simulation';
import { LiteratureGapComponent } from './features/literature-gap/literature-gap';
import { AdvancedResearchHubComponent } from './features/advanced-research/advanced-research.component';
import { SystemMaintenancePanelComponent } from './core/components/system-maintenance-panel.component';
import { SourceVerificationComponent } from './features/citation-manager/source-verification.component';
import { GoogleDriveIntegrationComponent } from './features/google-drive/google-drive-integration';
import { GmailIntegrationComponent } from './features/gmail/gmail-integration';
import { GoogleKeepIntegrationComponent } from './features/google-keep/google-keep-integration';
import { GoogleSheetsIntegrationComponent } from './features/google-sheets/google-sheets-integration';
import { GoogleTasksIntegrationComponent } from './features/google-tasks/google-tasks-integration';
import { AiToolsSuiteComponent } from './features/ai-tools-suite/ai-tools-suite';
import { SplitViewEditorComponent } from './features/editor/components/split-view-editor.component';
import { SpeechDictationComponent } from './features/editor/components/speech-dictation.component';
import { D3ChordDiagramComponent, ChapterCrossReferenceData } from './features/d3-charts/chord-diagram.component';
import { FormalityToneControlComponent, FormalityToneConfig } from './features/editor/components/formality-tone-control.component';
import { TextLineageConnectorComponent, TextLineageNode } from './features/editor/components/text-lineage-connector.component';
import { AcademicRigorBannerComponent } from './features/editor/components/academic-rigor-banner.component';
import { KurdishAcademicEvaluatorComponent } from './features/editor/components/kurdish-academic-evaluator.component';
import { AcademicGlossaryTableComponent } from './features/glossary/academic-glossary-table.component';
import { LogicalConsistencyCheckerComponent } from './features/editor/components/logical-consistency-checker.component';
import { AutomatedBibliographyGeneratorComponent } from './features/citation-manager/components/automated-bibliography-generator.component';
import { ThesisHealthReportComponent } from './features/editor/components/thesis-health-report.component';
import { EditorPomodoroTimerComponent } from './features/editor/components/editor-pomodoro-timer.component';
import { DailyResearchPulseComponent } from './features/editor/components/daily-research-pulse.component';
import { CitationHealthCheckComponent } from './features/editor/components/citation-health-check.component';
import { ChapterTimelineViewComponent } from './features/editor/components/chapter-timeline-view.component';
import { GrammarSyntaxFloatingPanelComponent } from './features/editor/components/grammar-syntax-floating-panel.component';
import { AcademicAdditionsSidebarComponent } from './features/editor/components/academic-additions-sidebar.component';
import { ConceptGraphComponent } from './features/d3-charts/concept-graph.component';
import { GlobalToastContainerComponent } from './components/global-toast-container';
import { AppNotificationsService } from './core/app.notifications';
import { DigitalLibraryService } from './services/digital-library.service';
import { AcademicStoreService } from './services/academic-store.service';
import { ApplicationStartupService } from './core/startup';
import { AppUiActionsService } from './services/app-ui-actions.service';
import { AppEditorControllerService } from './services/app-editor-controller.service';
import { AppSearchControllerService } from './services/app-search-controller.service';
import { AppStateFacadeService } from './services/app-state-facade.service';
import { AppAcademicActions } from './helpers/app-academic-actions';

import { DEFAULT_ACADEMIC_RULES } from '../prompts/academic-rules';
import { ACADEMIC_GLOSSARY } from '../prompts/academic-glossary';
import { calculateChapterTargetWords } from './helpers/chapter-calculator';
import { calculateBookProgressSummary, BookProgressSummary } from './helpers/book-progress';
import { calculateWordValidationStatus } from './helpers/word-validation.helper';
import {
  GlossaryEntry,
  TemplateSample,
  ChapterSnapshotModel as ChapterSnapshot,
  RetrievedChunkModel as RetrievedChunk,
  ChapterItemModel as ChapterItem,
  StructureReviewResult,
  SavedManuscriptModel as SavedManuscript,
  SearchResultItem
} from './domain/models';

import { SplashScreenComponent } from './features/splash/splash-screen.component';
import { DashboardHeaderComponent } from './features/dashboard/dashboard-header.component';
import { AcademicPlatformComponent } from './features/academic-platform/academic-platform.component';
import { buildAcademicThesisOutline } from './helpers/outline-structure';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    SplashScreenComponent, DashboardHeaderComponent, AcademicPlatformComponent,
    SearchEngineComponent, PlagiarismComponent, PythonSandboxComponent,
    HarvardReviewComponent, EliteReviewComponent, ResearchFeatureComponent,
    GlossaryComponent, ExportWordComponent, LatexComponent,
    CitationFeatureComponent, VivaSimulationComponent, LiteratureGapComponent,
    AdvancedResearchHubComponent, SystemMaintenancePanelComponent, SourceVerificationComponent,
    GoogleDriveIntegrationComponent, GmailIntegrationComponent, GoogleKeepIntegrationComponent,
    GoogleSheetsIntegrationComponent, GoogleTasksIntegrationComponent, AiToolsSuiteComponent,
    SplitViewEditorComponent, SpeechDictationComponent, D3ChordDiagramComponent,
    FormalityToneControlComponent, TextLineageConnectorComponent, AcademicRigorBannerComponent,
    KurdishAcademicEvaluatorComponent, AcademicGlossaryTableComponent, LogicalConsistencyCheckerComponent,
    AutomatedBibliographyGeneratorComponent,
    ThesisHealthReportComponent, EditorPomodoroTimerComponent,
    DailyResearchPulseComponent, CitationHealthCheckComponent, ChapterTimelineViewComponent,
    GrammarSyntaxFloatingPanelComponent, AcademicAdditionsSidebarComponent, ConceptGraphComponent,
    GlobalToastContainerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly Math = Math;
  private startupService = inject(ApplicationStartupService);
  private fb = inject(FormBuilder);

  public appUiActions = inject(AppUiActionsService);
  public editorController = inject(AppEditorControllerService);
  public searchController = inject(AppSearchControllerService);
  public appStateFacade = inject(AppStateFacadeService);
  public dashboardState = inject(AppDashboardStateService);
  public bridge = inject(AppTemplateBridgeService);
  public toastService = inject(AppNotificationsService);

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
  isWritingProgress = signal<boolean>(false);
  isHumanizingProgress = signal<boolean>(false);
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
    ragModel: ['gemini-3.8-flash'], ragLimit: [5],
    temperature: [0.7], thinkingTokens: [1024], writingTokens: [4096],
    thesisDefense: [false]
  });

  ngOnInit(): void {
    this.startupService.init();

    // Keep the feature bridge synchronized with the component-owned form without
    // exposing the FormGroup itself to the service layer.
    this.bridge.setRefineFormContext(this.refineForm.getRawValue());
    this.refineForm.valueChanges.subscribe(value => {
      this.bridge.setRefineFormContext(value);
    });
  }

  updateActiveChapterContent(newContent: string) {
    const activeId = this.editorService.activeChapterId();
    if (activeId !== null) {
      this.editorService.updateChapterContent(activeId, newContent, 'چاکسازیی ڕێنوسی سۆرانی');
    } else if (this.editorService.chapters().length > 0) {
      this.editorService.updateChapterContent(this.editorService.chapters()[0].id, newContent, 'چاکسازیی ڕێنوسی سۆرانی');
    }
  }

  appendDictatedSpeechText(text: string): void {
    const active = this.activeChapter();
    if (!active) return;
    this.editorService.updateChapterContent(active.id, (active.content || '') + text, 'تۆمارکردنی دەنگی زانستی');
  }

  onInsertAcademicAddition(text: string): void {
    const active = this.activeChapter();
    if (!active) {
      this.toastService.showToast('ئاگاداری', 'تکایە سەرەتا بەشێک دەستنیشان بکە بۆ تێکردنی بڕگەکە.', 'warning', 3000);
      return;
    }
    this.editorService.updateChapterContent(active.id, (active.content || '') + text, 'زیادکردنی بڕگەی ئەکادیمی');
    this.toastService.showToast('سەرکەوتوو بوو', 'بڕگەی ئەکادیمی بە سەرکەوتوویی تێکەڵی دەقی بەشەکە کرا.', 'success', 3000);
  }

  onFormalityConfigChanged(config: FormalityToneConfig): void {
    this.selectedFormalityConfig.set(config);
  }

  onLineageParentChanged(node: TextLineageNode | null): void {
    this.selectedLineageParent.set(node);
  }

  getActiveThesisText(): string {
    const activeId = this.editorService.activeChapterId();
    if (activeId !== null) {
      return this.editorService.chapters().find(c => c.id === activeId)?.content || '';
    }
    return this.editorService.chapters()[0]?.content || '';
  }

  onDriveFileImported(file: { name: string; content: string }) {
    this.updateActiveChapterContent(file.content);
    this.mainTab.set('editor');
  }

  getChapterTargetWords(chapter: ChapterItem, list: ChapterItem[], totalWords: number): number {
    return calculateChapterTargetWords(chapter, list, totalWords);
  }

  getWordProgressPct(chapter: ChapterItem | null): number {
    if (!chapter) return 0;
    const target = this.getChapterTarget(chapter);
    if (target <= 0) return 0;
    const current = chapter.wordCount || (chapter.content ? chapter.content.trim().split(/\s+/).filter(Boolean).length : 0);
    return Math.min(200, Math.round((current / target) * 100));
  }

  getWordValidationStatus(chapter: ChapterItem | null) {
    return calculateWordValidationStatus(chapter, (ch) => this.getChapterTarget(ch));
  }

  fixAllChaptersSpelling(): void {
    const msg = this.editorController.fixAllChaptersSpelling(this.chapters(), (updated) => this.chapters.set(updated));
    if (msg) {
      this.searchFeedbackMessage.set(msg);
      setTimeout(() => this.searchFeedbackMessage.set(null), 5000);
    }
  }

  fixChapterSpelling(chapterId: number): void {
    const msg = this.editorController.fixSingleChapterSpelling(chapterId, this.chapters(), (updated) => this.chapters.set(updated));
    if (msg) {
      this.searchFeedbackMessage.set(msg);
      setTimeout(() => this.searchFeedbackMessage.set(null), 5000);
    }
  }

  updateChapterTargetWords(chapterId: number, targetWords: number) {
    if (!targetWords || targetWords <= 0) return;
    const list = [...this.chapters()];
    const idx = list.findIndex(c => c.id === chapterId);
    if (idx !== -1) {
      list[idx].customTargetWords = targetWords;
      this.chapters.set(list);
    }
  }

  applyMarginPreset(preset: '5%' | '10%' | '15%' | '1page' | '2pages') {
    const target = this.refineForm.get('targetPages')?.value || 10;
    const res = AppAcademicActions.applyMarginPreset(target, preset);
    this.refineForm.patchValue({ sizeMode: 'range', minPages: res.minPages, maxPages: res.maxPages });
  }

  getChapterHeaders(content: string) {
    return AppAcademicActions.getChapterHeaders(content);
  }

  applyTextFormatting(textarea: HTMLTextAreaElement, format: 'bold' | 'italic' | 'sub' | 'sup') {
    textarea.value = AppAcademicActions.formatTextSelection(textarea, format);
  }

  getKurdishNumberStr(index: number): string {
    return this.appUiActions.getKurdishNumberStr(index);
  }

  getSnippet(text: string, query: string, maxLength = 160): string {
    return this.appUiActions.getSnippet(text, query, maxLength);
  }

  getWordCountOfText(text: string): number {
    return this.appUiActions.getWordCountOfText(text);
  }

  saveStateLocally(): void {
    this.searchController.showFeedback('ڕەشنووسی تێزەکە بە سەرکەوتوویی لە سێرڤەری لۆکاڵیدا تۆمارکرا.');
  }

  clearEditor() {
    this.chapters.set([]);
    this.viewedChapter.set(null);
  }

  toggleAcademicDarkMode() {
    this.academicDarkMode.update(v => !v);
  }

  isManuscriptCompleted(item: any): boolean {
    return !!(item && item.chapters && item.chapters.length > 0 && item.chapters.every((c: any) => c.content && c.content.length > 100));
  }

  getChapterComplexity(c: ChapterItem) {
    return (c.content || '').length > 2000 ? 'بەرز' : 'مامناوەند';
  }

  copyToClipboard(text: string) {
    if (text) navigator.clipboard.writeText(text);
  }

  loginWithGoogle() {
    this.data.loginWithGoogle().catch((err: any) => {
      this.errorStr.set(err?.message || 'شیکردنەوە نەبوو لە هەوردا');
    });
  }

  logout() {
    this.data.logout().catch((err: any) => {
      this.errorStr.set(err?.message || 'کێشە ڕوویدا لە دەرچوون');
    });
  }

  async restoreLocalDraft() {
    const draft = await this.appStateFacade.loadDraftFromLocalStorage();
    if (draft) {
      if (draft.form) {
        this.refineForm.patchValue(draft.form);
      }
      if (draft.chapters && draft.chapters.length) {
        this.chapters.set(draft.chapters);
        this.editorService.setChapters(draft.chapters);
      }
      this.toastService.showSuccess('ڕەشنووس گەڕێندرایەوە', 'ڕەشنووسە لۆکاڵییەکەت بە سەرکەوتوویی لە مێمۆریەوە بارکرایەوە.');
    }
    this.hasLocalDraft.set(false);
  }

  discardLocalDraft() {
    this.appStateFacade.clearLocalDraft();
    this.hasLocalDraft.set(false);
    this.toastService.showInfo('ڕەشنووس سڕایەوە', 'ڕەشنووسە لۆکاڵییە پاشەکەوتکراوەکە بە تەواوی ڕەشکرایەوە.');
  }

  calibrateAuthorVoice() { this.dashboardState.calibrateAuthorVoice(); }
  selectPagePreset(pages: number) { this.refineForm.patchValue({ targetPages: pages, size: pages }); }
  onNumericInput(event: Event, field: string) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.refineForm.patchValue({ [field]: val });
  }
  toggleCustomFeature(feat: string) {
    const val = this.refineForm.get(feat)?.value;
    this.refineForm.patchValue({ [feat]: !val });
  }
  onCustomSourcesInput(event: Event, element: HTMLElement) {
    const value = String((event.target as HTMLTextAreaElement | null)?.value || '').trim().toLowerCase();
    this.bridge.quickPreviewError.set(null);

    if (!value) {
      this.bridge.quickPreviewSuggestions.set([]);
      this.bridge.isQuickPreviewVisible.set(false);
      return;
    }

    const suggestions = this.data.sourcesList()
      .filter(source => {
        const haystack = [source.title, source.author, source.publisher]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(value) || value.split(/[,;\n]+/).some(token => token.trim() && haystack.includes(token.trim()));
      })
      .slice(0, 8)
      .map(source => source.title);

    this.bridge.quickPreviewSuggestions.set(suggestions);
    this.bridge.isQuickPreviewVisible.set(true);
    this.onCustomSourcesClick(element);
  }

  onCustomSourcesClick(element: HTMLElement) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    this.bridge.quickPreviewPos.set({
      top: Math.max(8, rect.bottom + window.scrollY),
      left: Math.max(8, rect.left + window.scrollX),
      x: rect.left,
      y: rect.top
    });
    this.bridge.isQuickPreviewVisible.set(true);
  }
  addCustomRule(input: HTMLInputElement) { if (input) input.value = ''; }
  loadHistoryItem(item: any) {
    if (!item) return;
    if (item.title) this.refineForm.patchValue({ title: item.title });
    if (item.chapters?.length) {
      this.chapters.set(item.chapters);
      this.editorService.setChapters(item.chapters);
    }
    this.toastService.showSuccess('تێز بارکرا', `تێزی "${item.title || 'بێ ناونیشان'}" بە سەرکەوتوویی بارکرایەوە ناو سەرنووسەر.`);
  }
  deleteHistoryItem(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.data.deleteHistoryItem(id);
    this.toastService.showWarning('تێز سڕایەوە', 'توێژینەوەکە لە مێژووی هەورەکە سڕایەوە.');
  }
  openChapterPreview(c: ChapterItem) { this.viewedChapter.set(c); }
  insertMythologicalSynthesisToChapter(c: ChapterItem, myth: any) { this.dashboardState.insertMythologicalSynthesisToChapter(c, myth); }
  toggleChunkUsage(id: string) { this.dashboardState.toggleChunkUsage(id); }
  verifyChunkSource(chunk: any) { this.dashboardState.verifyChunkSource(chunk); }

  runCognitiveCopilot() { this.bridge.runCognitiveCopilot(); }
  getChapterById(id: any) { return this.bridge.getChapterById(id); }
  applyCockpitAccept(c: any) { this.bridge.applyCockpitAccept(c); }
  applyCockpitCritic(c: any) { this.bridge.applyCockpitCritic(c); }
  applyCockpitManual(c: any) { this.bridge.applyCockpitManual(c); }
  applyCopilotToChapter(c: any) { this.bridge.applyCopilotToChapter(c); }
  generateTitleAndSummary(topic: string) { this.bridge.generateTitleAndSummary(topic); }
  applyGeneratedTitle(t: string) { if (t) this.refineForm.patchValue({ title: t }); }
  copyTitleSummary(summary: string) { this.bridge.copyTitleSummary(summary); }
  setPageSizeMode(mode: string) {
    const value = String(mode || '').trim();
    if (value && this.refineForm.contains('sizeMode')) {
      this.refineForm.patchValue({ sizeMode: value });
    }
  }
  closeQuickPreview() { this.bridge.closeQuickPreview(); }
  applySourceSuggestion(s: any) { this.bridge.applySourceSuggestion(s); }
  toggleAcademicSection(sec: string) {
    if (!this.refineForm.contains(sec)) return;
    const current = this.refineForm.get(sec)?.value;
    this.refineForm.patchValue({ [sec]: !current });
  }
  updateRagModel(m: string) { this.bridge.updateRagModel(m); }
  updateRagLimit(l: number) { this.bridge.updateRagLimit(l); }
  toggleRole(role: string) {
    const key = role === 'author' ? 'roleAuthor' : role === 'critic' ? 'roleCritic' : role === 'reviewer' ? 'roleReviewer' : '';
    if (!key) return;
    const current = this.refineForm.get(key)?.value === true;
    this.refineForm.patchValue({ [key]: !current });
  }
  toggleDialect(d: string) {
    const key = d === 'thesis' ? 'dialectThesis' : d === 'antithesis' ? 'dialectAntithesis' : d === 'synthesis' ? 'dialectSynthesis' : '';
    if (!key) return;
    const current = this.refineForm.get(key)?.value === true;
    this.refineForm.patchValue({ [key]: !current });
  }
  onDragOver(e: Event, type: string) { this.bridge.onDragOver(e, type); }
  onDragLeave(e: Event, type: string) { this.bridge.onDragLeave(e, type); }
  onFileDrop(e: DragEvent, type: string) { this.bridge.onFileDrop(e, type); }
  onFileSelected(e: Event, type: string) { this.bridge.onFileSelected(e, type); }
  onSendToSecondWindow() {
    const val = this.refineForm.value;
    const title = (val.title || '').trim();
    if (!title) {
      this.toastService.showToast('ئاگاداری', 'تکایە سەرەتا ناونیشانی تێز یان توێژینەوەکەت بنووسە.', 'warning', 3500);
      return;
    }
    const newChapters = buildAcademicThesisOutline({
      title,
      discipline: val.discipline,
      writingType: val.writingType,
      academicLevel: val.academicLevel,
      targetPages: val.targetPages || val.size || 10,
      includeDedication: val.includeDedication,
      includeIntro: val.includeIntro,
      includeTOC: val.includeTOC,
      includeConclusion: val.includeConclusion,
      includeRecommendations: val.includeRecommendations,
      includeReferences: val.includeReferences
    });
    this.chapters.set(newChapters);
    this.editorService.setChapters(newChapters);
    if (newChapters.length > 0) {
      this.editorService.activeChapterId.set(newChapters[0].id);
    }
    this.activeSubTab.set('editor');
    this.toastService.showSuccess('پێکهاتەی بەشەکان ڕێکخرا', `بە سەرکەوتوویی ${newChapters.length} بەشی ئەکادیمی بۆ ناونیشانی «${title}» لە پەنجەرەی دووەم جێگیرکران.`);
    // Scroll window 2 into view gracefully
    if (typeof window !== 'undefined') {
      const w2 = document.getElementById('window-2-section');
      if (w2) {
        w2.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
  activateAllAcademicRules() { this.bridge.activateAllAcademicRules(); }
  deactivateAllAcademicRules() { this.bridge.deactivateAllAcademicRules(); }
  triggerComparison(r: any) { this.bridge.triggerComparison(r); }
  searchLoadHistory(r: any) { this.bridge.searchLoadHistory(r); }
  onRegisterVerifiedSource() { this.bridge.onRegisterVerifiedSource(); }
  expandGlossaryTerm(entry: any) { this.bridge.expandGlossaryTerm(entry); }
  applyGlossaryRealtimeFix(orig: string, fix: string) { this.bridge.applyGlossaryRealtimeFix(orig, fix); }
  toggleAcademicRule(id: string) { this.bridge.toggleAcademicRule(id); }
  removeCustomRule(id: string) { this.bridge.removeCustomRule(id); }
  onGlobalSearchInput(e: Event) { this.bridge.onGlobalSearchInput(e); }
  searchOpenChapter(r: any) { this.bridge.searchOpenChapter(r); }
  searchUseGlossary(r: any) { this.bridge.searchUseGlossary(r); }
  searchCopyGlossary(r: any) { this.bridge.searchCopyGlossary(r); }
  clearComparison() { this.bridge.clearComparison(); }
  getOriginalComparisonText(r: any) { return this.bridge.getOriginalComparisonText(r); }
  copyAllSearchResults() { this.bridge.copyAllSearchResults(); }
  sendFilteredReportToEmail() { this.bridge.sendFilteredReportToEmail(); }
  runRecentSearch(t: string) { this.bridge.runRecentSearch(t); }
  onBuildCitation() { this.bridge.onBuildCitation(); }
  importPdf4KurdBookToForm(b: any) { this.bridge.importPdf4KurdBookToForm(b); }
  importPdf4KurdBookToVerified(b: any) { this.bridge.importPdf4KurdBookToVerified(b); }
  deleteVerifiedSource(id: string) { this.bridge.deleteVerifiedSource(id); }
  injectAcademicSourceCitation(source: any, mode?: any) { this.bridge.injectAcademicSourceCitation(source, mode); }
  onSearchChange(e: Event) { this.bridge.onSearchChange(e); }
  onFilterCategory(cat: string) { this.bridge.onFilterCategory(cat); }
  useGlossaryTerm(entry: any) { this.bridge.useGlossaryTerm(entry); }
  toggleFaq(idx: number) { this.bridge.toggleFaq(idx); }
  reviewStructure() { this.dashboardState.calibrateAuthorVoice(); }
  autoWrite() { this.bridge.runCognitiveCopilot(); }
  autoHumanize() { this.bridge.runCognitiveCopilot(); }
  saveAll() { this.saveStateLocally(); }
  closeChapterPreview() { this.viewedChapter.set(null); }
  updateCompareLeftText(v: string) { this.bridge.updateCompareLeftText(v); }
  updateCompareRightText(v: string) { this.bridge.updateCompareRightText(v); }
  insertAcademicHeading(textarea: HTMLTextAreaElement, level: string) { this.bridge.insertAcademicHeading(textarea, level); }
  updateChapterContent(id: number, content: string, msg?: string) {
    this.editorService.updateChapterContent(id, content, msg || 'تۆمارکردنی گۆڕانکاری');
  }
  applySoranispellFixInViewedChapter() { this.bridge.applySoranispellFixInViewedChapter(); }
  encryptChapterInVault(c: any, pwd: any) { this.bridge.encryptChapterInVault(c, pwd); }
  decryptChapterInVault(c: any, pwd: any) { this.bridge.decryptChapterInVault(c, pwd); }
  createManualSnapshot(c: any) { this.bridge.createManualSnapshot(c); }
  verifyChapterIntegrityAgainstLastSnapshot(c: any) { return this.bridge.verifyChapterIntegrityAgainstLastSnapshot(c); }
  rollbackToSnapshot(c: any, sn: any) { this.bridge.rollbackToSnapshot(c, sn); }
  scrollToSection(text: string, textarea: any) { this.bridge.scrollToSection(text, textarea); }
  verifyCitationsLive(c: any) { this.bridge.verifyCitationsLive(c); }
  runAcademicConsultation() { this.bridge.runAcademicConsultation(); }
  appendConsultationToActiveChapter(c: any, text: string = '') { this.bridge.appendConsultationToActiveChapter(c, text); }
  auditAIIntegrity(chapter: any) { this.bridge.auditAIIntegrity(chapter); }
  summarizeThesisContext() { this.bridge.summarizeThesisContext(); }
  anonymizeActiveChapterData(chapter: any) { this.bridge.anonymizeActiveChapterData(chapter); }
  recalibrateWithIntuition(chapter: any) { this.bridge.recalibrateWithIntuition(chapter); }
  generateVivaQuestions(chapter: any) { this.bridge.generateVivaQuestions(chapter); }
  generateAcademicAdditions(chapter: any) { this.bridge.generateAcademicAdditions(chapter); }
  appendAdditionsToChapter(chapter: any, addition: any) { this.bridge.appendAdditionsToChapter(chapter, addition); }
  appendMethodologyLayoutToChapter(chapter: any) { this.bridge.appendMethodologyLayoutToChapter(chapter); }
  analyzeSoraniPhoneticsAndDialect(chapter: any) { this.bridge.analyzeSoraniPhoneticsAndDialect(chapter); }
  constructMethodologyAndHypotheses(chapter: any) { this.bridge.constructMethodologyAndHypotheses(chapter); }
  appendStatsExplanationToChapter(chapter: any) { this.bridge.appendStatsExplanationToChapter(chapter); }
  simulateEmpiricalStats(chapter: any) { this.bridge.simulateEmpiricalStats(chapter); }
  applyHarvardActionableImprovement(c: any, item?: any) { this.bridge.applyHarvardActionableImprovement(c, item); }
  runHarvardAcademicReview(c: any) { this.bridge.runHarvardAcademicReview(c); }
  appendLiteratureGapParagraphToChapter(c: any, text?: any) { this.bridge.appendLiteratureGapParagraphToChapter(c, text); }
  analyzeLiteratureGap(c: any) { this.bridge.analyzeLiteratureGap(c); }
  applyEliteCoAuthorMitigatedText(c: any) { this.bridge.applyEliteCoAuthorMitigatedText(c); }
  analyzeEliteCoAuthorHub(c: any) { this.bridge.analyzeEliteCoAuthorHub(c); }
  applyParaphrasedAlternativeToChapter(c: any, alt?: any) { this.bridge.applyParaphrasedAlternativeToChapter(c, alt); }
  applyParaphrasedText(c: any) { this.bridge.applyParaphrasedText(c); }
  runAcademicParaphrase() { this.bridge.runAcademicParaphrase(); }
  writeSingleChapter(id: number) { this.bridge.writeSingleChapter(id); }
  generateMultiStyleCitation() { this.bridge.generateMultiStyleCitation(); }
  checkChapterPlagiarism(chapter: any) { this.bridge.checkChapterPlagiarism(chapter); }
  exportSandboxPDF() { this.bridge.exportSandboxPDF(); }
  appendPythonSandboxOutputToChapter(chapter: any) { this.bridge.appendPythonSandboxOutputToChapter(chapter); }
  executePythonDatasetInterpreter(chapter: any) { this.bridge.executePythonDatasetInterpreter(chapter); }
  copyLatexCode(code: string) { this.bridge.copyLatexCode(code); }
  generateEliteAcademicAssessment(chapter: any) { this.bridge.generateEliteAcademicAssessment(chapter); }
  copyCitationsToClipboard(txt: string) { this.bridge.copyCitationsToClipboard(txt); }
  appendCitationToChapter(chapter: any) { this.bridge.appendCitationToChapter(chapter); }
  analyzeChapterRigor(c: any) { this.bridge.analyzeChapterRigor(c); }
  resetViva() { this.bridge.resetViva(); }
  submitVivaDefense(c: any) { this.bridge.submitVivaDefense(c); }
}
