import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type AcademicDegreeLevel = 'bachelor' | 'master' | 'phd' | 'postdoc';

export interface ToneImprovementSuggestion {
  id: string;
  original: string;
  replacement: string;
  category: 'vocabulary' | 'formality' | 'objectivity' | 'methodology';
  explanation: string;
  degreeApplicability: AcademicDegreeLevel[];
}

export interface AcademicToneAnalysis {
  score: number;
  level: AcademicDegreeLevel;
  levelTitle: string;
  status: 'passed' | 'warning' | 'failed';
  statusText: string;
  avgSentenceLength: number;
  academicLexiconCount: number;
  lexicalDensityPercentage: number;
  suggestions: ToneImprovementSuggestion[];
  levelRigorFeedback: string;
}

@Component({
  selector: 'app-academic-tone-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border p-3.5 space-y-3 font-sans transition-all duration-300 shadow-sm" dir="rtl"
         [ngClass]="{
           'bg-emerald-950/20 border-emerald-500/40 text-emerald-100': analysis().status === 'passed',
           'bg-amber-950/25 border-amber-500/50 text-amber-100': analysis().status === 'warning',
           'bg-rose-950/30 border-rose-600/60 text-rose-100': analysis().status === 'failed'
         }">
      <!-- Top Bar: Title, Academic Level Switcher, and Real-time Score -->
      <div class="flex items-center justify-between flex-wrap gap-2.5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
               [ngClass]="{
                 'bg-emerald-600 text-white shadow-xs': analysis().status === 'passed',
                 'bg-amber-600 text-white shadow-xs': analysis().status === 'warning',
                 'bg-rose-600 text-white animate-pulse shadow-xs': analysis().status === 'failed'
               }">
            <mat-icon class="!text-base">{{ analysis().status === 'passed' ? 'psychology' : 'spellcheck' }}</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold font-serif flex items-center gap-2">
              <span>پێوەری تۆن و زمانی ئەکادیمی (Real-time Academic Tone)</span>
            </h4>
            <p class="text-[10.5px] opacity-80">
              هەڵسەنگاندنی خێرای زمان، زاراوە و گوتاری زانستی بەپێی ئاستی خوێندن
            </p>
          </div>
        </div>

        <!-- Academic Degree Switcher (Bachelor vs Master vs PhD vs PostDoc) -->
        <div class="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-serif">
          @for (lvl of degreeLevels; track lvl.id) {
            <button
              type="button"
              (click)="selectedDegreeLevel.set(lvl.id)"
              [class]="selectedDegreeLevel() === lvl.id
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-lg text-[10.5px] transition-all cursor-pointer">
              {{ lvl.label }}
            </button>
          }
        </div>

        <!-- Real-time Score Badge & Details Toggle -->
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-mono font-extrabold border shadow-xs"
                [ngClass]="{
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40': analysis().status === 'passed',
                  'bg-amber-500/20 text-amber-300 border-amber-500/40': analysis().status === 'warning',
                  'bg-rose-600 text-white border-rose-400': analysis().status === 'failed'
                }">
            {{ analysis().score }}% ({{ analysis().statusText }})
          </span>

          <button
            type="button"
            (click)="isExpanded.set(!isExpanded())"
            class="px-2.5 py-1 bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer">
            <mat-icon class="!text-xs">{{ isExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span>{{ isExpanded() ? 'شاردنەوەی شیکاری' : 'وردەکاریی پێشنیارەکان' }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Feedback Alert Banner -->
      <div class="p-2 rounded-xl text-[11px] leading-relaxed font-serif flex items-start gap-2 bg-black/25 border border-white/5">
        <mat-icon class="!text-sm flex-none mt-0.5"
                  [ngClass]="{
                    'text-emerald-400': analysis().status === 'passed',
                    'text-amber-400': analysis().status === 'warning',
                    'text-rose-400': analysis().status === 'failed'
                  }">info</mat-icon>
        <div>
          <strong class="text-slate-200 font-bold ml-1">پێوەری {{ analysis().levelTitle }}:</strong>
          <span>{{ analysis().levelRigorFeedback }}</span>
        </div>
      </div>

      <!-- Expanded Detailed Suggestions & Stats -->
      @if (isExpanded()) {
        <div class="space-y-3 pt-2 border-t border-white/10">
          <!-- Metrics Bar -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2 bg-black/30 rounded-xl border border-white/5">
              <span class="block text-[10px] text-slate-400">تێکڕای درێژیی ڕستەکان</span>
              <span class="font-mono font-bold text-slate-200">{{ analysis().avgSentenceLength }} وشە</span>
            </div>
            <div class="p-2 bg-black/30 rounded-xl border border-white/5">
              <span class="block text-[10px] text-slate-400">چڕیی زاراوەی زانستی</span>
              <span class="font-mono font-bold text-slate-200">{{ analysis().lexicalDensityPercentage }}%</span>
            </div>
            <div class="p-2 bg-black/30 rounded-xl border border-white/5">
              <span class="block text-[10px] text-slate-400">کۆی وشە ئەکادیمییەکان</span>
              <span class="font-mono font-bold text-slate-200">{{ analysis().academicLexiconCount }}</span>
            </div>
          </div>

          <!-- Suggested Improvements List -->
          <div class="space-y-2">
            <h5 class="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>پێشنیارە چاکسازییەکان بۆ بەرزکردنەوەی تۆنی زانستی:</span>
              <span class="text-[10px] font-mono text-purple-300">
                {{ analysis().suggestions.length }} پێشنیار دۆزرایەوە
              </span>
            </h5>

            @if (analysis().suggestions.length === 0) {
              <div class="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-center text-xs text-emerald-200">
                <mat-icon class="!text-base align-middle ml-1">verified</mat-icon>
                <span>ئافەرم! دەقەکە لەم ئاستەدا هیچ کێشەیەکی تۆنی زمانی تێدا نییە و تەواو ئەکادیمییە.</span>
              </div>
            } @else {
              <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                @for (sug of analysis().suggestions; track sug.id) {
                  <div class="p-2.5 bg-black/40 border border-white/10 hover:border-purple-500/40 rounded-xl flex items-start justify-between gap-3 text-xs">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 flex-wrap font-serif">
                        <span class="line-through text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded font-mono text-[11px]">
                          "{{ sug.original }}"
                        </span>
                        <mat-icon class="!text-xs text-slate-400">arrow_back</mat-icon>
                        <span class="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                          "{{ sug.replacement }}"
                        </span>
                      </div>
                      <p class="text-[10.5px] text-slate-400 font-serif leading-normal">{{ sug.explanation }}</p>
                    </div>

                    <button
                      type="button"
                      (click)="onApplySuggestion(sug)"
                      class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0">
                      <mat-icon class="!text-xs">done_all</mat-icon>
                      <span>جێبەجێکردن</span>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class AcademicToneIndicatorComponent {
  content = input<string>('');
  chapterTitle = input<string>('');
  applyReplacement = output<{ original: string; replacement: string }>();

  readonly selectedDegreeLevel = signal<AcademicDegreeLevel>('phd');
  readonly isExpanded = signal<boolean>(false);

  readonly degreeLevels: { id: AcademicDegreeLevel; label: string }[] = [
    { id: 'bachelor', label: 'بەکالۆریۆس (Bachelor)' },
    { id: 'master', label: 'ماستەر (Master)' },
    { id: 'phd', label: 'دکتۆرا (PhD)' },
    { id: 'postdoc', label: 'پۆست-دکتۆرا (PostDoc)' }
  ];

  readonly analysis = computed<AcademicToneAnalysis>(() => {
    const text = this.content() || '';
    const level = this.selectedDegreeLevel();

    if (!text.trim()) {
      return {
        score: 100,
        level,
        levelTitle: this.getLevelName(level),
        status: 'passed',
        statusText: 'ئامادەی نووسین',
        avgSentenceLength: 0,
        academicLexiconCount: 0,
        lexicalDensityPercentage: 0,
        suggestions: [],
        levelRigorFeedback: 'دەست بکە بە نووسین تاوەکو سیستەم تۆن و پێوەری ئەکادیمی بە شێوەی ڕاستەوخۆ هەڵسەنگێنێت.'
      };
    }

    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.؟!]/).filter(s => s.trim().length > 0);
    const totalWords = words.length;
    const avgLen = sentences.length > 0 ? Math.round((totalWords / sentences.length) * 10) / 10 : 0;

    // Academic Lexicon matching
    const academicTermsRegex = /\b(مێتۆدۆلۆژی|ئیپستیمۆلۆژیا|پارادایم|تیۆریزەکردن|چەمکسازی|هەڵوەشاندنەوە|شیکاری|پێوەر|گریمانە|دەرەنجام|بەڵگە|سەرچاوە|دیکۆمێنت|زانستی|کەمی|چۆنایەتی|بونیادگەری|فینۆمینۆلۆژی|ڕەخنەگری|بەراوردکاری|پەیوەندیداری|ئاماری|ڕاپرسی|نموونەگیری)\b/g;
    const academicMatches = text.match(academicTermsRegex) || [];
    const academicLexiconCount = academicMatches.length;
    const lexicalDensity = totalWords > 0 ? Math.round((academicLexiconCount / totalWords) * 1000) / 10 : 0;

    // Weak / informal phrases and their academic replacements
    const weakPhrasesList: {
      pattern: RegExp;
      original: string;
      replacement: string;
      category: ToneImprovementSuggestion['category'];
      explanation: string;
      minDegree: AcademicDegreeLevel;
    }[] = [
      {
        pattern: /زۆر زۆر/g,
        original: 'زۆر زۆر',
        replacement: 'بە شێوەیەکی بەرچاو و باڵا',
        category: 'vocabulary',
        explanation: 'دووبارەکردنەوەی پاشگرەکانی وەسف نائەکادیمییە، پێویستە دەستەواژەی چڕی زانستی بەکاربهێنرێت.',
        minDegree: 'bachelor'
      },
      {
        pattern: /وەکو وتمان|وەک گوتمان/g,
        original: 'وەکو وتمان',
        replacement: 'وەک لە بەشەکانی پێشوودا ڕوونکرایەوە',
        category: 'formality',
        explanation: 'کەڵکوەرگرتن لە زمانی قسەکردنی ڕۆژانە گونجاو نییە لەگەڵ پێوەری ئەکادیمی.',
        minDegree: 'bachelor'
      },
      {
        pattern: /من وا دەبینم|من پێم وایە/g,
        original: 'من وا دەبینم',
        replacement: 'لە ڕوانگەی داتاکانی ئەم توێژینەوەیەوە دەردەکەوێت',
        category: 'objectivity',
        explanation: 'لە تێزی ماستەر و دکتۆرادا نابێت بۆچوونی تاکەکەسی بەبێ بەڵگەی سەلمێنراو یان بە گوتاری سەبژێکتیڤ دەرببڕدرێت.',
        minDegree: 'master'
      },
      {
        pattern: /شتی باش|شتێکی باش/g,
        original: 'شتی باش',
        replacement: 'دەرەنجامی ئەرێنی و پێشکەوتوو',
        category: 'vocabulary',
        explanation: 'وشەی "شت" ناڕوونە و قورسایی ئەکادیمی دەقەکە کەمدەکاتەوە.',
        minDegree: 'bachelor'
      },
      {
        pattern: /هیچ نییە|هیچ نەبوو/g,
        original: 'هیچ نەبوو',
        replacement: 'هیچ بەڵگەیەکی سەلمێنراو پشتڕاست نەکراوەتەوە',
        category: 'formality',
        explanation: 'دەربڕینی زانستی پێویستی بە دڵنیایی و زمانی حوکمی میتۆدی هەیە.',
        minDegree: 'bachelor'
      },
      {
        pattern: /هەمووان دەزانن|خەڵک هەموو دەزانن/g,
        original: 'هەمووان دەزانن',
        replacement: 'بەپێی کۆدەنگی سەرچاوە زانستییەکان',
        category: 'objectivity',
        explanation: 'ئیدعای گشتگیر بەبێ ناوهێنانی کۆمەڵگەی ئەکادیمی لە تێزی باڵادا ڕەتکراوەیە.',
        minDegree: 'master'
      },
      {
        pattern: /دیارە کە|ئاشکرایە کە/g,
        original: 'دیارە کە',
        replacement: 'شیکارییە مێتۆدییەکان ئاماژە بەوە دەکەن کە',
        category: 'methodology',
        explanation: 'لە ئاستی دکتۆرادا هیچ گریمانەیەک پێشوەختە بە "ئاشکرا" دانانرێت بێ سەلماندن.',
        minDegree: 'phd'
      },
      {
        pattern: /بێگومان/g,
        original: 'بێگومان',
        replacement: 'بە پشتبەستن بە سەلمێنەری دۆزراوەکان',
        category: 'objectivity',
        explanation: 'گومانی زانستی بنەمای سەرەکی فەلسەفەی لێکۆڵینەوەیە؛ لە دکتۆرادا حوکمی ڕەهای بێ بەڵگە کێشەدارە.',
        minDegree: 'phd'
      }
    ];

    const detectedSuggestions: ToneImprovementSuggestion[] = [];
    weakPhrasesList.forEach((item, idx) => {
      if (item.pattern.test(text)) {
        detectedSuggestions.push({
          id: `sug_${idx}_${Date.now()}`,
          original: item.original,
          replacement: item.replacement,
          category: item.category,
          explanation: item.explanation,
          degreeApplicability: ['bachelor', 'master', 'phd', 'postdoc']
        });
      }
    });

    // Score computation based on level
    let baseScore = 100;

    // 1. Sentence length evaluation
    if (level === 'bachelor') {
      if (avgLen < 10) baseScore -= 10;
      else if (avgLen > 30) baseScore -= 15;
    } else if (level === 'master') {
      if (avgLen < 15) baseScore -= 15;
      else if (avgLen > 35) baseScore -= 15;
      if (academicLexiconCount < 3) baseScore -= 15;
    } else if (level === 'phd' || level === 'postdoc') {
      if (avgLen < 18) baseScore -= 20;
      if (academicLexiconCount < 5) baseScore -= 25;
      if (lexicalDensity < 3) baseScore -= 15;
    }

    // 2. Penalty for detected weak phrases
    const penaltyPerPhrase = level === 'phd' ? 12 : (level === 'master' ? 8 : 5);
    baseScore -= detectedSuggestions.length * penaltyPerPhrase;

    const finalScore = Math.max(25, Math.min(100, Math.round(baseScore)));

    // Status evaluation
    const passThreshold = level === 'phd' ? 85 : (level === 'master' ? 78 : 68);
    const warnThreshold = passThreshold - 15;

    let status: 'passed' | 'warning' | 'failed' = 'passed';
    let statusText = 'گونجاو لەگەڵ ئاستی زانستی';

    if (finalScore < warnThreshold) {
      status = 'failed';
      statusText = 'لەخوار ئاستی پێویست';
    } else if (finalScore < passThreshold) {
      status = 'warning';
      statusText = 'پێویستی بە چاکسازییە';
    }

    // Level-specific guidance
    let levelRigorFeedback = '';
    if (level === 'bachelor') {
      levelRigorFeedback = finalScore >= passThreshold
        ? 'تۆن و داڕشتنی دەقەکە لە ئاستی ستانداردی بەکالۆریۆس دایە؛ ڕوون، ڕەوان و بێ کەم و کوڕی دیار.'
        : 'پێویستە ڕستەکان تۆکمەتر بکرێن و لە بەکارهێنانی دەستەواژەی ڕۆژانە دووربکەویتەوە.';
    } else if (level === 'master') {
      levelRigorFeedback = finalScore >= passThreshold
        ? 'دەقەکە خاوەنی تۆنێکی ئەکادیمیی شایستەیە بە ماستەر؛ تێبینی بەراوردکاری و زاراوەی زانستی دەکرێت.'
        : 'بۆ ئاستی ماستەر، پێویستە زاراوەی میتۆدی زیاتر بخرێتە ڕوو و بۆچوونی خودی بە دەستەواژەی بابەتی بگۆڕدرێت.';
    } else if (level === 'phd') {
      levelRigorFeedback = finalScore >= passThreshold
        ? 'ئاستی فەلسەفی، ئیپستیمۆلۆژی و تۆنی داڕشتن بە تەواوی هاوتای تێزی باڵای دکتۆرایە.'
        : 'تێزی دکتۆرا پێویستی بە زمانی چڕی زانستی، چەمکسازیی قووڵ و دوورکەوتنەوە لە هەر جۆرە حوکمێکی بێ بەڵگەیە.';
    } else {
      levelRigorFeedback = finalScore >= passThreshold
        ? 'گوتاری دەقەکە هاوتای توێژینەوەی بڵاوکراوەی گۆڤارە نێودەوڵەتییە یەکەمینەکانە (Q1 Journals).'
        : 'پێویستە زمانی ڕەخنەیی و هاوسەنگی پارادایمەکان لە ئاستی توێژەری باڵادا پتەوتر بکرێت.';
    }

    return {
      score: finalScore,
      level,
      levelTitle: this.getLevelName(level),
      status,
      statusText,
      avgSentenceLength: avgLen,
      academicLexiconCount,
      lexicalDensityPercentage: lexicalDensity,
      suggestions: detectedSuggestions,
      levelRigorFeedback
    };
  });

  private getLevelName(lvl: AcademicDegreeLevel): string {
    switch (lvl) {
      case 'bachelor': return 'بەکالۆریۆس';
      case 'master': return 'ماستەر';
      case 'phd': return 'دکتۆرا';
      case 'postdoc': return 'پۆست-دکتۆرا';
    }
  }

  onApplySuggestion(sug: ToneImprovementSuggestion): void {
    this.applyReplacement.emit({
      original: sug.original,
      replacement: sug.replacement
    });
  }
}
