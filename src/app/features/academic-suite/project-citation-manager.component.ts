import { Component, ChangeDetectionStrategy, signal, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChapterItemModel as ChapterItem } from '../../domain/models';
import { AcademicStoreService } from '../../services/academic-store.service';
import { AcademicSource } from '../../services/data';

export interface ProjectCitationItem {
  id: string;
  folder: string;
  title: string;
  author: string;
  year: number;
  publisher: string;
  sourceType: 'book' | 'journal' | 'thesis' | 'web';
  doi?: string;
  url?: string;
  volume?: string;
  pages?: string;
  tags?: string[];
}

@Component({
  selector: 'app-project-citation-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-right font-sans space-y-6" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <mat-icon class="!text-lg !w-5 !h-5">collections_bookmark</mat-icon>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-100 font-serif">سیستەمی بەڕێوەبردنی سەرچاوەکانی پڕۆژە (Project Citation Manager)</h4>
            <p class="text-[11px] text-slate-400">هاوردەکردنی BibTeX/RIS، ڕێکخستنی فۆڵدەر، و هەناردەکردنی پێڕست بۆ PDF و APA/MLA/Chicago</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="showAddModal.set(true)"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm">
            <mat-icon class="!text-xs">add</mat-icon>
            <span>زیادکردنی سەرچاوەی نوێ</span>
          </button>
          <button 
            type="button"
            (click)="showImportModal.set(true)"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer">
            <mat-icon class="!text-xs">file_download</mat-icon>
            <span>هاوردە لە BibTeX / RIS</span>
          </button>
        </div>
      </div>

      <!-- Folders & Style Toolbar -->
      <div class="flex items-center justify-between flex-wrap gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <!-- Folders Filter -->
        <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <span class="text-slate-400 text-[11px] ml-1">فۆڵدەر:</span>
          @for (f of availableFolders(); track f) {
            <button 
              type="button"
              (click)="selectedFolder.set(f)"
              [class]="selectedFolder() === f ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'"
              class="px-2.5 py-1 rounded-lg text-xs transition cursor-pointer">
              {{ f }}
            </button>
          }
        </div>

        <!-- Export Style Selector & PDF Export Button -->
        <div class="flex items-center gap-2">
          <select 
            [(ngModel)]="exportStyle"
            class="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500">
            <option value="APA">APA 7th</option>
            <option value="Harvard">Harvard</option>
            <option value="MLA">MLA 9th</option>
            <option value="Chicago">Chicago 17th</option>
          </select>

          <button 
            type="button"
            (click)="exportBibliographyAsPdf()"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer">
            <mat-icon class="!text-xs">picture_as_pdf</mat-icon>
            <span>هەناردەی PDF</span>
          </button>
        </div>
      </div>

      <!-- Citations List Table -->
      <div class="overflow-x-auto border border-slate-800 rounded-xl">
        <table class="w-full text-right text-xs text-slate-300">
          <thead class="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
            <tr>
              <th class="p-3">ناونیشانی سەرچاوە</th>
              <th class="p-3">نووسەر / ساڵ</th>
              <th class="p-3">جۆر و بڵاوکەرەوە</th>
              <th class="p-3">فۆڵدەر</th>
              <th class="p-3 text-center">کردارەکان</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 bg-slate-950/40">
            @for (item of filteredCitations(); track item.id) {
              <tr class="hover:bg-slate-850/50 transition">
                <td class="p-3">
                  <div class="font-bold text-slate-100 font-serif">{{ item.title }}</div>
                  @if (item.doi) {
                    <span class="text-[10px] text-blue-400 font-mono">DOI: {{ item.doi }}</span>
                  }
                </td>
                <td class="p-3">
                  <div>{{ item.author }}</div>
                  <span class="text-[10px] text-slate-400 font-mono">{{ item.year }}</span>
                </td>
                <td class="p-3">
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                    {{ item.sourceType }}
                  </span>
                  <div class="text-[10.5px] text-slate-400 mt-0.5">{{ item.publisher }}</div>
                </td>
                <td class="p-3">
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300 border border-blue-900/60 font-mono">
                    {{ item.folder }}
                  </span>
                </td>
                <td class="p-3 text-center">
                  <button 
                    type="button"
                    (click)="deleteCitation(item.id)"
                    class="p-1 hover:bg-rose-950/50 text-rose-400 rounded transition cursor-pointer"
                    title="سڕینەوە">
                    <mat-icon class="!text-sm !w-4 !h-4">delete</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="p-6 text-center text-slate-500">
                  هیچ سەرچاوەیەک لەم فۆڵدەرەدا تۆمار نەکراوە.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Formal Bibliography Preview Page -->
      <div id="project-bibliography-export-view" class="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h5 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
            <mat-icon class="!text-xs text-blue-400">auto_stories</mat-icon>
            <span>پێڕستی فەرمیی سەرچاوەکان ({{ exportStyle() }} Bibliography View):</span>
          </h5>
          <span class="text-[10px] text-slate-400 font-mono">{{ filteredCitations().length }} سەرچاوە ڕیزکراون</span>
        </div>

        <div class="space-y-2 text-xs font-serif leading-relaxed text-slate-300">
          @for (formatted of formattedBibliographyEntries(); track $index) {
            <p class="p-2.5 bg-slate-900/60 rounded border border-slate-800/80 hover:border-slate-700 transition">
              {{ formatted }}
            </p>
          }
        </div>
      </div>

      <!-- Add Citation Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-right space-y-4 shadow-2xl">
            <h4 class="text-sm font-bold text-white font-serif flex items-center gap-2">
              <mat-icon class="text-blue-400">add_circle</mat-icon>
              <span>تۆمارکردنی سەرچاوەی نوێ بۆ پڕۆژەکە</span>
            </h4>

            <div class="space-y-3 text-xs">
              <input type="text" [(ngModel)]="newForm.title" placeholder="ناونیشانی کتێب یان وتار *" class="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" [(ngModel)]="newForm.author" placeholder="ناوی نووسەر *" class="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100">
                <input type="number" [(ngModel)]="newForm.year" placeholder="ساڵ (بۆ نموونە: ٢٠٢٢) *" class="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" [(ngModel)]="newForm.publisher" placeholder="بڵاوکەرەوە / ژۆرناڵ" class="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100">
                <select [(ngModel)]="newForm.folder" class="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100">
                  <option value="گشتی">فۆڵدەری: گشتی</option>
                  <option value="تیۆری">فۆڵدەری: تیۆری</option>
                  <option value="میتۆدۆلۆژی">فۆڵدەری: میتۆدۆلۆژی</option>
                  <option value="ئەنجامەکان">فۆڵدەری: ئەنجامەکان</option>
                </select>
              </div>
              <input type="text" [(ngModel)]="newForm.doi" placeholder="کۆدی DOI یان بەستەری ئەنتەرنێت" class="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100">
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" (click)="showAddModal.set(false)" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">داخستن</button>
              <button type="button" (click)="saveNewCitation()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer">تۆمارکردن</button>
            </div>
          </div>
        </div>
      }

      <!-- Import BibTeX / RIS Modal -->
      @if (showImportModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-right space-y-4 shadow-2xl">
            <h4 class="text-sm font-bold text-white font-serif flex items-center gap-2">
              <mat-icon class="text-emerald-400">upload_file</mat-icon>
              <span>هاوردەکردنی سەرچاوە لە داتای BibTeX یان RIS</span>
            </h4>

            <p class="text-xs text-slate-400 leading-relaxed">
              دەتوانیت مەتنی فایلی .bib یان .ris لێرە دابنێیت تا سیستەمەکە بە شێوەیەکی داینامیکی نووسەر، ساڵ و ناونیشان لێکجیا بکاتەوە.
            </p>

            <textarea 
              [(ngModel)]="rawImportText" 
              rows="6" 
              placeholder="@article{kurd2022, author={Ahmad, K.}, title={Sociology of Language}, year={2022}}..." 
              class="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"></textarea>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" (click)="showImportModal.set(false)" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">داخستن</button>
              <button type="button" (click)="processBibtexImport()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer">لێکدانەوە و زیادکردن</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectCitationManagerComponent {
  private academicStore = inject(AcademicStoreService);

  activeChapter = input<ChapterItem | null>(null);

  selectedFolder = signal<string>('هەموو');
  exportStyle = signal<string>('APA');
  showAddModal = signal<boolean>(false);
  showImportModal = signal<boolean>(false);
  rawImportText = '';

  citations = signal<ProjectCitationItem[]>([
    {
      id: 'cit-1',
      folder: 'تیۆری',
      title: 'مێژووی پەروەردەی هاوچەرخ لە باشووری کوردستان',
      author: 'ئەحمەد، ک.',
      year: 2021,
      publisher: 'چاپخانەی زانکۆی سەلاحەدین',
      sourceType: 'book',
      doi: '10.1234/kurd.edu.2021'
    },
    {
      id: 'cit-2',
      folder: 'میتۆدۆلۆژی',
      title: 'شیکاریی چەندێتی لە زانستە کۆمەڵایەتییەکاندا',
      author: 'کەریم، ف.',
      year: 2023,
      publisher: 'گۆڤاری زانکۆی سلێمانی بۆ زانستە مرۆڤایەتییەکان',
      sourceType: 'journal',
      volume: '15(2)',
      pages: '45-62'
    }
  ]);

  newForm = {
    title: '',
    author: '',
    year: 2024,
    publisher: '',
    folder: 'گشتی',
    sourceType: 'book' as const,
    doi: ''
  };

  availableFolders = computed(() => ['هەموو', 'گشتی', 'تیۆری', 'میتۆدۆلۆژی', 'ئەنجامەکان']);

  filteredCitations = computed(() => {
    const f = this.selectedFolder();
    const list = this.citations();
    if (f === 'هەموو') return list;
    return list.filter(c => c.folder === f);
  });

  formattedBibliographyEntries = computed(() => {
    const style = this.exportStyle();
    return this.filteredCitations().map(c => {
      if (style === 'APA') {
        return `${c.author} (${c.year}). ${c.title}. ${c.publisher}${c.doi ? ', DOI: ' + c.doi : ''}.`;
      } else if (style === 'Harvard') {
        return `${c.author}, ${c.year}. ${c.title}. ${c.publisher}.`;
      } else if (style === 'MLA') {
        return `${c.author}. "${c.title}." ${c.publisher}, ${c.year}.`;
      } else {
        return `${c.author}, ${c.title} (${c.publisher}, ${c.year}).`;
      }
    });
  });

  saveNewCitation(): void {
    if (!this.newForm.title || !this.newForm.author) return;
    const item: ProjectCitationItem = {
      id: `cit-${Date.now()}`,
      title: this.newForm.title,
      author: this.newForm.author,
      year: this.newForm.year || 2024,
      publisher: this.newForm.publisher || 'بڵاوکەرەوەی زانستی',
      folder: this.newForm.folder || 'گشتی',
      sourceType: this.newForm.sourceType,
      doi: this.newForm.doi
    };
    this.citations.update(list => [item, ...list]);
    this.showAddModal.set(false);
    this.newForm = { title: '', author: '', year: 2024, publisher: '', folder: 'گشتی', sourceType: 'book', doi: '' };
  }

  deleteCitation(id: string): void {
    this.citations.update(list => list.filter(c => c.id !== id));
  }

  processBibtexImport(): void {
    const text = this.rawImportText.trim();
    if (!text) return;

    // Simple heuristic parser for BibTeX / RIS
    const authorMatch = text.match(/author\s*=\s*[{"]([^}"]+)[}"]/i);
    const titleMatch = text.match(/title\s*=\s*[{"]([^}"]+)[}"]/i);
    const yearMatch = text.match(/year\s*=\s*[{"]?(\d{4})[}"]?/i);

    const imported: ProjectCitationItem = {
      id: `cit-import-${Date.now()}`,
      title: titleMatch ? titleMatch[1] : 'وتاری هاوردەکراو',
      author: authorMatch ? authorMatch[1] : 'توێژەر',
      year: yearMatch ? parseInt(yearMatch[1], 10) : 2024,
      publisher: 'سەرچاوەی دەرەکی',
      folder: 'گشتی',
      sourceType: 'journal'
    };

    this.citations.update(list => [imported, ...list]);
    this.rawImportText = '';
    this.showImportModal.set(false);
  }

  exportBibliographyAsPdf(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
