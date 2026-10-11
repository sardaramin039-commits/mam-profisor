import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface CitationStandardRule {
  id: string;
  category: string;
  title: string;
  standardRule: string;
  badPractice: string;
  goodPractice: string;
  kurdishExample: string;
}

const CITATION_RULES: CitationStandardRule[] = [
  {
    id: 'r-1',
    category: 'وەرگێڕان و دەقاوودەق',
    title: 'دەقی ڕاستەوخۆ بەرامبەر پارافڕەیز (Direct Quote vs. Paraphrase)',
    standardRule: 'ئەگەر دەقەکە لە ٤٠ وشە کەمتر بوو دەخرێتە نێوان دووانەکەوانەی بچووک «...». ئەگەر لە ٤٠ وشە زیاتر بوو دەبێت ببێتە پاراگرافی سەربەخۆ (Block Quote) بە بۆشایی ٠.٥ ئینج لە لای ڕاستەوە.',
    badPractice: 'کۆپیکردنی دەقی توێژەر بەبێ کەوانە و بەبێ دیاریکردنی ژمارەی لاپەڕە.',
    goodPractice: 'داڕشتنەوە بە وشەی خۆت (Paraphrasing) لەگەڵ ئاماژەدان بە ساڵ، یاخود کەوانە لەگەڵ ژمارەی لاپەڕە (ل. ٤٥).',
    kurdishExample: 'وەک ئەحمەد (٢٠٢٢، ل. ١٤) ئاماژەی پێکردووە: «پەروەردەی هاوچەرخ پێویستی بە داهێنانە».'
  },
  {
    id: 'r-2',
    category: 'پلەی سەرچاوەکان',
    title: 'سەرچاوەی سەرەکی بەرامبەر سەرچاوەی لاوەکی (Primary vs. Secondary)',
    standardRule: 'هەمیشە دەبێت بگەڕێیتەوە سەر کتێب یان توێژینەوە سەرەکییەکە نەک لە ڕێگەی کەسێکی ترەوە ئاماژەی پێ بدەیت (Secondary Citation) مەگەر دەستنەکەوێت.',
    badPractice: 'نووسینی (پیاژێ، ١٩٥٢، وەک لە کەریم، ٢٠١٩ هاتووە) بۆ بیردۆزە گشتییەکان.',
    goodPractice: 'دۆزینەوەی سەرچاوە ڕەسەنەکەی پیاژێ و ئاماژەدان بەو کتێبە ڕاستەوخۆ.',
    kurdishExample: 'بۆ بەکارهێنانی تیۆرییەکان، پەنا بۆ چاپی ڕەسەنی بەرهەمەکە بەرە.'
  },
  {
    id: 'r-3',
    category: 'هاوسەنگی مێژوویی',
    title: 'یاسای ٥ ساڵی ڕابردوو بۆ ئەدەبیاتی زانستی (Recency of Literature)',
    standardRule: 'لانیکەم ٦٠٪ بۆ ٧٠٪ی سەرچاوەکانی پێداچوونەوەی ئەدەبیات دەبێت لە ٥ ساڵی ڕابردوودا بڵاوکرابنەوە بۆ سەلماندنی نوێبوونی کێشەی توێژینەوەکەت.',
    badPractice: 'پشت بەستن تەنها بە سەرچاوە کۆنەکانی ساڵانی هەشتا و نەوەدەکان.',
    goodPractice: 'تێکەڵکردنی سەرچاوەی دامەزرێنەر (Foundational) لەگەڵ تازەترین وتارەکانی ٢٠٢٠-٢٠٢٦.',
    kurdishExample: 'سەرچاوەی نوێ باوەڕپێکراوی و قورسایی ئەکادیمیی توێژینەوەکەت مسۆگەر دەکات.'
  },
  {
    id: 'r-4',
    category: 'پوختەی کوردی',
    title: 'شێوازی ئاماژەدان بە دەستنووس و چاوپێکەوتن لە هەرێمی کوردستان',
    standardRule: 'بۆ چاوپێکەوتنە کەسییەکان: ناوی تەواو، پلەی زانستی یان وەزیفی، کات و شوێنی چاوپێکەوتن لە پەراوێزدا بنووسرێت.',
    badPractice: 'نووسینی: "لە یەکێک لە مامۆستایانم بیست" بەبێ بەڵگەنامەی ڕەزامەندی.',
    goodPractice: 'چاوپێکەوتنی کەسی لەگەڵ [ناو]، بەرواری [ڕۆژ/مانگ/ساڵ]، هەولێر/سلێمانی، کۆدی تۆمار: IV-01.',
    kurdishExample: 'چاوپێکەوتن لەگەڵ د. کامەران ئەحمەد، ڕێکەوتی ١٥/٠٣/٢٠٢٤، زانکۆی سەلاحەدین.'
  }
];

@Component({
  selector: 'app-citation-standards-guide',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md">
            <mat-icon class="!text-xl !w-5 !h-5">verified</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>ڕێنوێنی و بنەماکانی ئاماژەدان بە سەرچاوە و ژێدەرەکان (Citation Standards Guide)</span>
              <span class="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                ستانداردی نێودەوڵەتی
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              ڕێساکانی بەهێزکردنی باوەڕپێکراوی، خۆپاراستن لە دزینی ئەدەبی و داڕشتنی ڕاستی ژێدەرەکان
            </p>
          </div>
        </div>

        <span class="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
          ڕێسای ٤ خاڵی مسۆگەرکردنی کوالیتی
        </span>
      </div>

      <!-- Interactive Rules Accordion Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (rule of rules(); track rule.id) {
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 hover:border-emerald-800/60 transition">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <span class="text-xs font-bold text-emerald-300">{{ rule.title }}</span>
              <span class="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                {{ rule.category }}
              </span>
            </div>

            <!-- Standard Instruction -->
            <p class="text-xs text-slate-300 leading-relaxed font-serif">
              {{ rule.standardRule }}
            </p>

            <!-- Good vs Bad Comparison Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div class="p-2 bg-rose-950/20 border border-rose-900/40 rounded-lg space-y-1">
                <span class="text-rose-400 font-bold flex items-center gap-1">
                  <mat-icon class="!text-xs !w-3 !h-3">cancel</mat-icon> هەڵەی باو:
                </span>
                <span class="text-slate-300 block font-serif">{{ rule.badPractice }}</span>
              </div>

              <div class="p-2 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1">
                <span class="text-emerald-400 font-bold flex items-center gap-1">
                  <mat-icon class="!text-xs !w-3 !h-3">check_circle</mat-icon> شێوازی دروست:
                </span>
                <span class="text-slate-300 block font-serif">{{ rule.goodPractice }}</span>
              </div>
            </div>

            <!-- Example Box -->
            <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-200">
              <span class="text-slate-400 font-sans">نموونەی جێبەجێکراو: </span>
              {{ rule.kurdishExample }}
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CitationStandardsGuideComponent {
  rules = signal<CitationStandardRule[]>(CITATION_RULES);
}
