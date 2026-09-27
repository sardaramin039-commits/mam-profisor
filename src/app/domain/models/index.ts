import { AcademicLevel, AcademicStyle, ChapterStatus, SourceType } from '../enums';

export interface GlossaryEntry {
  foreign: string;
  category: string;
  sourceLang: 'ئینگلیزی' | 'عەرەبی';
  translation: string;
  definition: string;
  id?: string;
  kurdishTerm?: string;
  term?: string;
  englishTerm?: string;
  soraniEquivalents?: string[];
  synonyms?: string[];
  usageContext?: string;
}

export interface TemplateSample {
  title: string;
  description: string;
  discipline: string;
  writingType: string;
  academicLevel: string;
  size: number;
}

export interface ChapterSnapshotModel {
  timestamp: string;
  content: string;
  wordCount: number;
  trigger?: string;
  customSourcesOn?: boolean;
  fieldWorkOn?: boolean;
  customTOCOn?: boolean;
  hash?: string;
  contentSnippet?: string;
}

export interface ChapterItemModel {
  id: number;
  title: string;
  wordCount: number;
  status: ChapterStatus | 'pending' | 'writing' | 'completed' | 'humanizing';
  content: string;
  academicNotes?: string;
  isViewOpen?: boolean;
  customTargetWords?: number;
  isLocked?: boolean;
  integrityHash?: string;
  snapshots?: ChapterSnapshotModel[];
  isEncryptedInVault?: boolean;
  customSourcesOn?: boolean;
  fieldWorkOn?: boolean;
  customTOCOn?: boolean;
}

export interface SuggestionItem {
  chapterIndex: number;
  improvedTitle: string;
  reason: string;
}

export interface StructureReviewResult {
  strengthenedTitle: string;
  feedbackMessage: string;
  suggestions?: SuggestionItem[];
}

export interface SavedManuscriptChapter {
  title: string;
  content: string;
  wordCount: number;
  academicNotes?: string;
  isLocked?: boolean;
  integrityHash?: string;
  snapshots?: ChapterSnapshotModel[];
  isEncryptedInVault?: boolean;
}

export interface SavedManuscriptModel {
  id: string;
  userId: string;
  title: string;
  discipline: string;
  academicLevel: AcademicLevel | string;
  pages: number;
  chapters: SavedManuscriptChapter[];
  createdAt?: {
    seconds: number;
    nanoseconds: number;
    secondsPassed?: number;
  };
}

export interface AcademicSourceModel {
  id: string;
  userId: string;
  author: string;
  authors?: string[];
  title: string;
  year: number;
  publisher: string;
  sourceType: SourceType | 'book' | 'journal' | 'thesis' | 'manuscript';
  journal?: string;
  url?: string;
  type?: string;
  doi?: string;
  isbn?: string;
  formattedCitation?: string;
  isVerified: boolean;
  createdAt?: { seconds: number; nanoseconds?: number } | null;
}

export interface RetrievedChunkModel {
  id: string;
  bookTitle: string;
  bookAuthor?: string;
  author?: string;
  year?: number;
  publisher?: string;
  chapterOrSection?: string;
  content: string;
  relevanceScore: number;
  chunkIndex?: number;
  pageNumber?: number;
  isUsedInChapter?: boolean;
  chapterIdUsed?: number;
  text?: string;
  sourceTitle?: string;
  isUsed?: boolean;
  isVerified?: boolean;
}

export interface CitationFormatResult {
  formattedText: string;
  style: AcademicStyle | string;
  inTextCitation: string;
}

export interface SearchResultItem {
  id: string;
  type: 'chapter' | 'history' | 'glossary';
  typeLabel: string;
  title: string;
  subtitle?: string;
  snippet: string;
  relevance: number;
  originalItem: ChapterItemModel | SavedManuscriptModel | GlossaryEntry;
  authorName?: string;
  savedDateStr?: string;
  wordCount?: number;
}


