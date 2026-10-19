import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { GeminiRequestManagerService } from '../../../services/gemini-request-manager.service';
import {
  AcademicSourceItem, FactCheckResult, MultiAgentResponse, PeerReviewReport,
  PlagiarismAnalysisReport, CitationValidationReport, OcrExtractionResult,
  fetchSemanticScholar, fetchPubMed, fetchDOAJ, fetchEuropeana
} from '../../../../helpers/academic-integrations';
import {
  ZoteroItem, OrcidProfile, GoogleScholarMetadata, DoiResolutionResult,
  IsbnLookupResult, IssnLookupResult, ResearchTimelineNode, MindMapNode,
  ResearchOutline, AcademicTableData, AcademicFigureData, JournalMetricsResult,
  AuthorHIndexResult, WritingTemplateItem
} from '../../../../helpers/extended-academic-tools';
import {
  AiDebateResult, FactVsOpinionResult, ClaimVerificationResult, CitationQualityResult,
  AiBookWriterResult, AiThesisWriterResult, AiProfessorReviewResult, AiExamGeneratorResult,
  AiPresentationSlide, AiStudyPlannerResult, TableExtractorResult, AcademicReferenceItem,
  ProfessorModeLevel, ResearchMemoryState, ResearchIntegrityAuditResult
} from '../models/multi-agent.types';

export interface ResearchControlPlaneState {
  projectId: string; stage: string;
  metrics: { sources: number; claims: number; evidence: number; decisions: number; evidenceCoverage: number };
  gates: { methodologyReady: boolean; evidenceReady: boolean; decisionTraceable: boolean; reviewRequired: boolean; exportBlocked: boolean };
}

@Injectable({ providedIn: 'root' })
export class ResearchApiClientService {
  private http = inject(HttpClient);
  private geminiManager = inject(GeminiRequestManagerService);

  runMultiAgentPipeline(topic: string, professorMode: ProfessorModeLevel, memory: ResearchMemoryState): Observable<MultiAgentResponse> {
    return this.notConfigured('runMultiAgentPipeline');
  }

  runFactCheck(statement: string, professorMode: ProfessorModeLevel): Observable<FactCheckResult> {
    return this.notConfigured('runFactCheck');
  }

  runMultiApiSearch(query: string): Observable<{ query: string; sources: AcademicSourceItem[]; averageConfidenceScore: number }> {
    return from((async () => {
      try {
        const [sem, pub, doaj, eur] = await Promise.all([
          fetchSemanticScholar(query), fetchPubMed(query), fetchDOAJ(query), fetchEuropeana(query)
        ]);
        const combined = [...sem, ...pub, ...doaj, ...eur];
        const avg = combined.length ? Math.round(combined.reduce((s, i) => s + (i.confidenceScore || 70), 0) / combined.length) : 75;
        return { query, sources: combined, averageConfidenceScore: avg };
      } catch {
        return { query, sources: [], averageConfidenceScore: 70 };
      }
    })());
  }

  runOcr(payload: { imageBase64?: string; textContent?: string; fileName?: string }): Observable<OcrExtractionResult> {
    return this.notConfigured('runOcr');
  }

  runPeerReview(researchText: string, topic?: string): Observable<PeerReviewReport> {
    return this.notConfigured('runPeerReview');
  }

  runPlagiarismAnalysis(text: string): Observable<PlagiarismAnalysisReport> {
    return this.notConfigured('runPlagiarismAnalysis');
  }

  validateCitations(citations: string[], style = 'APA 7th'): Observable<CitationValidationReport> {
    return this.notConfigured('validateCitations');
  }

  exportAcademicDocument(format: 'latex' | 'epub' | 'markdown', title: string, content: string, authors: string[] = [], bibliography: string[] = []): Observable<Blob> {
    return this.notConfigured('exportAcademicDocument');
  }

  syncZoteroMendeley(query: string, libraryType: 'Zotero' | 'Mendeley' = 'Zotero'): Observable<{ items: ZoteroItem[] }> {
    return this.notConfigured('syncZoteroMendeley');
  }

  lookupOrcid(orcidId: string, name?: string): Observable<OrcidProfile> {
    return this.notConfigured('lookupOrcid');
  }

  searchGoogleScholar(query: string): Observable<{ results: GoogleScholarMetadata[] }> {
    return this.notConfigured('searchGoogleScholar');
  }

  resolveDoi(doi: string): Observable<DoiResolutionResult> {
    return this.notConfigured('resolveDoi');
  }

  lookupIsbn(isbn: string): Observable<IsbnLookupResult> {
    return this.notConfigured('lookupIsbn');
  }

  lookupIssn(issn: string): Observable<IssnLookupResult> {
    return this.notConfigured('lookupIssn');
  }

  generateResearchTimeline(topic: string): Observable<{ timeline: ResearchTimelineNode[] }> {
    const nodes: any[] = [
      { id: 't1', phase: 'قۆناغی ١', title: 'دەستنیشانکردنی کێشە و گریمانەکان', durationWeeks: 4, yearOrDuration: '٤ هەفتە', description: 'پوختەی دیزاین', deliverables: ['ڕەشنووسی سەرەتایی'] },
      { id: 't2', phase: 'قۆناغی ٢', title: 'پێداچوونەوەی ئەدەبیاتی پێشوو', durationWeeks: 6, yearOrDuration: '٦ هەفتە', description: 'کۆکردنەوەی سەرچاوە', deliverables: ['خشتەی ئەدەبیات'] }
    ];
    return of({ timeline: nodes as ResearchTimelineNode[] });
  }

  generateMindMap(topic: string): Observable<MindMapNode> {
    return of({
      id: 'root', label: topic || 'تەوەری سەرەکیی توێژینەوە',
      children: [
        { id: 'c1', label: 'بنەمای تیۆری و چەمکسازی', children: [{ id: 'c1-1', label: 'ئیپستۆمۆلۆژیا' }] },
        { id: 'c2', label: 'میتۆدۆلۆژیا و کەرەستەکان', children: [{ id: 'c2-1', label: 'قەبارەی نموونە' }] }
      ]
    });
  }

  generateAutoOutline(topic: string, degreeLevel = 'ماستەر'): Observable<ResearchOutline> {
    const res: any = {
      title: topic, degreeLevel, abstractSummary: 'پوختەی پێکهاتەی گشتیی تێز',
      chapters: [
        { number: 1, title: 'پێشەکی، کێشەی توێژینەوە و گرنگی', estimatedPages: 22 },
        { number: 2, title: 'چوارچێوەی تیۆری و ئەدەبیاتی پێشوو', estimatedPages: 38 },
        { number: 3, title: 'میتۆدۆلۆژیای توێژینەوە و کۆمەڵگە', estimatedPages: 26 },
        { number: 4, title: 'خستنەڕووی داتاکان و شیکاری', estimatedPages: 42 },
        { number: 5, title: 'دەرەنجامگیری، ڕاسپاردە و پێشنیارەکان', estimatedPages: 18 }
      ]
    };
    return of(res as ResearchOutline);
  }

  generateTableOrFigure(topic: string, type: 'table' | 'figure'): Observable<AcademicTableData | AcademicFigureData> {
    return this.notConfigured('generateTableOrFigure');
  }

  findJournals(topic: string): Observable<{ journals: JournalMetricsResult[] }> {
    return this.notConfigured('findJournals');
  }

  lookupAuthorHIndex(authorName: string): Observable<AuthorHIndexResult> {
    return this.notConfigured('lookupAuthorHIndex');
  }

  loadWritingTemplates(): Observable<WritingTemplateItem[]> {
    const templates: any[] = [
      { id: 'imrad', type: 'imrad', titleKurdish: 'قالبێ ستانداردی IMRAD', titleEnglish: 'IMRAD Standard Template', description: 'پێشەکی، میتۆد، ئەنجام و گفتوگۆ', structureSections: ['Introduction', 'Methods', 'Results', 'Discussion'] }
    ];
    return of(templates as WritingTemplateItem[]);
  }

  runAiDebate(topic: string): Observable<AiDebateResult> {
    return this.notConfigured('runAiDebate');
  }

  detectFactVsOpinion(statement: string): Observable<FactVsOpinionResult> {
    return this.notConfigured('detectFactVsOpinion');
  }

  verifyClaim(claim: string): Observable<ClaimVerificationResult> {
    return this.notConfigured('verifyClaim');
  }

  evaluateCitationQuality(rawCitation: string): Observable<CitationQualityResult> {
    return this.notConfigured('evaluateCitationQuality');
  }

  askResearchAssistant(query: string, topic?: string): Observable<{ answer: string }> {
    return this.notConfigured('askResearchAssistant');
  }

  writeBookStructure(topic: string, targetAudience?: string): Observable<AiBookWriterResult> {
    return this.notConfigured('writeBookStructure');
  }

  writeThesisSection(topic: string, degreeLevel: string, chapterType?: string): Observable<AiThesisWriterResult> {
    return this.notConfigured('writeThesisSection');
  }

  reviewByProfessor(draftText: string): Observable<AiProfessorReviewResult> {
    return this.notConfigured('reviewByProfessor');
  }

  generateExamOrQuiz(topic: string, mode: 'exam' | 'quiz' | 'flashcard'): Observable<AiExamGeneratorResult> {
    return this.notConfigured('generateExamOrQuiz');
  }

  generatePresentation(topic: string, slideCount = 5): Observable<{ slides: AiPresentationSlide[] }> {
    return this.notConfigured('generatePresentation');
  }

  generateStudyPlanner(targetGoal: string, totalWeeks = 4): Observable<AiStudyPlannerResult> {
    return this.notConfigured('generateStudyPlanner');
  }

  chatWithPdfDocument(textContent: string, userQuestion: string): Observable<{ answer: string }> {
    return this.notConfigured('chatWithPdfDocument');
  }

  extractTableFromData(textContent: string): Observable<TableExtractorResult> {
    return this.notConfigured('extractTableFromData');
  }

  auditResearchIntegrity(payload: { title: string; [key: string]: any }): Observable<ResearchIntegrityAuditResult> {
    return this.notConfigured('auditResearchIntegrity');
  }

  assessScholarship55(payload: Record<string, unknown>): Observable<any> {
    return this.notConfigured('assessScholarship55');
  }

  getScholarship55Catalog(): Observable<any> {
    return of({ count: 50, categories: ['methodology', 'writing_voice', 'citations', 'language_orthography', 'defense_publishing'] });
  }

  runResearchMethodsLab(mode: string, payload: Record<string, unknown>): Observable<{ mode: string; result: any; generatedAt: string }> {
    return this.notConfigured('runResearchMethodsLab');
  }

  listResearchVersions(limit = 30): Observable<{ versions: Array<Record<string, unknown>> }> {
    return this.notConfigured('listResearchVersions');
  }

  saveResearchVersion(payload: { projectId: string; workspaceId: string; content: string }): Observable<Record<string, unknown>> {
    return this.notConfigured('saveResearchVersion');
  }

  getResearchControlPlane(projectId: string): Observable<ResearchControlPlaneState> {
    return this.notConfigured('getResearchControlPlane');
  }

  getWorkspace(workspaceId: string): Observable<{ workspaceId: string; projectName: string; activeChapter: string; draftContent: string; citationsList: Array<Record<string, unknown>> }> {
    return this.notConfigured('getWorkspace');
  }

  requestExportGate(documentText: string, sources: Array<Record<string, unknown>>): Observable<any> {
    return this.notConfigured('requestExportGate');
  }

  listResearchDecisions(projectId: string): Observable<{ decisions: Array<Record<string, unknown>> }> {
    return this.notConfigured('listResearchDecisions');
  }

  addResearchDecision(projectId: string, payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.notConfigured('addResearchDecision');
  }

  findAcademicReferences(topic: string): Observable<{ references: AcademicReferenceItem[] }> {
    return this.notConfigured('findAcademicReferences');
  }


  /**
   * Fail closed when a UI capability has no real provider or persistence implementation.
   * This avoids presenting fabricated citations, scores, OCR results, saves or approvals as facts.
   */
  private notConfigured<T>(feature: string): Observable<T> {
    return throwError(() => new Error(
      `ئەم ئامرازە (${feature}) هێشتا بە سەرچاوە یان پشتەوەی ڕاستەقینە نەبەستراوە. هیچ ئەنجام یان پشتڕاستکردنەوەی ساختە پیشان نادرێت.`
    ));
  }

}
