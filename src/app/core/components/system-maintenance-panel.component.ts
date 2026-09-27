import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CacheService } from '../services/cache.service';
import { GlobalErrorHandlerService } from '../services/global-error-handler';
import { BackupRestoreService } from '../services/backup-restore.service';
import { OfflineSyncService } from '../services/offline-sync.service';
import { StorageManagerService } from '../../services/storage-manager.service';
import { ManuscriptSyncService } from '../../services/manuscript-sync.service';
import { AppNotificationsService } from '../app.notifications';
import { AcademicApiHealthService } from '../services/academic-api-health.service';

@Component({
  selector: 'app-system-maintenance-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-white shadow-xl text-right font-serif space-y-4" dir="rtl">
      <!-- Status Banner Header -->
      <div class="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <mat-icon class="!w-5 !h-5">verified_user</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-amber-400">سیستمی جێگیریی، کۆگا و ڕاگرتنی سەرانسەری (System Storage & Resilience)</h3>
            <p class="text-[11px] text-stone-400">بەڕێوەبردنی پاشەکەوتی گەورە (IndexedDB)، کاشی خێرا (LocalStorage) و باری ئۆفلاین</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Online/Offline Badge -->
          <span [class]="offlineService.isOnline() 
            ? 'px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1' 
            : 'px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-[11px] font-bold flex items-center gap-1'">
            <mat-icon class="!w-3.5 !h-3.5 text-xs leading-none">{{ offlineService.isOnline() ? 'wifi' : 'wifi_off' }}</mat-icon>
            <span>{{ offlineService.isOnline() ? 'ئۆنلاین (سەرکەوتوو)' : 'ئۆفلاین (Local Fallback)' }}</span>
          </span>

          <button 
            (click)="toggleExpanded()"
            class="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-all cursor-pointer"
            title="پیشاندان یان شاردنەوە">
            <mat-icon>{{ isExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
      </div>

      <!-- VISUAL INDICATOR: Storage Usage & LocalStorage / IndexedDB Split -->
      <div class="bg-stone-800/90 rounded-xl p-3.5 border border-stone-700/80 space-y-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div class="flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 text-emerald-400 text-sm">storage</mat-icon>
            <span class="font-bold text-stone-200">دۆخی کۆگاکردن و دابەشبوونی کاش (Storage Usage & Split)</span>
          </div>

          <div class="flex items-center gap-3 text-[11px]">
            <span class="text-stone-300 font-mono">
              بەکاربراو: <strong class="text-emerald-400">{{ storageManager.metrics().totalUsedFormatted }}</strong> / {{ storageManager.metrics().quotaMB }} MB
            </span>
            <button
              (click)="onRefreshStorage()"
              [class.animate-spin]="storageManager.isRefreshing()"
              class="text-stone-400 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
              title="نوێکردنەوەی ئامارەکان">
              <mat-icon class="!w-4 !h-4 text-xs">refresh</mat-icon>
            </button>
          </div>
        </div>

        <!-- Progress Split Bar -->
        <div class="w-full h-3 bg-stone-950 rounded-full overflow-hidden flex border border-stone-700" title="دابەشبوونی قەبارەی کۆگا">
          <!-- IndexedDB portion (Cyan/Emerald) -->
          <div 
            class="h-full bg-linear-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
            [style.width]="(storageManager.metrics().indexedDbSplitPercent || 50) + '%'"
            title="IndexedDB Usage"></div>
          <!-- LocalStorage portion (Amber) -->
          <div 
            class="h-full bg-amber-500 transition-all duration-500"
            [style.width]="(storageManager.metrics().localStorageSplitPercent || 50) + '%'"
            title="LocalStorage Usage"></div>
        </div>

        <!-- Legend and details split -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <!-- IndexedDB Box -->
          <div class="bg-stone-900/80 p-2 rounded-lg border border-cyan-500/30 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
              <span class="text-stone-300 font-medium">IndexedDB (گەورە):</span>
            </div>
            <span class="font-mono text-cyan-300 font-bold">{{ storageManager.metrics().indexedDbFormatted }}</span>
          </div>

          <!-- LocalStorage Box -->
          <div class="bg-stone-900/80 p-2 rounded-lg border border-amber-500/30 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
              <span class="text-stone-300 font-medium">LocalStorage (خێرا):</span>
            </div>
            <span class="font-mono text-amber-300 font-bold">{{ storageManager.metrics().localStorageFormatted }}</span>
          </div>

          <!-- Manuscript Caching Badge -->
          <div class="col-span-2 sm:col-span-1 bg-stone-900/80 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <mat-icon class="!w-3.5 !h-3.5 text-emerald-400 text-xs">history_edu</mat-icon>
              <span class="text-stone-300 font-medium">تێزی پاشەکەوتکراو:</span>
            </div>
            <span class="font-mono text-emerald-300 font-bold text-[10px]">
              {{ storageManager.metrics().totalWordsCached > 0 ? (storageManager.metrics().totalWordsCached | number) + ' وشە' : 'پارێزراو لە IDB' }}
            </span>
          </div>
        </div>
      </div>

      <!-- AUTOMATED ACADEMIC APIS HEALTH MONITOR: Crossref, OpenAlex, Google Books -->
      <div class="bg-stone-800/90 rounded-xl p-3.5 border border-stone-700/80 space-y-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div class="flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 text-cyan-400 text-sm">hub</mat-icon>
            <span class="font-bold text-stone-200">چاودێری و پشکنینی خۆکاری APIـە ئەکادیمییەکان (Academic APIs Health)</span>
            <span [class]="apiHealthService.healthData().allHealthy
              ? 'px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40'">
              {{ apiHealthService.healthData().allHealthy ? '🟢 ALL APIS ONLINE' : '🟡 DEGRADED LATENCY' }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-[11px]">
            <button
              (click)="onRefreshApiHealth()"
              [disabled]="apiHealthService.isChecking()"
              class="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-stone-200 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer">
              <mat-icon [class.animate-spin]="apiHealthService.isChecking()" class="!w-3.5 !h-3.5 text-xs">refresh</mat-icon>
              <span>پشکنینی دەستبەجێ</span>
            </button>
          </div>
        </div>

        <!-- 3 External APIs Connectivity Status Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <!-- Crossref -->
          <div class="bg-stone-900/90 p-2.5 rounded-xl border border-stone-700/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span [class]="apiHealthService.healthData().crossref.status === 'healthy' ? 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'w-2.5 h-2.5 rounded-full bg-amber-400'"></span>
              <div>
                <div class="font-bold text-stone-200">Crossref API</div>
                <div class="text-[10px] text-stone-400">150M+ DOIs & Citations</div>
              </div>
            </div>
            <div class="text-left font-mono">
              <span class="text-emerald-400 font-bold block">{{ apiHealthService.healthData().crossref.latencyMs }}ms</span>
              <span class="text-[9px] text-stone-400 uppercase">{{ apiHealthService.healthData().crossref.status }}</span>
            </div>
          </div>

          <!-- OpenAlex -->
          <div class="bg-stone-900/90 p-2.5 rounded-xl border border-stone-700/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span [class]="apiHealthService.healthData().openalex.status === 'healthy' ? 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'w-2.5 h-2.5 rounded-full bg-amber-400'"></span>
              <div>
                <div class="font-bold text-stone-200">OpenAlex Catalog</div>
                <div class="text-[10px] text-stone-400">250M+ Scholarly Works</div>
              </div>
            </div>
            <div class="text-left font-mono">
              <span class="text-emerald-400 font-bold block">{{ apiHealthService.healthData().openalex.latencyMs }}ms</span>
              <span class="text-[9px] text-stone-400 uppercase">{{ apiHealthService.healthData().openalex.status }}</span>
            </div>
          </div>

          <!-- Google Books -->
          <div class="bg-stone-900/90 p-2.5 rounded-xl border border-stone-700/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span [class]="apiHealthService.healthData().googlebooks.status === 'healthy' ? 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'w-2.5 h-2.5 rounded-full bg-amber-400'"></span>
              <div>
                <div class="font-bold text-stone-200">Google Books API</div>
                <div class="text-[10px] text-stone-400">Digitized Library Corpus</div>
              </div>
            </div>
            <div class="text-left font-mono">
              <span class="text-emerald-400 font-bold block">{{ apiHealthService.healthData().googlebooks.latencyMs }}ms</span>
              <span class="text-[9px] text-stone-400 uppercase">{{ apiHealthService.healthData().googlebooks.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div class="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-1">
          <div class="text-stone-400 text-[10px]">خێرایی و کاش (Hits / Misses)</div>
          <div class="font-bold text-amber-300 font-mono text-sm">
            {{ cacheService.cacheHits() }} / {{ cacheService.cacheMisses() }}
          </div>
        </div>

        <div class="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-1">
          <div class="text-stone-400 text-[10px]">لۆگی هەڵەکان (Logged Errors)</div>
          <div class="font-bold text-emerald-400 font-mono text-sm">
            {{ errorHandler.errorLogs().length }}
          </div>
        </div>

        <div class="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-1">
          <div class="text-stone-400 text-[10px]">دوا سینککردن (Last Sync)</div>
          <div class="font-bold text-stone-300 font-mono text-[10px] truncate">
            {{ manuscriptSync.lastSyncTime() ? (manuscriptSync.lastSyncTime() | date:'shortTime') : 'تەواو جێگیر' }}
          </div>
        </div>

        <div class="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-1">
          <div class="text-stone-400 text-[10px]">وەشانی سیستەم (Version)</div>
          <div class="font-bold text-emerald-400 font-mono text-sm">v2.6.0 Stable</div>
        </div>
      </div>

      <!-- Expanded Control Tools & Documentation Links -->
      @if (isExpanded()) {
        <div class="pt-3 border-t border-stone-800 space-y-4">
          <!-- Action Buttons (Manual Clear Caches & Optimization) -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <button
              (click)="onClearLocalStorageCache()"
              class="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <mat-icon class="!w-4 !h-4 text-xs">cleaning_services</mat-icon>
              <span>سڕینەوەی کاشی LocalStorage</span>
            </button>

            <button
              (click)="onClearIndexedDbCache()"
              class="px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <mat-icon class="!w-4 !h-4 text-xs">auto_delete</mat-icon>
              <span>سڕینەوەی کاشی کاتیی IndexedDB</span>
            </button>

            <button
              (click)="onMigrateAndOptimize()"
              class="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <mat-icon class="!w-4 !h-4 text-xs">sync</mat-icon>
              <span>ڕێکخستن و گواستنەوەی دەستبەجێ بۆ IDB</span>
            </button>

            <button
              (click)="backupService.exportFullBackup()"
              class="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <mat-icon class="!w-4 !h-4 text-xs">download</mat-icon>
              <span>داگرتنی داتا (Backup JSON)</span>
            </button>

            <label class="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <mat-icon class="!w-4 !h-4 text-xs">upload</mat-icon>
              <span>گه‌ڕاندنه‌وه‌ی داتا (Restore)</span>
              <input type="file" (change)="onFileSelected($event)" accept=".json" class="hidden" />
            </label>

            <a
              href="/api/docs"
              target="_blank"
              class="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 text-xs">api</mat-icon>
              <span>بەڵگەنامەی API</span>
            </a>
          </div>

          <!-- Status / Feedback -->
          @if (backupService.statusMessage()) {
            <div class="p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-amber-300 font-sans">
              {{ backupService.statusMessage() }}
            </div>
          }

          <!-- Recent Error Log Snippet if any -->
          @if (errorHandler.errorLogs().length > 0) {
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[11px] text-stone-400">
                <span>تۆماری ئاگادارییەکانی هەڵە (Recent Error Logs):</span>
                <button (click)="errorHandler.clearErrors()" class="text-rose-400 hover:underline cursor-pointer">سڕینەوە</button>
              </div>
              <div class="bg-black/50 p-2.5 rounded-xl border border-stone-800 max-h-24 overflow-y-auto text-[11px] font-mono text-stone-300 space-y-1">
                @for (log of errorHandler.errorLogs(); track log.id) {
                  <div class="text-rose-300">[{{ log.timestamp | date:'HH:mm:ss' }}] {{ log.message }}</div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SystemMaintenancePanelComponent implements OnInit {
  public cacheService = inject(CacheService);
  public errorHandler = inject(GlobalErrorHandlerService);
  public backupService = inject(BackupRestoreService);
  public offlineService = inject(OfflineSyncService);
  public storageManager = inject(StorageManagerService);
  public manuscriptSync = inject(ManuscriptSyncService);
  public notifications = inject(AppNotificationsService);
  public apiHealthService = inject(AcademicApiHealthService);

  isExpanded = signal<boolean>(false);

  ngOnInit(): void {
    // Automatically trigger health check in background on load
    this.apiHealthService.checkHealth().catch(() => {});
  }

  async onRefreshApiHealth(): Promise<void> {
    await this.apiHealthService.checkHealth();
    if (this.apiHealthService.healthData().allHealthy) {
      this.notifications.showSuccess('پشکنینی API ئەنجامدرا', 'سەرجەم داتابەیسە زانستییە جیهانییەکان (Crossref, OpenAlex, Google Books) ئۆنلاینن.');
    } else {
      this.notifications.showWarning('کێشەی کاتی لە هێڵ', 'هەندێک لە APIـەکان کاتی وەڵامدانەوەیان بەرزە یان کێشەی هێڵیان هەیە.');
    }
  }

  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  async onRefreshStorage(): Promise<void> {
    await this.storageManager.refreshMetrics();
    this.notifications.showInfo('ئاماری کۆگا نوێکرایەوە', 'قەبارەی پاشەکەوت و دابەشبوونی میمۆری لە کاتی ڕاستەقینەدا پێوانەکرایەوە.');
  }

  onClearLocalStorageCache(): void {
    const success = this.storageManager.clearLocalStorageCache();
    if (success) {
      this.notifications.showSuccess('کاشی LocalStorage سڕایەوە', 'کاشە کاتییەکان لە LocalStorage پاککرانەوە و یادگە بەتاڵکرایەوە.');
    }
  }

  async onClearIndexedDbCache(): Promise<void> {
    const success = await this.storageManager.clearIndexedDbCache();
    if (success) {
      this.notifications.showSuccess('کاشی کاتیی IndexedDB سڕایەوە', 'کاشی کاتیی نێو IndexedDB بە سەرکەوتوویی خاوێنکرایەوە.');
    }
  }

  async onMigrateAndOptimize(): Promise<void> {
    const migrated = await this.manuscriptSync.checkAndMigrateLargeDraft();
    await this.storageManager.refreshMetrics();
    if (migrated) {
      this.notifications.showSuccess('گواستنەوە سەرکەوتوو بوو', 'بەشە گەورەکانی دەقی تێزەکە بە سەلامەتی گوازرانەوە بۆ IndexedDB.');
    } else {
      this.notifications.showInfo('سیستەم تەواو ئۆپتیمايزکراوە', 'دەقەکان لە دۆخێکی جێگیردایە و لە بنکەدراوەی IndexedDB پارێزراون.');
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.backupService.restoreFromFile(file).then(() => {
        setTimeout(() => location.reload(), 1500);
      });
    }
  }
}
