import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mam-splash" dir="rtl">
      <div class="mam-splash-grid">
        <section class="mam-splash-copy">
          <div class="mam-splash-brand">
            <div class="mam-splash-mark"><mat-icon>auto_stories</mat-icon></div>
            <div><strong>مام پڕۆفیسۆر</strong><span>Academic Writing & Research Workspace</span></div>
          </div>

          <div class="mam-splash-label">KURDISH-FIRST ACADEMIC WORKSPACE</div>
          <h1>توێژینەوەکەت<br><em>لە بیرۆکە بۆ بەڵگە.</em></h1>
          <p>شوێنێکی یەکگرتوو بۆ ڕێکخستنی تێز، نووسینی بەشەکان، گەڕانی سەرچاوە و پشکنینی دەقی ئەکادیمی.</p>

          <div class="mam-splash-actions">
            <button type="button" class="primary" (click)="enterWorkspace.emit(); selectWorkspaceTab.emit('editor')">
              <mat-icon>edit</mat-icon>
              <span>دەستپێکردنی پڕۆژە</span>
            </button>
            <button type="button" class="secondary" (click)="enterWorkspace.emit(); selectWorkspaceTab.emit('editor'); openSettings.emit()">
              <mat-icon>tune</mat-icon>
              <span>ڕێکخستنە سەرەتاییەکان</span>
            </button>
            <button type="button" class="secondary !border-rose-500/40 !text-rose-300 hover:!bg-rose-950/40" (click)="enterWorkspace.emit(); selectWorkspaceTab.emit('suite'); downloadCodebasePdf()" title="داگرتنی تەواوی کۆدەکانی ئەم ئەپە بە فایلی PDF">
              <mat-icon class="!text-rose-400">picture_as_pdf</mat-icon>
              <span>کۆدەکانی ئەپ (PDF)</span>
            </button>
          </div>

          <div class="mam-splash-principles">
            <div><mat-icon>fact_check</mat-icon><span>جیاکردنەوەی بەڵگە لە گومان</span></div>
            <div><mat-icon>menu_book</mat-icon><span>نووسین بۆ ئاستی ئەکادیمی</span></div>
            <div><mat-icon>language</mat-icon><span>پشتیوانی لە سۆرانی</span></div>
          </div>
        </section>

        <aside class="mam-splash-preview">
          <div class="mam-preview-window">
            <div class="mam-preview-bar"><span></span><span></span><span></span><b>مام پڕۆفیسۆر</b></div>
            <div class="mam-preview-body">
              <div class="mam-preview-side">
                <button type="button" class="active cursor-pointer hover:opacity-80 transition" (click)="enterWorkspace.emit(); selectWorkspaceTab.emit('editor')"><mat-icon>history_edu</mat-icon><span>نووسین</span></button>
                <button type="button" class="cursor-pointer hover:opacity-80 transition" (click)="enterWorkspace.emit(); selectWorkspaceTab.emit('advanced_research')"><mat-icon>hub</mat-icon><span>توێژینەوە</span></button>
                <button type="button" class="cursor-pointer hover:opacity-80 transition" (click)="enterWorkspace.emit(); selectWorkspaceTab.emit('suite')"><mat-icon>build</mat-icon><span>ئامرازەکان</span></button>
              </div>
              <div class="mam-preview-content">
                <div class="line wide"></div>
                <div class="line mid"></div>
                <div class="line short"></div>
                <div class="mam-preview-card"><span></span><span></span><span></span></div>
                <div class="line wide"></div>
                <div class="line wide"></div>
                <div class="line mid"></div>
              </div>
            </div>
          </div>
          <div class="mam-splash-note">
            <mat-icon>verified_user</mat-icon>
            <div><strong>بنەمای دیزاین</strong><span>کەمکردنەوەی قەرەباڵغی، ڕوونکردنەوەی هەنگاوەکان، و لێدانەوەی کردەوەی کارا.</span></div>
          </div>
        </aside>
      </div>

      <footer class="mam-splash-footer">
        <span>مام پڕۆفیسۆر</span>
        <span>ناوەندی کوردی بۆ نووسین و توێژینەوەی ئەکادیمی</span>
        <span>© ٢٠٢٦</span>
      </footer>

      @if (isSettingsOpen()) {
        <div class="mam-settings-backdrop" (click)="closeSettings.emit()">
          <section class="mam-settings" (click)="$event.stopPropagation()">
            <button type="button" class="mam-settings-close" (click)="closeSettings.emit()" aria-label="داخستن">
              <mat-icon>close</mat-icon>
            </button>
            <div class="mam-settings-head">
              <span>ڕێکخستن</span>
              <h2>ڕێکخستنی شێوازی نووسین</h2>
            </div>

            <!-- Codebase PDF Section (Optimized for Mobile & Desktop) -->
            <div class="my-4 p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-right space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <mat-icon class="!w-6 !h-6 text-2xl">picture_as_pdf</mat-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-slate-100">تەواوی کۆدەکانی ئەپ (PDF)</h3>
                    <span class="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">٦٠٥ فایل | ١٠٠ هەزار دێڕ</span>
                  </div>
                  <p class="text-[11px] text-slate-300 leading-relaxed mt-1">
                    داگرتنی دەستبەجێی سەرجەم فایلەکان و مۆدیوولەکانی پڕۆژە لە یەک فایلی PDF داونلۆدکراودا بۆ ناو مۆبایل و تابلێت.
                  </p>
                </div>
              </div>

              @if (statusMessage()) {
                <div class="text-[11px] text-amber-200 bg-amber-950/60 border border-amber-800/60 px-3 py-2 rounded-xl flex items-center gap-2">
                  <mat-icon class="text-sm animate-spin" [class.hidden]="!isRegenerating()">sync</mat-icon>
                  <span>{{ statusMessage() }}</span>
                </div>
              }

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  (click)="downloadCodebasePdf()"
                  class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer">
                  <mat-icon class="text-base">download</mat-icon>
                  <span>داگرتن بۆ مۆبایل</span>
                </button>

                <button
                  type="button"
                  [disabled]="isRegenerating()"
                  (click)="regenerateAndDownload()"
                  class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50">
                  <mat-icon class="text-base" [class.animate-spin]="isRegenerating()">refresh</mat-icon>
                  <span>{{ isRegenerating() ? 'کۆکردنەوەی کۆدەکان...' : 'نوێکردنەوە و داگرتن' }}</span>
                </button>
              </div>

              <div class="text-center pt-1 border-t border-rose-900/30">
                <a href="/mam-professor-codebase.pdf" target="_blank" class="text-[11px] text-rose-300/80 hover:text-rose-200 underline">
                  کردنەوەی ڕاستەوخۆ لە وێبگەڕدا (Open in Browser)
                </a>
              </div>
            </div>

            @if (refineForm()) {
              <div [formGroup]="refineForm()!" class="mam-settings-form">
                <label>Temperature<input type="range" min="0" max="1" step="0.1" formControlName="temperature"></label>
                <div class="mam-settings-grid">
                  <label>Thinking tokens<input type="number" formControlName="thinkingTokens"></label>
                  <label>Writing tokens<input type="number" formControlName="writingTokens"></label>
                </div>
                <label class="mam-settings-toggle">
                  <span>شبیه‌سازی بەرگریی تێز</span>
                  <button type="button" (click)="refineForm()?.patchValue({thesisDefense: !refineForm()?.get('thesisDefense')?.value})">
                    {{ refineForm()?.get('thesisDefense')?.value ? 'چالاکە' : 'ناچالاکە' }}
                  </button>
                </label>
                <button type="button" class="mam-settings-save" (click)="closeSettings.emit()">جێگیرکردن</button>
              </div>
            }
          </section>
        </div>
      }
    </main>
  `
})
export class SplashScreenComponent {
  private http = inject(HttpClient);

  refineForm = input<FormGroup | null>(null);
  isSettingsOpen = input(false);
  enterWorkspace = output<void>();
  selectWorkspaceTab = output<'editor' | 'library' | 'suite' | 'advanced_research'>();
  openSettings = output<void>();
  closeSettings = output<void>();

  isRegenerating = signal(false);
  statusMessage = signal('');

  downloadCodebasePdf(): void {
    this.statusMessage.set('داگرتنی فایلەکە بۆ مۆبایلەکەت دەستی پێکرد...');
    const link = document.createElement('a');
    link.href = '/mam-professor-codebase.pdf';
    link.setAttribute('download', 'mam-professor-codebase.pdf');
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => this.statusMessage.set(''), 4500);
  }

  async regenerateAndDownload(): Promise<void> {
    this.isRegenerating.set(true);
    this.statusMessage.set('سێرڤەر خەریکی کۆکردنەوەی تەواوی کۆدەکانە بە دوایین نوێکارییەکان...');
    try {
      await firstValueFrom(this.http.post('/api/codebase-pdf/regenerate', {}));
      this.statusMessage.set('فایلی نوێ ئامادە کرا! داگرتن دەستی پێکرد...');
      this.downloadCodebasePdf();
    } catch {
      this.statusMessage.set('فایلی ئامادەکراو دادەبەزێنرێت...');
      this.downloadCodebasePdf();
    } finally {
      this.isRegenerating.set(false);
      setTimeout(() => this.statusMessage.set(''), 5000);
    }
  }
}
