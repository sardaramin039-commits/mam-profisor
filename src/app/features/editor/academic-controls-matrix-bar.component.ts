import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AcademicControlsMatrixService, AcademicMatrixConfig } from '../../core/services/academic-controls-matrix.service';

type ActivePanel = 'sources' | 'outline' | 'dialectic' | 'agents' | 'style' | 'comparative' | null;

@Component({
  selector: 'app-academic-controls-matrix-bar',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mam-matrix-container w-full bg-stone-900/90 text-stone-100 rounded-2xl border border-stone-800 shadow-xl backdrop-blur-md p-4 mb-6 transition-all duration-300 font-sans" dir="rtl">
      <!-- Header bar with summary badge -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <mat-icon class="!text-lg !w-5 !h-5">tune</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-bold text-white flex items-center gap-2 m-0">
              <span>کۆنتڕۆڵە پێشکەوتووەکانی ئەکادیمی (٦ کۆنتڕۆڵی پرۆفیسۆر)</span>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                {{ matrix.activeBadgesCount() }} چالاکە
              </span>
            </h2>
            <p class="text-[11px] text-stone-400 m-0 mt-0.5">
              ئاڕاستەکردنی قووڵی بزوێنەری نووسین، سەرچاوەی تایبەت، دیالێکتیک، فرە-ئەجێنت و مۆدی بەراوردکاری.
            </p>
          </div>
        </div>

        @if (activePanel()) {
          <button
            type="button"
            (click)="activePanel.set(null)"
            class="text-xs text-stone-400 hover:text-white px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 transition flex items-center gap-1 cursor-pointer">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">expand_less</mat-icon>
            <span>داخستنی پەڕەی ڕێکخستن</span>
          </button>
        }
      </div>

      <!-- 6 Interactive Icon Pills -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
        <!-- 1. Custom Sources -->
        <button
          type="button"
          (click)="onPillClick('sources', 'customSourcesEnabled')"
          class="flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden group"
          [class]="matrix.state().customSourcesEnabled ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-sm shadow-emerald-950' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'">
          <div class="flex items-center justify-between w-full mb-1">
            <mat-icon class="!text-lg !w-5 !h-5" [class.text-emerald-400]="matrix.state().customSourcesEnabled">menu_book</mat-icon>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class]="matrix.state().customSourcesEnabled ? 'bg-emerald-500 text-black' : 'bg-stone-700/70 text-stone-400'">
              {{ matrix.state().customSourcesEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <span class="text-xs font-bold text-stone-100">سەرچاوەی تایبەت</span>
          <span class="text-[10px] mt-0.5 truncate w-full" [class.text-emerald-300]="matrix.state().customSourcesEnabled">
            {{ matrix.state().customSourcesEnabled ? 'قوفڵی سەرچاوەکان' : 'خۆکار (ئەپ دادەنێت)' }}
          </span>
        </button>

        <!-- 2. Custom Outline -->
        <button
          type="button"
          (click)="onPillClick('outline', 'customOutlineEnabled')"
          class="flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden group"
          [class]="matrix.state().customOutlineEnabled ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 shadow-sm shadow-sky-950' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'">
          <div class="flex items-center justify-between w-full mb-1">
            <mat-icon class="!text-lg !w-5 !h-5" [class.text-sky-400]="matrix.state().customOutlineEnabled">format_list_numbered_rtl</mat-icon>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class]="matrix.state().customOutlineEnabled ? 'bg-sky-500 text-black' : 'bg-stone-700/70 text-stone-400'">
              {{ matrix.state().customOutlineEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <span class="text-xs font-bold text-stone-100">پێڕستی تایبەت</span>
          <span class="text-[10px] mt-0.5 truncate w-full" [class.text-sky-300]="matrix.state().customOutlineEnabled">
            {{ matrix.state().customOutlineEnabled ? 'پێڕستی دیاریکراو' : 'خۆکار (ئەپ دادەڕێژێت)' }}
          </span>
        </button>

        <!-- 3. Dialectic Engine -->
        <button
          type="button"
          (click)="onPillClick('dialectic', 'dialecticModeEnabled')"
          class="flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden group"
          [class]="matrix.state().dialecticModeEnabled ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-sm shadow-indigo-950' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'">
          <div class="flex items-center justify-between w-full mb-1">
            <mat-icon class="!text-lg !w-5 !h-5" [class.text-indigo-400]="matrix.state().dialecticModeEnabled">balance</mat-icon>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class]="matrix.state().dialecticModeEnabled ? 'bg-indigo-500 text-white' : 'bg-stone-700/70 text-stone-400'">
              {{ matrix.state().dialecticModeEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <span class="text-xs font-bold text-stone-100">سیستەمی دیالێکتیک</span>
          <span class="text-[10px] mt-0.5 truncate w-full" [class.text-indigo-300]="matrix.state().dialecticModeEnabled">
            {{ matrix.state().dialecticModeEnabled ? 'تێز • دژەتێز • سێنتێز' : 'شێوازی ئاسایی' }}
          </span>
        </button>

        <!-- 4. Writer-Critic-Reviewer Loop -->
        <button
          type="button"
          (click)="onPillClick('agents', 'writerCriticReviewerEnabled')"
          class="flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden group"
          [class]="matrix.state().writerCriticReviewerEnabled ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-sm shadow-amber-950' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'">
          <div class="flex items-center justify-between w-full mb-1">
            <mat-icon class="!text-lg !w-5 !h-5" [class.text-amber-400]="matrix.state().writerCriticReviewerEnabled">groups</mat-icon>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class]="matrix.state().writerCriticReviewerEnabled ? 'bg-amber-500 text-black' : 'bg-stone-700/70 text-stone-400'">
              {{ matrix.state().writerCriticReviewerEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <span class="text-xs font-bold text-stone-100">فلتەری ٣-ئەجێنت</span>
          <span class="text-[10px] mt-0.5 truncate w-full" [class.text-amber-300]="matrix.state().writerCriticReviewerEnabled">
            {{ matrix.state().writerCriticReviewerEnabled ? 'نووسەر • ڕەخنەگر • پێداچوونەوە' : 'تاکە ئەجێنت' }}
          </span>
        </button>

        <!-- 5. Style Mimicry -->
        <button
          type="button"
          (click)="onPillClick('style', 'styleMimicryEnabled')"
          class="flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden group"
          [class]="matrix.state().styleMimicryEnabled ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-sm shadow-purple-950' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'">
          <div class="flex items-center justify-between w-full mb-1">
            <mat-icon class="!text-lg !w-5 !h-5" [class.text-purple-400]="matrix.state().styleMimicryEnabled">auto_fix_high</mat-icon>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class]="matrix.state().styleMimicryEnabled ? 'bg-purple-500 text-white' : 'bg-stone-700/70 text-stone-400'">
              {{ matrix.state().styleMimicryEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <span class="text-xs font-bold text-stone-100">کۆپی ستایل</span>
          <span class="text-[10px] mt-0.5 truncate w-full" [class.text-purple-300]="matrix.state().styleMimicryEnabled">
            {{ matrix.state().styleMimicryEnabled ? 'هاوشێوەسازیی دەق' : 'شێوازی ستاندارد' }}
          </span>
        </button>

        <!-- 6. Comparative Study Mode -->
        <button
          type="button"
          (click)="onPillClick('comparative', 'comparativeModeEnabled')"
          class="flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden group"
          [class]="matrix.state().comparativeModeEnabled ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-sm shadow-rose-950' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'">
          <div class="flex items-center justify-between w-full mb-1">
            <mat-icon class="!text-lg !w-5 !h-5" [class.text-rose-400]="matrix.state().comparativeModeEnabled">compare_arrows</mat-icon>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class]="matrix.state().comparativeModeEnabled ? 'bg-rose-500 text-white' : 'bg-stone-700/70 text-stone-400'">
              {{ matrix.state().comparativeModeEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <span class="text-xs font-bold text-stone-100">بەراوردکاری (٣ بۆشایی)</span>
          <span class="text-[10px] mt-0.5 truncate w-full" [class.text-rose-300]="matrix.state().comparativeModeEnabled">
            {{ matrix.state().comparativeModeEnabled ? 'دەقی ١ • دەقی ٢ • تەوەر' : 'توێژینەوەی یەکپارچە' }}
          </span>
        </button>
      </div>

      <!-- Expandable Configuration Drawers -->
      @if (activePanel() === 'sources') {
        <div class="mt-4 p-4 rounded-xl bg-stone-950/80 border border-emerald-500/30 transition-all">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <mat-icon class="!text-sm !w-4 !h-4">menu_book</mat-icon>
              <span>قوفڵی سەرچاوە تایبەتەکانی توێژەر (Custom Scholarly Sources)</span>
            </div>
            <button
              type="button"
              (click)="matrix.toggle('customSourcesEnabled')"
              class="px-2.5 py-0.5 text-[11px] rounded font-bold cursor-pointer transition"
              [class]="matrix.state().customSourcesEnabled ? 'bg-emerald-500 text-black' : 'bg-stone-800 text-stone-400'">
              {{ matrix.state().customSourcesEnabled ? 'چالاکە (Active)' : 'ناچالاک بکە' }}
            </button>
          </div>
          <p class="text-[11px] text-stone-400 mb-2">
            سەرچاوەکان دێڕ بە دێڕ لێرە بنووسە یان پێست بکە. ئەپڵیکەیشن بە توندی پابەند دەبێت کە تەنها ئەم سەرچاوانە بەکاربهێنێت:
          </p>
          <textarea
            [value]="matrix.state().customSourcesList"
            (input)="onTextChange('customSourcesList', $event)"
            rows="3"
            dir="rtl"
            placeholder="نموونە:
١. د. مەعرووف خەزنەدار (٢٠٠١)، مێژووی ئەدەبی کوردی، بەرگی یەکەم، دەزگای ئاراس، هەولێر.
٢. د. کەمال مەزهەر ئەحمەد (١٩٨٥)، کوردستان لە ساڵەکانی شەڕی یەکەمی جیهانیدا، بەغدا."
            class="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-serif leading-relaxed">
          </textarea>
        </div>
      }

      @if (activePanel() === 'outline') {
        <div class="mt-4 p-4 rounded-xl bg-stone-950/80 border border-sky-500/30 transition-all">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <mat-icon class="!text-sm !w-4 !h-4">format_list_numbered_rtl</mat-icon>
              <span>پێڕستی تایبەت و دیاریکراوی بەشەکان (Custom Chapters Outline)</span>
            </div>
            <button
              type="button"
              (click)="matrix.toggle('customOutlineEnabled')"
              class="px-2.5 py-0.5 text-[11px] rounded font-bold cursor-pointer transition"
              [class]="matrix.state().customOutlineEnabled ? 'bg-sky-500 text-black' : 'bg-stone-800 text-stone-400'">
              {{ matrix.state().customOutlineEnabled ? 'چالاکە (Active)' : 'ناچالاک بکە' }}
            </button>
          </div>
          <p class="text-[11px] text-stone-400 mb-2">
            پێڕستی بەشەکان دێڕ بە دێڕ لێرە دابنێ؛ بزوێنەر دەقاودەق بەپێی ئەم پێڕستە بەش و تەوەرەکان دروست دەکات:
          </p>
          <textarea
            [value]="matrix.state().customOutlineText"
            (input)="onTextChange('customOutlineText', $event)"
            rows="4"
            dir="rtl"
            placeholder="نموونە:
بەشی یەکەم: چوارچێوەی چەمکسازی و تیۆری توێژینەوە
  - تەوەری یەکەم: پێناسەی چەمک و مێژووی سەرهەڵدان
  - تەوەری دووەم: دیدگا تیۆرییە هاوچەرخەکان
بەشی دووەم: لێکۆڵینەوەی مەیدانی و شیکاریی بەراوردکاری
  - تەوەری یەکەم: ئامراز و میتۆدۆلۆجیای کۆکردنەوەی داتا"
            class="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-sky-500 font-serif leading-relaxed">
          </textarea>
        </div>
      }

      @if (activePanel() === 'dialectic') {
        <div class="mt-4 p-4 rounded-xl bg-stone-950/80 border border-indigo-500/30 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <mat-icon class="!text-sm !w-4 !h-4">balance</mat-icon>
              <span>سیستەمی شیکاریی دیالێکتیکی (Hegelian Dialectical Triad)</span>
            </div>
            <button
              type="button"
              (click)="matrix.toggle('dialecticModeEnabled')"
              class="px-2.5 py-0.5 text-[11px] rounded font-bold cursor-pointer transition"
              [class]="matrix.state().dialecticModeEnabled ? 'bg-indigo-500 text-white' : 'bg-stone-800 text-stone-400'">
              {{ matrix.state().dialecticModeEnabled ? 'چالاکە (Active)' : 'ناچالاک بکە' }}
            </button>
          </div>
          <!-- 3-Step Visual Pill Indicator -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg bg-stone-900 border border-indigo-900/60 flex items-start gap-2.5">
              <span class="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">١</span>
              <div>
                <strong class="text-xs text-indigo-300 block mb-0.5">تێز (Thesis)</strong>
                <span class="text-[11px] text-stone-400 leading-snug block">خستنەڕووی تێزی سەرەکی، گریمانە و دیدگای داکۆکیکراو بە بەڵگەی بەهێزەوە.</span>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-stone-900 border border-indigo-900/60 flex items-start gap-2.5">
              <span class="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">٢</span>
              <div>
                <strong class="text-xs text-indigo-300 block mb-0.5">دژەتێز (Antithesis)</strong>
                <span class="text-[11px] text-stone-400 leading-snug block">خستنەڕووی ڕەخنە، دیدگای بەرامبەر و کێشە تیۆری و پراکتیکییەکان.</span>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-stone-900 border border-indigo-900/60 flex items-start gap-2.5">
              <span class="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">٣</span>
              <div>
                <strong class="text-xs text-indigo-300 block mb-0.5">سێنتێز (Synthesis)</strong>
                <span class="text-[11px] text-stone-400 leading-snug block">تێپەڕاندنی دژیەکییەکان و دەرئەنجامێکی گشتگیر و قووڵی توێژەر.</span>
              </div>
            </div>
          </div>
        </div>
      }

      @if (activePanel() === 'agents') {
        <div class="mt-4 p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <mat-icon class="!text-sm !w-4 !h-4">groups</mat-icon>
              <span>فلتەری سێ-ئەجێنتی نووسین (Writer ➔ Critic ➔ Reviewer Pipeline)</span>
            </div>
            <button
              type="button"
              (click)="matrix.toggle('writerCriticReviewerEnabled')"
              class="px-2.5 py-0.5 text-[11px] rounded font-bold cursor-pointer transition"
              [class]="matrix.state().writerCriticReviewerEnabled ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-400'">
              {{ matrix.state().writerCriticReviewerEnabled ? 'چالاکە (Active)' : 'ناچالاک بکە' }}
            </button>
          </div>
          <!-- 3-Agent Pipeline Visual Stage -->
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="flex-1 p-3 rounded-lg bg-stone-900 border border-amber-900/60 flex items-center gap-2.5 w-full">
              <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                <mat-icon class="!text-sm !w-4 !h-4">edit_note</mat-icon>
              </div>
              <div>
                <strong class="text-xs text-amber-300 block">١. نووسەری ئەکادیمی</strong>
                <span class="text-[10px] text-stone-400">داڕشتنی پەرەگراف بە دەستەواژەی زانستی</span>
              </div>
            </div>
            <mat-icon class="text-stone-600 hidden sm:block shrink-0">west</mat-icon>
            <div class="flex-1 p-3 rounded-lg bg-stone-900 border border-amber-900/60 flex items-center gap-2.5 w-full">
              <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                <mat-icon class="!text-sm !w-4 !h-4">psychology</mat-icon>
              </div>
              <div>
                <strong class="text-xs text-amber-300 block">٢. ڕەخنەگری میتۆدی</strong>
                <span class="text-[10px] text-stone-400">پشکنینی بەڵگە، پوختەیی و نەهێشتنی سۆز</span>
              </div>
            </div>
            <mat-icon class="text-stone-600 hidden sm:block shrink-0">west</mat-icon>
            <div class="flex-1 p-3 rounded-lg bg-stone-900 border border-amber-900/60 flex items-center gap-2.5 w-full">
              <div class="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                <mat-icon class="!text-sm !w-4 !h-4">verified</mat-icon>
              </div>
              <div>
                <strong class="text-xs text-amber-300 block">٣. پێداچوونەوەی زمانەوانی</strong>
                <span class="text-[10px] text-stone-400">ڕێنووسی ڕەسەنی کوردی و تەواوکاری</span>
              </div>
            </div>
          </div>
        </div>
      }

      @if (activePanel() === 'style') {
        <div class="mt-4 p-4 rounded-xl bg-stone-950/80 border border-purple-500/30 transition-all">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 text-purple-400 text-xs font-bold">
              <mat-icon class="!text-sm !w-4 !h-4">auto_fix_high</mat-icon>
              <span>هاوشێوەسازیی ستایل و شێوازناسی (Academic Style Cloning / Mimicry)</span>
            </div>
            <button
              type="button"
              (click)="matrix.toggle('styleMimicryEnabled')"
              class="px-2.5 py-0.5 text-[11px] rounded font-bold cursor-pointer transition"
              [class]="matrix.state().styleMimicryEnabled ? 'bg-purple-500 text-white' : 'bg-stone-800 text-stone-400'">
              {{ matrix.state().styleMimicryEnabled ? 'چالاکە (Active)' : 'ناچالاک بکە' }}
            </button>
          </div>
          <p class="text-[11px] text-stone-400 mb-2">
            دەق یان پەرەگرافێکی نموونەیی لەو نووسەر، کتێب یان گۆڤارە دابنێ کە دەتەوێت تەواوی توێژینەوەکەت بە هەمان ستایل و قەڵەم بنووسرێت:
          </p>
          <textarea
            [value]="matrix.state().styleReferenceSample"
            (input)="onTextChange('styleReferenceSample', $event)"
            rows="3"
            dir="rtl"
            placeholder="نموونەی دەقی خوازراو لێرە پێست بکە تا تەواوی شێوازی ڕستەسازی، پلەی فەرمیبوون و زاراوەکان هاوشێوە بکرێن..."
            class="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-purple-500 font-serif leading-relaxed">
          </textarea>
        </div>
      }

      @if (activePanel() === 'comparative') {
        <div class="mt-4 p-4 rounded-xl bg-stone-950/80 border border-rose-500/30 transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <mat-icon class="!text-sm !w-4 !h-4">compare_arrows</mat-icon>
              <span>مۆدی توێژینەوەی بەراوردکاری (3-Box Comparative Matrix)</span>
            </div>
            <button
              type="button"
              (click)="matrix.toggle('comparativeModeEnabled')"
              class="px-2.5 py-0.5 text-[11px] rounded font-bold cursor-pointer transition"
              [class]="matrix.state().comparativeModeEnabled ? 'bg-rose-500 text-white' : 'bg-stone-800 text-stone-400'">
              {{ matrix.state().comparativeModeEnabled ? 'چالاکە (Active)' : 'ناچالاک بکە' }}
            </button>
          </div>

          <p class="text-[11px] text-stone-400 mb-3">
            دیاریکردنی سێ بنەمای توێژینەوەی بەراوردکاری (دەقی یەکەم، دەقی دووەم، و تەوەری هاوبەشی بەراوردکاری):
          </p>

          <!-- 3 Distinct Boxes -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Box 1 -->
            <div class="p-3 rounded-xl bg-stone-900/90 border border-rose-900/60">
              <label class="block text-xs font-bold text-rose-300 mb-1.5 flex items-center gap-1.5">
                <mat-icon class="!text-xs !w-4 !h-4">book</mat-icon>
                <span>١. کتێب / دەقی یەکەم</span>
              </label>
              <input
                type="text"
                [value]="matrix.state().comparativeSourceOne"
                (input)="onTextChange('comparativeSourceOne', $event)"
                placeholder="نموونە: مەم و زینی ئەحمەدی خانی"
                class="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-rose-500 font-serif"
              />
            </div>

            <!-- Box 2 -->
            <div class="p-3 rounded-xl bg-stone-900/90 border border-rose-900/60">
              <label class="block text-xs font-bold text-rose-300 mb-1.5 flex items-center gap-1.5">
                <mat-icon class="!text-xs !w-4 !h-4">book</mat-icon>
                <span>٢. کتێب / دەقی دووەم</span>
              </label>
              <input
                type="text"
                [value]="matrix.state().comparativeSourceTwo"
                (input)="onTextChange('comparativeSourceTwo', $event)"
                placeholder="نموونە: شیرین و خوسرەوی خانای قوبادی"
                class="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-rose-500 font-serif"
              />
            </div>

            <!-- Box 3 -->
            <div class="p-3 rounded-xl bg-stone-900/90 border border-rose-900/60">
              <label class="block text-xs font-bold text-rose-300 mb-1.5 flex items-center gap-1.5">
                <mat-icon class="!text-xs !w-4 !h-4">hub</mat-icon>
                <span>٣. ڕووی بەراوردکاری (تەوەر)</span>
              </label>
              <input
                type="text"
                [value]="matrix.state().comparativeAxis"
                (input)="onTextChange('comparativeAxis', $event)"
                placeholder="نموونە: ڕەهەندی سۆفیگەری و پێکهاتەی گێڕانەوە"
                class="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-rose-500 font-serif"
              />
            </div>
          </div>
        </div>
      }
    </section>
  `
})
export class AcademicControlsMatrixBarComponent {
  readonly matrix = inject(AcademicControlsMatrixService);
  readonly activePanel = signal<ActivePanel>(null);

  onPillClick(panel: ActivePanel, toggleKey: keyof AcademicMatrixConfig): void {
    // If clicking the current open panel, toggle state; if closed, open panel and ensure enabled
    if (this.activePanel() === panel) {
      this.activePanel.set(null);
    } else {
      this.activePanel.set(panel);
      if (!this.matrix.state()[toggleKey]) {
        this.matrix.toggle(toggleKey as any);
      }
    }
  }

  onTextChange(key: keyof AcademicMatrixConfig, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target) {
      this.matrix.update(key, target.value as any);
    }
  }
}
