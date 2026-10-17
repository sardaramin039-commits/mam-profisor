import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DigitalLibraryService } from '../../../services/digital-library.service';
import { crawlerEngine } from '../services/crawler-engine';
import { SupportedLanguage, DocumentType } from '../../../models/digital-library.model';

@Component({
  selector: 'app-library-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      
      <!-- Modal Box -->
      <div class="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        
        <!-- Header Bar -->
        <div class="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-stone-100">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <mat-icon class="!w-6 !h-6">admin_panel_settings</mat-icon>
            </div>
            <div>
              <h2 class="font-serif font-bold text-lg text-amber-300">
                {{ lib.t().adminDashboard }}
              </h2>
              <p class="text-xs text-stone-400">
                سیستمی ڕەوتکردنەوە و پشکنینی سەرچاوە و ئیندێکسکردنی کتێبخانەی دیجیتاڵی
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Trigger Sync Button -->
            <button
              type="button"
              (click)="runSync()"
              [disabled]="lib.isSyncing()"
              class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <mat-icon [class.animate-spin]="lib.isSyncing()" class="!w-4 !h-4">sync</mat-icon>
              <span>{{ lib.isSyncing() ? 'جێبەجێکردن...' : lib.t().syncNow }}</span>
            </button>

            <!-- Close Action -->
            <button type="button" (click)="closeDialog.emit()" class="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors">
              <mat-icon class="!w-5 !h-5">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Dashboard Content Body -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-950/60">
          
          <!-- Top Stat Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <span class="text-xs text-stone-400">کۆی گشتی کتێبخانەکان</span>
              <p class="font-mono text-2xl font-bold text-amber-400">{{ lib.sources().length }}</p>
              <span class="text-[10px] text-stone-400">{{ stats().activeSources }} سەرچاوە چالاکە</span>
            </div>

            <div class="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <span class="text-xs text-stone-400">کتێب و بەڵگەنامەی ئیندێکسکراو</span>
              <p class="font-mono text-2xl font-bold text-stone-100">{{ stats().totalBooks }}</p>
              <span class="text-[10px] text-stone-400">لە کەتەلۆگی ناوخۆی ئەپ</span>
            </div>

            <div class="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <span class="text-xs text-stone-400">تۆماری زیانیار سڕاوە (Dedup)</span>
              <p class="font-mono text-2xl font-bold text-emerald-400">{{ stats().duplicateCount }}</p>
              <span class="text-[10px] text-stone-400">کاتی ئیندێکسکردن</span>
            </div>

            <div class="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <span class="text-xs text-stone-400">دوا هاودەمکردن</span>
              <p class="font-sans text-xs font-bold text-amber-300 truncate mt-2">{{ stats().lastSyncTime | date:'short' }}</p>
              <span class="text-[10px] text-stone-400">خولگەی ٢٤ کاتژمێری</span>
            </div>
          </div>

          <!-- Tab Navigation inside Admin -->
          <div class="flex items-center gap-2 border-b border-stone-800 pb-2">
            <button
              (click)="activeTab.set('sources')"
              [class]="activeTab() === 'sources' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-300 hover:bg-stone-800'"
              class="px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              کۆکراوەی سەرچاوەکان
            </button>
            <button
              (click)="activeTab.set('add_book')"
              [class]="activeTab() === 'add_book' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-300 hover:bg-stone-800'"
              class="px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              زیادکردنی کتێبی نوێ
            </button>
            <button
              (click)="activeTab.set('logs')"
              [class]="activeTab() === 'logs' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-300 hover:bg-stone-800'"
              class="px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              لۆگەکانی سیستەم (Logs)
            </button>
          </div>

          <!-- TAB 1: Sources List -->
          @if (activeTab() === 'sources') {
            <div class="space-y-3">
              <h3 class="font-serif font-bold text-sm text-stone-200">
                لیستی سەرچاوەکان و دۆخی پشکنینیان:
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (src of lib.sources(); track src.id) {
                  <div class="bg-stone-900 border border-stone-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-serif font-bold text-amber-300 truncate">{{ src.nameKurdish || src.name }}</span>
                        <span class="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {{ src.status }}
                        </span>
                      </div>
                      <p class="text-[11px] text-stone-400 mt-1 line-clamp-2 font-sans">{{ src.description }}</p>
                    </div>

                    <div class="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                      <span>کۆی بەڵگەنامە: {{ src.totalItems }}</span>
                      <a [href]="src.url" target="_blank" class="text-amber-400 hover:underline">سەردان</a>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB 2: Add Custom Book Form -->
          @if (activeTab() === 'add_book') {
            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 max-w-2xl mx-auto">
              <h3 class="font-serif font-bold text-base text-amber-300 border-b border-stone-800 pb-2">
                فۆرمی زیادکردنی کتێب یان دەستنووسی نوێ بۆ ئەرشیڤ
              </h3>

              <form [formGroup]="addBookForm" (ngSubmit)="submitBook()" class="space-y-3 text-right">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label for="book-title-input" class="block text-xs font-bold text-stone-400 mb-1">ناونیشانی کتێب *</label>
                    <input id="book-title-input" formControlName="title" type="text" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none" />
                  </div>
                  <div>
                    <label for="book-author-input" class="block text-xs font-bold text-stone-400 mb-1">ناوی نووسەر / لێکۆڵەر *</label>
                    <input id="book-author-input" formControlName="author" type="text" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label for="book-year-input" class="block text-xs font-bold text-stone-400 mb-1">ساڵی بڵاوکردنەوە</label>
                    <input id="book-year-input" formControlName="year" type="number" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none" />
                  </div>
                  <div>
                    <label for="book-lang-select" class="block text-xs font-bold text-stone-400 mb-1">زمان</label>
                    <select id="book-lang-select" formControlName="language" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none">
                      <option value="ckb">کوردی (سۆرانی)</option>
                      <option value="kmr">کوردی (کورمانجی)</option>
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                      <option value="fa">فارسی</option>
                      <option value="tr">Türkçe</option>
                    </select>
                  </div>
                  <div>
                    <label for="book-type-select" class="block text-xs font-bold text-stone-400 mb-1">جۆری بەڵگەنامە</label>
                    <select id="book-type-select" formControlName="documentType" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none">
                      <option value="book">کتێب</option>
                      <option value="article">وتار</option>
                      <option value="journal">گۆڤار</option>
                      <option value="thesis">تێز</option>
                      <option value="manuscript">دەستنووس</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label for="book-desc-input" class="block text-xs font-bold text-stone-400 mb-1">پوختە و وەسف</label>
                  <textarea id="book-desc-input" formControlName="description" rows="3" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none"></textarea>
                </div>

                <div>
                  <label for="book-url-input" class="block text-xs font-bold text-stone-400 mb-1">لینکی دابەزاندنی PDF</label>
                  <input id="book-url-input" formControlName="downloadUrl" type="url" class="w-full bg-stone-800 text-stone-100 text-xs p-2.5 rounded-xl border border-stone-700 outline-none" />
                </div>

                <button
                  type="submit"
                  [disabled]="addBookForm.invalid"
                  class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  پاشەکەوتکردن لە ئەرشیڤی گشتی
                </button>
              </form>
            </div>
          }

          <!-- TAB 3: System Crawling Logs -->
          @if (activeTab() === 'logs') {
            <div class="space-y-3">
              <h3 class="font-serif font-bold text-sm text-stone-200">مێژووی لۆگەکانی ڕەوتکردنەوە:</h3>
              <div class="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden font-mono text-xs">
                @for (log of syncLogs(); track log.id) {
                  <div class="p-3 border-b border-stone-800/80 flex items-center justify-between text-stone-300">
                    <div>
                      <span class="text-amber-400 font-bold">[{{ log.timestamp | date:'mediumTime' }}]</span>
                      <span class="ml-2">{{ log.message }}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                      {{ log.durationMs }}ms
                    </span>
                  </div>
                }
              </div>
            </div>
          }

        </div>

      </div>

    </div>
  `
})
export class LibraryAdminDashboardComponent {
  public lib = inject(DigitalLibraryService);
  public closeDialog = output<void>();
  public activeTab = signal<'sources' | 'add_book' | 'logs'>('sources');
  public stats = signal(crawlerEngine.getAdminStats());
  public syncLogs = signal(crawlerEngine.getSyncLogs());

  private fb = inject(FormBuilder);

  public addBookForm = this.fb.group({
    title: ['', Validators.required],
    author: ['', Validators.required],
    year: [null, Validators.required],
    language: ['ckb' as SupportedLanguage, Validators.required],
    documentType: ['book' as DocumentType, Validators.required],
    description: [''],
    downloadUrl: ['https://www.kurdipedia.org']
  });

  public runSync(): void {
    this.lib.isSyncing.set(true);
    crawlerEngine.triggerSync().then(() => {
      this.lib.isSyncing.set(false);
      this.stats.set(crawlerEngine.getAdminStats());
      this.syncLogs.set(crawlerEngine.getSyncLogs());
      // Refresh books list in service
      this.lib.books.set([...crawlerEngine.getCatalog()]);
    });
  }

  public submitBook(): void {
    if (this.addBookForm.valid) {
      const val = this.addBookForm.value;
      crawlerEngine.addBook({
        title: val.title || '',
        author: val.author || '',
        year: val.year ?? 0,
        language: val.language as SupportedLanguage,
        documentType: val.documentType as DocumentType,
        description: val.description || '',
        downloadUrl: val.downloadUrl || 'https://www.kurdipedia.org'
      });

      this.lib.books.set([...crawlerEngine.getCatalog()]);
      this.addBookForm.reset({
        title: '',
        author: '',
        year: null,
        language: 'ckb',
        documentType: 'book',
        description: '',
        downloadUrl: 'https://www.kurdipedia.org'
      });
      this.activeTab.set('sources');
    }
  }
}
