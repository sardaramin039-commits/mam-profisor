import { Injectable, signal, inject } from '@angular/core';
import {
  AcademicSourceItem,
  FactCheckResult,
  MultiAgentResponse,
  PeerReviewReport,
  PlagiarismAnalysisReport,
  CitationValidationReport,
  OcrExtractionResult
} from '../../../../helpers/academic-integrations';
import {
  ZoteroItem,
  OrcidProfile,
  GoogleScholarMetadata,
  DoiResolutionResult,
  IsbnLookupResult,
  IssnLookupResult,
  ResearchTimelineNode,
  MindMapNode,
  ResearchOutline,
  AcademicTableData,
  AcademicFigureData,
  JournalMetricsResult,
  AuthorHIndexResult,
  WritingTemplateItem
} from '../../../../helpers/extended-academic-tools';
import {
  AiDebateResult,
  FactVsOpinionResult,
  ClaimVerificationResult,
  CitationQualityResult,
  AiBookWriterResult,
  AiThesisWriterResult,
  AiProfessorReviewResult,
  AiExamGeneratorResult,
  AiPresentationSlide,
  AiStudyPlannerResult,
  TableExtractorResult,
  AcademicReferenceItem,
  ProfessorModeLevel,
  ResearchMemoryState
} from '../models/multi-agent.types';
import { ResearchApiClientService } from './research-api-client.service';
import { loadResearchMemoryFromStorage, saveResearchMemoryToStorage } from '../helpers/research-memory.helper';

export * from '../models/multi-agent.types';

@Injectable({
  providedIn: 'root'
})
export class MultiAgentService {
  private api = inject(ResearchApiClientService);

  readonly professorMode = signal<ProfessorModeLevel>('ماستەر');
  readonly researchMemory = signal<ResearchMemoryState>(loadResearchMemoryFromStorage());

  readonly isLoadingPipeline = signal<boolean>(false);
  readonly pipelineResult = signal<MultiAgentResponse | null>(null);
  readonly pipelineError = signal<string | null>(null);
  readonly isFactChecking = signal<boolean>(false);
  readonly factCheckResult = signal<FactCheckResult | null>(null);
  readonly isSearchingAPIs = signal<boolean>(false);
  readonly searchSources = signal<AcademicSourceItem[]>([]);
  readonly averageConfidenceScore = signal<number>(0);
  readonly isProcessingOcr = signal<boolean>(false);
  readonly ocrResult = signal<OcrExtractionResult | null>(null);
  readonly isPeerReviewing = signal<boolean>(false);
  readonly peerReviewResult = signal<PeerReviewReport | null>(null);
  readonly isCheckingPlagiarism = signal<boolean>(false);
  readonly plagiarismResult = signal<PlagiarismAnalysisReport | null>(null);
  readonly isValidatingCitations = signal<boolean>(false);
  readonly citationValidationResult = signal<CitationValidationReport | null>(null);
  readonly isSyncingZotero = signal<boolean>(false);
  readonly zoteroItems = signal<ZoteroItem[]>([]);
  readonly isFetchingOrcid = signal<boolean>(false);
  readonly orcidProfile = signal<OrcidProfile | null>(null);
  readonly isSearchingScholar = signal<boolean>(false);
  readonly scholarResults = signal<GoogleScholarMetadata[]>([]);
  readonly isResolvingDoi = signal<boolean>(false);
  readonly doiResult = signal<DoiResolutionResult | null>(null);
  readonly isLookingUpIsbn = signal<boolean>(false);
  readonly isbnResult = signal<IsbnLookupResult | null>(null);
  readonly isLookingUpIssn = signal<boolean>(false);
  readonly issnResult = signal<IssnLookupResult | null>(null);
  readonly isGeneratingTimeline = signal<boolean>(false);
  readonly timelineResult = signal<ResearchTimelineNode[]>([]);
  readonly isGeneratingMindMap = signal<boolean>(false);
  readonly mindMapResult = signal<MindMapNode | null>(null);
  readonly isGeneratingOutline = signal<boolean>(false);
  readonly outlineResult = signal<ResearchOutline | null>(null);
  readonly isGeneratingTableFigure = signal<boolean>(false);
  readonly tableResult = signal<AcademicTableData | null>(null);
  readonly figureResult = signal<AcademicFigureData | null>(null);
  readonly isFindingJournals = signal<boolean>(false);
  readonly journalResults = signal<JournalMetricsResult[]>([]);
  readonly isLookingUpHIndex = signal<boolean>(false);
  readonly authorHIndexResult = signal<AuthorHIndexResult | null>(null);
  readonly writingTemplates = signal<WritingTemplateItem[]>([]);
  readonly isRunningDebate = signal<boolean>(false);
  readonly debateResult = signal<AiDebateResult | null>(null);
  readonly isDetectingFactOpinion = signal<boolean>(false);
  readonly factOpinionResult = signal<FactVsOpinionResult | null>(null);
  readonly isVerifyingClaim = signal<boolean>(false);
  readonly claimResult = signal<ClaimVerificationResult | null>(null);
  readonly isEvaluatingCitationQuality = signal<boolean>(false);
  readonly citationQualityResult = signal<CitationQualityResult | null>(null);
  readonly isAskingResearchAssistant = signal<boolean>(false);
  readonly researchAssistantAnswer = signal<string>('');
  readonly isWritingBook = signal<boolean>(false);
  readonly bookResult = signal<AiBookWriterResult | null>(null);
  readonly isWritingThesis = signal<boolean>(false);
  readonly thesisResult = signal<AiThesisWriterResult | null>(null);
  readonly isReviewingProfessor = signal<boolean>(false);
  readonly professorReviewResult = signal<AiProfessorReviewResult | null>(null);
  readonly isGeneratingExam = signal<boolean>(false);
  readonly examResult = signal<AiExamGeneratorResult | null>(null);
  readonly isGeneratingPresentation = signal<boolean>(false);
  readonly presentationSlides = signal<AiPresentationSlide[]>([]);
  readonly isGeneratingStudyPlanner = signal<boolean>(false);
  readonly studyPlannerResult = signal<AiStudyPlannerResult | null>(null);
  readonly isChattingPdf = signal<boolean>(false);
  readonly pdfChatAnswer = signal<string>('');
  readonly isExtractingTable = signal<boolean>(false);
  readonly extractedTableResult = signal<TableExtractorResult | null>(null);
  readonly isFindingReferences = signal<boolean>(false);
  readonly referenceFinderResults = signal<AcademicReferenceItem[]>([]);

  setProfessorMode(mode: ProfessorModeLevel) {
    this.professorMode.set(mode);
  }

  updateProjectTitle(title: string) {
    this.researchMemory.update(m => ({ ...m, projectTitle: title, lastUpdated: new Date().toISOString() }));
    this.saveMemoryToStorage();
  }

  addHypothesis(hypothesis: string) {
    if (!hypothesis.trim()) return;
    this.researchMemory.update(m => ({ ...m, hypotheses: [...m.hypotheses, hypothesis.trim()], lastUpdated: new Date().toISOString() }));
    this.saveMemoryToStorage();
  }

  removeHypothesis(index: number) {
    this.researchMemory.update(m => ({ ...m, hypotheses: m.hypotheses.filter((_, i) => i !== index), lastUpdated: new Date().toISOString() }));
    this.saveMemoryToStorage();
  }

  addNote(note: string) {
    if (!note.trim()) return;
    this.researchMemory.update(m => ({ ...m, notes: [note.trim(), ...m.notes], lastUpdated: new Date().toISOString() }));
    this.saveMemoryToStorage();
  }

  runMultiAgentPipeline(topic: string) {
    if (!topic?.trim()) return;
    this.isLoadingPipeline.set(true);
    this.pipelineError.set(null);
    this.api.runMultiAgentPipeline(topic, this.professorMode(), this.researchMemory()).subscribe({
      next: (res) => { this.pipelineResult.set(res); this.isLoadingPipeline.set(false); },
      error: (err) => {
        console.error('Multi-Agent Pipeline Error:', err);
        this.pipelineError.set('داواکارییەکەی Multi-Agent تووشی هەڵە بوو. تکایە دووبارە هەوڵ بدەرەوە.');
        this.isLoadingPipeline.set(false);
      }
    });
  }

  runFactCheck(statement: string) {
    if (!statement?.trim()) return;
    this.isFactChecking.set(true);
    this.factCheckResult.set(null);
    this.api.runFactCheck(statement, this.professorMode()).subscribe({
      next: (res) => { this.factCheckResult.set(res); this.isFactChecking.set(false); },
      error: (err) => { console.error('Fact Check Error:', err); this.isFactChecking.set(false); }
    });
  }

  runMultiApiSearch(query: string) {
    if (!query?.trim()) return;
    this.isSearchingAPIs.set(true);
    this.api.runMultiApiSearch(query).subscribe({
      next: (res) => {
        this.searchSources.set(res.sources || []);
        this.averageConfidenceScore.set(res.averageConfidenceScore || 85);
        this.isSearchingAPIs.set(false);
      },
      error: (err) => { console.error('Multi API Search Error:', err); this.isSearchingAPIs.set(false); }
    });
  }

  runOcr(payload: { imageBase64?: string; textContent?: string; fileName?: string }) {
    this.isProcessingOcr.set(true);
    this.ocrResult.set(null);
    this.api.runOcr(payload).subscribe({
      next: (res) => { this.ocrResult.set(res); this.isProcessingOcr.set(false); },
      error: (err) => { console.error('OCR Error:', err); this.isProcessingOcr.set(false); }
    });
  }

  runPeerReview(researchText: string, topic?: string) {
    if (!researchText.trim()) return;
    this.isPeerReviewing.set(true);
    this.peerReviewResult.set(null);
    this.api.runPeerReview(researchText, topic).subscribe({
      next: (res) => { this.peerReviewResult.set(res); this.isPeerReviewing.set(false); },
      error: (err) => { console.error('Peer Review Error:', err); this.isPeerReviewing.set(false); }
    });
  }

  runPlagiarismAnalysis(text: string) {
    if (!text.trim()) return;
    this.isCheckingPlagiarism.set(true);
    this.plagiarismResult.set(null);
    this.api.runPlagiarismAnalysis(text).subscribe({
      next: (res) => { this.plagiarismResult.set(res); this.isCheckingPlagiarism.set(false); },
      error: (err) => { console.error('Plagiarism Check Error:', err); this.isCheckingPlagiarism.set(false); }
    });
  }

  validateCitations(citations: string[], style = 'APA 7th') {
    if (!citations || citations.length === 0) return;
    this.isValidatingCitations.set(true);
    this.citationValidationResult.set(null);
    this.api.validateCitations(citations, style).subscribe({
      next: (res) => { this.citationValidationResult.set(res); this.isValidatingCitations.set(false); },
      error: (err) => { console.error('Citation Validation Error:', err); this.isValidatingCitations.set(false); }
    });
  }

  exportAcademicDocument(format: 'latex' | 'epub' | 'markdown', title: string, content: string, authors: string[] = [], bibliography: string[] = []) {
    this.api.exportAcademicDocument(format, title, content, authors, bibliography).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'latex' ? 'tex' : format;
        a.download = `${title.replace(/\s+/g, '_')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export Error:', err)
    });
  }

  syncZoteroMendeley(query: string, libraryType: 'Zotero' | 'Mendeley' = 'Zotero') {
    this.isSyncingZotero.set(true);
    this.api.syncZoteroMendeley(query, libraryType).subscribe({
      next: (res) => { this.zoteroItems.set(res.items || []); this.isSyncingZotero.set(false); },
      error: (err) => { console.error('Zotero/Mendeley Sync Error:', err); this.isSyncingZotero.set(false); }
    });
  }

  lookupOrcid(orcidId: string, name?: string) {
    this.isFetchingOrcid.set(true);
    this.api.lookupOrcid(orcidId, name).subscribe({
      next: (res) => { this.orcidProfile.set(res); this.isFetchingOrcid.set(false); },
      error: (err) => { console.error('ORCID Lookup Error:', err); this.isFetchingOrcid.set(false); }
    });
  }

  searchGoogleScholar(query: string) {
    if (!query.trim()) return;
    this.isSearchingScholar.set(true);
    this.api.searchGoogleScholar(query).subscribe({
      next: (res) => { this.scholarResults.set(res.results || []); this.isSearchingScholar.set(false); },
      error: (err) => { console.error('Google Scholar Search Error:', err); this.isSearchingScholar.set(false); }
    });
  }

  resolveDoi(doi: string) {
    if (!doi.trim()) return;
    this.isResolvingDoi.set(true);
    this.api.resolveDoi(doi).subscribe({
      next: (res) => { this.doiResult.set(res); this.isResolvingDoi.set(false); },
      error: (err) => { console.error('DOI Resolver Error:', err); this.isResolvingDoi.set(false); }
    });
  }

  lookupIsbn(isbn: string) {
    if (!isbn.trim()) return;
    this.isLookingUpIsbn.set(true);
    this.api.lookupIsbn(isbn).subscribe({
      next: (res) => { this.isbnResult.set(res); this.isLookingUpIsbn.set(false); },
      error: (err) => { console.error('ISBN Lookup Error:', err); this.isLookingUpIsbn.set(false); }
    });
  }

  lookupIssn(issn: string) {
    if (!issn.trim()) return;
    this.isLookingUpIssn.set(true);
    this.api.lookupIssn(issn).subscribe({
      next: (res) => { this.issnResult.set(res); this.isLookingUpIssn.set(false); },
      error: (err) => { console.error('ISSN Lookup Error:', err); this.isLookingUpIssn.set(false); }
    });
  }

  generateResearchTimeline(topic: string) {
    if (!topic.trim()) return;
    this.isGeneratingTimeline.set(true);
    this.api.generateResearchTimeline(topic).subscribe({
      next: (res) => { this.timelineResult.set(res.timeline || []); this.isGeneratingTimeline.set(false); },
      error: (err) => { console.error('Timeline Error:', err); this.isGeneratingTimeline.set(false); }
    });
  }

  generateMindMap(topic: string) {
    if (!topic.trim()) return;
    this.isGeneratingMindMap.set(true);
    this.api.generateMindMap(topic).subscribe({
      next: (res) => { this.mindMapResult.set(res); this.isGeneratingMindMap.set(false); },
      error: (err) => { console.error('Mind Map Error:', err); this.isGeneratingMindMap.set(false); }
    });
  }

  generateAutoOutline(topic: string, degreeLevel?: string) {
    if (!topic.trim()) return;
    this.isGeneratingOutline.set(true);
    this.api.generateAutoOutline(topic, degreeLevel).subscribe({
      next: (res) => { this.outlineResult.set(res); this.isGeneratingOutline.set(false); },
      error: (err) => { console.error('Auto Outline Error:', err); this.isGeneratingOutline.set(false); }
    });
  }

  generateTableOrFigure(topic: string, type: 'table' | 'figure') {
    if (!topic.trim()) return;
    this.isGeneratingTableFigure.set(true);
    if (type === 'table') this.tableResult.set(null);
    else this.figureResult.set(null);

    this.api.generateTableOrFigure(topic, type).subscribe({
      next: (res) => {
        if (type === 'table') this.tableResult.set(res as AcademicTableData);
        else this.figureResult.set(res as AcademicFigureData);
        this.isGeneratingTableFigure.set(false);
      },
      error: (err) => { console.error('Table/Figure Error:', err); this.isGeneratingTableFigure.set(false); }
    });
  }

  findJournals(topic: string) {
    if (!topic.trim()) return;
    this.isFindingJournals.set(true);
    this.api.findJournals(topic).subscribe({
      next: (res) => { this.journalResults.set(res.journals || []); this.isFindingJournals.set(false); },
      error: (err) => { console.error('Journal Finder Error:', err); this.isFindingJournals.set(false); }
    });
  }

  lookupAuthorHIndex(authorName: string) {
    if (!authorName.trim()) return;
    this.isLookingUpHIndex.set(true);
    this.api.lookupAuthorHIndex(authorName).subscribe({
      next: (res) => { this.authorHIndexResult.set(res); this.isLookingUpHIndex.set(false); },
      error: (err) => { console.error('H-Index Error:', err); this.isLookingUpHIndex.set(false); }
    });
  }

  loadWritingTemplates() {
    this.api.loadWritingTemplates().subscribe({
      next: (res) => this.writingTemplates.set(res || []),
      error: (err) => console.error('Templates Error:', err)
    });
  }

  runAiDebate(topic: string) {
    if (!topic.trim()) return;
    this.isRunningDebate.set(true);
    this.api.runAiDebate(topic).subscribe({
      next: (res) => { this.debateResult.set(res); this.isRunningDebate.set(false); },
      error: () => this.isRunningDebate.set(false)
    });
  }

  detectFactVsOpinion(statement: string) {
    if (!statement.trim()) return;
    this.isDetectingFactOpinion.set(true);
    this.api.detectFactVsOpinion(statement).subscribe({
      next: (res) => { this.factOpinionResult.set(res); this.isDetectingFactOpinion.set(false); },
      error: () => this.isDetectingFactOpinion.set(false)
    });
  }

  verifyClaim(claim: string) {
    if (!claim.trim()) return;
    this.isVerifyingClaim.set(true);
    this.api.verifyClaim(claim).subscribe({
      next: (res) => { this.claimResult.set(res); this.isVerifyingClaim.set(false); },
      error: () => this.isVerifyingClaim.set(false)
    });
  }

  evaluateCitationQuality(rawCitation: string) {
    if (!rawCitation.trim()) return;
    this.isEvaluatingCitationQuality.set(true);
    this.api.evaluateCitationQuality(rawCitation).subscribe({
      next: (res) => { this.citationQualityResult.set(res); this.isEvaluatingCitationQuality.set(false); },
      error: () => this.isEvaluatingCitationQuality.set(false)
    });
  }

  askResearchAssistant(query: string, topic?: string) {
    if (!query.trim()) return;
    this.isAskingResearchAssistant.set(true);
    this.api.askResearchAssistant(query, topic).subscribe({
      next: (res) => { this.researchAssistantAnswer.set(res.answer || ''); this.isAskingResearchAssistant.set(false); },
      error: () => this.isAskingResearchAssistant.set(false)
    });
  }

  writeBookStructure(topic: string, targetAudience?: string) {
    if (!topic.trim()) return;
    this.isWritingBook.set(true);
    this.api.writeBookStructure(topic, targetAudience).subscribe({
      next: (res) => { this.bookResult.set(res); this.isWritingBook.set(false); },
      error: () => this.isWritingBook.set(false)
    });
  }

  writeThesisSection(topic: string, degreeLevel: string, chapterType?: string) {
    if (!topic.trim()) return;
    this.isWritingThesis.set(true);
    this.api.writeThesisSection(topic, degreeLevel, chapterType).subscribe({
      next: (res) => { this.thesisResult.set(res); this.isWritingThesis.set(false); },
      error: () => this.isWritingThesis.set(false)
    });
  }

  reviewByProfessor(draftText: string) {
    if (!draftText.trim()) return;
    this.isReviewingProfessor.set(true);
    this.api.reviewByProfessor(draftText).subscribe({
      next: (res) => { this.professorReviewResult.set(res); this.isReviewingProfessor.set(false); },
      error: () => this.isReviewingProfessor.set(false)
    });
  }

  generateExamOrQuiz(topic: string, mode: 'exam' | 'quiz' | 'flashcard') {
    if (!topic.trim()) return;
    this.isGeneratingExam.set(true);
    this.api.generateExamOrQuiz(topic, mode).subscribe({
      next: (res) => { this.examResult.set(res); this.isGeneratingExam.set(false); },
      error: () => this.isGeneratingExam.set(false)
    });
  }

  generatePresentation(topic: string, slideCount = 5) {
    if (!topic.trim()) return;
    this.isGeneratingPresentation.set(true);
    this.api.generatePresentation(topic, slideCount).subscribe({
      next: (res) => { this.presentationSlides.set(res.slides || []); this.isGeneratingPresentation.set(false); },
      error: () => this.isGeneratingPresentation.set(false)
    });
  }

  generateStudyPlanner(targetGoal: string, totalWeeks = 4) {
    if (!targetGoal.trim()) return;
    this.isGeneratingStudyPlanner.set(true);
    this.api.generateStudyPlanner(targetGoal, totalWeeks).subscribe({
      next: (res) => { this.studyPlannerResult.set(res); this.isGeneratingStudyPlanner.set(false); },
      error: () => this.isGeneratingStudyPlanner.set(false)
    });
  }

  chatWithPdfDocument(textContent: string, userQuestion: string) {
    this.isChattingPdf.set(true);
    this.api.chatWithPdfDocument(textContent, userQuestion).subscribe({
      next: (res) => { this.pdfChatAnswer.set(res.answer || ''); this.isChattingPdf.set(false); },
      error: () => this.isChattingPdf.set(false)
    });
  }

  extractTableFromData(textContent: string) {
    this.isExtractingTable.set(true);
    this.api.extractTableFromData(textContent).subscribe({
      next: (res) => { this.extractedTableResult.set(res); this.isExtractingTable.set(false); },
      error: () => this.isExtractingTable.set(false)
    });
  }

  findAcademicReferences(topic: string) {
    if (!topic.trim()) return;
    this.isFindingReferences.set(true);
    this.api.findAcademicReferences(topic).subscribe({
      next: (res) => { this.referenceFinderResults.set(res.references || []); this.isFindingReferences.set(false); },
      error: () => this.isFindingReferences.set(false)
    });
  }

  private saveMemoryToStorage() {
    saveResearchMemoryToStorage(this.researchMemory());
  }
}
