import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { AcademicPipelineClientService } from '../../services/academic-pipeline-client.service';
import type {
  AcademicPipelineEvent,
  AcademicPipelineLevel
} from '../../services/academic-pipeline-client.service';

export interface StandardChapterTemplate {
  number: number;
  titleKurdish: string;
  titleEnglish: string;
  objective: string;
  requiredSections: string[];
}

const FIVE_CHAPTER_STANDARD: StandardChapterTemplate[] = [
  {
    number: 1,
    titleKurdish: 'بەشی یەکەم: چوارچێوەی گشتیی توێژینەوە',
    titleEnglish: 'Introduction & General Framework',
    objective: 'ناساندنی کێشە، پرسیارەکان، گرنگی، ئامانجەکان، و سنووردارکردنی توێژینەوەکە.',
    requiredSections: [
      'دەستپێک و پێشینەی کێشە',
      'کێشەی توێژینەوە (Problem Statement)',
      'گرنگیی زانستی و پراکتیکی (Significance)',
      'ئامانجە سەرەکی و لقدارەکان (Objectives)',
      'پرسیار و گریمانەکانی توێژینەوە (Questions & Hypotheses)',
      'سنووری کاتی، شوێنی و بابەتی (Scope & Delimitations)',
      'پێناسەکردنی چەمک و زاراوەکان (Definition of Terms)'
    ]
  },
  {
    number: 2,
    titleKurdish: 'بەشی دووەم: چوارچێوەی تیۆری و پێداچوونەوەی ئەدەبیات',
    titleEnglish: 'Theoretical Framework & Literature Review',
    objective: 'شیکردنەوەی بیردۆزە بنەڕەتییەکان و لێکۆڵینەوە پێشووە پەیوەندیدارەکان.',
    requiredSections: [
      'تەوەری یەکەم: بیردۆزە فەلسەفی و زانستییەکان',
      'تەوەری دووەم: گۆڕاوە سەربەخۆ و پەیوەستەکان',
      'توێژینەوە پێشووە ناوخۆیی و نێودەوڵەتییەکان',
      'بۆشایی زانستی و جیاوازیی ئەم لێکۆڵینەوەیە (Research Gap)'
    ]
  },
  {
    number: 3,
    titleKurdish: 'بەشی سێیەم: میتۆدۆلۆژیا و ڕێکارەکانی لێکۆڵینەوە',
    titleEnglish: 'Research Methodology & Procedures',
    objective: 'ڕوونکردنەوەی شێوازی کۆکردنەوە و چارەسەرکردنی داتا و بەڵگەکان.',
    requiredSections: [
      'میتۆدی توێژینەوە (وەسفی، شیکاری، یان تاقیکاری)',
      'کۆمەڵگەی توێژینەوە (Target Population)',
      'نموونە و شێوازی دیاریکردنی (Sample Size & Sampling Technique)',
      'ئامرازەکانی کۆکردنەوەی داتا (پرسیارنامە، چاوپێکەوتن)',
      'ڕەوایی و جێگیریی ئامرازەکان (Validity & Reliability)',
      'شێوازە ئاماری و شیکارییەکان (Statistical Methods)'
    ]
  },
  {
    number: 4,
    titleKurdish: 'بەشی چوارەم: خستنەڕوو و شیکردنەوەی ئەنجامەکان',
    titleEnglish: 'Results & Data Analysis',
    objective: 'پیشاندانی خشتە، گراف و وەڵامدانەوەی پرسیار و گریمانەکان بە بەڵگەوە.',
    requiredSections: [
      'وەسفی دیمۆگرافیی بەشداربووان',
      'وەڵامی پرسیاری یەکەم و تاقیکردنەوەی گریمانەی پەیوەندیدار',
      'وەڵامی پرسیاری دووەم و هاوکۆلکەی پەیوەندی',
      'پوختەی ئەنجامە ئاماری و دەقییەکان'
    ]
  },
  {
    number: 5,
    titleKurdish: 'بەشی پێنجەم: لێکدانەوە، دەرئەنجام، و ڕاسپاردەکان',
    titleEnglish: 'Discussion, Conclusions & Recommendations',
    objective: 'پێکگرتنی ئەنجامەکان لەگەڵ ئەدەبیاتی پێشوو و پێشنیارکردنی هەنگاوی داهاتوو.',
    requiredSections: [
      'لێکدانەوەی ئەنجامەکان لە ژێر ڕۆشنایی بیردۆزدا (Discussion)',
      'دەرئەنجامە سەرەکییەکان (Key Conclusions)',
      'ڕاسپاردە ئەکادیمی و پراکتیکییەکان (Recommendations)',
      'پێشنیار بۆ توێژینەوەکانی داهاتوو (Suggestions for Future Studies)'
    ]
  }
];

@Component({
  selector: 'app-thesis-structure-organizer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">account_tree</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>ڕێکخەری پێکهاتەی لۆژیکیی تێز و توێژینەوە (Thesis Structure Organizer)</span>
              <span class="text-[10px] bg-violet-950 text-violet-300 border border-violet-800 px-2 py-0.5 rounded font-mono">
                ستانداردی ٥ بەشی زانکۆکان
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              دیاریکردنی ئاراستەی گشتیی نامە، خشتەی لۆژیکیی تەوەرەکان و گەرەنتی نەپەڕاندنی بەشە سەرەکییەکان
            </p>
          </div>
        </div>

        <button (click)="applyStandard5Chapters()"
                class="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer">
          <mat-icon class="!text-sm !w-4 !h-4">auto_fix_high</mat-icon>
          <span>داڕشتنی خۆکاری بەشەکان لە سەرنووسەر</span>
        </button>
      </div>

      <!-- Authenticated, evidence-aware academic writing pipeline -->
      <section class="bg-slate-950/80 border border-emerald-900/50 rounded-xl p-4 space-y-3" aria-labelledby="academic-pipeline-title">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h4 id="academic-pipeline-title" class="text-sm font-bold text-emerald-300">زنجیرەی نووسینی ئەکادیمی بە AI</h4>
            <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">
              ڕەشنووس بە قۆناغ دروست دەکرێت. زانیاریی گەڕان‌کراو بە خۆکار پشتڕاستکراو نییە و پێش ئاماژەدان دەبێت سەرچاوە و بەڵگەکان بپشکنرێن؛ لیستی ژێدەر بە ساختە زیاد ناکرێت.
            </p>
          </div>
          @if (isPipelineRunning()) {
            <button type="button" (click)="cancelAcademicDraft()"
              class="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg text-xs font-bold">
              هەڵوەشاندنەوە
            </button>
          }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_190px] gap-3">
          <label class="block text-xs text-slate-300 space-y-1.5">
            <span class="font-bold">ناونیشانی توێژینەوە</span>
            <input type="text" maxlength="500" [value]="pipelineTitle()"
              (input)="pipelineTitle.set($any($event.target).value)"
              placeholder="ناونیشانی ورد و دیاریکراوی توێژینەوە بنووسە"
              class="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none" />
          </label>
          <label class="block text-xs text-slate-300 space-y-1.5">
            <span class="font-bold">ئاستی ئەکادیمی</span>
            <select [value]="pipelineLevel()" (change)="setPipelineLevel($any($event.target).value)"
              class="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none">
              <option value="school">قۆناغی قوتابخانە</option>
              <option value="bachelor">بەکالۆریۆس</option>
              <option value="master">ماستەر</option>
              <option value="phd">دکتۆرا</option>
              <option value="professor">ئاستی پرۆفیسۆر</option>
            </select>
          </label>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" (click)="generateAcademicDraft()"
            [disabled]="isPipelineRunning() || pipelineTitle().trim().length < 2"
            class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <mat-icon class="!text-sm !w-4 !h-4">auto_awesome</mat-icon>
            {{ isPipelineRunning() ? 'خەریکی نووسینە...' : 'دەستپێکردنی نووسینی قۆناغ بە قۆناغ' }}
          </button>
          <span class="text-[10px] text-slate-500">پێویستی بە چوونەژوورەوەی بەکارهێنەر هەیە.</span>
        </div>

        @if (isPipelineRunning() || pipelineStatus()) {
          <div class="space-y-1.5" aria-live="polite">
            <div class="flex items-center justify-between gap-2 text-xs text-slate-300">
              <span>{{ pipelineStatus() }}</span>
              <span class="font-mono text-emerald-300">{{ pipelineProgress() }}٪</span>
            </div>
            <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-300"
                [style.width.%]="pipelineProgress()"></div>
            </div>
          </div>
        }

        @if (generatedDraft()) {
          <div class="space-y-2 border-t border-slate-800 pt-3">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <h5 class="text-xs font-bold text-slate-100">ڕەشنووسی بەرهەمهاتوو</h5>
              <div class="flex items-center gap-2">
                <button type="button" (click)="copyGeneratedDraft()"
                  class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs">کۆپیکردن</button>
              </div>
            </div>
            <textarea readonly [value]="generatedDraft()" rows="10"
              class="w-full max-h-[420px] min-h-[220px] resize-y bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-7 font-mono"
              aria-label="ڕەشنووسی بەرهەمهاتوو"></textarea>
            @if (!pipelineComplete()) {
              <p class="text-[11px] text-amber-300" role="status">
                ئەم دەقە هێشتا بە تەواوی نەکۆتایی هاتووە؛ تەنها دەتوانیت کۆپی بکەیت، زیادکردنی بەشی ناتەواو ڕێگەپێدراو نییە.
              </p>
            }
            <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2">
              <label class="text-xs text-slate-300 space-y-1.5">
                <span class="font-bold">بەشی مەبەست بۆ زیادکردنی ڕەشنووس</span>
                <select [value]="targetChapterId()" (change)="targetChapterId.set($any($event.target).value)"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100">
                  <option value="">بەشێک دیاری بکە</option>
                  @for (chapter of availableChapters(); track chapter.id) {
                    <option [value]="chapter.id">{{ chapter.title }}{{ chapter.isLocked ? ' (داخراو)' : '' }}</option>
                  }
                </select>
              </label>
              <button type="button" (click)="appendGeneratedDraft()"
                [disabled]="isPipelineRunning() || !pipelineComplete() || !targetChapterId() || !generatedDraft().trim()"
                class="self-end px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold">
                زیادکردن بەبێ سڕینەوەی دەقی پێشوو
              </button>
            </div>
          </div>
        }
      </section>

      <!-- Chapter Completeness Progress -->
      <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-300 font-bold">ئاستی تەواوبوونی پێکهاتەی نامە:</span>
          <div class="w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-l from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                 [style.width.%]="completenessScore()"></div>
          </div>
          <span class="text-xs font-mono text-violet-300 font-bold">{{ completenessScore() }}٪</span>
        </div>

        <span class="text-[11px] text-slate-400">
          ژمارەی بەشە چالاکەکانی ئێستا: {{ currentChaptersCount() }} لە ٥ بەش
        </span>
      </div>

      <!-- Five Standard Chapters Cards -->
      <div class="space-y-2.5">
        @for (ch of standardChapters(); track ch.number) {
          <div class="bg-slate-950/70 border border-slate-800/80 hover:border-violet-800/60 rounded-xl p-3.5 space-y-2 transition">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-violet-950 text-violet-300 border border-violet-800/80 flex items-center justify-center text-xs font-bold font-mono">
                  {{ ch.number }}
                </span>
                <span class="text-xs font-bold text-slate-100">{{ ch.titleKurdish }}</span>
                <span class="text-[11px] text-slate-400 font-mono">({{ ch.titleEnglish }})</span>
              </div>

              <span class="text-[10.5px] text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-900/50">
                ئامانج: {{ ch.objective }}
              </span>
            </div>

            <!-- Required Sections Pills -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              @for (sec of ch.requiredSections; track sec) {
                <span class="text-[11px] bg-slate-900 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 font-serif">
                  <mat-icon class="!text-[10px] !w-2.5 !h-2.5 text-violet-400">check</mat-icon>
                  {{ sec }}
                </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ThesisStructureOrganizerComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);
  private readonly academicPipeline = inject(AcademicPipelineClientService);
  private pipelineAbortController: AbortController | null = null;

  readonly pipelineTitle = signal('');
  readonly pipelineLevel = signal<AcademicPipelineLevel>('phd');
  readonly isPipelineRunning = signal(false);
  readonly pipelineComplete = signal(false);
  readonly pipelineProgress = signal(0);
  readonly pipelineStatus = signal('');
  readonly generatedDraft = signal('');
  readonly targetChapterId = signal('');
  readonly availableChapters = computed(() => this.editorService.chapters());

  standardChapters = signal<StandardChapterTemplate[]>(FIVE_CHAPTER_STANDARD);

  currentChaptersCount = computed(() => {
    return this.editorService.chapters().length;
  });

  completenessScore = computed(() => {
    const count = this.currentChaptersCount();
    return Math.min(100, Math.round((count / 5) * 100));
  });

  setPipelineLevel(value: string): void {
    const allowed: AcademicPipelineLevel[] = ['school', 'bachelor', 'master', 'phd', 'professor'];
    if (allowed.includes(value as AcademicPipelineLevel)) {
      this.pipelineLevel.set(value as AcademicPipelineLevel);
    }
  }

  async generateAcademicDraft(): Promise<void> {
    const title = this.pipelineTitle().trim();
    if (title.length < 2 || this.isPipelineRunning()) return;

    const controller = new AbortController();
    this.pipelineAbortController = controller;
    this.isPipelineRunning.set(true);
    this.pipelineProgress.set(0);
    this.pipelineComplete.set(false);
    this.pipelineStatus.set('دەستپێکردنی گەڕان و بنیاتنانی نەخشە...');
    this.generatedDraft.set('');
    let assembled = '';

    try {
      const result = await this.academicPipeline.generate(
        { title, level: this.pipelineLevel() },
        (event: AcademicPipelineEvent) => {
          this.pipelineProgress.set(event.progressPercent);
          this.pipelineStatus.set(event.message);
          if (event.partialMarkdown?.trim()) {
            assembled = assembled ? assembled + '\n\n' + event.partialMarkdown : event.partialMarkdown;
            this.generatedDraft.set(assembled);
          }
        },
        controller.signal
      );
      this.generatedDraft.set(result);
      this.pipelineComplete.set(true);
      this.pipelineProgress.set(100);
      this.pipelineStatus.set('ڕەشنووس تەواو بوو؛ سەرچاوەکان هێشتا پێویستیان بە پشتڕاستکردنەوە هەیە.');
      this.toastService.showSuccess(
        'ڕەشنووس بەردەستە',
        'دەقی بەرهەمهاتوو پارێزراوە؛ پێش بەکارهێنانی ئەکادیمی، ژێدەر و بەڵگەکان پشتڕاست بکەرەوە.'
      );
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        this.pipelineStatus.set('داواکاریی نووسین هەڵوەشێندرایەوە؛ دەقی بەرهەمهاتووی پێشوو بپارێزە.');
      } else {
        const message = error instanceof Error
          ? error.message
          : 'زنجیرەی نووسین تەواو نەبوو؛ دواتر دووبارە هەوڵ بدە.';
        this.pipelineStatus.set(message);
        this.toastService.showWarning('نووسینی ئەکادیمی تەواو نەبوو', message);
      }
    } finally {
      this.isPipelineRunning.set(false);
      this.pipelineAbortController = null;
    }
  }

  cancelAcademicDraft(): void {
    this.pipelineAbortController?.abort();
  }

  async copyGeneratedDraft(): Promise<void> {
    const draft = this.generatedDraft();
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      this.toastService.showSuccess('کۆپی کرا', 'ڕەشنووس بۆ کلیپبۆرد کۆپی کرا.');
    } catch {
      this.toastService.showWarning('کۆپیکردن نەکرا', 'دەقی خوارەوە بە دەستی هەڵبژێرە و کۆپی بکە.');
    }
  }

  appendGeneratedDraft(): void {
    if (!this.pipelineComplete()) {
      this.toastService.showWarning('ڕەشنووس ناتەواوە', 'تەنها ڕەشنووسی تەواو دەتوانرێت زیاد بکرێت.');
      return;
    }
    const selectedValue = this.targetChapterId().trim();
    const selectedId = Number(selectedValue);
    if (!selectedValue || !Number.isSafeInteger(selectedId) || selectedId < 1) {
      this.toastService.showWarning('بەش دیاری نەکرا', 'سەرەتا بەشی مەبەست دیاری بکە.');
      return;
    }

    const target = this.editorService.chapters().find(chapter => chapter.id === selectedId);
    if (!target) {
      this.toastService.showWarning('بەش نەدۆزرایەوە', 'لیستی بەشەکان نوێ بکەرەوە و بەشێکی بوون‌هەبوو دیاری بکە.');
      return;
    }
    if (target.isLocked) {
      this.toastService.showWarning('بەش داخراوە', 'بەشی داخراو ناتوانرێت دەستکاری بکرێت.');
      return;
    }

    const draft = this.generatedDraft().trim();
    if (!draft) return;
    const existing = (target.content || '').trim();
    const combined = existing ? existing + '\n\n' + draft : draft;
    this.editorService.updateChapterContent(
      target.id,
      combined,
      'AI academic pipeline draft appended by user'
    );
    this.toastService.showSuccess(
      'ڕەشنووس زیاد کرا',
      'دەقی نوێ بە کۆتایی بەشی دیاریکراو زیاد کرا؛ هیچ دەقی پێشووت سڕایەوە نییە.'
    );
  }

  applyStandard5Chapters(): void {
    const existing = this.editorService.chapters();
    if (existing.length > 0 && !confirm('ئایا دڵنیایت دەتەوێت چوارچێوەی ستانداردی ٥ بەش دابڕێژیت؟ بەشەکانت نوێ دەکرێنەوە.')) {
      return;
    }

    const newChapters = FIVE_CHAPTER_STANDARD.map((std, idx) => ({
      id: idx + 1,
      title: std.titleKurdish,
      content: `## ${std.titleKurdish}\n\n### ئامانجی ئەم بەشە:\n${std.objective}\n\n### بڕگە سەرەکییەکان:\n${std.requiredSections.map(s => `- ${s}`).join('\n')}\n\n[دەقی ئەکادیمی لێرە بنووسە...]`
    }));

    this.editorService.setChapters(newChapters as any);
    this.toastService.showSuccess('پێکهاتەی نامە ڕێکخرا', 'هەر ٥ بەشە بنەڕەتییەکەی تێز بە خشتە و تەوەرەکانیانەوە دروستکران.');
  }
}
