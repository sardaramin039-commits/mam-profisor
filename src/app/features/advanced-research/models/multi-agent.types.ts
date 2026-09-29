export interface AiDebateResult {
  topic?: string;
  perspectiveA: { title: string; arguments: string[] };
  perspectiveB: { title: string; arguments: string[] };
  synthesisVerdict?: string;
}

export interface FactVsOpinionResult {
  statement?: string;
  classification?: string;
  confidenceScore?: number;
  explanation?: string;
}

export interface ClaimVerificationResult {
  claim?: string;
  verdict?: string;
  evidenceSummary?: string;
  sources?: string[];
}

export interface CitationQualityResult {
  rawCitation?: string;
  qualityScore?: number;
  reliabilityRating?: string;
  metrics: { publisherReputation: string };
}

export interface AiBookWriterResult {
  topic?: string;
  bookTitle?: string;
  draftChapterSnippet?: string;
}

export interface AiThesisWriterResult {
  topic?: string;
  thesisTitle?: string;
  degreeLevel?: string;
  chapterDraft: { introduction: string };
}

export interface AiProfessorReviewResult {
  draftText?: string;
  professorVerdict?: string;
  detailedCorrections?: string;
}

export interface AiExamGeneratorResult {
  topic?: string;
  quizQuestions?: { question?: string; options: string[]; correctAnswerIndex: number }[];
  flashcards?: { concept?: string; definition?: string }[];
}

export interface AiPresentationSlide {
  slideNumber?: number;
  title?: string;
  bulletPoints: string[];
  speakerNotes?: string;
}

export interface AiStudyPlannerResult {
  targetGoal?: string;
  weeklySchedule?: { weekNumber?: number; focusArea?: string; assessmentMilestone?: string }[];
}

export interface TableExtractorResult {
  extractedTable?: unknown;
  markdownFormat?: string;
}

export interface AcademicReferenceItem {
  title?: string;
  authors?: string[];
  year?: number;
  journal?: string;
  doi?: string;
}

export type ProfessorModeLevel = 'سەرەتایی' | 'بەکالۆریۆس' | 'ماستەر' | 'دکتۆرا' | 'پڕۆفیسۆر';

export interface ResearchMemoryState {
  projectTitle: string;
  discipline: string;
  hypotheses: string[];
  keyTerms: string[];
  notes: string[];
  lastUpdated: string;
}

export interface ResearchIntegrityAuditResult {
  status: 'sound' | 'needs_revision' | 'insufficient_information' | string;
  executiveAssessment?: string;
  alignment?: { area: string; status: 'aligned' | 'partial' | 'missing' | string; finding: string }[];
  criticalGaps?: {
    area: string;
    severity: 'critical' | 'major' | 'minor' | string;
    problem: string;
    requiredAction: string;
  }[];
  claimsNeedingEvidence?: {
    claim: string;
    evidenceStatus: string;
    note: string;
  }[];
  reproducibilityChecklist?: { item: string; status: 'complete' | 'partial' | 'missing' | string }[];
  citationAudit?: { markerCount: number; bibliographyEntryCount: number; interpretation: string };
  nextActions?: string[];
  auditMeta?: {
    model: string;
    citationMarkerCount: number;
    bibliographyEntryCount: number;
    evidencePolicy: string;
    generatedAt: string;
  };
}
