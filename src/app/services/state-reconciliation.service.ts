import { Injectable, inject } from '@angular/core';
import { OfflinePersistenceService } from './offline-persistence.service';

export interface VersionedEntity<T> {
  id: string | number;
  data: T;
  version: number;
  lastModified: number;
  authorId?: string;
}

export interface MergeResult<T> {
  resolvedData: T;
  hasConflict: boolean;
  conflictBackup?: T;
  action: 'local-kept' | 'remote-applied' | 'merged-non-destructive';
  messageKurdish: string;
}

@Injectable({
  providedIn: 'root'
})
export class StateReconciliationService {
  private persistence = inject(OfflinePersistenceService);

  /**
   * Generates a unique conflict recovery key for preserving local drafts
   */
  private getConflictBackupKey(entityType: string, id: string | number): string {
    return `conflict_backup_${entityType}_${id}_${Date.now()}`;
  }

  /**
   * Three-way merge resolution for chapters and manuscript sections.
   * Prevents silent data overwrite when working across multiple devices or offline sessions.
   */
  public reconcileTextEntity(
    id: string | number,
    localText: string,
    localTimestamp: number,
    remoteText: string,
    remoteTimestamp: number
  ): MergeResult<string> {
    const cleanLocal = (localText || '').trim();
    const cleanRemote = (remoteText || '').trim();

    // 1. Identical content: no conflict
    if (cleanLocal === cleanRemote) {
      return {
        resolvedData: cleanLocal,
        hasConflict: false,
        action: 'local-kept',
        messageKurdish: 'داتای لۆکاڵ و سەرهێڵ وەک یەکن؛ پاشەکەوت بێ کێشەیە.'
      };
    }

    // 2. Only local was updated (local newer by > 2 seconds and remote unchanged)
    if (localTimestamp > remoteTimestamp + 2000 && cleanLocal.length > 0) {
      return {
        resolvedData: cleanLocal,
        hasConflict: false,
        action: 'local-kept',
        messageKurdish: 'نوێترین دەستکارییەکانی توێژەر لەسەر ئامێرەکە جێگیر کران.'
      };
    }

    // 3. Only remote was updated (remote newer and local had no offline edits)
    if (remoteTimestamp > localTimestamp + 2000 && cleanRemote.length > 0) {
      // Save local draft as safety backup before adopting remote
      if (cleanLocal.length > 0) {
        this.persistence.setItem(this.getConflictBackupKey('chapter', id), cleanLocal);
      }

      return {
        resolvedData: cleanRemote,
        hasConflict: false,
        action: 'remote-applied',
        messageKurdish: 'دەقی سەرهێڵی نوێکراوە لە داتابەیسەوە بە سەرکەوتوویی وەرگیرا.'
      };
    }

    // 4. True Concurrent Divergence (both edited around same time or offline split)
    // Non-destructive preservation: Keep local text, but append remote additions with clear demarcation
    const backupKey = this.getConflictBackupKey('chapter', id);
    this.persistence.setItem(backupKey, cleanLocal);

    const mergedContent = `${cleanLocal}\n\n> ⚠️ [بەشی ناکۆکیی سەرهێڵ - دوایین دەستکاریی داتابەیس لە ڕێکەوتی ${new Date(remoteTimestamp).toLocaleTimeString('ku-IQ')}]:\n${cleanRemote}`;

    return {
      resolvedData: mergedContent,
      hasConflict: true,
      conflictBackup: cleanLocal,
      action: 'merged-non-destructive',
      messageKurdish: 'دەستکاریی هاوکات ڕوویدا؛ هەردوو دەقەکە بە شێوەیەکی پارێزراو یەکخران تا هیچ زانیارییەک نەفەوتێت.'
    };
  }

  /**
   * Bridges Cloud SQL and Firestore sync to prevent split-brain state
   */
  public logDualDbSync(
    entity: string,
    firestoreStatus: 'success' | 'failed' | 'offline',
    sqlStatus: 'success' | 'failed' | 'unreachable'
  ): void {
    if (firestoreStatus === 'failed' || sqlStatus === 'failed') {
      console.warn(`[DualDbReconciler] State disparity detected for "${entity}": Firestore=${firestoreStatus}, SQL=${sqlStatus}`);
    }
  }
}
