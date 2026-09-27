import { Injectable, inject } from '@angular/core';
import { EditorService } from '../features/editor/services/editor';
import { ChapterItemModel as ChapterItem, ChapterSnapshotModel as ChapterSnapshot, SavedManuscriptModel as SavedManuscript } from '../domain/models';
import { encryptText, decryptText, calculateIntegrityHash, verifyChapterIntegrity } from '../helpers/academic-vault';

@Injectable({ providedIn: 'root' })
export class AppUiActionsService {
  private editorService = inject(EditorService);

  getKurdishNumberStr(index: number): string {
    const numbers = ['یەکەم', 'دووەم', 'سێیەم', 'چوارەم', 'پێنجەم', 'شەشەم', 'حەوتەم', 'هەشتەم', 'نۆیەم', 'دەیەم'];
    return numbers[index] || `${index + 1}`;
  }

  getSnippet(text: string, query: string, maxLength = 160): string {
    if (!text) return '';
    if (!query) return text.slice(0, maxLength);
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, maxLength);
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 100);
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  }

  getWordCountOfText(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  appendContentToActiveChapter(contentToAppend: string, reason = 'زیادکردنی ناوەڕۆک') {
    const activeId = this.editorService.activeChapterId();
    const chs = this.editorService.chapters();
    const targetId = activeId !== null ? activeId : (chs[0]?.id ?? null);
    if (targetId !== null) {
      const ch = chs.find(c => c.id === targetId);
      const currentContent = ch ? ch.content : '';
      const updated = currentContent ? `${currentContent}\n\n${contentToAppend}` : contentToAppend;
      this.editorService.updateChapterContent(targetId, updated, reason);
    }
  }

  calculateRigorScore(content: string | undefined): number {
    if (!content) return 0;
    const len = content.length;
    if (len < 100) return 30;
    if (len < 500) return 60;
    if (len < 2000) return 85;
    return 98;
  }

  verifyChapterIntegrity(chapter: ChapterItem): { isValid: boolean; currentHash: string; expectedHash: string } {
    return verifyChapterIntegrity(chapter);
  }

  encryptChapter(chapter: ChapterItem, key: string) {
    if (!chapter.content) return;
    const encrypted = encryptText(chapter.content, key);
    this.editorService.updateChapterContent(chapter.id, encrypted, 'رمزیکردنی بەش');
  }

  decryptChapter(chapter: ChapterItem, key: string) {
    if (!chapter.content) return;
    try {
      const decrypted = decryptText(chapter.content, key);
      this.editorService.updateChapterContent(chapter.id, decrypted, 'دەرهێنان لە رمزیکردن');
    } catch {
      console.error('Decryption failed for chapter:', chapter.id);
    }
  }

  saveSnapshot(chapterId: number, trigger = 'تۆمار') {
    const chs = this.editorService.chapters();
    const ch = chs.find(c => c.id === chapterId);
    if (!ch) return;
    const currentHash = calculateIntegrityHash(ch.content || '');
    const newSnapshot: ChapterSnapshot = {
      timestamp: new Date().toLocaleTimeString('ckb-IQ'),
      hash: currentHash,
      contentSnippet: (ch.content || '').slice(0, 100) + '...',
      content: ch.content || '',
      wordCount: ch.wordCount || 0,
      trigger
    };
    const updatedSnapshots = [newSnapshot, ...(ch.snapshots || [])];
    this.editorService.updateChapterSnapshots(chapterId, updatedSnapshots);
  }

  rollbackSnapshot(chapter: ChapterItem, snapshot: ChapterSnapshot) {
    if (snapshot.contentSnippet) {
      this.saveSnapshot(chapter.id, 'گەڕانەوە بۆ لۆگ');
    }
  }
}
