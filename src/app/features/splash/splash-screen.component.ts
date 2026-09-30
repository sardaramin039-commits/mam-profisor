import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
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
            <button type="button" class="primary" (click)="enterWorkspace.emit()">
              <mat-icon>edit</mat-icon>
              <span>دەستپێکردنی پڕۆژە</span>
            </button>
            <button type="button" class="secondary" (click)="openSettings.emit()">
              <mat-icon>tune</mat-icon>
              <span>ڕێکخستنە سەرەتاییەکان</span>
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
                <div class="active"><mat-icon>history_edu</mat-icon><span>نووسین</span></div>
                <div><mat-icon>hub</mat-icon><span>توێژینەوە</span></div>
                <div><mat-icon>build</mat-icon><span>ئامرازەکان</span></div>
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
            <div class="mam-settings-head"><span>ڕێکخستن</span><h2>ڕێکخستنی شێوازی نووسین</h2></div>

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
  refineForm = input<FormGroup | null>(null);
  isSettingsOpen = input(false);
  enterWorkspace = output<void>();
  openSettings = output<void>();
  closeSettings = output<void>();
}
