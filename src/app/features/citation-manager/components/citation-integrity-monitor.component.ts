import { Component, ChangeDetectionStrategy, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CitationVerificationTrackerService, RejectedCitationRecord, VerifiedCitationRecord } from '../../../services/citation-verification-tracker.service';

@Component({
  selector: 'app-citation-integrity-monitor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 font-sans text-right" dir="rtl">
      <!-- 1. WARNING NOTIFICATION SYSTEM: Rejected Fake/Invalid Citations -->
      @if (activeWarnings().length > 0) {
        <div class="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/70 text-amber-100 shadow-lg space-y-3 animate-pulse-subtle">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="flex items-start gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                <mat-icon class="!w-5 !h-5 text-xl">warning_amber</mat-icon>
              </div>
              <div>
                <h3 class="text-xs font-bold text-amber-200 flex items-center gap-2">
                  <span>ئاگاداری دەستپاکی ئەکادیمی: ڕەتکردنەوەی سەرچاوەی گوماناوی</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
                    {{ activeWarnings().length }} سەرچاوە ڕەتکرایەوە
                  </span>
                </h3>
                <p class="text-[11px] text-amber-300/90 leading-relaxed mt-0.5">
                  سیستەمی AdaptiveCitationManager سەرچاوەی ساختە یان ناتەواوی فلتەر کردووە چونکە پێچەوانەی یاسای قەدەغەکردنی سەرچاوەی خەیاڵییە. دەتوانیت سەرچاوەی ڕاستەقینەی بەدیل تۆمار بکەیت.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-2.5 pt-1">
            @for (rej of activeWarnings(); track rej.id) {
              <div class="p-3 rounded-xl bg-slate-900/90 border border-amber-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div class="space-y-1 text-xs">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-rose-300">{{ rej.attemptedAuthor }}</span>
                    <span class="text-slate-400">({{ rej.attemptedYear }})</span>
                    <span class="text-slate-300 italic">«{{ rej.attemptedTitle }}»</span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-rose-400 font-mono">
                    <span class="px-2 py-0.5 bg-rose-950/80 rounded border border-rose-800">
                      هۆکار: {{ rej.reason }}
                    </span>
                    @if (rej.matchedPattern) {
                      <span class="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                        دەستەواژەی قەدەغەکراو: {{ rej.matchedPattern }}
                      </span>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    (click)="openAlternativeModal(rej)"
                    class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <mat-icon class="!w-4 !h-4 text-base">edit_note</mat-icon>
                    <span>پێشکەشکردنی سەرچاوەی بەدیل</span>
                  </button>
                  <button
                    type="button"
                    (click)="tracker.dismissRejection(rej.id)"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer">
                    پشتگوێخستن
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- 2. DASHBOARD WIDGET: Quality Score (Claim + Concrete Evidence) -->
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <mat-icon class="!w-5 !h-5 text-xl">verified</mat-icon>
            </div>
            <div>
              <h3 class="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>پێوەری کوالێتیی دەقی ئەکادیمی (Quality Score)</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" [class]="qualityMetrics().gradeColor" [class.bg-emerald-950]="qualityMetrics().qualityGrade === 'A+' || qualityMetrics().qualityGrade === 'A'">
                  پلەی {{ qualityMetrics().qualityGrade }}
                </span>
              </h3>
              <p class="text-[10px] text-slate-400 mt-0.5">
                هەڵسەنگاندنی چڕیی بەڵگە (Claim + Concrete Evidence) لە بەرامبەر تەواوی پەرەگرافەکاندا
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-200">{{ qualityMetrics().statusLabelKurdish }}</span>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Metric 1: Quality Score -->
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400">کۆی نمرەی کوالێتی</span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-black font-mono" [class]="qualityMetrics().gradeColor">
                {{ qualityMetrics().qualityScore }}٪
              </span>
              <span class="text-[10px] text-slate-500">لە ١٠٠</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                [class.bg-emerald-500]="qualityMetrics().qualityScore >= 80"
                [class.bg-blue-500]="qualityMetrics().qualityScore >= 65 && qualityMetrics().qualityScore < 80"
                [class.bg-amber-500]="qualityMetrics().qualityScore >= 50 && qualityMetrics().qualityScore < 65"
                [class.bg-rose-500]="qualityMetrics().qualityScore < 50"
                [style.width.%]="qualityMetrics().qualityScore">
              </div>
            </div>
          </div>

          <!-- Metric 2: Paragraph Evidence Density -->
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400">چڕیی پەرەگرافی سەلمێنراو</span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-black font-mono text-emerald-400">
                {{ qualityMetrics().densityPercentage }}٪
              </span>
              <span class="text-[10px] text-slate-500">پشتبەستوو بە بەڵگە</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-2">
              {{ qualityMetrics().substantiatedParagraphs }} لە {{ qualityMetrics().totalParagraphs }} پەرەگراف
            </span>
          </div>

          <!-- Metric 3: Verified Citations -->
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400">سەرچاوەی پشتڕاستکراو</span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-black font-mono text-blue-400">
                {{ verifiedCitations().length }}
              </span>
              <span class="text-[10px] text-slate-500">سەرچاوەی فەرمی</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-2">
              {{ qualityMetrics().citationsCount }} پەراوێزی تۆمارکراو
            </span>
          </div>

          <!-- Metric 4: Academic Integrity Rule Status -->
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400">یاسای دەستپاکی</span>
            <div class="flex items-center gap-1.5 mt-1">
              @if (qualityMetrics().ruleFollowed) {
                <mat-icon class="!w-5 !h-5 text-emerald-400">check_circle</mat-icon>
                <span class="text-xs font-bold text-emerald-300">پابەند بە یاسا</span>
              } @else {
                <mat-icon class="!w-5 !h-5 text-rose-400">error</mat-icon>
                <span class="text-xs font-bold text-rose-300">پێویستی بە پێداچوونەوەیە</span>
              }
            </div>
            <span class="text-[10px] text-slate-400 mt-2">
              {{ qualityMetrics().unsubstantiatedParagraphs }} پەرەگراف بێ بەڵگەیە
            </span>
          </div>
        </div>
      </div>

      <!-- 3. REAL-TIME CITATION VERIFICATION FEED & PROGRESS BAR -->
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <mat-icon class="text-emerald-400 !w-4 !h-4 text-base">fact_check</mat-icon>
            <h4 class="text-xs font-bold text-slate-200">
              شریتی پێشکەوتن و لیستی سەرچاوە پشتڕاستکراوەکان (Live Verification Feed)
            </h4>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono text-emerald-300 font-bold">
              {{ tracker.verificationProgress() }}٪ پشتڕاستکرایەوە
            </span>
            <button
              type="button"
              (click)="simulateAddTestCitation()"
              class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition cursor-pointer"
              title="تاقیکردنەوەی فلتەری سەرچاوەی ساختە">
              + تاقیکردنەوەی سەرچاوە
            </button>
          </div>
        </div>

        <!-- Verification Progress Bar -->
        <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            class="h-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-700"
            [style.width.%]="tracker.verificationProgress()">
          </div>
        </div>

        <!-- Verified Citations Feed -->
        <div class="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
          @if (verifiedCitations().length === 0) {
            <p class="text-xs text-slate-500 text-center py-4">
              هێشتا سەرچاوەیەک پرۆسێس نەکراوە. لە کاتی نووسینی بەشەکاندا، لێرە بە شێوەی زیندوو دەردەکەون.
            </p>
          } @else {
            @for (c of verifiedCitations(); track c.id) {
              <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition">
                <div class="flex items-start gap-2.5">
                  <div class="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 text-[11px] font-bold font-mono">
                    {{ c.footnoteNum || '✓' }}
                  </div>
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-slate-100">{{ c.author }}</span>
                      <span class="text-slate-400 text-[11px]">({{ c.year }})</span>
                      <span class="text-slate-200 italic">«{{ c.title }}»</span>
                    </div>
                    <p class="text-[11px] text-slate-400">{{ c.publisherOrLocation }} {{ c.pageOrNote ? '• ل ' + c.pageOrNote : '' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                    {{ getLangLabel(c.language) }}
                  </span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-0.5">
                    <mat-icon class="!w-3 !h-3 text-[10px]">verified</mat-icon>
                    <span>{{ getOriginLabel(c.verificationOrigin) }}</span>
                  </span>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- ALTERNATIVE CITATION MODAL -->
      @if (selectedRejectionForFix(); as rej) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div class="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-5 space-y-4 text-right" dir="rtl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-amber-400">edit_note</mat-icon>
                <h3 class="text-sm font-bold text-slate-100">پێشکەشکردنی سەرچاوەی ڕاستەقینە و بەدیل</h3>
              </div>
              <button
                type="button"
                (click)="selectedRejectionForFix.set(null)"
                class="text-slate-400 hover:text-slate-200">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-1">
              <span class="font-bold block">سەرچاوە ڕەتکراوەکە:</span>
              <p class="text-slate-300">{{ rej.attemptedAuthor }} ({{ rej.attemptedYear }}) - {{ rej.attemptedTitle }}</p>
              <p class="text-[11px] text-rose-300">هۆکاری ڕەتکردنەوە: {{ rej.reason }}</p>
            </div>

            <form [formGroup]="alternativeForm" (ngSubmit)="submitAlternative(rej.id)" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">ناوی نووسەر یان توێژەر (ڕاستەقینە):</label>
                <input
                  type="text"
                  formControlName="author"
                  placeholder="نموونە: د. مارف خەزنەدار"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">ساڵی چاپ:</label>
                  <input
                    type="text"
                    formControlName="year"
                    placeholder="نموونە: ٢٠٠١"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">زمان:</label>
                  <select
                    formControlName="language"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                    <option value="ku">کوردی</option>
                    <option value="ar">عەرەبی</option>
                    <option value="en">English</option>
                    <option value="fa">فارسی</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">ناونیشانی کتێب یان توێژینەوە:</label>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="نموونە: مێژووی ئەدەبی کوردی، بەرگی سێیەم"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">دەزگای چاپ و شار:</label>
                  <input
                    type="text"
                    formControlName="publisherOrLocation"
                    placeholder="نموونە: هەولێر: دەزگای ئاراس"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">لاپەڕە (ئارەزوومەندانە):</label>
                  <input
                    type="text"
                    formControlName="pageOrNote"
                    placeholder="نموونە: ٧٥-٧٨"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              @if (alternativeError()) {
                <div class="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300">
                  {{ alternativeError() }}
                </div>
              }

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="selectedRejectionForFix.set(null)"
                  class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer">
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  [disabled]="alternativeForm.invalid"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer">
                  پشتڕاستکردن و جێگیرکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CitationIntegrityMonitorComponent {
  public tracker = inject(CitationVerificationTrackerService);
  private fb = inject(FormBuilder);

  public chapterText = input<string>('');

  public activeWarnings = this.tracker.activeWarnings;
  public verifiedCitations = this.tracker.verifiedCitations;
  public qualityMetrics = computed(() => {
    const text = this.chapterText();
    return this.tracker.calculateQualityMetrics(text);
  });

  public selectedRejectionForFix = signal<RejectedCitationRecord | null>(null);
  public alternativeError = signal<string>('');

  public alternativeForm: FormGroup = this.fb.group({
    author: ['', [Validators.required, Validators.minLength(3)]],
    year: ['', [Validators.required, Validators.minLength(4)]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    publisherOrLocation: ['', [Validators.required, Validators.minLength(3)]],
    language: ['ku', Validators.required],
    pageOrNote: ['']
  });

  public openAlternativeModal(rejection: RejectedCitationRecord): void {
    this.selectedRejectionForFix.set(rejection);
    this.alternativeError.set('');
    this.alternativeForm.reset({
      author: '',
      year: rejection.attemptedYear && rejection.attemptedYear !== 'نادیار' ? rejection.attemptedYear : '٢٠٢٣',
      title: '',
      publisherOrLocation: '',
      language: rejection.language || 'ku',
      pageOrNote: ''
    });
  }

  public submitAlternative(rejectedId: string): void {
    if (this.alternativeForm.invalid) return;

    const val = this.alternativeForm.value;
    const res = this.tracker.resolveRejectionWithAlternative(rejectedId, {
      author: val.author,
      year: val.year,
      title: val.title,
      publisherOrLocation: val.publisherOrLocation,
      language: val.language,
      pageOrNote: val.pageOrNote
    });

    if (res.success) {
      this.selectedRejectionForFix.set(null);
      this.alternativeError.set('');
    } else {
      this.alternativeError.set(res.error || 'سەرچاوەکە ستاندارد نییە');
    }
  }

  public simulateAddTestCitation(): void {
    // Allows user to test the real-time fake citation rejection filter
    this.tracker.recordRejection(
      {
        id: `test_fake_${Date.now()}`,
        author: 'unknown author',
        year: '2024',
        title: 'example thesis placeholder',
        publisherOrLocation: 'n/a',
        language: 'en'
      },
      'سەرچاوەکە دەستەواژەی گوماناوی و نەناسراوی تێدایە (unknown/placeholder)',
      'unknown'
    );
  }

  public getLangLabel(lang: string): string {
    const map: Record<string, string> = {
      ku: 'کوردی',
      ar: 'عەرەبی',
      en: 'English',
      fa: 'فارسی'
    };
    return map[lang] || lang;
  }

  public getOriginLabel(origin?: string): string {
    if (origin === 'user_verified_library') return 'کتێبخانەی توێژەر';
    if (origin === 'primary_corpus') return 'دەقی بنەڕەتی';
    return 'Google Grounded';
  }
}
