import { Injectable, inject } from '@angular/core';
import { AcademicStoreService } from '../services/academic-store.service';
import { AutoSaveManagerService } from '../services/auto-save-manager.service';
import { EditorService } from '../features/editor/services/editor';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private store = inject(AcademicStoreService);
  private autoSaveManager = inject(AutoSaveManagerService);
  private editorService = inject(EditorService);

  async initializeSystem(): Promise<void> {
    console.log('[AppInitializer] Academic Thesis Platform initializing with unified storage persistence...');
    this.store.addLog('سیستەمی ئەکادیمی سەرکەوتووانە دەستی پێکرد.');

    try {
      // Check and restore draft from IndexedDB / LocalStorage so zero user work is lost on page reload
      const hasDraft = await this.autoSaveManager.checkAndDetectDraftOnStartup();
      if (hasDraft) {
        const restored = await this.autoSaveManager.restoreDraft();
        if (restored && restored.chapters?.length) {
          this.store.addLog(`پڕۆژەی ڕەشنووس بە سەرکەوتوویی لە خەزێنەی ئۆفلاین گەڕێندرایەوە (${restored.wordCount || 0} وشە).`);
        }
      }
    } catch (err) {
      console.warn('[AppInitializer] Draft auto-restore warning:', err);
    }
  }
}

