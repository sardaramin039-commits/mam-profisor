import { Injectable, signal } from '@angular/core';
import { ChapterItemModel, ChapterSnapshotModel } from '../../../domain/models';
import { AcademicFormatter } from '../../../shared/utils/academic-formatter';
import { encryptText, decryptText } from '../../../helpers/academic-vault';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  readonly chapters = signal<ChapterItemModel[]>([]);
  readonly activeChapterId = signal<number | null>(null);

  setChapters(chaps: ChapterItemModel[]) {
    this.chapters.set(chaps);
  }

  updateChapterSnapshots(chapterId: number, snapshots: ChapterSnapshotModel[]) {
    this.chapters.update(list => list.map(c => c.id === chapterId ? { ...c, snapshots } : c));
  }

  updateChapterContent(chapterId: number, newContent: string, triggerReason = 'Auto Save') {
    this.chapters.update(list => {
      return list.map(c => {
        if (c.id === chapterId) {
          const wordCount = AcademicFormatter.countWords(newContent);
          const snapshot: ChapterSnapshotModel = {
            timestamp: new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' }),
            content: newContent,
            wordCount,
            trigger: triggerReason
          };
          const snapshots = c.snapshots ? [snapshot, ...c.snapshots.slice(0, 19)] : [snapshot];
          return {
            ...c,
            content: newContent,
            wordCount,
            snapshots
          };
        }
        return c;
      });
    });
  }

  toggleLock(chapterId: number) {
    this.chapters.update(list => 
      list.map(c => c.id === chapterId ? { ...c, isLocked: !c.isLocked } : c)
    );
  }

  calculateChapterTargetWords(chapterTitle: string, totalWords: number, listLength: number): number {
    const title = (chapterTitle || '').toLowerCase();
    
    if (title.includes('پێشکەشە') || title.includes('dedication')) {
      return 100;
    }
    if (title.includes('پێشەکی') || title.includes('introduction')) {
      return Math.max(800, Math.round(totalWords * 0.125));
    }
    if (title.includes('ئەنجام') || title.includes('conclusion')) {
      return 450;
    }
    if (title.includes('ڕاسپاردە') || title.includes('recommendation')) {
      return 400;
    }
    if (title.includes('پێڕست') || title.includes('contents')) {
      return 250;
    }
    if (title.includes('سەرچاوە') || title.includes('references') || title.includes('bibliography')) {
      return 500;
    }
    return Math.round(totalWords / Math.max(1, listLength));
  }

  async encryptText(plaintext: string, secretKey: string): Promise<string> {
    return encryptText(plaintext, secretKey);
  }

  async decryptText(cipherText: string, secretKey: string): Promise<string> {
    return decryptText(cipherText, secretKey);
  }
}
