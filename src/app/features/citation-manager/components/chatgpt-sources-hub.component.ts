import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatGptSourcesService, DiscoveredAcademicSource } from '../../../services/chatgpt-sources.service';

@Component({
  selector: 'app-chatgpt-sources-hub',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 text-slate-200">
      <!-- Status Badge & Explainer Banner -->
      <div class="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <mat-icon class="text-lg">psychology</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-xs font-bold text-white">مۆدیوڵی زیرەکی دەستکردی ChatGPT بۆ سەرچاوە و بەیبلۆگرافی</h4>
              <span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE (GPT-5.5 + Web Search)
              </span>
              <span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <mat-icon class="text-[10px]">verified</mat-icon>
                VERIFICATION REQUIRED
              </span>
            </div>
            <p class="text-[11px] text-slate-400">کلیل لە سێرڤەر پارێزراوە؛ ChatGPT بە Web Search سەرچاوەکان دەدۆزێتەوە و پاشان لە سیستەمی Verification ـدا پشکنین دەکرێن</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
          <mat-icon class="text-xs text-emerald-400">lock</mat-icon>
          <span>OpenAI API Key (پارێزراو لە سێرڤەر)</span>
        </div>
      </div>

      <!-- Action Mode Switcher -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          (click)="activeMode.set('discover')"
          [class]="activeMode() === 'discover'
            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
          <mat-icon class="text-sm">travel_explore</mat-icon>
          <span>دۆزینەوەی سەرچاوەی ئەکادیمی (Discover)</span>
        </button>

        <button
          type="button"
          (click)="activeMode.set('organize')"
          [class]="activeMode() === 'organize'
            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
          <mat-icon class="text-sm">sort_by_alpha</mat-icon>
          <span>ڕێکخستن و فۆرماتکردنی سەرچاوەکان (Organize)</span>
        </button>
      </div>

      <!-- Mode 1: Discover Sources -->
      @if (activeMode() === 'discover') {
        <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <form [formGroup]="discoverForm" (ngSubmit)="handleDiscover()" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2 space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">بابەتی لێکۆڵینەوە یان پرسیاری توێژینەوە</label>
                <div class="relative">
                  <input
                    formControlName="query"
                    type="text"
                    placeholder="نموونە: کاریگەریی زیرەکی دەستکرد لەسەر میتۆدۆلۆجیای توێژینەوەی ئەکادیمی..."
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <mat-icon class="absolute left-2.5 top-2.5 text-slate-500 text-sm">search</mat-icon>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">دیۆسپلین / بوار</label>
                <select
                  formControlName="discipline"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="زانستە مرۆڤایەتییەکان و زمان">زانستە مرۆڤایەتییەکان و زمان</option>
                  <option value="زانستی کۆمپیوتەر و تەکنەلۆجیا">زانستی کۆمپیوتەر و تەکنەلۆجیا</option>
                  <option value="پزیشکی و تەندروستی">پزیشکی و تەندروستی</option>
                  <option value="کۆمەڵناسی و یاسا">کۆمەڵناسی و یاسا</option>
                  <option value="ئابووری و بەڕێوەبردن">ئابووری و بەڕێوەبردن</option>
                  <option value="گشتی">گشتی</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                <mat-icon class="text-xs text-emerald-400">info</mat-icon>
                <span>گەڕان لە گۆڤارە پیاچوونەوەکراوەکان (Peer-reviewed journals) ئەنجام دەدرێت</span>
              </div>

              <button
                type="submit"
                [disabled]="discoverForm.invalid || isLoading()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                @if (isLoading()) {
                  <mat-icon class="text-xs animate-spin">refresh</mat-icon>
                  <span>لە گەڕاندایە...</span>
                } @else {
                  <mat-icon class="text-xs">travel_explore</mat-icon>
                  <span>دۆزینەوە بە ChatGPT</span>
                }
              </button>
            </div>
          </form>

          <!-- Discovered Results -->
          @if (discoveredList().length > 0) {
            <div class="pt-3 border-t border-slate-800 space-y-3">
              @if (thematicSummary()) {
                <div class="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-200">
                  <div class="font-bold flex items-center gap-1 mb-1">
                    <mat-icon class="text-xs">insights</mat-icon>
                    <span>پوختەی دەستنیشانکراو بە کوردی:</span>
                  </div>
                  <p class="leading-relaxed">{{ thematicSummary() }}</p>
                </div>
              }

              <div class="space-y-2 max-h-80 overflow-y-auto">
                @for (src of discoveredList(); track src.title) {
                  <div class="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl space-y-1.5 transition-all">
                    <div class="flex items-start justify-between gap-2">
                      <h5 class="text-xs font-bold text-slate-100">{{ src.title }}</h5>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {{ src.year }}
                      </span>
                    </div>

                    <div class="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>{{ src.authors.join(', ') }}</span>
                      <span>•</span>
                      <span class="italic text-slate-300">{{ src.journalOrPublisher }}</span>
                      @if (src.doi) {
                        <span>•</span>
                        <span class="font-mono text-indigo-400 text-[10px]">DOI: {{ src.doi }}</span>
                      }
                    </div>

                    <p class="text-[11px] text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                      {{ src.relevanceExplanation }}
                    </p>

                    <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                      <span>APA: {{ src.citationAPA }}</span>
                      <button
                        type="button"
                        (click)="copyCitation(src.citationHarvard)"
                        class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 transition-colors cursor-pointer">
                        <mat-icon class="text-[12px]">content_copy</mat-icon>
                        <span>Harvard کۆپیکردنی</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Mode 2: Organize & Format References -->
      @if (activeMode() === 'organize') {
        <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <form [formGroup]="organizeForm" (ngSubmit)="handleOrganize()" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2 space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">ناونیشانی توێژینەوە</label>
                <input
                  formControlName="topic"
                  type="text"
                  placeholder="ناونیشانی کارە ئەکادیمییەکەت بنووسە..."
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-slate-300">شێوازی فەرمی بەیبلۆگرافی</label>
                <select
                  formControlName="citationStyle"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="harvard">Harvard (پاشناوی نووسەر، ساڵ)</option>
                  <option value="apa">APA 7th Edition</option>
                  <option value="mla">MLA 9th Edition</option>
                  <option value="chicago">Chicago Manual of Style</option>
                </select>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-slate-300">سەرچاوە خاوەکان / تێکست (ناوی کتێب، گۆڤار، بەستەر یان ناوی نووسەران)</label>
              <textarea
                formControlName="rawReferences"
                rows="4"
                placeholder="لیستی سەرچاوەکانت لێرە دابنێ؛ ChatGPT بە شێوەیەکی زانستی پشکنینیان بۆ دەکات، هەڵەکانیان ڕاستدەکاتەوە، و بەپێی ئەلفوبێ ڕێکیان دەخات..."
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-mono"
              ></textarea>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-[11px] text-slate-400">ڕێزبەندکردن بەپێی ئەلفوبێی پاشناوی نووسەر لەگەڵ ئاماژەدانی ناو دەق</span>
              <button
                type="submit"
                [disabled]="organizeForm.invalid || isLoading()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                @if (isLoading()) {
                  <mat-icon class="text-xs animate-spin">refresh</mat-icon>
                  <span>لە ڕێکخستندایە...</span>
                } @else {
                  <mat-icon class="text-xs">sort_by_alpha</mat-icon>
                  <span>ڕێکخستن بە ChatGPT</span>
                }
              </button>
            </div>
          </form>

          <!-- Organized Bibliography Result -->
          @if (curatedBibliography()) {
            <div class="pt-3 border-t border-slate-800 space-y-3">
              <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <h5 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <mat-icon class="text-sm">format_list_bulleted</mat-icon>
                    <span>لیستی ڕێکخراوی سەرچاوەکان ({{ organizeForm.value.citationStyle | uppercase }}):</span>
                  </h5>
                  <button
                    type="button"
                    (click)="copyCitation(curatedBibliography())"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1 cursor-pointer">
                    <mat-icon class="text-xs">content_copy</mat-icon>
                    <span>کۆپیکردنی هەمووی</span>
                  </button>
                </div>
                <pre class="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">{{ curatedBibliography() }}</pre>
              </div>

              @if (inTextGuide()) {
                <div class="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">
                  <span class="font-bold block mb-1">ڕێنمایی ئاماژەدانی ناو دەق (In-text Citations):</span>
                  <p class="leading-relaxed">{{ inTextGuide() }}</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ChatGptSourcesHubComponent {
  private fb = inject(FormBuilder);
  private chatGptService = inject(ChatGptSourcesService);

  activeMode = signal<'discover' | 'organize'>('discover');
  isLoading = signal(false);

  // Discover state
  discoveredList = signal<DiscoveredAcademicSource[]>([]);
  thematicSummary = signal<string>('');

  // Organize state
  curatedBibliography = signal<string>('');
  inTextGuide = signal<string>('');

  discoverForm = this.fb.group({
    query: ['', [Validators.required, Validators.minLength(3)]],
    discipline: ['گشتی']
  });

  organizeForm = this.fb.group({
    topic: ['', [Validators.required, Validators.minLength(3)]],
    citationStyle: ['harvard'],
    rawReferences: ['']
  });

  async handleDiscover(): Promise<void> {
    if (this.discoverForm.invalid) return;
    this.isLoading.set(true);
    try {
      const formVal = this.discoverForm.value;
      const res = await this.chatGptService.discoverSources(
        formVal.query || '',
        formVal.discipline || 'گشتی'
      );
      this.discoveredList.set(res.discoveredSources || []);
      this.thematicSummary.set(res.thematicSummary || '');
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleOrganize(): Promise<void> {
    if (this.organizeForm.invalid) return;
    this.isLoading.set(true);
    try {
      const formVal = this.organizeForm.value;
      const res = await this.chatGptService.organizeReferences(
        formVal.topic || '',
        formVal.rawReferences || '',
        (formVal.citationStyle as any) || 'harvard'
      );
      this.curatedBibliography.set(res.curatedBibliography || '');
      this.inTextGuide.set(res.inTextCitationGuide || '');
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  copyCitation(text: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }
}
