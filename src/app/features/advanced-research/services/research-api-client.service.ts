import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
export interface ResearchControlPlaneState {
  projectId: string;
  stage: string;
  metrics: { sources: number; claims: number; evidence: number; decisions: number; evidenceCoverage: number };
  gates: { methodologyReady: boolean; evidenceReady: boolean; decisionTraceable: boolean; reviewRequired: boolean; exportBlocked: boolean };
}

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
  ResearchMemoryState,
  ResearchIntegrityAuditResult
} from '../models/multi-agent.types';

@Injectable({
  providedIn: 'root'
})
export class ResearchApiClientService {
  private http = inject(HttpClient);

  runMultiAgentPipeline(topic: string, professorMode: ProfessorModeLevel, researchMemory: ResearchMemoryState): Observable<MultiAgentResponse> {
    return this.http.post<MultiAgentResponse>('/api/multi_agent_pipeline', {
      topic: topic.trim(),
      professorMode,
      researchMemory
    });
  }

  runFactCheck(statement: string, professorMode: ProfessorModeLevel): Observable<FactCheckResult> {
    return this.http.post<FactCheckResult>('/api/fact_check_agent', {
      statement: statement.trim(),
      professorMode
    });
  }

  runMultiApiSearch(query: string): Observable<{ query: string; sources: AcademicSourceItem[]; averageConfidenceScore: number }> {
    return this.http.post<{ query: string; sources: AcademicSourceItem[]; averageConfidenceScore: number }>('/api/multi_academic_search', { query: query.trim() });
  }

  runOcr(payload: { imageBase64?: string; textContent?: string; fileName?: string }): Observable<OcrExtractionResult> {
    return this.http.post<OcrExtractionResult>('/api/ocr_extraction', payload);
  }

  runPeerReview(researchText: string, topic?: string): Observable<PeerReviewReport> {
    return this.http.post<PeerReviewReport>('/api/ai_peer_review', { researchText, topic });
  }

  runPlagiarismAnalysis(text: string): Observable<PlagiarismAnalysisReport> {
    return this.http.post<PlagiarismAnalysisReport>('/api/ai_plagiarism_analysis', { text });
  }

  validateCitations(citations: string[], style = 'APA 7th'): Observable<CitationValidationReport> {
    return this.http.post<CitationValidationReport>('/api/citation_validator', { citations, style });
  }

  exportAcademicDocument(format: 'latex' | 'epub' | 'markdown', title: string, content: string, authors: string[] = [], bibliography: string[] = []): Observable<Blob> {
    return this.http.post('/api/export_academic', { format, title, content, authors, bibliography }, { responseType: 'blob' });
  }

  syncZoteroMendeley(query: string, libraryType: 'Zotero' | 'Mendeley' = 'Zotero'): Observable<{ items: ZoteroItem[] }> {
    return this.http.post<{ items: ZoteroItem[] }>('/api/zotero_mendeley_search', { query, libraryType });
  }

  lookupOrcid(orcidId: string, name?: string): Observable<OrcidProfile> {
    return this.http.post<OrcidProfile>('/api/orcid_lookup', { orcidId, name });
  }

  searchGoogleScholar(query: string): Observable<{ results: GoogleScholarMetadata[] }> {
    return this.http.post<{ results: GoogleScholarMetadata[] }>('/api/google_scholar_search', { query });
  }

  resolveDoi(doi: string): Observable<DoiResolutionResult> {
    return this.http.post<DoiResolutionResult>('/api/doi_resolver', { doi });
  }

  lookupIsbn(isbn: string): Observable<IsbnLookupResult> {
    return this.http.post<IsbnLookupResult>('/api/isbn_lookup', { isbn });
  }

  lookupIssn(issn: string): Observable<IssnLookupResult> {
    return this.http.post<IssnLookupResult>('/api/issn_lookup', { issn });
  }

  generateResearchTimeline(topic: string): Observable<{ timeline: ResearchTimelineNode[] }> {
    return this.http.post<{ timeline: ResearchTimelineNode[] }>('/api/research_timeline', { topic });
  }

  generateMindMap(topic: string): Observable<MindMapNode> {
    return this.http.post<MindMapNode>('/api/mind_map_generator', { topic });
  }

  generateAutoOutline(topic: string, degreeLevel?: string): Observable<ResearchOutline> {
    return this.http.post<ResearchOutline>('/api/auto_outline_generator', { topic, degreeLevel });
  }

  generateTableOrFigure(topic: string, type: 'table' | 'figure'): Observable<AcademicTableData | AcademicFigureData> {
    return this.http.post<AcademicTableData | AcademicFigureData>('/api/table_figure_generator', { topic, type });
  }

  findJournals(topic: string): Observable<{ journals: JournalMetricsResult[] }> {
    return this.http.post<{ journals: JournalMetricsResult[] }>('/api/journal_finder_metrics', { topic });
  }

  lookupAuthorHIndex(authorName: string): Observable<AuthorHIndexResult> {
    return this.http.post<AuthorHIndexResult>('/api/journal_finder_metrics', { authorName });
  }

  loadWritingTemplates(): Observable<WritingTemplateItem[]> {
    return this.http.get<WritingTemplateItem[]>('/api/academic_writing_templates');
  }

  runAiDebate(topic: string): Observable<AiDebateResult> {
    return this.http.post<AiDebateResult>('/api/ai_debate', { topic });
  }

  detectFactVsOpinion(statement: string): Observable<FactVsOpinionResult> {
    return this.http.post<FactVsOpinionResult>('/api/fact_vs_opinion', { statement });
  }

  verifyClaim(claim: string): Observable<ClaimVerificationResult> {
    return this.http.post<ClaimVerificationResult>('/api/claim_verification', { claim });
  }

  evaluateCitationQuality(rawCitation: string): Observable<CitationQualityResult> {
    return this.http.post<CitationQualityResult>('/api/citation_quality_score', { rawCitation });
  }

  askResearchAssistant(query: string, topic?: string): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>('/api/ai_research_assistant', { query, topic });
  }

  writeBookStructure(topic: string, targetAudience?: string): Observable<AiBookWriterResult> {
    return this.http.post<AiBookWriterResult>('/api/ai_book_writer', { topic, targetAudience });
  }

  writeThesisSection(topic: string, degreeLevel: string, chapterType?: string): Observable<AiThesisWriterResult> {
    return this.http.post<AiThesisWriterResult>('/api/ai_thesis_dissertation_writer', { topic, degreeLevel, chapterType });
  }

  reviewByProfessor(draftText: string): Observable<AiProfessorReviewResult> {
    return this.http.post<AiProfessorReviewResult>('/api/ai_professor_review', { draftText });
  }

  generateExamOrQuiz(topic: string, mode: 'exam' | 'quiz' | 'flashcard'): Observable<AiExamGeneratorResult> {
    return this.http.post<AiExamGeneratorResult>('/api/ai_exam_quiz_flashcards', { topic, mode });
  }

  generatePresentation(topic: string, slideCount = 5): Observable<{ slides: AiPresentationSlide[] }> {
    return this.http.post<{ slides: AiPresentationSlide[] }>('/api/ai_presentation_generator', { topic, slideCount });
  }

  generateStudyPlanner(targetGoal: string, totalWeeks = 4): Observable<AiStudyPlannerResult> {
    return this.http.post<AiStudyPlannerResult>('/api/ai_study_planner', { targetGoal, totalWeeks });
  }

  chatWithPdfDocument(textContent: string, userQuestion: string): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>('/api/ai_reading_pdf_chat', { textContent, userQuestion });
  }

  extractTableFromData(textContent: string): Observable<TableExtractorResult> {
    return this.http.post<TableExtractorResult>('/api/ai_image_table_extractor', { textContent });
  }

  auditResearchIntegrity(payload: {
    title: string;
    discipline?: string;
    academicLevel?: string;
    researchQuestion?: string;
    objectives?: string;
    hypotheses?: string;
    methodology?: string;
    populationSample?: string;
    variables?: string;
    dataCollection?: string;
    analysisPlan?: string;
    ethics?: string;
    draftText?: string;
    bibliography?: string;
  }): Observable<ResearchIntegrityAuditResult> {
    return this.http.post<ResearchIntegrityAuditResult>('/api/research_integrity_audit', payload);
  }

  assessScholarship55(payload: Record<string, unknown>): Observable<any> {
    return this.http.post('/api/scholarship_55', { payload });
  }

  getScholarship55Catalog(): Observable<any> {
    return this.http.get('/api/scholarship_55/catalog');
  }

  runResearchMethodsLab(mode: 'prisma' | 'power' | 'claim_map' | 'provenance' | 'framework' | 'risk_bias' | 'evidence_grade', payload: Record<string, unknown>): Observable<{ mode: string; result: any; generatedAt: string }> {
    return this.http.post<{ mode: string; result: any; generatedAt: string }>('/api/research_methods_lab', { mode, payload });
  }

  getResearchControlPlane(projectId: string): Observable<ResearchControlPlaneState> {
    return this.http.get<ResearchControlPlaneState>(`/api/research-control/${encodeURIComponent(projectId)}`);
  }

  listResearchDecisions(projectId: string): Observable<{ decisions: Array<Record<string, unknown>> }> {
    return this.http.get<{ decisions: Array<Record<string, unknown>> }>(`/api/research-decisions/${encodeURIComponent(projectId)}`);
  }

  addResearchDecision(projectId: string, payload: {
    kind: string; decision: string; rationale?: string; evidenceIds?: string[]; conflictingEvidence?: string[]; impact?: string; actor?: 'user' | 'ai_assistant' | 'reviewer';
  }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`/api/research-decisions/${encodeURIComponent(projectId)}`, payload);
  }

  findAcademicReferences(topic: string): Observable<{ references: AcademicReferenceItem[] }> {
    return this.http.post<{ references: AcademicReferenceItem[] }>('/api/ai_reference_finder', { topic });
  }
}
