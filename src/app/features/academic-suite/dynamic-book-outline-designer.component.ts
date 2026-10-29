import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EditorService } from '../editor/services/editor';
import { AppNotificationsService } from '../../core/app.notifications';
import { buildAcademicThesisOutline } from '../../helpers/outline-structure';
import { GeminiStructuredOutlineService, ThesisOutlineResponse } from '../../services/gemini-structured-outline.service';
import { SubSectionWriterService } from '../../services/sub-section-writer.service';
import { LEVEL_PROFILES, AcademicLevel, LevelCalibrationProfile } from '../../models/level-profiles';
import { AcademicBlueprint, buildLevelCalibratedBlueprint } from '../../services/BlueprintAndOutlineAgent';
import { AdaptiveCitationManager, SourceItem } from '../../services/AdaptiveCitationManager';
import {
  generateLevelDesignStylesheet,
  writeCalibratedSubSection,
  generateCalibratedConclusion
} from '../../services/AdaptiveWriterAndDesigner';
import {
  generateCompleteAcademicWork,
  CompleteAcademicWorkResult,
  MasterOrchestrationProgress
} from '../../services/MasterOrchestrator';
import { ChapterItemModel, AxisItem, SubBranchItem } from '../../domain/models';

export interface KurdishStandardEvaluation {
  status: 'compliant' | 'warning' | 'needs_adjustment';
  statusLabel: string;
  badgeClass: string;
  wordDensityLabel: string;
  subsectionsAdvice: string;
  structureDistribution: { name: string; percentage: number; words: number }[];
}

@Component({
  selector: 'app-dynamic-book-outline-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">account_tree</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>دیزاینەری داینامیکیی پێڕست و پەیکەری تێز (Thesis Outline Designer)</span>
              <span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono">
                Gemini Structured Schema
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              داڕشتنی پەیکەری ئەکادیمی بەپێی یاسا زێڕینەکان، کالیبراسیۆنی ٤ ئاستەکە، و بۆریی نووسینی پێکەوەبەستراو
            </p>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button (click)="activeDesignMode.set('profiles')"
                  [class.bg-purple-600]="activeDesignMode() === 'profiles'"
                  [class.text-white]="activeDesignMode() === 'profiles'"
                  [class.text-slate-300]="activeDesignMode() !== 'profiles'"
                  class="px-3 py-1 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">verified_user</mat-icon>
            <span>کالیبراسیۆنی ٤ ئاستەکە (Level Profiles)</span>
          </button>
          <button (click)="activeDesignMode.set('blueprint')"
                  [class.bg-purple-600]="activeDesignMode() === 'blueprint'"
                  [class.text-white]="activeDesignMode() === 'blueprint'"
                  [class.text-slate-300]="activeDesignMode() !== 'blueprint'"
                  class="px-3 py-1 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">architecture</mat-icon>
            <span>نەخشەی ئەندازیاری (Blueprint Agent)</span>
          </button>
          <button (click)="activeDesignMode.set('master')"
                  [class.bg-purple-600]="activeDesignMode() === 'master'"
                  [class.text-white]="activeDesignMode() === 'master'"
                  [class.text-slate-300]="activeDesignMode() !== 'master'"
                  class="px-3 py-1 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">auto_awesome_motion</mat-icon>
            <span>بەڕێوەبەری گشتی (Master Orchestrator)</span>
          </button>
          <button (click)="activeDesignMode.set('gemini')"
                  [class.bg-purple-600]="activeDesignMode() === 'gemini'"
                  [class.text-white]="activeDesignMode() === 'gemini'"
                  [class.text-slate-300]="activeDesignMode() !== 'gemini'"
                  class="px-3 py-1 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">auto_awesome</mat-icon>
            <span>پەیکەری ستاندارد (Gemini)</span>
          </button>
          <button (click)="activeDesignMode.set('density')"
                  [class.bg-purple-600]="activeDesignMode() === 'density'"
                  [class.text-white]="activeDesignMode() === 'density'"
                  [class.text-slate-300]="activeDesignMode() !== 'density'"
                  class="px-3 py-1 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">tune</mat-icon>
            <span>ئەندازە و چڕی (Density)</span>
          </button>
          <button (click)="activeDesignMode.set('pipeline')"
                  [class.bg-purple-600]="activeDesignMode() === 'pipeline'"
                  [class.text-white]="activeDesignMode() === 'pipeline'"
                  [class.text-slate-300]="activeDesignMode() !== 'pipeline'"
                  class="px-3 py-1 text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold">
            <mat-icon class="!text-xs !w-3.5 !h-3.5">auto_stories</mat-icon>
            <span>بۆریی نووسین (Multi-Pass)</span>
          </button>
        </div>
      </div>

      <!-- Mode 0: Academic Level Profiles & Calibration (School, Bachelor, Master, PhD) -->
      @if (activeDesignMode() === 'profiles') {
        @let profile = currentLevelProfile();
        <div class="space-y-4">
          <!-- 4 Level Selector Tabs -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            @for (lvl of academicLevelsList; track lvl) {
              @let p = levelProfiles[lvl];
              <button
                type="button"
                (click)="applyCalibrationProfile(lvl)"
                [class.ring-2]="selectedProfileLevel() === lvl"
                [class.ring-purple-500]="selectedProfileLevel() === lvl"
                [class.bg-slate-950]="selectedProfileLevel() === lvl"
                [class.border-purple-500]="selectedProfileLevel() === lvl"
                [class.bg-slate-900]="selectedProfileLevel() !== lvl"
                [class.border-slate-800]="selectedProfileLevel() !== lvl"
                class="p-3 rounded-xl border text-right transition cursor-pointer hover:border-slate-700">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-100 font-serif">{{ p.kurdishTitle.split('(')[0] }}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                        [class.bg-purple-900]="selectedProfileLevel() === lvl"
                        [class.text-purple-200]="selectedProfileLevel() === lvl"
                        [class.bg-slate-800]="selectedProfileLevel() !== lvl"
                        [class.text-slate-400]="selectedProfileLevel() !== lvl">
                    {{ p.structure.totalWords.toLocaleString() }} وشە
                  </span>
                </div>
                <span class="text-[10px] text-slate-400 block line-clamp-1 font-serif">
                  {{ p.structure.coreChaptersCount }} بەش • {{ p.citationMode }}
                </span>
              </button>
            }
          </div>

          <!-- Active Profile Header Card -->
          <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-4 rounded-xl border border-indigo-900/50 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <mat-icon class="!text-lg">psychology</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white font-serif">{{ profile.kurdishTitle }}</h4>
                  <span class="text-[10px] text-purple-300 font-mono">Profile Level: {{ profile.level.toUpperCase() }} • {{ profile.structure.totalWords.toLocaleString() }} وشە</span>
                </div>
              </div>

              <button
                type="button"
                (click)="applyCalibrationProfile(selectedProfileLevel())"
                class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">check_circle</mat-icon>
                <span>کالیبرەکردنی هەموو بەشەکان بەپێی ئەم ئاستە</span>
              </button>
            </div>

            <!-- Persona and Voice -->
            <div class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
              <span class="text-xs font-bold text-purple-300 flex items-center gap-1">
                <mat-icon class="!text-xs">record_voice_over</mat-icon>
                شوناس و کەسایەتیی نووسەر (Persona & Authorial Voice):
              </span>
              <p class="text-xs text-slate-200 font-serif leading-relaxed whitespace-pre-line">
                {{ profile.personaPrompt.trim() }}
              </p>
            </div>

            <!-- Two-Column: Style Rules vs Forbidden Rules -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Style Rules -->
              <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span class="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <mat-icon class="!text-xs">menu_book</mat-icon>
                  یاساکانی زمان، زاراوە و ڕستەسازی:
                </span>
                <div class="text-xs text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                  {{ profile.vocabularyAndStyleRules.trim() }}
                </div>
              </div>

              <!-- Forbidden Rules -->
              <div class="bg-red-950/20 p-3 rounded-lg border border-red-900/40 space-y-1.5">
                <span class="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <mat-icon class="!text-xs">block</mat-icon>
                  یاسا بە توندی قەدەغەکراوەکان (Strictly Forbidden):
                </span>
                <div class="text-xs text-rose-200/90 font-serif leading-relaxed whitespace-pre-line">
                  {{ profile.strictlyForbiddenRules.trim() }}
                </div>
              </div>
            </div>

            <!-- Intro and Conclusion Rules -->
            <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <span class="text-xs font-bold text-indigo-300 flex items-center gap-1">
                <mat-icon class="!text-xs">alt_route</mat-icon>
                ڕێساکانی داڕشتنی پێشەکی و ئەنجام:
              </span>
              <div class="text-xs text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                {{ profile.introAndConclusionRules.trim() }}
              </div>
            </div>

            <!-- Structural Metrics Matrix -->
            <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
                <mat-icon class="!text-xs">view_column</mat-icon>
                ماتریسی پێکهاتەیی و ژمارەی وشەکان (Structural Calibration Matrix):
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">کۆی وشە</span>
                  <span class="font-bold font-mono text-purple-300">{{ profile.structure.totalWords.toLocaleString() }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">دەروازە/پێشەکی</span>
                  <span class="font-bold font-mono text-blue-300">{{ profile.structure.introWords.toLocaleString() }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">ئەنجامەکان</span>
                  <span class="font-bold font-mono text-amber-300">{{ profile.structure.conclusionWords.toLocaleString() }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">بەشە سەرەکییەکان</span>
                  <span class="font-bold font-mono text-slate-200">{{ profile.structure.coreChaptersCount }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">تەوەر / بەشێک</span>
                  <span class="font-bold font-mono text-slate-200">{{ profile.structure.sectionsPerChapter }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">لق / تەوەرێک</span>
                  <span class="font-bold font-mono text-slate-200">{{ profile.structure.subSectionsPerSection }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">سەقفی ١ قۆناغ</span>
                  <span class="font-bold font-mono text-emerald-300">{{ profile.structure.maxWordsPerSinglePass }}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded border border-slate-800">
                  <span class="text-[9px] text-slate-400 block">کەمترین سەرچاوە</span>
                  <span class="font-bold font-mono text-indigo-300">{{ profile.structure.minSources }}</span>
                </div>
              </div>
            </div>

            <!-- Citation Mode & Design Specs -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <!-- Citation Mode Card -->
              <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <mat-icon class="!text-xs">format_quote</mat-icon>
                  شێوازی سەرچاوە و پەراوێز (Citation Mode):
                </span>
                <span class="font-mono text-purple-300 text-[11px] block bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {{ profile.citationMode }}
                </span>
                <p class="text-[11px] text-slate-400">
                  @if (profile.citationMode === 'simple_list') {
                    لیستی سادەی سەرچاوەکان لە کۆتایی ڕاپۆرتەکە بەبێ پەراوێزی ژمارەدار.
                  } @else if (profile.citationMode === 'standard_footnotes') {
                    پەراوێزی ژمارەدار لە ژێرەوەی لاپەڕە بە فۆرماتی ئەکادیمیی ستاندارد.
                  } @else {
                    پەراوێزی فرەزمانی زانستی بە ڕەنووسی کوردی (١) و پۆلێنکردنی بیبلۆگرافیای ٤ زمانی.
                  }
                </p>

                <!-- Live Adaptive Citation Preview -->
                @if (sampleAdaptiveCitationsResult(); as preview) {
                  <div class="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span class="text-[10px] text-purple-300 font-bold block flex items-center gap-1">
                      <mat-icon class="!text-[10px] text-purple-400">auto_stories</mat-icon>
                      نموونەی شێوازی پەراوێز و سەرچاوەدانان بە پێوەری ئەم ئاستە (Adaptive Citation):
                    </span>
                    <div class="bg-slate-950 p-2 rounded border border-slate-800/80 text-[11px] font-serif text-slate-300 leading-relaxed" [innerHTML]="preview.formattedHtml">
                    </div>
                    @if (preview.footnotesBlock) {
                      <div class="bg-slate-950 p-2 rounded border border-slate-800/80 text-[10px] font-serif text-slate-400 whitespace-pre-line">
                        {{ preview.footnotesBlock }}
                      </div>
                    }
                    <div class="bg-slate-950 p-2 rounded border border-slate-800/80 text-[10px] font-serif text-indigo-300 max-h-24 overflow-y-auto whitespace-pre-line">
                      {{ preview.bibliography }}
                    </div>
                  </div>
                }
              </div>

              <!-- Design Spec Card -->
              <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <mat-icon class="!text-xs">design_services</mat-icon>
                  تایبەتمەندیی دیزاین، فۆنت و چاپ (Design Spec):
                </span>
                <div class="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300 pt-1">
                  <div class="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span class="text-slate-500 block">فۆنت:</span>
                    <span class="font-mono text-slate-200">{{ profile.designSpec.fontFamily.split(',')[0] }}</span>
                  </div>
                  <div class="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span class="text-slate-500 block">قەبارەی دەق:</span>
                    <span class="font-mono text-slate-200">{{ profile.designSpec.bodyFontSizePt }}pt</span>
                  </div>
                  <div class="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span class="text-slate-500 block">بۆشایی دێڕ:</span>
                    <span class="font-mono text-slate-200">{{ profile.designSpec.lineHeight }}</span>
                  </div>
                  <div class="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span class="text-slate-500 block">پەراوێز:</span>
                    <span class="font-mono text-slate-200">{{ profile.designSpec.footnoteSizePt }}pt</span>
                  </div>
                  <div class="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span class="text-slate-500 block">پەڕاوێزی ڕاست:</span>
                    <span class="font-mono text-slate-200">{{ profile.designSpec.marginsCm.right }}cm</span>
                  </div>
                  <div class="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span class="text-slate-500 block">مۆدێلی بینراو:</span>
                    <span class="font-mono text-purple-300">{{ profile.designSpec.visualStyle }}</span>
                  </div>
                </div>

                <!-- Stylesheet Toggle & Preview -->
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    (click)="showStylesheet.set(!showStylesheet())"
                    class="text-[11px] text-purple-300 hover:text-purple-200 flex items-center gap-1 font-bold cursor-pointer">
                    <mat-icon class="!text-xs">css</mat-icon>
                    <span>{{ showStylesheet() ? 'شاردنەوەی ستایلی تایپۆگرافی' : 'پیشاندانی ستایلی تایپۆگرافی و چاپی کوردی (CSS)' }}</span>
                  </button>
                  <button
                    type="button"
                    (click)="copyStylesheet()"
                    class="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800 flex items-center gap-1 cursor-pointer">
                    <mat-icon class="!text-[10px]">content_copy</mat-icon>
                    <span>کۆپیکردنی CSS</span>
                  </button>
                </div>

                @if (showStylesheet()) {
                  <pre class="bg-slate-950 p-2.5 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap" dir="ltr">{{ currentStylesheet() }}</pre>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Mode Blueprint: Academic Blueprint & Outline Agent with Micro-Topics -->
      @if (activeDesignMode() === 'blueprint') {
        @let profile = currentLevelProfile();
        <div class="space-y-4">
          <!-- Setup Bar -->
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <mat-icon class="!text-sm text-purple-400">psychology</mat-icon>
                <span>ئەندازیاریی تێز و پێڕست بە پێوەری زێڕینی ٤ ئاستەکە (Blueprint & Outline Agent)</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                Micro-Topics Overlap Prevention
              </span>
            </div>

            <!-- 4 Level Quick Selection -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              @for (lvl of academicLevelsList; track lvl) {
                @let p = levelProfiles[lvl];
                <button
                  type="button"
                  (click)="applyCalibrationProfile(lvl)"
                  [class.ring-2]="selectedProfileLevel() === lvl"
                  [class.ring-purple-500]="selectedProfileLevel() === lvl"
                  [class.bg-purple-950]="selectedProfileLevel() === lvl"
                  [class.border-purple-600]="selectedProfileLevel() === lvl"
                  [class.bg-slate-900]="selectedProfileLevel() !== lvl"
                  [class.border-slate-800]="selectedProfileLevel() !== lvl"
                  class="p-2 rounded-lg border text-right cursor-pointer transition">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-100">{{ p.kurdishTitle.split('(')[0] }}</span>
                    <span class="text-[10px] font-mono text-purple-300 font-bold">{{ p.structure.totalWords.toLocaleString() }}</span>
                  </div>
                  <span class="text-[10px] text-slate-400 block mt-0.5">{{ p.structure.coreChaptersCount }} بەش • {{ p.structure.sectionsPerChapter * p.structure.subSectionsPerSection }} لق</span>
                </button>
              }
            </div>

            <!-- Thesis Title Input & Generate Button -->
            <div class="space-y-2 pt-2 border-t border-slate-800/80">
              <label class="block text-xs font-bold text-slate-300">ناونیشانی لێکۆڵینەوە یان پڕۆژەی تێز:</label>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  [ngModel]="thesisTitle()"
                  (ngModelChange)="thesisTitle.set($event)"
                  placeholder="ناونیشانی تێز یان ڕاپۆرت بنووسە..."
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-serif" />
                <button
                  type="button"
                  (click)="generateBlueprint()"
                  [disabled]="isBlueprintGenerating()"
                  class="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50">
                  @if (isBlueprintGenerating()) {
                    <mat-icon class="!text-sm animate-spin">autorenew</mat-icon>
                    <span>خەریکی داڕشتنی نەخشەی ئەندازیارییە...</span>
                  } @else {
                    <mat-icon class="!text-sm">auto_awesome</mat-icon>
                    <span>دروستکردنی نەخشەی ئەندازیاری (Generate Blueprint)</span>
                  }
                </button>
              </div>
            </div>
          </div>

          <!-- Generated Blueprint Display -->
          @if (generatedBlueprint(); as bp) {
            <div class="bg-slate-950 p-4 rounded-xl border border-purple-900/60 shadow-xl space-y-4">
              <!-- Sub-Tabs for Blueprint Inspection -->
              <div class="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                <div class="flex items-center gap-1">
                  <button
                    (click)="activeBlueprintTab.set('chapters')"
                    [class.bg-purple-600]="activeBlueprintTab() === 'chapters'"
                    [class.text-white]="activeBlueprintTab() === 'chapters'"
                    [class.text-slate-400]="activeBlueprintTab() !== 'chapters'"
                    class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                    <mat-icon class="!text-xs">view_list</mat-icon>
                    <span>پەیکەری بەش و لقەکان ({{ bp.chapters.length }} بەش)</span>
                  </button>
                  <button
                    (click)="activeBlueprintTab.set('analysis')"
                    [class.bg-purple-600]="activeBlueprintTab() === 'analysis'"
                    [class.text-white]="activeBlueprintTab() === 'analysis'"
                    [class.text-slate-400]="activeBlueprintTab() !== 'analysis'"
                    class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                    <mat-icon class="!text-xs">query_stats</mat-icon>
                    <span>شیکاریی ڕەهەندەکانی ناونیشان</span>
                  </button>
                  <button
                    (click)="activeBlueprintTab.set('front_matter')"
                    [class.bg-purple-600]="activeBlueprintTab() === 'front_matter'"
                    [class.text-white]="activeBlueprintTab() === 'front_matter'"
                    [class.text-slate-400]="activeBlueprintTab() !== 'front_matter'"
                    class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                    <mat-icon class="!text-xs">article</mat-icon>
                    <span>دەروازە و پوختەکان</span>
                  </button>
                </div>

                <!-- Action Button: Apply to Manuscript -->
                <button
                  type="button"
                  (click)="applyBlueprintToManuscript()"
                  class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow">
                  <mat-icon class="!text-xs">library_add_check</mat-icon>
                  <span>جێبەجێکردن لەناو دەستنووس (Apply to Manuscript)</span>
                </button>
              </div>

              <!-- View 1: Chapters & Micro-Topics -->
              @if (activeBlueprintTab() === 'chapters') {
                <div class="space-y-3">
                  @for (ch of bp.chapters; track ch.title; let chIdx = $index) {
                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2">
                      <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-full bg-purple-900/60 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                            {{ chIdx + 1 }}
                          </span>
                          <span class="text-xs font-bold text-slate-100 font-serif">{{ ch.title }}</span>
                          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                            {{ ch.chapterType }}
                          </span>
                        </div>
                        <span class="text-xs font-bold font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                          {{ ch.targetWords.toLocaleString() }} وشە
                        </span>
                      </div>

                      <!-- Sections in Chapter -->
                      <div class="space-y-2 pr-2 border-r-2 border-purple-900/40">
                        @for (sec of ch.sections; track sec.title) {
                          <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 space-y-1.5">
                            <div class="flex items-center justify-between text-xs font-bold text-slate-200">
                              <span class="flex items-center gap-1 font-serif">
                                <mat-icon class="!text-xs text-indigo-400">subdirectory_arrow_right</mat-icon>
                                {{ sec.title }}
                              </span>
                              <span class="font-mono text-[11px] text-slate-400">{{ sec.targetWords.toLocaleString() }} وشە</span>
                            </div>

                            <!-- SubSections with Micro-Topics -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                              @for (sub of sec.subSections; track sub.code) {
                                <div class="bg-slate-900/80 p-2 rounded border border-slate-800 space-y-1 text-xs">
                                  <div class="flex items-center justify-between">
                                    <span class="font-mono text-purple-300 font-bold text-[11px]">{{ sub.code }}</span>
                                    <span class="font-mono text-emerald-400 text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                      {{ sub.targetWords.toLocaleString() }} وشە
                                    </span>
                                  </div>
                                  <div class="font-bold text-slate-200 font-serif text-[11px]">{{ sub.title }}</div>

                                  <!-- Micro Topics To Cover (Prevents Topic Overlap) -->
                                  @if (sub.microTopicsToCover.length) {
                                    <div class="mt-1 pt-1 border-t border-slate-800/80">
                                      <span class="text-[9px] text-purple-300 font-bold block mb-0.5">تەوەرە وردە تایبەتەکان (ڕێگری لە سووتانی بابەت):</span>
                                      <div class="space-y-0.5">
                                        @for (topic of sub.microTopicsToCover; track topic) {
                                          <div class="text-[10px] text-slate-300 flex items-start gap-1">
                                            <span class="text-purple-400 font-bold">•</span>
                                            <span>{{ topic }}</span>
                                          </div>
                                        }
                                      </div>
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- View 2: Title Analysis -->
              @if (activeBlueprintTab() === 'analysis') {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span class="text-[11px] text-purple-400 font-bold block">بابەت یان کەرەستەی سەرەکی (Core Subject):</span>
                    <p class="text-slate-200 font-serif leading-relaxed">{{ bp.titleAnalysis.coreSubject }}</p>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span class="text-[11px] text-blue-400 font-bold block">ڕەهەندی یەکەم / بەشی دووەم (Primary Dimension):</span>
                    <p class="text-slate-200 font-serif leading-relaxed">{{ bp.titleAnalysis.primaryDimension }}</p>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span class="text-[11px] text-emerald-400 font-bold block">ڕەهەندی دووەم / بەشی سێیەم (Secondary Dimension):</span>
                    <p class="text-slate-200 font-serif leading-relaxed">{{ bp.titleAnalysis.secondaryDimension }}</p>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span class="text-[11px] text-amber-400 font-bold block">میتۆد و ڕێبازی زانستی (Recommended Approach):</span>
                    <p class="text-slate-200 font-serif leading-relaxed">{{ bp.titleAnalysis.recommendedApproach }}</p>
                  </div>
                </div>
              }

              <!-- View 3: Front Matter & Full Introduction -->
              @if (activeBlueprintTab() === 'front_matter') {
                <div class="space-y-3 text-xs">
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span class="text-[11px] text-purple-300 font-bold block">بەخشین و سوپاسنامەی فەرمی (Dedication & Acknowledgments):</span>
                    <p class="text-slate-300 font-serif leading-relaxed">{{ bp.frontMatterAndIntro.dedicationAndAck }}</p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span class="text-[11px] text-indigo-300 font-bold block">پوختەی کوردی (Kurdish Abstract):</span>
                      <p class="text-slate-300 font-serif leading-relaxed">{{ bp.frontMatterAndIntro.abstractKurdish }}</p>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-left" dir="ltr">
                      <span class="text-[11px] text-indigo-300 font-bold block">English Abstract:</span>
                      <p class="text-slate-300 font-sans leading-relaxed">{{ bp.frontMatterAndIntro.abstractEnglish }}</p>
                    </div>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span class="text-[11px] text-emerald-300 font-bold block">دەقی تەواوی پێشەکی / دەروازەی لێکۆڵینەوە (Full Introduction Markdown):</span>
                    <div class="bg-slate-950 p-3 rounded border border-slate-800 max-h-60 overflow-y-auto whitespace-pre-line font-serif text-slate-200 text-xs leading-relaxed">
                      {{ bp.frontMatterAndIntro.fullIntroductionMarkdown }}
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Mode 1: Gemini Structured Outline Generator -->
      @if (activeDesignMode() === 'gemini') {
        <div class="space-y-4">
          <!-- Setup Bar -->
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">ناونیشانی تەواوی تێز (Thesis Title):</label>
                <input
                  type="text"
                  [ngModel]="thesisTitle()"
                  (ngModelChange)="thesisTitle.set($event)"
                  placeholder="بۆ نموونە: ژانری سەفەرنامە لە ئەدەبی هاوچەرخی کوردیدا؛ خوێندنەوەیەکی بونیادگەری"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-serif" />
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">ئاستی ئەکادیمی:</label>
                  <select
                    [ngModel]="selectedProfileLevel()"
                    (ngModelChange)="setAcademicLevel($event)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-serif">
                    <option value="phd">دکتۆرا (٩٠،٠٠٠ وشە)</option>
                    <option value="master">ماستەر (٤٥،٠٠٠ وشە)</option>
                    <option value="bachelor">بەکالۆریۆس (١٢،٠٠٠ وشە)</option>
                    <option value="school">قوتابخانە (٢،٢٠٠ وشە)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">بواری پسپۆڕی:</label>
                  <select
                    [ngModel]="academicDiscipline()"
                    (ngModelChange)="academicDiscipline.set($event)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-serif">
                    <option value="ئەدەب و زمان">ئەدەب و زمان</option>
                    <option value="فەلسەفە و مێژوو">فەلسەفە و مێژوو</option>
                    <option value="زانستە مرۆڤایەتییەکان">زانستە مرۆڤایەتییەکان</option>
                    <option value="میتۆدی ئەزموونی و ئاماری">میتۆدی ئەزموونی و ئاماری</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">تێکڕای وشەکان:</label>
                  <input
                    type="number"
                    [ngModel]="targetWords()"
                    (ngModelChange)="targetWords.set($event)"
                    step="5000"
                    min="10000"
                    max="150000"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500" />
                </div>
              </div>
            </div>

            <!-- Research Questions Section -->
            <div class="pt-2.5 border-t border-slate-800/80 space-y-2">
              <label class="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>پرسیارەکانی توێژینەوە (پێویستە بەش و تەوەرەکان ڕاستەوخۆ وەڵامی بدەنەوە):</span>
                <span class="text-[10px] text-purple-400 font-mono">{{ researchQuestions().length }} پرسیار</span>
              </label>

              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [ngModel]="newQuestionInput()"
                  (ngModelChange)="newQuestionInput.set($event)"
                  (keydown.enter)="addResearchQuestion()"
                  placeholder="پرسیارێکی توێژینەوە بنووسە و Enter لێبدە..."
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-serif" />
                <button
                  type="button"
                  (click)="addResearchQuestion()"
                  class="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm">
                  <mat-icon class="!text-xs">add</mat-icon>
                  <span>زیادکردن</span>
                </button>
              </div>

              @if (researchQuestions().length > 0) {
                <div class="space-y-1 pt-1">
                  @for (q of researchQuestions(); track q; let qIdx = $index) {
                    <div class="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                      <div class="flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center text-[10px] font-bold font-mono">
                          {{ qIdx + 1 }}
                        </span>
                        <span class="text-slate-200 font-serif">{{ q }}</span>
                      </div>
                      <button
                        type="button"
                        (click)="removeResearchQuestion(qIdx)"
                        class="text-rose-400 hover:text-rose-300 transition cursor-pointer p-0.5"
                        title="سڕینەوەی ئەم پرسیارە">
                        <mat-icon class="!text-xs">close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Action Button -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2">
              <span class="text-[11px] text-slate-400">
                پەیکەرەکە لەژێر یاسا زێڕینەکان و Smart Word Allocation (دەروازە ٦٠٠٠، ئەنجام ٣٥٠٠، تیۆری ٢٨٪، پراکتیکی ٣٦٪ + ٣٦٪) دادەڕێژرێت.
              </span>

              <button
                type="button"
                (click)="generateGeminiOutline()"
                [disabled]="structuredOutlineService.isGenerating()"
                class="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50">
                @if (structuredOutlineService.isGenerating()) {
                  <mat-icon class="animate-spin !text-sm">sync</mat-icon>
                  <span>شیکاریی چەمک و داڕشتنی پێڕست بە Gemini...</span>
                } @else {
                  <mat-icon class="!text-sm text-purple-200">auto_awesome</mat-icon>
                  <span>داڕشتنی پەیکەر بە Gemini Structured Output</span>
                }
              </button>
            </div>
          </div>

          <!-- Structured Output Display -->
          @if (structuredOutlineService.lastGeneratedOutline(); as outline) {
            <!-- 1. Scientific Title Deconstruction Card -->
            <div class="bg-slate-950 p-4 rounded-xl border border-purple-900/40 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <span class="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <mat-icon class="!text-sm">psychology</mat-icon>
                  شیتەڵکردنی زانستیی ناونیشان پێش داڕشتن (Title Deconstruction):
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-950 text-purple-200 border border-purple-800">
                  {{ outline.titleDeconstruction.researchNature === 'qualitative_textual' ? 'شیکاریی چۆنایەتی/دەقی' : 'شیکاریی چەندایەتی/ئاماری' }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span class="text-[10px] text-slate-400 block font-bold">بابەتی سەرەکی (Core Subject):</span>
                  <span class="text-slate-100 font-serif">{{ outline.titleDeconstruction.coreSubject }}</span>
                </div>
                <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span class="text-[10px] text-slate-400 block font-bold">ڕەهەندی یەکەم / بەشی ٢:</span>
                  <span class="text-indigo-200 font-serif">{{ outline.titleDeconstruction.dimensionOne }}</span>
                </div>
                <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span class="text-[10px] text-slate-400 block font-bold">ڕەهەندی دووەم / بەشی ٣:</span>
                  <span class="text-violet-200 font-serif">{{ outline.titleDeconstruction.dimensionTwo }}</span>
                </div>
                <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span class="text-[10px] text-slate-400 block font-bold">میتۆد و تیۆری / بەشی ١:</span>
                  <span class="text-emerald-200 font-serif">{{ outline.titleDeconstruction.methodologyAndTheory }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Vertical Alignment Chapters Tree -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <mat-icon class="!text-sm text-indigo-400">format_list_numbered_rtl</mat-icon>
                  پەیکەری ستوونی بەشەکان (Vertical Alignment):
                </h4>
                <span class="text-[11px] text-slate-400">کۆی بەشەکان: {{ outline.chapters.length }} بەش</span>
              </div>

              <div class="space-y-3">
                @for (ch of outline.chapters; track ch.id || $index) {
                  <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-900">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {{ chapterTypeLabel(ch.chapterType) }}
                        </span>
                        <h5 class="text-xs font-bold text-slate-100 font-serif">{{ ch.title }}</h5>
                      </div>
                      <span class="text-[11px] text-slate-400 font-mono">{{ ch.targetWords }} وشە</span>
                    </div>

                    <!-- Sections -->
                    @if (ch.sections && ch.sections.length > 0) {
                      <div class="grid grid-cols-1 gap-2">
                        @for (sec of ch.sections; track sec.title) {
                          <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                            <div class="flex items-center justify-between text-xs">
                              <span class="font-bold text-slate-200 font-serif">{{ sec.title }}</span>
                              <span class="text-[10px] text-slate-500 font-mono">{{ sec.targetWords }} وشە</span>
                            </div>

                            <!-- SubSections -->
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                              @for (sub of sec.subSections; track sub.code) {
                                <div class="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-between text-[11px] gap-1">
                                  <div class="flex items-center gap-1.5">
                                    <span class="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold">
                                      {{ sub.code }}
                                    </span>
                                    <span class="text-slate-300 font-serif leading-tight">{{ sub.title }}</span>
                                  </div>
                                  <div class="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                                    <span>{{ sub.targetWords }} وشە</span>
                                    <span class="text-emerald-400">{{ sub.status }}</span>
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>سەقفی جێگیر بەپێی نەریتی ئەکادیمی (Fixed Cap - ڕێوڕەسمی دەستپێک یان کۆتایی)</span>
                        <span class="text-emerald-400 font-mono font-bold">{{ ch.targetWords }} وشە</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Apply Button for Gemini Outline -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-800">
              <span class="text-xs text-slate-400">
                بە پەسەندکردن، تەواوی بەشەکانی دەستنووس نوێ دەکرێنەوە و بەپێی ئەم پەیکەرە ڕێکدەخرێن.
              </span>

              <button
                type="button"
                (click)="applyGeminiOutline()"
                class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
                <mat-icon class="!text-sm">done_all</mat-icon>
                <span>جێبەجێکردنی ئەم پەیکەرە لە دەستنووسدا</span>
              </button>
            </div>
          }
        </div>
      }

      <!-- Mode 2: Density & Pages Architectural Designer -->
      @if (activeDesignMode() === 'density') {
        <!-- Quick Presets -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button (click)="applyPreset('thesis')"
                  class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
            نامەی ماستەر/دکتۆرا
          </button>
          <button (click)="applyPreset('book')"
                  class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
            کتێبی زانستی B5
          </button>
          <button (click)="applyPreset('monograph')"
                  class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
            مۆنۆگرافی چڕ
          </button>
        </div>

        <!-- Controls Matrix: Pages, Words-per-page, Subsections -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <!-- Target Pages -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>ژمارەی لاپەڕەی کتێب:</span>
              <span class="text-purple-400 font-mono text-sm">{{ targetPages() }} لاپەڕە</span>
            </label>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              [ngModel]="targetPages()"
              (ngModelChange)="targetPages.set($event)"
              class="w-full accent-purple-500 cursor-pointer" />
            <div class="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>١٠ لاپەڕە</span>
              <span>١٥٠ لاپەڕە</span>
              <span>٣٠٠ لاپەڕە</span>
            </div>
          </div>

          <!-- Words Per Page Ratio -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>ڕێژەی وشە لە لاپەڕەیەکدا:</span>
              <span class="text-indigo-400 font-mono text-sm">{{ wordsPerPage() }} وشە</span>
            </label>
            <input
              type="range"
              min="200"
              max="500"
              step="25"
              [ngModel]="wordsPerPage()"
              (ngModelChange)="wordsPerPage.set($event)"
              class="w-full accent-indigo-500 cursor-pointer" />
            <div class="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>٢٠٠ (فراوان)</span>
              <span>٣٥٠ (ستاندارد)</span>
              <span>٥٠٠ (چڕ)</span>
            </div>
          </div>

          <!-- Subsections per Chapter -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>چڕیی ژێر-بەشەکان:</span>
              <span class="text-violet-400 font-mono text-sm">{{ subtopicsPerChapter() }} تەوەر لە فەسلێکدا</span>
            </label>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              [ngModel]="subtopicsPerChapter()"
              (ngModelChange)="subtopicsPerChapter.set($event)"
              class="w-full accent-violet-500 cursor-pointer" />
            <div class="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>٢ (سادە)</span>
              <span>٤ (هاوسەنگ)</span>
              <span>٦ (تەواو چڕ)</span>
            </div>
          </div>
        </div>

        <!-- Real-time Mathematical & Architectural Metrics -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">کۆی وشەی کتێبەکە</span>
            <span class="text-lg font-bold font-mono text-purple-300">{{ totalWordsBudget() }}</span>
            <span class="text-[10px] text-slate-500 block">وشەی خەمڵێنراو</span>
          </div>

          <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">ژمارەی فەسلە سەرەکییەکان</span>
            <span class="text-lg font-bold font-mono text-indigo-300">{{ majorChaptersCount() }}</span>
            <span class="text-[10px] text-slate-500 block">فەسڵی سەرەکی</span>
          </div>

          <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">کۆی تەوەر و ژێر-بەشەکان</span>
            <span class="text-lg font-bold font-mono text-violet-300">{{ totalSubstantiveUnits() }}</span>
            <span class="text-[10px] text-slate-500 block">تەوەری سەربەخۆ</span>
          </div>

          <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 block">قەبارەی هەر تەوەرێک</span>
            <span class="text-lg font-bold font-mono text-emerald-300">{{ wordsPerSubsection() }}</span>
            <span class="text-[10px] text-slate-500 block">وشە لە یەک وەڵامدا</span>
          </div>
        </div>

        <!-- Kurdish Academic Standards Compliance Panel -->
        @if (evaluation(); as eval) {
          <div class="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <mat-icon class="!text-sm !w-4 !h-4 text-purple-400">verified</mat-icon>
                <span class="text-xs font-bold text-slate-200">هەڵسەنگاندن بەپێی ستانداردە ئەکادیمییەکانی کوردیی سۆرانی:</span>
              </div>
              <span [class]="eval.badgeClass" class="text-xs px-2.5 py-0.5 rounded-full font-bold">
                {{ eval.statusLabel }}
              </span>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed font-serif">
              {{ eval.wordDensityLabel }} {{ eval.subsectionsAdvice }}
            </p>

            <!-- Structure Balance Bar -->
            <div class="space-y-1">
              <span class="text-[10px] text-slate-400 block">هاوسەنگیی بەشەکان بەپێی نەریتی ئەکادیمی:</span>
              <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div class="h-full bg-blue-500" style="width: 15%" title="پێشەکی و چوارچێوە: ١٥٪"></div>
                <div class="h-full bg-purple-500" style="width: 25%" title="چەمکسازی و تیۆری: ٢٥٪"></div>
                <div class="h-full bg-indigo-500" style="width: 20%" title="میتۆدۆلۆژیا: ٢٠٪"></div>
                <div class="h-full bg-emerald-500" style="width: 30%" title="شیکاری و دۆزینەوە: ٣٠٪"></div>
                <div class="h-full bg-amber-500" style="width: 10%" title="ئەنجام و ڕاسپاردە: ١٠٪"></div>
              </div>
              <div class="flex justify-between text-[9px] text-slate-500 pt-0.5">
                <span>پێشەکی (١٥٪)</span>
                <span>تیۆری (٢٥٪)</span>
                <span>مێتۆد (٢٠٪)</span>
                <span>شیکاری (٣٠٪)</span>
                <span>ئەنجام (١٠٪)</span>
              </div>
            </div>
          </div>
        }

        <!-- Apply Button -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-800">
          <span class="text-xs text-slate-400">
            بە پەسەندکردن، تەواوی بەشەکان بەپێی ئەم ئەندازەیە بۆ پەنجەرەی دووەم ڕێکدەخرێن.
          </span>

          <button
            type="button"
            (click)="applyDesignedOutline()"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
            <mat-icon class="!text-sm !w-4 !h-4">done_all</mat-icon>
            <span>جێبەجێکردن و ڕێکخستنی پێڕست لە نووسیندا</span>
          </button>
        </div>
      }

      <!-- Mode 3: Multi-Pass Writing Pipeline (4,200 words, numbered footnotes & bibliography) -->
      @if (activeDesignMode() === 'pipeline') {
        <div class="space-y-4">
          <!-- Overview Card -->
          <div class="bg-slate-950 p-4 rounded-xl border border-indigo-900/40 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <mat-icon class="!text-sm">architecture</mat-icon>
                بۆریی نووسینی فرەقۆناغی (Long SubSection Multi-Pass Pipeline)
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-950 text-indigo-200 border border-indigo-800">
                ٤،٢٠٠ وشە / لق بە ٣ قۆناغی ١،٤٠٠ وشەیی
              </span>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed font-serif">
              ئەم بزوێنەرە تایبەتە بە نووسینی قووڵی ئەکادیمی؛ ڕێگری دەکات لە کورتکردنەوەی قەبارەی لقەکان بەوەی هەر لقێکی ٤،٢٠٠ وشەیی
              دەبەستێتەوە بە ٣ قۆناغی چڕی ١،٤٠٠ وشەیی، بە پاراستنی گرێدانی مەعریفی لەگەڵ لقی پێشوو، بەکارهێنانی ڕەنووسی کوردی بۆ پەراوێزەکان،
              سڕینەوەی سەرچاوەی دووبارە بە (سەرچاوەی پێشوو)، و داڕشتنی کۆتایی بیبلۆگرافیا بەپێی چوار زمانی سەرەکی.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span class="text-[10px] text-slate-400 block font-bold">لقی یەکەم (١.١.١):</span>
                <span class="text-slate-200 font-serif font-bold">چەمکی جینۆلۆژیا لای فۆکۆ و ژانرناسی</span>
                <span class="text-[10px] text-indigo-400 block mt-1 font-mono">٤،٢٠٠ وشە (٣ قۆناغ)</span>
              </div>
              <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span class="text-[10px] text-slate-400 block font-bold">گرێدانی زنجیرەیی بە لقی دووەم (١.١.٢):</span>
                <span class="text-slate-200 font-serif font-bold">تیۆریی ژانرە ئەدەبییەکان (باختین، تۆدۆرۆڤ)</span>
                <span class="text-[10px] text-indigo-400 block mt-1 font-mono">بەستنەوە بە دواپەرەگرافی ١.١.١</span>
              </div>
              <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span class="text-[10px] text-slate-400 block font-bold">بەڕێوەبەری سەرچاوەکان:</span>
                <span class="text-slate-200 font-serif font-bold">AcademicCitationManager</span>
                <span class="text-[10px] text-emerald-400 block mt-1">پەراوێزی کوردی + بیبلۆگرافیای فرەزمان</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
              <span class="text-[11px] text-slate-400">
                تێکڕای تێز: پەرەسەندنی مێژوویی و گێڕانەوەیی ژانری سەفەرنامە لە ئەدەبی کوردیدا (خوێندنەوەیەکی جینۆلۆژی)
              </span>

              <button
                type="button"
                (click)="runPipeline()"
                [disabled]="isPipelineRunning()"
                class="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50">
                @if (isPipelineRunning()) {
                  <mat-icon class="animate-spin !text-sm">sync</mat-icon>
                  <span>خەریکی نووسینی فرەقۆناغی لقەکانە...</span>
                } @else {
                  <mat-icon class="!text-sm text-purple-200">play_arrow</mat-icon>
                  <span>جێبەجێکردنی بۆریی نووسین (Run Thesis Writing Pipeline)</span>
                }
              </button>
            </div>
          </div>

          <!-- Pipeline Results Display -->
          @if (pipelineResult(); as res) {
            <div class="space-y-4">
              <!-- SubSection 1.1.1 Card -->
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-800">
                      لقی ١.١.١
                    </span>
                    <h4 class="text-xs font-bold text-white font-serif">چەمکی جینۆلۆژیا لە نێوان ڕەچەڵەکناسیی فۆکۆ و ژانرناسیی ئەدەبیدا</h4>
                  </div>
                  <span class="text-xs font-mono text-emerald-400">{{ res.subSection1.totalWords }} وشە ({{ res.subSection1.passesCount }} قۆناغ)</span>
                </div>
                <div class="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 font-serif leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
                  {{ res.subSection1.fullMarkdown }}
                </div>
                @if (res.subSection1.footnotes.length > 0) {
                  <div class="text-[11px] text-slate-400 pt-1 flex items-center gap-2 flex-wrap">
                    <span class="text-indigo-400 font-bold">پەراوێزەکان:</span>
                    @for (fn of res.subSection1.footnotes; track fn) {
                      <span class="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">{{ fn }}</span>
                    }
                  </div>
                }
              </div>

              <!-- SubSection 1.1.2 Card -->
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-800">
                      لقی ١.١.٢
                    </span>
                    <h4 class="text-xs font-bold text-white font-serif">تیۆریی ژانرە ئەدەبییەکان لای باختین، تۆدۆرۆڤ و شێفەر</h4>
                  </div>
                  <span class="text-xs font-mono text-emerald-400">{{ res.subSection2.totalWords }} وشە ({{ res.subSection2.passesCount }} قۆناغ)</span>
                </div>
                <div class="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 font-serif leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
                  {{ res.subSection2.fullMarkdown }}
                </div>
                @if (res.subSection2.footnotes.length > 0) {
                  <div class="text-[11px] text-slate-400 pt-1 flex items-center gap-2 flex-wrap">
                    <span class="text-indigo-400 font-bold">پەراوێزەکان:</span>
                    @for (fn of res.subSection2.footnotes; track fn) {
                      <span class="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">{{ fn }}</span>
                    }
                  </div>
                }
              </div>

              <!-- Final Multilingual Bibliography Card -->
              <div class="bg-slate-950 p-4 rounded-xl border border-purple-900/40 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 class="text-xs font-bold text-purple-300 font-serif flex items-center gap-1.5">
                    <mat-icon class="!text-sm">menu_book</mat-icon>
                    بیبلۆگرافیای کۆتایی تێزەکە (پۆلێنکراو بەپێی زمان و ئەلفوبێ بەبێ دووبارەبوونەوە)
                  </h4>
                </div>
                <div class="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 font-serif leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
                  {{ res.finalBibliography }}
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Mode 4: Master Orchestrator (Full Academic Pipeline) -->
      @if (activeDesignMode() === 'master') {
        @let profile = currentLevelProfile();
        <div class="space-y-4">
          <!-- Setup Bar -->
          <div class="bg-slate-950 p-4 rounded-xl border border-purple-900/60 shadow-xl space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <mat-icon class="!text-sm text-purple-400">auto_awesome_motion</mat-icon>
                <span>بەڕێوەبەری گشتیی دروستکردنی تەواوی بەرهەمی ئەکادیمی (Master Orchestrator)</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                End-to-End Autonomous Pipeline
              </span>
            </div>

            <!-- 4 Level Quick Selection -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              @for (lvl of academicLevelsList; track lvl) {
                @let p = levelProfiles[lvl];
                <button
                  type="button"
                  (click)="applyCalibrationProfile(lvl)"
                  [class.ring-2]="selectedProfileLevel() === lvl"
                  [class.ring-purple-500]="selectedProfileLevel() === lvl"
                  [class.bg-purple-950]="selectedProfileLevel() === lvl"
                  [class.border-purple-600]="selectedProfileLevel() === lvl"
                  [class.bg-slate-900]="selectedProfileLevel() !== lvl"
                  [class.border-slate-800]="selectedProfileLevel() !== lvl"
                  class="p-2.5 rounded-lg border text-right cursor-pointer transition">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-100">{{ p.kurdishTitle.split('(')[0] }}</span>
                    <span class="text-[10px] font-mono text-purple-300 font-bold">{{ p.structure.totalWords.toLocaleString() }} وشە</span>
                  </div>
                  <span class="text-[10px] text-slate-400 block mt-1">{{ p.structure.coreChaptersCount }} بەش • {{ p.structure.minSources }} سەرچاوە</span>
                </button>
              }
            </div>

            <!-- Title & Master Action Button -->
            <div class="space-y-2 pt-2 border-t border-slate-800/80">
              <label class="block text-xs font-bold text-slate-300">ناونیشانی تەواوی لێکۆڵینەوە یان تێز:</label>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  [ngModel]="thesisTitle()"
                  (ngModelChange)="thesisTitle.set($event)"
                  placeholder="ناونیشانی تێز یان ڕاپۆرت بنووسە..."
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-serif" />
                <button
                  type="button"
                  (click)="runMasterOrchestrator()"
                  [disabled]="isMasterOrchestrating()"
                  class="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50">
                  @if (isMasterOrchestrating()) {
                    <mat-icon class="!text-sm animate-spin">sync</mat-icon>
                    <span>خەریکی جێبەجێکردنی تەواوی پڕۆژەکەیە...</span>
                  } @else {
                    <mat-icon class="!text-sm">play_circle</mat-icon>
                    <span>جێبەجێکردنی تەواوی پڕۆژەکە (Generate Complete Academic Work)</span>
                  }
                </button>
              </div>
            </div>

            <!-- Master Progress Indicator -->
            @if (isMasterOrchestrating() && masterProgress(); as prog) {
              <div class="p-3 bg-slate-900 rounded-lg border border-purple-800/60 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-purple-300 flex items-center gap-1.5">
                    <mat-icon class="!text-xs animate-spin">refresh</mat-icon>
                    {{ prog.message }}
                  </span>
                  <span class="font-mono text-emerald-400">{{ prog.percent }}%</span>
                </div>
                <div class="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 transition-all duration-300" [style.width.%]="prog.percent"></div>
                </div>
                @if (prog.currentSubSection) {
                  <span class="text-[10px] text-slate-400 block font-serif">
                    لق لە نووسیندایە: {{ prog.currentSubSection }}
                  </span>
                }
              </div>
            }
          </div>

          <!-- Master Orchestrator Results Display -->
          @if (masterResult(); as work) {
            <div class="bg-slate-950 p-4 rounded-xl border border-purple-900/60 shadow-xl space-y-4">
              <!-- Header Summary & Quick Actions -->
              <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div>
                  <h4 class="text-sm font-bold text-white font-serif flex items-center gap-2">
                    <span>{{ work.metadata.title }}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
                      {{ work.metadata.level }}
                    </span>
                  </h4>
                  <span class="text-xs text-slate-400 font-mono">
                    کۆی وشەی بەرهەمهاتوو بەپێی کالیبراسیۆنی زانستی: {{ work.metadata.targetWords.toLocaleString() }} وشە
                  </span>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    (click)="applyMasterResultToManuscript()"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow">
                    <mat-icon class="!text-sm">library_add_check</mat-icon>
                    <span>جێبەجێکردن لەناو دەستنووس (Apply to Manuscript)</span>
                  </button>
                  <button
                    type="button"
                    (click)="copyFullWorkMarkdown()"
                    class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700">
                    <mat-icon class="!text-xs">content_copy</mat-icon>
                    <span>کۆپیکردنی دەقی تەواو</span>
                  </button>
                </div>
              </div>

              <!-- Sub-Tabs for Result Inspection -->
              <div class="flex items-center gap-1 border-b border-slate-800/80 pb-2 flex-wrap">
                <button
                  (click)="activeMasterTab.set('chapters')"
                  [class.bg-purple-600]="activeMasterTab() === 'chapters'"
                  [class.text-white]="activeMasterTab() === 'chapters'"
                  [class.text-slate-400]="activeMasterTab() !== 'chapters'"
                  class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <mat-icon class="!text-xs">menu_book</mat-icon>
                  <span>بەشە سەرەکییە نووسراوەکان ({{ work.documentSections.coreChapters.length }} بەش)</span>
                </button>
                <button
                  (click)="activeMasterTab.set('front_matter')"
                  [class.bg-purple-600]="activeMasterTab() === 'front_matter'"
                  [class.text-white]="activeMasterTab() === 'front_matter'"
                  [class.text-slate-400]="activeMasterTab() !== 'front_matter'"
                  class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <mat-icon class="!text-xs">article</mat-icon>
                  <span>ڕێوڕەسم و دەروازە</span>
                </button>
                <button
                  (click)="activeMasterTab.set('conclusion')"
                  [class.bg-purple-600]="activeMasterTab() === 'conclusion'"
                  [class.text-white]="activeMasterTab() === 'conclusion'"
                  [class.text-slate-400]="activeMasterTab() !== 'conclusion'"
                  class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <mat-icon class="!text-xs">check_circle</mat-icon>
                  <span>ئەنجام و ڕاسپاردەکان</span>
                </button>
                <button
                  (click)="activeMasterTab.set('bibliography')"
                  [class.bg-purple-600]="activeMasterTab() === 'bibliography'"
                  [class.text-white]="activeMasterTab() === 'bibliography'"
                  [class.text-slate-400]="activeMasterTab() !== 'bibliography'"
                  class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <mat-icon class="!text-xs">format_quote</mat-icon>
                  <span>بیبلۆگرافیا و ستایلی چاپ</span>
                </button>
              </div>

              <!-- Tab 1: Core Chapters -->
              @if (activeMasterTab() === 'chapters') {
                <div class="space-y-3">
                  @for (chMd of work.documentSections.coreChapters; track chMd; let chIdx = $index) {
                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2">
                      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span class="text-xs font-bold text-purple-300 font-serif flex items-center gap-1.5">
                          <mat-icon class="!text-xs">folder</mat-icon>
                          بەشی {{ chIdx + 1 }}
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">بەشە سەرەکییەکان</span>
                      </div>
                      <div class="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 font-serif leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line">
                        {{ chMd }}
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Tab 2: Front Matter & Intro -->
              @if (activeMasterTab() === 'front_matter') {
                <div class="space-y-3 text-xs">
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span class="text-[11px] text-purple-300 font-bold block">بەخشین و سوپاسنامە:</span>
                    <p class="text-slate-300 font-serif leading-relaxed">{{ work.documentSections.dedicationAndAck }}</p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span class="text-[11px] text-indigo-300 font-bold block">پوختەی کوردی:</span>
                      <p class="text-slate-300 font-serif leading-relaxed">{{ work.documentSections.abstractKurdish }}</p>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-left" dir="ltr">
                      <span class="text-[11px] text-indigo-300 font-bold block">English Abstract:</span>
                      <p class="text-slate-300 font-sans leading-relaxed">{{ work.documentSections.abstractEnglish }}</p>
                    </div>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span class="text-[11px] text-emerald-300 font-bold block">دەقی دەروازەی لێکۆڵینەوە:</span>
                    <div class="bg-slate-950 p-3 rounded border border-slate-800 max-h-60 overflow-y-auto whitespace-pre-line font-serif text-slate-200 leading-relaxed">
                      {{ work.documentSections.introductionOrGateway }}
                    </div>
                  </div>
                </div>
              }

              <!-- Tab 3: Conclusion -->
              @if (activeMasterTab() === 'conclusion') {
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 class="text-xs font-bold text-emerald-300 font-serif flex items-center gap-1.5">
                      <mat-icon class="!text-sm">verified</mat-icon>
                      ئەنجامە زانستییەکان، سەنتێز و ڕاسپاردەکان
                    </h4>
                  </div>
                  <div class="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 font-serif leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line">
                    {{ work.documentSections.conclusion }}
                  </div>
                </div>
              }

              <!-- Tab 4: Bibliography & CSS -->
              @if (activeMasterTab() === 'bibliography') {
                <div class="space-y-3 text-xs">
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span class="text-[11px] text-purple-300 font-bold block">لیستی بیبلۆگرافیای پۆلێنکراو بەپێی زمان و ئەلفوبێ:</span>
                    <div class="bg-slate-950 p-3 rounded border border-slate-800/80 text-xs font-serif text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
                      {{ work.documentSections.bibliography }}
                    </div>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span class="text-[11px] text-emerald-300 font-bold block">ستایلی تایپۆگرافی و چاپی کوردی (CSS Stylesheet):</span>
                    <pre class="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap" dir="ltr">{{ work.cssStylesheet }}</pre>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DynamicBookOutlineDesignerComponent {
  private editorService = inject(EditorService);
  private toastService = inject(AppNotificationsService);
  readonly structuredOutlineService = inject(GeminiStructuredOutlineService);
  readonly subSectionWriterService = inject(SubSectionWriterService);

  readonly levelProfiles = LEVEL_PROFILES;
  readonly academicLevelsList: AcademicLevel[] = ['phd', 'master', 'bachelor', 'school'];
  selectedProfileLevel = signal<AcademicLevel>('phd');
  currentLevelProfile = computed(() => LEVEL_PROFILES[this.selectedProfileLevel()]);

  sampleAdaptiveCitationsResult = computed(() => {
    const lvl = this.selectedProfileLevel();
    const mgr = new AdaptiveCitationManager(lvl);
    const sampleText = `وەک میخائیل باختین ئاماژەی پێدەدات{{CITE:bakhtin}}، ژانری ئەدەبی وەک یادگەی گوتار کار دەکات. میشێل فۆکۆش لە شیکاریی دیسکۆرسدا{{CITE:foucault}} هەمان بۆچوون دەسەلمێنێت. پاشان باختین لە لاپەڕەیەکی تردا{{CITE:bakhtin}} جەخت لە فرەدەنگی دەکاتەوە. لە ئەدەبی کوردیدا مارف خەزنەدار{{CITE:khaznadar}} دەقی سەفەرنامەکان دەپشکنێت، و لە ئینگلیزیشدا تۆدۆرۆڤ{{CITE:todorov}} چەمکەکە شرۆڤە دەکات.`;

    const sampleSources: SourceItem[] = [
      {
        id: 'bakhtin',
        author: 'باختین، میخائیل',
        year: '١٩٨١',
        title: 'خەیاڵدانی دیالۆگی: چوار وتار لەسەر ڕۆمان',
        publisherOrLocation: 'زانکۆی تێکساس',
        language: 'ku',
        pageOrNote: '٧٢'
      },
      {
        id: 'foucault',
        author: 'فۆکۆ، میشێل',
        year: '١٩٧١',
        title: 'نیزامی گوتار',
        publisherOrLocation: 'سلێمانی: دەزگای سەردەم',
        language: 'ku',
        pageOrNote: '٤٥'
      },
      {
        id: 'khaznadar',
        author: 'خەزنەدار، مارف',
        year: '٢٠١٠',
        title: 'مێژووی ئەدەبی کوردی (بەرگی چوارەم)',
        publisherOrLocation: 'هەولێر: دەزگای ئاراس',
        language: 'ku',
        pageOrNote: '١١٢'
      },
      {
        id: 'todorov',
        author: 'Todorov, Tzvetan',
        year: '1978',
        title: 'The Origin of Genres',
        publisherOrLocation: 'Paris: Éditions du Seuil',
        language: 'en',
        pageOrNote: '15'
      }
    ];

    const formatted = mgr.registerAndFormatCitations(sampleText, sampleSources);
    const bibliography = mgr.buildBibliographySection();

    return {
      formattedHtml: formatted.cleanMarkdown,
      footnotesBlock: formatted.footnotesBlock,
      bibliography
    };
  });

  showStylesheet = signal<boolean>(false);
  currentStylesheet = computed(() => generateLevelDesignStylesheet(this.selectedProfileLevel()));

  copyStylesheet(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.currentStylesheet());
      this.toastService.showSuccess('ستایلی CSS کۆپیکرا', 'تایپۆگرافی و ستایلی چاپ بە سەرکەوتوویی کۆپیکرا.');
    }
  }

  activeDesignMode = signal<'gemini' | 'density' | 'pipeline' | 'profiles' | 'blueprint' | 'master'>('profiles');
  isBlueprintGenerating = signal<boolean>(false);
  generatedBlueprint = signal<AcademicBlueprint | null>(null);
  activeBlueprintTab = signal<'chapters' | 'analysis' | 'front_matter'>('chapters');
  isMasterOrchestrating = signal<boolean>(false);
  masterProgress = signal<MasterOrchestrationProgress | null>(null);
  masterResult = signal<CompleteAcademicWorkResult | null>(null);
  activeMasterTab = signal<'chapters' | 'front_matter' | 'conclusion' | 'bibliography'>('chapters');
  isPipelineRunning = signal<boolean>(false);
  pipelineResult = signal<any>(null);

  // Gemini Structured Outline Inputs
  thesisTitle = signal<string>('ژانری سەفەرنامە لە ئەدەبی هاوچەرخی کوردیدا؛ خوێندنەوەیەکی بونیادگەری');
  academicLevel = signal<'قوتابخانە' | 'بەکالۆریۆس' | 'ماستەر' | 'دکتۆرا' | string>('دکتۆرا');
  academicDiscipline = signal<string>('ئەدەب و زمان');
  targetWords = signal<number>(90000);
  researchQuestions = signal<string[]>([
    'چۆن ڕەهەندەکانی ژانری سەفەرنامە لە ئەدەبی هاوچەرخی کوردیدا گەشەیان کردووە؟',
    'میکانیزمە بنیاتگەری و گوتارییەکان لە دەقی نووسەراندا چۆن بەرجەستە دەبن؟'
  ]);
  newQuestionInput = signal<string>('');

  setAcademicLevel(level: any): void {
    const raw = String(level || 'phd').toLowerCase();
    let lvl: AcademicLevel = 'phd';
    if (raw === 'school' || raw.includes('قوتابخانە')) lvl = 'school';
    else if (raw === 'bachelor' || raw.includes('بەکالۆریۆس')) lvl = 'bachelor';
    else if (raw === 'master' || raw.includes('ماستەر')) lvl = 'master';
    else lvl = 'phd';

    this.selectedProfileLevel.set(lvl);
    this.academicLevel.set(lvl === 'phd' ? 'دکتۆرا' : lvl === 'master' ? 'ماستەر' : lvl === 'bachelor' ? 'بەکالۆریۆس' : 'قوتابخانە');
    this.targetWords.set(LEVEL_PROFILES[lvl].structure.totalWords);
  }

  applyCalibrationProfile(level: AcademicLevel): void {
    this.selectedProfileLevel.set(level);
    this.setAcademicLevel(level);
    const prof = LEVEL_PROFILES[level];
    this.toastService.showSuccess(
      'کالیبراسیۆنی ئاست پەسەندکرا',
      `سەرجەم بزوێنەرەکان، قەبارەی وشەکان و یاساکانی شێواز بەپێی «${prof.kurdishTitle}» (${prof.structure.totalWords.toLocaleString()} وشە) ڕێکخران.`
    );
  }

  addResearchQuestion(): void {
    const q = this.newQuestionInput().trim();
    if (!q) return;
    this.researchQuestions.update(list => [...list, q]);
    this.newQuestionInput.set('');
  }

  removeResearchQuestion(index: number): void {
    this.researchQuestions.update(list => list.filter((_, i) => i !== index));
  }

  // Density Mode Inputs
  targetPages = signal<number>(50);
  wordsPerPage = signal<number>(350);
  subtopicsPerChapter = signal<number>(4);

  totalWordsBudget = computed(() => this.targetPages() * this.wordsPerPage());

  totalSubstantiveUnits = computed(() => {
    const pagesPerResponse = 2;
    return Math.max(2, Math.ceil(this.targetPages() / pagesPerResponse));
  });

  majorChaptersCount = computed(() => {
    const units = this.totalSubstantiveUnits();
    const subs = this.subtopicsPerChapter();
    return Math.max(2, Math.min(8, Math.ceil(units / subs)));
  });

  wordsPerSubsection = computed(() => {
    const total = this.totalWordsBudget();
    const units = this.totalSubstantiveUnits();
    return Math.max(350, Math.round((total * 0.70) / units));
  });

  evaluation = computed<KurdishStandardEvaluation>(() => {
    const wPerSub = this.wordsPerSubsection();
    const wpp = this.wordsPerPage();

    let status: 'compliant' | 'warning' | 'needs_adjustment' = 'compliant';
    let statusLabel = 'پەسەندکراوی تەواو بەپێی ستاندارد';
    let badgeClass = 'bg-emerald-950 text-emerald-300 border border-emerald-800';
    let wordDensityLabel = `ڕێژەی ${wpp} وشە لە لاپەڕەیەکدا تەواو هاوتایە لەگەڵ پێوەری چاپ و پێداچوونەوەی ئەکادیمیی زانکۆکانی کوردستان.`;
    let subsectionsAdvice = `قەبارەی هەر تەوەرێک (${wPerSub} وشە) لە سنوری تەواوی توانای نووسینی تێرکەردایە بەبێ کورتکردنەوە.`;

    if (wPerSub < 350) {
      status = 'warning';
      statusLabel = 'تەوەرەکان کورتن';
      badgeClass = 'bg-amber-950 text-amber-300 border border-amber-800';
      subsectionsAdvice = 'قەبارەی وشەی هەر تەوەرێک کەمە، پێشنیار دەکرێت ژمارەی تەوەرەکان کەم بکرێتەوە یان لاپەڕە زیاد بکرێت.';
    } else if (wPerSub > 850) {
      status = 'needs_adjustment';
      statusLabel = 'تەوەرەکان پێویستیان بە وردکردنەوەیە';
      badgeClass = 'bg-rose-950 text-rose-300 border border-rose-800';
      subsectionsAdvice = 'تەوەرەکان قەبارەیان زیاترە لە توانای یەک وەڵامی تێرکەر، تکایە ڕێژەی ژێر-بەشەکان زیاد بکە.';
    }

    return {
      status,
      statusLabel,
      badgeClass,
      wordDensityLabel,
      subsectionsAdvice,
      structureDistribution: [
        { name: 'پێشەکی و چوارچێوە', percentage: 15, words: Math.round(this.totalWordsBudget() * 0.15) },
        { name: 'چوارچێوەی تیۆری', percentage: 25, words: Math.round(this.totalWordsBudget() * 0.25) },
        { name: 'میتۆدۆلۆژیا', percentage: 20, words: Math.round(this.totalWordsBudget() * 0.20) },
        { name: 'شیکاری و داتاکان', percentage: 30, words: Math.round(this.totalWordsBudget() * 0.30) },
        { name: 'دەرئەنجام و ڕاسپاردە', percentage: 10, words: Math.round(this.totalWordsBudget() * 0.10) }
      ]
    };
  });

  async generateGeminiOutline(): Promise<void> {
    await this.structuredOutlineService.generateThesisOutline(
      this.thesisTitle(),
      {
        academicLevel: this.academicLevel(),
        discipline: this.academicDiscipline(),
        targetWords: this.targetWords(),
        researchQuestions: this.researchQuestions()
      }
    );
  }

  applyGeminiOutline(): void {
    const outline = this.structuredOutlineService.lastGeneratedOutline();
    if (!outline) return;
    this.structuredOutlineService.applyOutlineAndSetChapters(outline, this.targetWords());
    this.toastService.showSuccess('پەیکەری تێز جێگیرکرا', 'پەیکەری تێز بە سەرکەوتوویی لەناو دەستنووس و بەشەکاندا جێبەجێکرا.');
  }

  chapterTypeLabel(type: string): string {
    const map: Record<string, string> = {
      front_matter: 'پێشەکی و ڕێوڕەسم',
      intro: 'دەروازەی لێکۆڵینەوە',
      theory: 'چوارچێوەی تیۆری',
      practical_1: 'شیکاریی ڕەهەندی یەکەم',
      practical_2: 'شیکاریی ڕەهەندی دووەم',
      conclusion: 'ئەنجامەکان و ڕاسپاردە',
      back_matter: 'پاشکۆ و سەرچاوەکان'
    };
    return map[type] || 'بەش';
  }

  applyPreset(preset: 'thesis' | 'book' | 'monograph'): void {
    if (preset === 'thesis') {
      this.targetPages.set(80);
      this.wordsPerPage.set(280);
      this.subtopicsPerChapter.set(4);
    } else if (preset === 'book') {
      this.targetPages.set(120);
      this.wordsPerPage.set(350);
      this.subtopicsPerChapter.set(5);
    } else {
      this.targetPages.set(40);
      this.wordsPerPage.set(450);
      this.subtopicsPerChapter.set(3);
    }
  }

  applyDesignedOutline(): void {
    const chapters = buildAcademicThesisOutline({
      title: 'کتێبی زانستی و لێکۆڵینەوەی ئەکادیمی',
      targetPages: this.targetPages(),
      writingType: 'book',
      includeDedication: true,
      includeTOC: true,
      includeIntro: true,
      includeConclusion: true,
      includeRecommendations: true,
      includeReferences: true
    });

    this.editorService.setChapters(chapters);
    if (chapters.length > 0) {
      this.editorService.activeChapterId.set(chapters[0].id);
    }

    this.toastService.showSuccess(
      'پێڕستی داینامیکی جێگیرکرا',
      `پێڕستی کتێبەکە بە سەرکەوتوویی بەپێی ${this.targetPages()} لاپەڕە و ${this.totalWordsBudget()} وشە ڕێکخرا (${chapters.length} بەش).`
    );
  }

  async runPipeline(): Promise<void> {
    this.isPipelineRunning.set(true);
    try {
      const lvl = this.selectedProfileLevel();
      const profile = LEVEL_PROFILES[lvl];
      const res = await this.subSectionWriterService.runThesisWritingPipeline(lvl);
      this.pipelineResult.set(res);
      this.toastService.showSuccess(
        'بۆریی نووسین بە سەرکەوتوویی تەواو بوو',
        `نووسینی لقی ١.١.١ و ١.١.٢ بەپێی کالیبراسیۆنی «${profile.kurdishTitle}» بە سەرکەوتوویی تەواو کرا.`
      );
    } catch (err: any) {
      console.error('Error running thesis writing pipeline:', err);
      this.toastService.showError('هەڵە لە بۆریی نووسین', err?.message || 'شکست لە جێبەجێکردنی پڕۆسەی نووسین');
    } finally {
      this.isPipelineRunning.set(false);
    }
  }

  async generateBlueprint(): Promise<void> {
    this.isBlueprintGenerating.set(true);
    try {
      const level = this.selectedProfileLevel();
      const title = this.thesisTitle();
      const bp = await buildLevelCalibratedBlueprint(title, level);
      this.generatedBlueprint.set(bp);
      const prof = LEVEL_PROFILES[level];
      this.toastService.showSuccess(
        'نەخشەی ئەندازیاری ئامادە کرا',
        `پەیکەری تێز بەپێی کالیبراسیۆنی «${prof.kurdishTitle}» و ${bp.chapters.length} بەش بە سەرکەوتوویی داڕێژرا.`
      );
    } catch (err: any) {
      console.error('Error generating blueprint:', err);
      this.toastService.showError('هەڵە لە دروستکردنی نەخشەی ئەندازیاری', err?.message || 'شکست لە دروستکردنی پەیکەر');
    } finally {
      this.isBlueprintGenerating.set(false);
    }
  }

  applyBlueprintToManuscript(): void {
    const bp = this.generatedBlueprint();
    if (!bp) return;

    const chapters: ChapterItemModel[] = bp.chapters.map((ch, chIdx) => {
      const axes: AxisItem[] = (ch.sections || []).map((sec, secIdx) => {
        const branches: SubBranchItem[] = (sec.subSections || []).map(sub => ({
          id: sub.code,
          code: sub.code,
          title: sub.title,
          targetWords: sub.targetWords,
          wordCount: 0,
          status: 'pending',
          keyConceptsCovered: sub.microTopicsToCover || []
        }));

        return {
          id: `${chIdx + 1}.${secIdx + 1}`,
          code: `تەوەری ${secIdx + 1}`,
          title: sec.title,
          targetWords: sec.targetWords,
          wordCount: 0,
          branches
        };
      });

      let content = `# ${ch.title}\n\n`;
      if (ch.chapterType === 'intro' && bp.frontMatterAndIntro.fullIntroductionMarkdown) {
        content = bp.frontMatterAndIntro.fullIntroductionMarkdown;
      } else {
        content += `ئەم بەشە بە ئامانجی شیکردنەوەی تەوەرەکانی پەیکەری تێز داڕێژراوە بەپێی کالیبراسیۆنی «${LEVEL_PROFILES[bp.level].kurdishTitle}».\n\n`;
        ch.sections.forEach(s => {
          content += `## ${s.title}\n`;
          s.subSections.forEach(sub => {
            content += `### ${sub.code} - ${sub.title} (${sub.targetWords.toLocaleString()} وشە)\n`;
            if (sub.microTopicsToCover?.length) {
              content += `تەوەرە وردەکانی ئەم لقە (Micro-Topics):\n`;
              sub.microTopicsToCover.forEach(t => content += `- ${t}\n`);
            }
            content += `\n`;
          });
        });
      }

      return {
        id: chIdx + 1,
        title: ch.title,
        wordCount: 0,
        customTargetWords: ch.targetWords,
        status: 'pending',
        content,
        axes
      };
    });

    this.editorService.setChapters(chapters);
    if (chapters.length > 0) {
      this.editorService.activeChapterId.set(chapters[0].id);
    }
    this.toastService.showSuccess(
      'نەخشەی ئەندازیاری جێگیرکرا',
      `نەخشەی ئەندازیاریی تێزەکە بە ${chapters.length} بەش و هەموو لق و Micro-Topics لەناو دەستنووسدا جێگیر کرا.`
    );
  }

  async runMasterOrchestrator(): Promise<void> {
    this.isMasterOrchestrating.set(true);
    this.masterProgress.set({
      stage: 'blueprint',
      percent: 5,
      message: 'دەستپێکردنی بزوێنەری بەڕێوەبەری گشتی (Master Orchestrator)...'
    });

    try {
      const level = this.selectedProfileLevel();
      const title = this.thesisTitle();
      const result = await generateCompleteAcademicWork(title, level, (prog) => {
        this.masterProgress.set(prog);
      });
      this.masterResult.set(result);
      const prof = LEVEL_PROFILES[level];
      this.toastService.showSuccess(
        'بەرهەمی ئەکادیمی بە سەرکەوتوویی تەواو بوو',
        `تەواوی کارەکە بەپێی کالیبراسیۆنی «${prof.kurdishTitle}» و ${result.documentSections.coreChapters.length} بەش بە سەرکەوتوویی بەرهەمهێنرا.`
      );
    } catch (err: any) {
      console.error('Master orchestrator error:', err);
      this.toastService.showError('هەڵە لە بەڕێوەبەری گشتی', err?.message || 'شکست لە دروستکردنی تەواوی پڕۆژەکە');
    } finally {
      this.isMasterOrchestrating.set(false);
    }
  }

  applyMasterResultToManuscript(): void {
    const work = this.masterResult();
    if (!work) return;

    const chapters: ChapterItemModel[] = [];

    // بەشی ١: دەروازەی لێکۆڵینەوە
    let introContent = `# دەروازەی لێکۆڵینەوە\n\n`;
    if (work.documentSections.dedicationAndAck) {
      introContent += `## بەخشین و سوپاسنامە\n${work.documentSections.dedicationAndAck}\n\n`;
    }
    if (work.documentSections.abstractKurdish) {
      introContent += `## پوختەی لێکۆڵینەوە\n${work.documentSections.abstractKurdish}\n\n`;
    }
    if (work.documentSections.introductionOrGateway) {
      introContent += `${work.documentSections.introductionOrGateway}\n\n`;
    }

    chapters.push({
      id: 1,
      title: 'دەروازەی لێکۆڵینەوە و چوارچێوەی گشتی',
      wordCount: 0,
      status: 'completed',
      content: introContent
    });

    // بەشە سەرەکییەکان
    work.documentSections.coreChapters.forEach((chMd, idx) => {
      chapters.push({
        id: idx + 2,
        title: `بەشی ${idx + 1}: شیکاریی زانستی و پێکهاتەیی`,
        wordCount: 0,
        status: 'completed',
        content: chMd
      });
    });

    // بەشی ئەنجام و ڕاسپاردەکان
    const conclusionIndex = chapters.length + 1;
    chapters.push({
      id: conclusionIndex,
      title: 'ئەنجامە زانستییەکان، سەنتێز و ڕاسپاردەکان',
      wordCount: 0,
      status: 'completed',
      content: work.documentSections.conclusion
    });

    // بەشی سەرچاوە و بیبلۆگرافیا
    const bibIndex = chapters.length + 1;
    chapters.push({
      id: bibIndex,
      title: 'لیستی سەرچاوە و بیبلۆگرافیا',
      wordCount: 0,
      status: 'completed',
      content: work.documentSections.bibliography
    });

    this.editorService.setChapters(chapters);
    this.editorService.activeChapterId.set(1);
    this.toastService.showSuccess(
      'تەواوی بەرهەمەکە لەناو دەستنووسدا جێگیرکرا',
      `تەواوی پێشەکی، ${work.documentSections.coreChapters.length} بەشی سەرەکی، ئەنجامەکان و بیبلۆگرافیا (${chapters.length} بەش) لە دەستنووسدا دانران.`
    );
  }

  copyFullWorkMarkdown(): void {
    const work = this.masterResult();
    if (!work) return;

    let full = `# ${work.metadata.title}\n\n`;
    full += `> ئاستی ئەکادیمی: ${work.metadata.level} (${work.metadata.targetWords.toLocaleString()} وشە)\n\n`;
    if (work.documentSections.dedicationAndAck) {
      full += `## بەخشین و سوپاسنامە\n${work.documentSections.dedicationAndAck}\n\n`;
    }
    if (work.documentSections.abstractKurdish) {
      full += `## پوختەی کوردی\n${work.documentSections.abstractKurdish}\n\n`;
    }
    if (work.documentSections.abstractEnglish) {
      full += `## Abstract\n${work.documentSections.abstractEnglish}\n\n`;
    }
    if (work.documentSections.introductionOrGateway) {
      full += `${work.documentSections.introductionOrGateway}\n\n`;
    }
    work.documentSections.coreChapters.forEach((ch) => {
      full += `${ch}\n\n`;
    });
    if (work.documentSections.conclusion) {
      full += `${work.documentSections.conclusion}\n\n`;
    }
    if (work.documentSections.bibliography) {
      full += `${work.documentSections.bibliography}\n\n`;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(full);
      this.toastService.showSuccess('دەقی تەواو کۆپیکرا', 'تەواوی دەقی کارە ئەکادیمییەکە لە کلیپبۆرددا تۆمار کرا.');
    }
  }
}
