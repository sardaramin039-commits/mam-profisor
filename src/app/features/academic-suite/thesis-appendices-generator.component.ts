import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../core/app.notifications';
import { EditorService } from '../editor/services/editor';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface AppendixTemplate {
  id: string;
  titleKurdish: string;
  category: 'consent' | 'ethics' | 'tables_figures' | 'questionnaire';
  description: string;
  contentTemplate: string;
}

export const TEMPLATES: AppendixTemplate[] = [
  {
    id: 'app-consent',
    titleKurdish: 'فۆرمی ڕەزامەندیی زانیاریدەران (Informed Consent Form)',
    category: 'consent',
    description: 'بەڵگەنامەی فەرمی بۆ واژووی بەشداربووان و زامنکردنی بەشداریی ئارەزوومەندانە بەپێی ستانداردی ئەخلاقیی ئەکادیمی.',
    contentTemplate: `## پاشکۆی (١): فۆرمی ڕەزامەندیی ئاگادارانەی بەشداربووان (Informed Consent Form)

بەڕێز بەشداربووی هێژا،
ئەم توێژینەوەیە لەژێر ناونیشانی «[ناونیشانی تێزەکەت لێرە بنووسە]» وەک بەشێک لە پێداویستییەکانی بەدەستهێنانی بڕوانامەی [ماستەر / دکتۆرا] لە بەشی [ناوی بەش]، کۆلێژی [ناوی کۆلێژ]، زانکۆی [ناوی زانکۆ] ئەنجام دەدرێت.

**مەرج و بنەما ئەخلاقییەکان:**
١. بەشداریکردنی بەڕێزتان بە تەواوی ئارەزوومەندانەیە و مافی کشانەوەت هەیە لە هەر قۆناغێکدا.
٢. سەرجەم زانیاری و داتاکان بە تەواوی بە نهێنی و بێ ناوهێنان (Anonymous) دەپارێزرێن و تەنها بۆ مەبەستی توێژینەوەی زانستی بەکاردەهێنرێن.
٣. بەشداریکردنت لەم لێکۆڵینەوەیەدا هیچ مەترسییەکی جەستەیی، دەروونی یان یاسایی بەدوادا نایەت.

**ڕاگەیاندنی بەشداربوو:**
ئەم فۆرمەم خوێندەوە و لە تەواوی ئامانجەکانی توێژینەوەکە تێگەیشتم، بە ئارەزووی خۆم ڕەزامەندی دەردەبڕم بۆ بەشداریکردن.
واژووی بەشداربوو: ............................  بەروار: ......./......./٢٠٢...`
  },
  {
    id: 'app-irb',
    titleKurdish: 'بەڵگەنامەی پەسەندکردنی لێژنەی ئەخلاقی (IRB Clearance Certificate)',
    category: 'ethics',
    description: 'نوسراوی فەرمیی پەسەندکردنی لێژنەی ئەخلاقی زانستی بۆ تێپەڕاندنی مەرجەکانی بێزیانی و پاراستنی مافی مرۆڤ.',
    contentTemplate: `## پاشکۆی (٢): پەسەندنامەی لێژنەی ئەخلاقی توێژینەوە (IRB Ethical Approval)

**زانکۆی [ناوی زانکۆ] / کۆلێژی [ناوی کۆلێژ]**
**لێژنەی ئەخلاقیاتی توێژینەوەی زانستی (Institutional Review Board - IRB)**

ژمارە: .....................
بەروار: ......./......./٢٠٢...

بۆ/ سەرپەرشتیاری بەڕێز و توێژەر
بابەت/ پەسەندکردنی ئەخلاقیاتی توێژینەوە

دوای کۆبوونەوەی لێژنەی ئەخلاقیاتی توێژینەوەی زانستی و پێداچوونەوە بە پڕۆپۆزەڵ و میتۆدۆلۆژیای توێژینەوەی بەڕێز: [ناوی توێژەر] لەژێر ناونیشانی «[ناونیشانی تێز]»، لێژنەکە بە کۆی دەنگ بڕیاری دا بە:
**پەسەندکردنی ئەخلاقیاتی توێژینەوەکە (Full Ethical Clearance)** بەو پێیەی سەرجەم پێوەرە نێودەوڵەتییەکانی پاراستنی مرۆڤ و نهێنیی بەشداربووان لە پرۆسەی کۆکردنەوەی داتادا ڕەچاو کراون.

سەرۆکی لێژنەی ئەخلاقیات: ............................ واژوو: ............................`
  },
  {
    id: 'app-tables',
    titleKurdish: 'پێڕستی فەرمیی خشتە و وێنەکان (List of Tables & Figures)',
    category: 'tables_figures',
    description: 'خشتەی پوختی ژمارەی خشتە، وێنە و هێڵکارییەکان بەپێی بەشەکانی تێز و لاپەڕەکانیان.',
    contentTemplate: `## پێڕستی خشتەکان (List of Tables)

| ژمارەی خشتە | ناونیشانی خشتە | لاپەڕە |
| :---: | :--- | :---: |
| خشتەی (١-١) | ئاماری دیمۆگرافیی بەشداربووانی توێژینەوە | ١٢ |
| خشتەی (٢-١) | بەراوردی تیۆرییەکانی پێشوو لە ئەدەبیاتی زانستیدا | ٤٥ |
| خشتەی (٣-١) | هاوکۆلکەی جێگیریی کڕۆنباخ ئەلفا بۆ پێوەرەکان | ٧٨ |
| خشتەی (٤-١) | دەرئەنجامی شیکاریی فرەگۆڕاو (Multiple Regression) | ١٠٢ |

---

## پێڕستی وێنە و هێڵکارییەکان (List of Figures)

| ژمارەی وێنە | ناونیشانی وێنە یان هێڵکاری | لاپەڕە |
| :---: | :--- | :---: |
| وێنەی (١-١) | چوارچێوەی چەمکیی پەیوەندی نێوان گۆڕاوەکان | ١٨ |
| وێنەی (٣-١) | هێڵکاریی قۆناغەکانی جێبەجێکردنی میتۆدۆلۆژیا | ٨٠ |
| وێنەی (٤-١) | دابەشبوونی ئاسایی داتاکان (Normal Distribution Curve) | ١١٠ |`
  }
];

@Component({
  selector: 'app-thesis-appendices-generator',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <mat-icon>attachment</mat-icon>
            </span>
            <h3 class="text-xl font-bold text-stone-900">داڕێژەری فەرمیی پاشکۆ و بەڵگەنامە ئەکادیمییەکان (Appendices & Ethics)</h3>
          </div>
          <p class="text-xs md:text-sm text-stone-600 mt-1">
            دروستکردنی بەڵگەنامەکانی ڕەزامەندیی ئەخلاقی (IRB)، فۆرمی ڕەزامەندیی زانیاریدەران و پێڕستی خشتەکان بەپێی ستاندارد.
          </p>
        </div>
      </div>

      <!-- Template Selector -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        @for (tpl of templates(); track tpl.id) {
          <div
            (click)="selectTemplate(tpl)"
            [class]="selectedTemplate().id === tpl.id ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-stone-200 bg-stone-50 hover:bg-stone-100/80'"
            class="p-4 rounded-xl border transition cursor-pointer space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-stone-900">{{ tpl.titleKurdish }}</span>
              <mat-icon [class]="selectedTemplate().id === tpl.id ? 'text-emerald-600' : 'text-stone-400'" class="text-sm">
                {{ selectedTemplate().id === tpl.id ? 'radio_button_checked' : 'radio_button_unchecked' }}
              </mat-icon>
            </div>
            <p class="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
              {{ tpl.description }}
            </p>
          </div>
        }
      </div>

      <!-- Active Template Editor & Preview -->
      <div class="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <mat-icon class="text-emerald-600 text-xs">edit_note</mat-icon>
            <span>دەستکاریکردنی پێشوەختەی پاشکۆ</span>
          </span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="copyTemplate()"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium border border-stone-200 transition cursor-pointer">
              <mat-icon class="text-xs">content_copy</mat-icon>
              <span>لەبەرگرتنەوە</span>
            </button>
            <button
              type="button"
              (click)="insertIntoActiveDocument()"
              class="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">
              <mat-icon class="text-xs">post_add</mat-icon>
              <span>هاوپێچکردن لە بەشی ئێستا</span>
            </button>
          </div>
        </div>

        <textarea
          [(ngModel)]="activeContent"
          rows="11"
          class="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:border-emerald-500 transition"></textarea>
      </div>
    </div>
  `
})
export class ThesisAppendicesGeneratorComponent {
  chapters = input<ChapterItem[]>([]);
  private notifications = inject(AppNotificationsService);
  private editor = inject(EditorService);

  templates = signal<AppendixTemplate[]>(TEMPLATES);
  selectedTemplate = signal<AppendixTemplate>(TEMPLATES[0]);
  activeContent = TEMPLATES[0].contentTemplate;

  selectTemplate(tpl: AppendixTemplate) {
    this.selectedTemplate.set(tpl);
    this.activeContent = tpl.contentTemplate;
  }

  copyTemplate() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.activeContent);
      this.notifications.showSuccess('لەبەرگیرایەوە', 'دەقی پاشکۆکە لەبەرگیرایەوە.');
    }
  }

  insertIntoActiveDocument() {
    const ch = this.chapters().find(c => c.id === this.editor.activeChapterId()) || this.chapters()[0];
    if (ch) {
      const current = (ch.content || '').trim();
      const updated = current ? `${current}\n\n${this.activeContent}` : this.activeContent;
      this.editor.updateChapterContent(ch.id, updated, 'هاوپێچکردنی پاشکۆ');
      this.notifications.showSuccess('هاوپێچ کرا', 'پاشکۆکە بە سەرکەوتوویی خرایە ناو دەستنووس.');
    } else {
      this.notifications.showWarning('ئاگاداری', 'سەرەتا بەشێک لە سەرنووسەر هەڵبژێرە.');
    }
  }
}
