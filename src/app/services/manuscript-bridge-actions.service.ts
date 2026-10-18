import { Injectable, inject } from '@angular/core';
import { EditorService } from '../features/editor/services/editor';
import { EditorSyncFeedbackService } from './editor-sync-feedback.service';
import { AppNotificationsService } from '../core/app.notifications';
import { countKurdishWords } from './data';
import { ChapterItemModel as ChapterItem, SubBranchItem } from '../domain/models';

@Injectable({
  providedIn: 'root'
})
export class ManuscriptBridgeActionsService {
  private editorService = inject(EditorService);
  private editorSyncFeedback = inject(EditorSyncFeedbackService);
  private toastService = inject(AppNotificationsService);

  /**
   * Applies given text into the active chapter or active sub-branch in the manuscript.
   * Supports 'replace' and 'append' modes and immediately triggers auto-save.
   */
  applyManuscriptUpdate(
    text: string,
    mode: 'replace' | 'append' = 'append',
    targetChapterInput?: ChapterItem | null,
    targetBranchInput?: SubBranchItem | null,
    refineFormValue?: any,
    manuscriptTitle?: string
  ): void {
    if (!text || !text.trim()) {
      this.toastService.showWarning('دەق بەتاڵە', 'هیچ دەقێک نییە بۆ چەسپاندن لە دەستنووسدا.');
      return;
    }

    const trimmed = text.trim();
    const chapters = this.editorService.chapters();
    if (chapters.length === 0) {
      this.toastService.showWarning('دەستنووس بەتاڵە', 'تکایە سەرەتا بەشەکانی تێز لە پەنجەرەی یەکەم ڕێکبخە.');
      return;
    }

    const activeId = this.editorService.activeChapterId();
    const targetChapter = targetChapterInput || (activeId !== null ? chapters.find(c => c.id === activeId) : null) || chapters[0];
    if (!targetChapter) return;

    // Check if there is an active sub-branch to update
    if (targetChapter.axes && targetChapter.axes.length > 0) {
      let branchFound = false;
      const updatedAxes = targetChapter.axes.map(axis => {
        const updatedBranches = axis.branches.map(branch => {
          const isTarget = targetBranchInput ? branch.id === targetBranchInput.id : branch.status === 'writing' || branch.status === 'pending';
          if (!branchFound && isTarget) {
            branchFound = true;
            const finalContent = mode === 'replace' ? trimmed : (branch.content ? `${branch.content}\n\n${trimmed}` : trimmed);
            return {
              ...branch,
              content: finalContent,
              wordCount: countKurdishWords(finalContent),
              status: 'completed' as const
            };
          }
          return branch;
        });
        return { ...axis, branches: updatedBranches };
      });

      if (branchFound) {
        let assembledContent = '';
        for (const ax of updatedAxes) {
          assembledContent += `\n\n## ${ax.title}\n\n`;
          for (const b of ax.branches) {
            if (b.content) {
              assembledContent += `\n### ${b.code} ${b.title}\n\n${b.content}\n`;
            }
          }
        }

        const totalWords = countKurdishWords(assembledContent);
        this.editorService.chapters.update(list =>
          list.map(c => c.id === targetChapter.id ? { ...c, axes: updatedAxes, content: assembledContent, wordCount: totalWords } : c)
        );
        this.editorService.updateChapterContent(targetChapter.id, assembledContent, mode === 'replace' ? 'چەسپاندن لە لق' : 'لکاندن بە لق');
        this.editorSyncFeedback.scheduleSync(this.editorService.chapters(), refineFormValue, manuscriptTitle);
        this.toastService.showSuccess(
          'دەستنووس نوێکرایەوە',
          mode === 'replace' ? 'دەقی لقەکە جێگیر کرا و بە شێوەی خۆکار پاشەکەوت بوو.' : 'دەقەکە بە سەرکەوتوویی بە کۆتایی لقەکەوە لکێندرا و پاشەکەوت بوو.'
        );
        return;
      }
    }

    // Direct chapter update
    const prevContent = targetChapter.content || '';
    const updatedContent = mode === 'replace' ? trimmed : (prevContent ? `${prevContent}\n\n${trimmed}` : trimmed);
    const wordCount = countKurdishWords(updatedContent);

    this.editorService.updateChapterContent(targetChapter.id, updatedContent, mode === 'replace' ? 'چەسپاندن لە دەستنووس' : 'لکاندن بە دەستنووس');
    this.editorService.chapters.update(list =>
      list.map(c => c.id === targetChapter.id ? { ...c, content: updatedContent, wordCount } : c)
    );
    this.editorSyncFeedback.scheduleSync(this.editorService.chapters(), refineFormValue, manuscriptTitle);
    this.toastService.showSuccess(
      'دەستنووس نوێکرایەوە',
      mode === 'replace' ? 'دەقی بەشەکە لە سەرنووسەردا جێگیر کرا و پاشەکەوت بوو.' : 'دەقەکە بە سەرکەوتوویی بە کۆتایی بەشەکەوە لکێندرا و پاشەکەوت بوو.'
    );
  }
}
