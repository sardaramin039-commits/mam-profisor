import { Injectable, inject } from '@angular/core';
import { EditorService } from '../features/editor/services/editor';
import { ChapterItemModel as ChapterItem, ChapterSnapshotModel as ChapterSnapshot } from '../domain/models';
import { SoraniSpellingCorrector } from '../helpers/sorani-spelling';
import { AppAcademicActions } from '../helpers/app-academic-actions';

@Injectable({ providedIn: 'root' })
export class AppEditorControllerService {
  private editorService = inject(EditorService);

  fixAllChaptersSpelling(chapters: ChapterItem[], updateFn: (updated: ChapterItem[]) => void): string {
    if (!chapters || chapters.length === 0) {
      return 'هیچ بەشێک نییە بۆ چاککردنەوەی ڕێنووس.';
    }

    let totalFixes = 0;
    let updatedChaptersCount = 0;

    const updated = chapters.map((c) => {
      if (!c.content) return c;
      const res = SoraniSpellingCorrector.processAndCount(c.content);
      if (res.changesCount > 0) {
        totalFixes += res.changesCount;
        updatedChaptersCount++;
        const wordCount = res.correctedText.trim().split(/\s+/).filter(Boolean).length;
        return {
          ...c,
          content: res.correctedText,
          wordCount
        };
      }
      return c;
    });

    updateFn(updated);

    return updatedChaptersCount > 0
      ? `✨ بە سەرکەوتوویی ڕێنووسی ${updatedChaptersCount} بەش بەپێی ستانداردی سۆرانی چاککرایەوە (${totalFixes} هەڵە ڕاستکرایەوە)!`
      : 'پشکنین تەواو بوو: تەواوی بەشەکان خاوێنن و بەپێی ستانداردی کوردی سۆرانی نووسراون.';
  }

  fixSingleChapterSpelling(chapterId: number, chapters: ChapterItem[], updateFn: (updated: ChapterItem[]) => void): string {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.content) return '';

    const res = SoraniSpellingCorrector.processAndCount(chapter.content);
    if (res.changesCount === 0) {
      return `دەقی بەشی ${chapterId} پێشتر بەپێی ستانداردی سۆرانی چاککراوە.`;
    }

    const wordCount = res.correctedText.trim().split(/\s+/).filter(Boolean).length;
    const updated = chapters.map((c) =>
      c.id === chapterId ? { ...c, content: res.correctedText, wordCount } : c
    );

    updateFn(updated);

    return `✨ ڕێنووسی بەشی ${chapterId} بەپێی ستانداردی کوردی سۆرانی چاککرایەوە (${res.changesCount} هەڵە ڕاستکرایەوە).`;
  }

  formatSelectionInTextarea(textarea: HTMLTextAreaElement, format: 'bold' | 'italic' | 'sub' | 'sup'): string {
    return AppAcademicActions.formatTextSelection(textarea, format);
  }
}
