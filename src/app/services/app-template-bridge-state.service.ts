import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditorService } from '../features/editor/services/editor';
import { Data } from './data';
import { ChapterItemModel as ChapterItem } from '../domain/models';
import { ACADEMIC_GLOSSARY as GLOSSARY_PROMPT } from '../../prompts/academic-glossary';
import { DEFAULT_ACADEMIC_RULES, AcademicRule } from '../../prompts/academic-rules';
import { CitationBuilder, CitationItem } from '../helpers/citation-builder';

import { createSnapshotHash } from './app-template-bridge.utils';

@Injectable({ providedIn: 'root' })
export class AppTemplateBridgeStateService {
  protected editorService = inject(EditorService);
  protected data = inject(Data);
  protected fb = inject(FormBuilder);
  protected http = inject(HttpClient);
  refineForm?: FormGroup;

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
  generatedTitleSummary = signal<{ titles: string[]; summary: string; status?: 'generated' | 'degraded' | 'title-only' } | null>(null);
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
  academicRules = signal<AcademicRule[]>([...DEFAULT_ACADEMIC_RULES]);

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

}
