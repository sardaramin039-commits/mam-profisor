export interface AcademicSourceItem {
  id: string;
  title: string;
  authors: string[];
  year: string;
  sourceType: 'SemanticScholar' | 'PubMed' | 'OpenLibrary' | 'InternetArchive' | 'DOAJ' | 'WorldCat' | 'Europeana' | 'LibraryOfCongress' | 'OAIPMH' | 'PeerReviewedJournal' | 'OpenAlex' | 'Crossref';
  url: string;
  snippet: string;
  citationCount?: number;
  doi?: string;
  openAlexId?: string;
  crossrefId?: string;
  publisher?: string;
  confidenceScore: number; // 0 - 100
  peerReviewed: boolean;
}

export interface PeerReviewReport {
  overallVerdict: 'قبووڵکراو بەبێ دەستکاری' | 'پێویستی بە دەستکاری بچووک هەیە' | 'پێویستی بە دەستکاری گەورە هەیە' | 'ڕەتکراوەتەوە';
  reviewScore: number; // 0-100
  originalityScore: number;
  methodologyScore: number;
  clarityScore: number;
  strengths: string[];
  weaknesses: string[];
  detailedComments: string;
  recommendedRevisions: string[];
}

export interface PlagiarismAnalysisReport {
  originalityScore: number; // 0-100%
  similarityPercentage: number; // 0-100%
  potentialMatches: {
    sourceTitle: string;
    matchedTextSnippet: string;
    similarityRate: number;
    sourceUrl: string;
  }[];
  verdict: 'ڕەسەن و پاک' | 'ئاستی گوماناوی' | 'کۆپیکاری نائەکادیمی';
  recommendations: string[];
}

export interface CitationValidationReport {
  totalCitationsChecked: number;
  validCitationsCount: number;
  invalidOrBrokenCount: number;
  citationDetails: {
    rawCitation: string;
    style: 'APA' | 'Harvard' | 'MLA' | 'Chicago';
    isValid: boolean;
    issue?: string;
    suggestedCorrection?: string;
  }[];
}

export interface OcrExtractionResult {
  extractedText: string;
  confidence: number;
  pageCount?: number;
  languageDetected: string;
  summary: string;
  academicKeywords: string[];
}

export interface FactCheckResult {
  claim: string;
  status: 'پشتڕاستکراوەتەوە' | 'تێبینی و گومان' | 'هەڵەی زانیاری' | 'نیازی سەرچاوە';
  factualityScore: number; // 0 - 100%
  explanation: string;
  verifiedSources: string[];
  correctedStatement?: string;
  suggestions: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'concept' | 'author' | 'book' | 'paper' | 'institution';
  val: number; // node size weight
}

export interface KnowledgeGraphLink {
  source: string;
  target: string;
  label: string;
  strength: number;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  links: KnowledgeGraphLink[];
}

export interface MultiAgentResponse {
  professorMode: string;
  topic: string;
  researchAgentOutput: {
    sources: AcademicSourceItem[];
    keyConcepts: string[];
  };
  writerAgentOutput: {
    title: string;
    academicProse: string;
    kurdishSynthesis: string;
  };
  citationAgentOutput: {
    formattedCitationsAPA: string[];
    formattedCitationsHarvard: string[];
    citationsCount: number;
  };
  reviewerAgentOutput: {
    strengths: string[];
    literatureGaps: string[];
    methodologyCritique: string;
    improvementSuggestions: string[];
  };
  factCheckerAgentOutput: FactCheckResult;
  knowledgeGraph: KnowledgeGraphData;
  sourceConfidenceAverage: number;
}
