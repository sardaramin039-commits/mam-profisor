import { Injectable, inject } from '@angular/core';
import { EditorService } from '../../editor/services/editor';
import { AcademicStoreService } from '../../../services/academic-store.service';
import { ManuscriptBridgeActionsService } from '../../../services/manuscript-bridge-actions.service';
import { AppNotificationsService } from '../../../core/app.notifications';

@Injectable({
  providedIn: 'root'
})
export class TabContextBridgeService {
  private editorService = inject(EditorService);
  private academicStore = inject(AcademicStoreService);
  private manuscriptBridge = inject(ManuscriptBridgeActionsService);
  private toastService = inject(AppNotificationsService);

  /**
   * Retrieves the comprehensive active thesis context:
   * Title, Research Questions, Methodology, and current Chapter/Sub-branch text.
   */
  getActiveThesisContext(): string {
    const title = this.academicStore.manuscriptTitle() || 'تێزی ئەکادیمی';
    const chapters = this.editorService.chapters();
    const activeId = this.editorService.activeChapterId();
    const activeCh = (activeId !== null ? chapters.find(c => c.id === activeId) : null) || chapters[0];
    const questions = this.academicStore.verticalAlignmentMatrix().map(m => m.questionText).join('؛ ');

    let branchText = '';
    if (activeCh?.axes && activeCh.axes.length > 0) {
      for (const axis of activeCh.axes) {
        for (const branch of axis.branches) {
          if (branch.content) {
            branchText += `\n[${branch.code} ${branch.title}]:\n${branch.content}\n`;
          }
        }
      }
    }

    const chapterContent = branchText || activeCh?.content || '';
    const snippet = `ناونیشانی تێز: ${title}\nپرسیارەکانی توێژینەوە: ${questions || 'کێشە و فەرزنامەی توێژینەوە'}\nبەشی هەڵبژێردراو: ${activeCh?.title || 'بەشی کارپێکراو'}\nدەقی چالاکی دەستنووس:\n${chapterContent.slice(0, 1200)}`;

    return snippet;
  }

  /**
   * Directly inserts given research output into the active manuscript.
   */
  insertIntoManuscript(text: string): void {
    if (!text || !text.trim()) {
      this.toastService.showWarning('دەق بەتاڵە', 'هیچ دەرئەنجامێک نییە بۆ ناردن بۆ دەستنووس.');
      return;
    }
    this.manuscriptBridge.applyManuscriptUpdate(text.trim(), 'append');
  }

  /**
   * Saves the result as a Research Corpus Card for cross-chapter evidence.
   */
  saveAsCorpusCard(title: string, text: string): void {
    if (!text || !text.trim()) {
      this.toastService.showWarning('دەق بەتاڵە', 'هیچ دەرئەنجامێک نییە بۆ پاشەکەوتکردن.');
      return;
    }
    const activeId = this.editorService.activeChapterId();
    this.academicStore.addCorpusCard({
      title: title || 'دەرئەنجامی توێژینەوەی پێشکەوتوو',
      excerptText: text.trim(),
      sourceTitle: title || 'کارتی فیشی پێشکەوتوو',
      author: 'Academic Research Engine',
      targetChapterId: activeId !== null ? activeId : 1,
      category: 'corpus',
      tags: ['advanced_research', 'corpus_card']
    });
    this.toastService.showSuccess('پاشەکەوت کرا', 'دەرئەنجامەکە وەک فیش لە کۆرپەسدا پاشەکەوت کرا.');
  }
}
