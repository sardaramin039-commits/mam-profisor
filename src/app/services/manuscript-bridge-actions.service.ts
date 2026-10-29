import { Injectable, inject } from '@angular/core';
import { EditorService } from '../features/editor/services/editor';
import { EditorSyncFeedbackService } from './editor-sync-feedback.service';
import { AppNotificationsService } from '../core/app.notifications';
import { countKurdishWords } from './data';
import { ChapterItemModel as ChapterItem, SubBranchItem } from '../domain/models';
import { buildAcademicThesisOutline } from '../helpers/outline-structure';
import { SourceVerificationService } from './source-verification.service';

@Injectable({
  providedIn: 'root'
})
export class ManuscriptBridgeActionsService {
  private editorService = inject(EditorService);
  private editorSyncFeedback = inject(EditorSyncFeedbackService);
  private toastService = inject(AppNotificationsService);
  private sourceVerificationService = inject(SourceVerificationService);

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

  /**
   * Tree manipulation methods for Chapter, Axis, and Sub-branch
   */
  addChapter(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, title?: string): ChapterItem {
    const list = chaptersSignal();
    const nextId = list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1;
    const kurdishNames = ['یەکەم', 'دووەم', 'سێیەم', 'چوارەم', 'پێنجەم', 'شەشەم', 'حەوتەم', 'هەشتەم', 'نۆیەم', 'دەیەم'];
    const kurdishNum = kurdishNames[nextId - 1] || String(nextId);
    const finalTitle = title || `بەشی ${kurdishNum}: تەوەری نوێی ئەکادیمی`;

    const newChapter: ChapterItem = {
      id: nextId,
      title: finalTitle,
      wordCount: 0,
      status: 'pending',
      content: '',
      academicNotes: '',
      axes: [
        {
          id: `${nextId}.1`,
          code: 'تەوەری یەکەم',
          title: 'چوارچێوەی گشتی و چەمکسازی',
          targetWords: 1500,
          wordCount: 0,
          branches: [
            { id: `${nextId}.1.1`, code: `${nextId}.١.١`, title: 'پێشینەی کێشە و چەمکە سەرەکییەکان', targetWords: 750, wordCount: 0, status: 'pending' },
            { id: `${nextId}.1.2`, code: `${nextId}.١.٢`, title: 'شیکاریی لایەنەکان و بەراوردکاری', targetWords: 750, wordCount: 0, status: 'pending' }
          ]
        }
      ]
    };

    chaptersSignal.update(arr => [...arr, newChapter]);
    this.editorService.chapters.set(chaptersSignal());
    this.toastService.showSuccess('بەش زیادکرا', `«${finalTitle}» بۆ پەیکەری تێزەکە زیادکرا.`);
    return newChapter;
  }

  renameChapter(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, newTitle?: string): void {
    const target = chaptersSignal().find(c => c.id === chapterId);
    if (!target) return;
    const finalTitle = newTitle || (typeof window !== 'undefined' ? window.prompt('تکایە ناونیشانی نوێ بۆ بەشەکە بنووسە:', target.title) : target.title);
    if (finalTitle && finalTitle.trim()) {
      chaptersSignal.update(list => list.map(c => c.id === chapterId ? { ...c, title: finalTitle.trim() } : c));
      this.editorService.chapters.set(chaptersSignal());
      this.toastService.showSuccess('ناونیشان نوێکرایەوە', 'ناونیشانی بەشەکە بە سەرکەوتوویی نوێکرایەوە.');
    }
  }

  deleteChapter(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number): void {
    const target = chaptersSignal().find(c => c.id === chapterId);
    chaptersSignal.update(list => list.filter(c => c.id !== chapterId));
    this.editorService.chapters.set(chaptersSignal());
    this.toastService.showSuccess('بەش سڕایەوە', `«${target?.title || 'بەش'}» لە پەیکەری تێز سڕایەوە.`);
  }

  moveChapterUp(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number): void {
    const list = [...chaptersSignal()];
    const idx = list.findIndex(c => c.id === chapterId);
    if (idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      chaptersSignal.set(list);
      this.editorService.chapters.set(list);
    }
  }

  moveChapterDown(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number): void {
    const list = [...chaptersSignal()];
    const idx = list.findIndex(c => c.id === chapterId);
    if (idx !== -1 && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      chaptersSignal.set(list);
      this.editorService.chapters.set(list);
    }
  }

  addAxis(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, axisTitle?: string): void {
    const kurdishAxisNames = ['تەوەری یەکەم', 'تەوەری دووەم', 'تەوەری سێیەم', 'تەوەری چوارەم', 'تەوەری پێنجەم', 'تەوەری شەشەم'];
    chaptersSignal.update(list => list.map(c => {
      if (c.id !== chapterId) return c;
      const axes = c.axes ? [...c.axes] : [];
      const nextAxisNum = axes.length + 1;
      const axisId = `${chapterId}.${nextAxisNum}`;
      const code = kurdishAxisNames[nextAxisNum - 1] || `تەوەری ${nextAxisNum}`;
      const title = axisTitle || (nextAxisNum === 1 ? 'چوارچێوەی تیۆری' : nextAxisNum === 2 ? 'شیکاریی پراکتیکی و دەقەکان' : 'تاوتوێ و ئەنجامەکان');
      axes.push({
        id: axisId,
        code,
        title,
        targetWords: 1500,
        wordCount: 0,
        branches: [
          { id: `${axisId}.1`, code: `${axisId}.١`, title: 'بڕگەی یەکەم: خستنەڕوو', targetWords: 750, wordCount: 0, status: 'pending' },
          { id: `${axisId}.2`, code: `${axisId}.٢`, title: 'بڕگەی دووەم: شیکاریی بەراوردکاری', targetWords: 750, wordCount: 0, status: 'pending' }
        ]
      });
      return { ...c, axes };
    }));
    this.editorService.chapters.set(chaptersSignal());
    this.toastService.showSuccess('تەوەر زیادکرا', 'تەوەری نوێ بە سەرکەوتوویی بۆ ئەم بەشە زیادکرا.');
  }

  renameAxis(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, axisId: string, newTitle?: string): void {
    const chapter = chaptersSignal().find(c => c.id === chapterId);
    const axis = chapter?.axes?.find(a => a.id === axisId);
    const finalTitle = newTitle || (typeof window !== 'undefined' ? window.prompt('تکایە ناونیشانی نوێی تەوەر بنووسە:', axis?.title) : axis?.title);
    if (finalTitle && finalTitle.trim()) {
      chaptersSignal.update(list => list.map(c => {
        if (c.id !== chapterId || !c.axes) return c;
        return {
          ...c,
          axes: c.axes.map(a => a.id === axisId ? { ...a, title: finalTitle.trim() } : a)
        };
      }));
      this.editorService.chapters.set(chaptersSignal());
      this.toastService.showSuccess('تەوەر گۆڕدرا', 'ناوی تەوەر نوێکرایەوە.');
    }
  }

  deleteAxis(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, axisId: string): void {
    chaptersSignal.update(list => list.map(c => {
      if (c.id !== chapterId || !c.axes) return c;
      return {
        ...c,
        axes: c.axes.filter(a => a.id !== axisId)
      };
    }));
    this.editorService.chapters.set(chaptersSignal());
    this.toastService.showSuccess('تەوەر سڕایەوە', 'تەوەرەکە لە بەشەکە سڕایەوە.');
  }

  addBranch(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, axisId: string, branchTitle?: string): void {
    chaptersSignal.update(list => list.map(c => {
      if (c.id !== chapterId || !c.axes) return c;
      return {
        ...c,
        axes: c.axes.map(a => {
          if (a.id !== axisId) return a;
          const branches = a.branches ? [...a.branches] : [];
          const nextBrNum = branches.length + 1;
          const brId = `${axisId}.${nextBrNum}`;
          const code = `${axisId}.${nextBrNum}`;
          branches.push({
            id: brId,
            code,
            title: branchTitle || `لقی ${nextBrNum}: شیکاری و بەڵگەسازی`,
            targetWords: 750,
            wordCount: 0,
            status: 'pending'
          });
          return { ...a, branches };
        })
      };
    }));
    this.editorService.chapters.set(chaptersSignal());
    this.toastService.showSuccess('لق زیادکرا', 'لقی نوێ بۆ تەوەرەکە زیادکرا.');
  }

  renameBranch(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, axisId: string, branchId: string, newTitle?: string): void {
    const chapter = chaptersSignal().find(c => c.id === chapterId);
    const axis = chapter?.axes?.find(a => a.id === axisId);
    const branch = axis?.branches?.find(b => b.id === branchId);
    const finalTitle = newTitle || (typeof window !== 'undefined' ? window.prompt('تکایە ناونیشانی نوێی لق بنووسە:', branch?.title) : branch?.title);
    if (finalTitle && finalTitle.trim()) {
      chaptersSignal.update(list => list.map(c => {
        if (c.id !== chapterId || !c.axes) return c;
        return {
          ...c,
          axes: c.axes.map(a => {
            if (a.id !== axisId || !a.branches) return a;
            return {
              ...a,
              branches: a.branches.map(b => b.id === branchId ? { ...b, title: finalTitle.trim() } : b)
            };
          })
        };
      }));
      this.editorService.chapters.set(chaptersSignal());
      this.toastService.showSuccess('لق نوێکرایەوە', 'ناوی لق بە سەرکەوتوویی نوێکرایەوە.');
    }
  }

  deleteBranch(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, chapterId: number, axisId: string, branchId: string): void {
    chaptersSignal.update(list => list.map(c => {
      if (c.id !== chapterId || !c.axes) return c;
      return {
        ...c,
        axes: c.axes.map(a => {
          if (a.id !== axisId || !a.branches) return a;
          return {
            ...a,
            branches: a.branches.filter(b => b.id !== branchId)
          };
        })
      };
    }));
    this.editorService.chapters.set(chaptersSignal());
    this.toastService.showSuccess('لق سڕایەوە', 'لقەکە لە تەوەرەکە سڕایەوە.');
  }

  aiGenerateStructure(chaptersSignal: { (): ChapterItem[]; update: (fn: (val: ChapterItem[]) => ChapterItem[]) => void; set: (val: ChapterItem[]) => void }, formValue: any): void {
    const options = {
      title: formValue?.title || 'تێزی زانستی',
      discipline: formValue?.discipline || 'humanities',
      writingType: formValue?.writingType || 'book',
      academicLevel: formValue?.academicLevel || 'master',
      targetPages: formValue?.targetPages || formValue?.size || 10,
      includeDedication: formValue?.includeDedication ?? true,
      includeIntro: formValue?.includeIntro ?? true,
      includeTOC: formValue?.includeTOC ?? true,
      includeConclusion: formValue?.includeConclusion ?? true,
      includeRecommendations: formValue?.includeRecommendations ?? true,
      includeReferences: formValue?.includeReferences ?? true,
      customSourcesOn: formValue?.customSourcesOn ?? false,
      customSourcesText: formValue?.customSourcesText || '',
      customTOCOn: formValue?.customTOCOn ?? false,
      customTOCText: formValue?.customTOCText || '',
      fieldWorkOn: formValue?.fieldWorkOn ?? false,
      fieldWorkText: formValue?.fieldWorkText || '',
      thesisStructureType: formValue?.thesisStructureType || 'humanities'
    };
    const outline = buildAcademicThesisOutline(options);
    chaptersSignal.set(outline);
    this.editorService.chapters.set(outline);
    const structName = formValue?.thesisStructureType === 'empirical' ? 'زانستە ئەزموونییەکان (٥ بەش)' : 'زانستە مرۆڤایەتییەکان';
    this.toastService.showSuccess('پەیکەری تێز داڕێژرا', `پەیکەری تێز بەپێی ستانداردی «${structName}» بە سەرکەوتوویی نوێکرایەوە.`);
  }

  injectAcademicSourceCitation(source: any, mode: 'inline' | 'footnote' | 'bibliography' = 'inline', targetChapter?: ChapterItem | null): void {
    // Strict Verification Gating: Only VERIFIED and user-approved records can be inserted
    const check = this.sourceVerificationService.isEligibleForCitation(source);
    if (!check.eligible) {
      this.toastService.showError(
        'دانانی سەرچاوە ڕەتکرایەوە (Unverified/Unapproved)',
        check.reason || 'تەنها ئەو سەرچاوەیانە شیاون بۆ دانان کە بە فەرمی لە Crossref یان OpenAlex پشتڕاستکراونەتەوە و لە لایەن بەکارهێنەرەوە پەسەند کراون.'
      );
      return;
    }

    const verifiedRecord = check.source || source;
    // Format citation without inventing non-existent metadata
    const formatted = this.sourceVerificationService.formatCitation(verifiedRecord, mode);

    if (typeof document !== 'undefined') {
      const textarea = (document.querySelector('#chapterTextarea') as HTMLTextAreaElement) || document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        const insertText = mode === 'inline' ? ` ${formatted} ` : `\n${formatted}\n`;
        textarea.value = textarea.value.substring(0, start) + insertText + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }
    }

    const activeChapter = targetChapter || this.editorService.chapters().find(c => c.id === this.editorService.activeChapterId()) || this.editorService.chapters()[0];
    if (activeChapter) {
      const prevContent = activeChapter.content || '';
      const updatedContent = prevContent ? `${prevContent}\n${formatted}` : formatted;
      this.editorService.updateChapterContent(activeChapter.id, updatedContent, 'دانانی سەرچاوەی پشتڕاستکراو لە دەقدا');
    }

    const displayName = verifiedRecord.authors?.[0] || verifiedRecord.title;
    this.toastService.showSuccess('سەرچاوەی پەسەندکراو دانرا', `سەرچاوەی «${displayName}» بە سەرکەوتوویی خرایە ناو دەقی سەرنووسەر.`);
  }
}
