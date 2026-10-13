import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../core/app.notifications';
import { EditorService } from '../editor/services/editor';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface SubjectivePhrasePattern {
  id: string;
  phrase: string;
  category: 'personal_bias' | 'absolute_claim' | 'emotional_fluff';
  categoryLabelKurdish: string;
  scholarlyAlternativeKurdish: string;
  reasonKurdish: string;
}

const TONE_RULES: SubjectivePhrasePattern[] = [
  {
    id: 't-1',
    phrase: 'من پێم وایە',
    category: 'personal_bias',
    categoryLabelKurdish: 'دەربڕینی تاکەکەسی (Personal Bias)',
    scholarlyAlternativeKurdish: 'داتاکان ئاماژە بەوە دەکەن کە / لە ڕوانگەی لێکۆڵینەوەکەوە دەردەکەوێت کە',
    reasonKurdish: 'لە تێزی ئەکادیمیدا پێویستە دەنگی نادیار یان دەربڕینی بێلایەن بەکاربێت نەک ڕای کەسی.'
  },
  {
    id: 't-2',
    phrase: 'بێگومان',
    category: 'absolute_claim',
    categoryLabelKurdish: 'بانگەشەی ڕەها (Absolute Claim)',
    scholarlyAlternativeKurdish: 'بەڵگەکان بەهێزن لەسەر ئەوەی کە / ئەگەری زۆر هەیە کە',
    reasonKurdish: 'زانست هەمیشە ئەگەری گۆڕانکاری لەخۆدەگرێت، بەکارهێنانی دەستەواژەی تەواو ڕەها نائەکادیمییە.'
  },
  {
    id: 't-3',
    phrase: 'بەدڵنیاییەوە',
    category: 'absolute_claim',
    categoryLabelKurdish: 'بانگەشەی ڕەها (Absolute Claim)',
    scholarlyAlternativeKurdish: 'بەپێی ئەنجامەکانی شیکار / شیکارییە ئامارییەکان پشتڕاستی دەکەنەوە کە',
    reasonKurdish: 'پێویستە دڵنیایی لەسەر بنەمای ژمارە و داتای پشتڕاستکراو بێت نەک جەختکردنەوەی زمانی.'
  },
  {
    id: 't-4',
    phrase: 'زۆر ڕوونە',
    category: 'emotional_fluff',
    categoryLabelKurdish: 'پڕکردنەوەی هەستەکی (Emotional Fluff)',
    scholarlyAlternativeKurdish: 'دەرئەنجامەکان ڕوونی دەکەنەوە کە',
    reasonKurdish: 'ئەوەی بۆ توێژەر ڕوونە، بۆ خوێنەر پێویستی بە بەڵگەیە؛ لەبەر ئەوە دەبێت پێچەوانەکەی بسەلمێنرێت.'
  },
  {
    id: 't-5',
    phrase: 'سەرسوڕهێنەرە',
    category: 'emotional_fluff',
    categoryLabelKurdish: 'هەڵوێستی سۆزداری (Emotional Fluff)',
    scholarlyAlternativeKurdish: 'جێگەی سەرنجی زانستییە کە / بە شێوەیەکی چاوەڕواننەکراو دەرکەوتووە کە',
    reasonKurdish: 'دەربڕینی سەرسوڕمان شیاوی ڕۆژنامەوانییە نەک توێژینەوەی ئەکادیمی.'
  }
];

export interface DetectedIssue {
  rule: SubjectivePhrasePattern;
  occurrences: number;
}

@Component({
  selector: 'app-academic-tone-analyzer',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <mat-icon>psychology_alt</mat-icon>
            </span>
            <h3 class="text-xl font-bold text-stone-900">پشکنەری بێلایەنی و سەنگینیی زمانی ئەکادیمی (Tone & Objectivity)</h3>
          </div>
          <p class="text-xs md:text-sm text-stone-600 mt-1">
            دۆزینەوەی دەستەواژە هەستەکی، ڕۆژنامەوانی و ڕەهاکان لە دەقدا و پێشنیارکردنی هاوتای زانستی و بێلایەن.
          </p>
        </div>

        <button
          type="button"
          (click)="scanText()"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs">
          <mat-icon class="text-sm">travel_explore</mat-icon>
          <span>پشکنینی بەشی چالاک</span>
        </button>
      </div>

      <!-- Tone Rigor Score Banner -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">پێوەری بێلایەنی (Objectivity Index)</span>
          <p class="text-lg font-bold text-stone-900 mt-0.5">{{ objectivityScore() }}٪</p>
        </div>
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">کۆی حاڵەتە دۆزراوەکان</span>
          <p class="text-lg font-bold text-rose-700 mt-0.5">{{ totalDetectedIssues() }} حاڵەت</p>
        </div>
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">دۆخی زمانەوانی</span>
          <p class="text-xs font-bold text-emerald-800 mt-1">
            {{ totalDetectedIssues() === 0 ? 'تەواو ئەکادیمی و سەنگین' : 'پێویستی بە بژارکردنە' }}
          </p>
        </div>
      </div>

      <!-- Detected Issues List -->
      <div class="space-y-3">
        @if (detectedIssues().length === 0) {
          <div class="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 text-xs">
            <mat-icon class="text-2xl text-emerald-600 mb-1">verified</mat-icon>
            <p class="font-bold text-stone-800">دەقەکە لە دەستەواژەی هەستەکی و نائەکادیمی خاوێنە!</p>
            <p class="text-stone-500 mt-0.5">هیچ دەربڕینێکی ڕۆژنامەوانی یان تاکەکەسی نەدۆزرایەوە.</p>
          </div>
        } @else {
          @for (issue of detectedIssues(); track issue.rule.id) {
            <div class="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2.5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-rose-950">«{{ issue.rule.phrase }}»</span>
                  <span class="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                    {{ issue.occurrences }} جار دووبارە بووەتەوە
                  </span>
                  <span class="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                    {{ issue.rule.categoryLabelKurdish }}
                  </span>
                </div>

                <button
                  type="button"
                  (click)="replaceInDocument(issue)"
                  class="self-end sm:self-auto px-2.5 py-1 bg-white hover:bg-stone-50 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold transition cursor-pointer">
                  جێگرتنەوە بە هاوتای زانستی
                </button>
              </div>

              <div class="text-xs text-stone-700 bg-white p-2.5 rounded-lg border border-rose-100 space-y-1">
                <div class="flex items-start gap-1.5">
                  <strong class="text-emerald-800 shrink-0">هاوتای ئەکادیمیی پێشنیارکراو:</strong>
                  <span class="text-emerald-950 font-medium font-serif">«{{ issue.rule.scholarlyAlternativeKurdish }}»</span>
                </div>
                <div class="flex items-start gap-1.5 text-stone-500 text-[11px]">
                  <strong class="text-stone-700 shrink-0">هۆکار:</strong>
                  <span>{{ issue.rule.reasonKurdish }}</span>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AcademicToneAnalyzerComponent {
  chapters = input<ChapterItem[]>([]);
  private notifications = inject(AppNotificationsService);
  private editor = inject(EditorService);

  detectedIssues = signal<DetectedIssue[]>([]);

  totalDetectedIssues = computed(() => {
    return this.detectedIssues().reduce((acc, curr) => acc + curr.occurrences, 0);
  });

  objectivityScore = computed(() => {
    const total = this.totalDetectedIssues();
    if (total === 0) return 100;
    const score = Math.max(50, 100 - total * 7);
    return score;
  });

  scanText() {
    const ch = this.chapters().find(c => c.id === this.editor.activeChapterId()) || this.chapters()[0];
    if (!ch || !ch.content) {
      this.notifications.showWarning('ئاگاداری', 'دەستنووس یان بەشێک لە سەرنووسەر هەڵبژێرە.');
      return;
    }

    const content = ch.content;
    const found: DetectedIssue[] = [];

    for (const rule of TONE_RULES) {
      const regex = new RegExp(rule.phrase, 'g');
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        found.push({
          rule,
          occurrences: matches.length
        });
      }
    }

    this.detectedIssues.set(found);
    if (found.length > 0) {
      this.notifications.showInfo('پشکنین تەواو بوو', `${found.length} دەستەواژەی پێویست بە چاکسازی دۆزرانەوە.`);
    } else {
      this.notifications.showSuccess('پشکنین تەواو بوو', 'دەقەکەت لە دەستەواژەی نائەکادیمی خاوێنە.');
    }
  }

  replaceInDocument(issue: DetectedIssue) {
    const ch = this.chapters().find(c => c.id === this.editor.activeChapterId()) || this.chapters()[0];
    if (!ch || !ch.content) return;

    const regex = new RegExp(issue.rule.phrase, 'g');
    const updated = ch.content.replace(regex, issue.rule.scholarlyAlternativeKurdish.split(' / ')[0]);
    this.editor.updateChapterContent(ch.id, updated, 'چاکسازیی دەربڕینی ئەکادیمی');

    this.detectedIssues.update(list => list.filter(item => item.rule.id !== issue.rule.id));
    this.notifications.showSuccess('جێگرتەوە', `دەستەواژەی «${issue.rule.phrase}» گۆڕدرا بۆ هاوتای زانستی.`);
  }
}
