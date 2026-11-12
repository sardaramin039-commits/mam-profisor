/**
 * src/app/helpers/thesis-enrichment.helper.ts
 *
 * Professorial Upgrade - Phase 3 Prompt Enrichment Engine
 * Combines Primary Corpus & Research Cards, Vertical Alignment Matrix,
 * and Cross-Chapter Rolling Memory.
 */

import { ChapterItemModel } from '../domain/models';
import {
  ResearchCorpusCard,
  VerticalAlignmentMatrixItem,
  buildChapterCorpusPromptContext,
  buildVerticalAlignmentConclusionsPromptDirectives,
  buildCrossChapterRollingMemory
} from './thesis-context-map';

export interface ThesisPromptEnrichmentOptions {
  chapterId: number;
  chapterTitle?: string;
  corpusCards?: ResearchCorpusCard[];
  matrix?: VerticalAlignmentMatrixItem[];
  chapters?: ChapterItemModel[];
}

export function isConclusionOrFindingsChapter(title?: string): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return (
    title.includes('ئەنجام') ||
    title.includes('دەرئەنجام') ||
    title.includes('دەرەنجام') ||
    title.includes('کۆتایی') ||
    lower.includes('finding') ||
    lower.includes('conclusion')
  );
}

export function buildPhase3PromptEnrichment(options: ThesisPromptEnrichmentOptions): string {
  const parts: string[] = [];

  // 1. Primary Corpus & Research Cards
  if (options.corpusCards && options.corpusCards.length > 0) {
    const corpusPrompt = buildChapterCorpusPromptContext(options.corpusCards, options.chapterId);
    if (corpusPrompt) {
      parts.push(corpusPrompt);
    }
  }

  // 2. Vertical Alignment Matrix (for findings/conclusions or when matrix provided)
  const isConclusion = isConclusionOrFindingsChapter(options.chapterTitle);
  if (options.matrix && options.matrix.length > 0) {
    if (isConclusion) {
      parts.push(buildVerticalAlignmentConclusionsPromptDirectives(options.matrix));
    } else {
      // Light vertical alignment reminder
      const relevant = options.matrix.find(m => m.targetChapterId === options.chapterId);
      if (relevant) {
        parts.push(
          `[پەیوەندیی ستوونیی ئەم تەوەرە بە پرسیار و ئامانجی سەرەکی]:\n` +
          `- ئەم بەشە ڕاستەوخۆ وەڵامی پرسیاری ${relevant.questionNumber} («${relevant.questionText}») دەداتەوە.\n` +
          `- ئامانجی تەرخانکراو: «${relevant.objectiveText}». پێویستە دەقەکە لەسەر بەدەستهێنانی ئەم ئامانجە چڕ بکرێتەوە.`
        );
      }
    }
  }

  // 3. Cross-Chapter Rolling Memory
  if (options.chapters && options.chapters.length > 0 && options.chapterId > 1) {
    const memory = buildCrossChapterRollingMemory(options.chapters, options.chapterId);
    if (memory) {
      parts.push(memory);
    }
  }

  return parts.join('\n\n');
}
