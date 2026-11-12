export * from '../domain/models';

export interface ParaphraseResult {
  originalText: string;
  paraphrasedText: string;
  discipline: string;
  toneLevel: string;
  keyChanges?: string[];
  vocabularyEnhancements?: { original: string; replacement: string; reason: string }[];
}

export interface LiteratureGapResult {
  identifiedGaps: string[];
  proposedNovelties: string[];
  kurdishParagraph: string;
  englishParagraph: string;
  recommendedCitations?: { title: string; authors: string; year: string; doi?: string }[];
}

export interface AcademicAdditionResult {
  methodologyContent: string;
  sourcesContent: string;
}
