import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { AI_TOOLS_CATALOG, AiToolItem } from './ai-tools-catalog';
import { EditorService } from '../editor/services/editor';
import { AcademicStoreService } from '../../services/academic-store.service';
import { ManuscriptBridgeActionsService } from '../../services/manuscript-bridge-actions.service';
import { AppNotificationsService } from '../../core/app.notifications';

@Component({
  selector: 'app-ai-tools-suite',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 text-right font-serif" dir="rtl">
      <!-- Top Banner Header -->
      <div class="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-6 text-white shadow-xl space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <mat-icon class="!w-7 !h-7">auto_awesome</mat-icon>
            </div>
            <div>
              <h2 class="text-xl font-bold text-amber-400 font-serif">کۆمەڵەی ئامرازە ئەکادیمییە هەڵبژێردراوەکان</h2>
              <p class="text-xs text-stone-300">ئامرازەکان بەپێی کارەکە دەستنیشان کراون؛ لیستەکە هەموو کارەکان لە یەک شوێن پێشکەش دەکات و هیچ نمرەیەک جێگەی پشکنینی بەڵگە ناگرێت.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full font-bold shadow-sm">
              ئامرازە بەردەستەکان
            </span>
          </div>
        </div>

        <!-- Search Bar & Filters -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-stone-800/80">
          <div class="md:col-span-4 relative">
            <mat-icon class="absolute right-3 top-2.5 text-stone-400 !w-5 !h-5 text-sm">search</mat-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="گەڕان لە نێوان ئامرازە بەردەستەکاندا..."
              class="w-full bg-stone-950/80 border border-stone-700 text-stone-100 placeholder-stone-400 text-xs rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:border-amber-400 transition-all font-sans"
            />
          </div>

          <div class="md:col-span-8 flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              (click)="selectedSection.set('all')"
              [class]="selectedSection() === 'all'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              هەموو ئامرازەکان
            </button>
            <button
              type="button"
              (click)="selectedSection.set('1-30')"
              [class]="selectedSection() === '1-30'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              1–30
            </button>
            <button
              type="button"
              (click)="selectedSection.set('31-60')"
              [class]="selectedSection() === '31-60'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              31–60
            </button>
            <button
              type="button"
              (click)="selectedSection.set('61-90')"
              [class]="selectedSection() === '61-90'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              61–90
            </button>
            <button
              type="button"
              (click)="selectedSection.set('91-120')"
              [class]="selectedSection() === '91-120'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              91–120
            </button>
            <button
              type="button"
              (click)="selectedSection.set('121-130')"
              [class]="selectedSection() === '121-130'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              121–130
            </button>
            <button
              type="button"
              (click)="selectedSection.set('131-160')"
              [class]="selectedSection() === '131-160'
                ? 'px-3 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition-all flex-none'
                : 'px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-xl text-xs font-medium border border-stone-700 transition-all cursor-pointer flex-none'">
              پلاتفۆرم (131–160)
            </button>
        </div>
      </div>

      <!-- Main Layout Grid: Tool Selector List & Interactive Workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Right Column: Tools List Selector (4 cols on lg) -->
        <div class="lg:col-span-4 space-y-2 max-h-[780px] overflow-y-auto pr-1">
          <div class="flex items-center justify-between text-xs text-stone-500 font-bold px-1 pb-1">
            <span>ئامرازە بەردەستەکان ({{ filteredTools().length }})</span>
            @if (searchQuery()) {
              <span class="text-amber-700 font-mono">ئەنجامی گەڕان</span>
            }
          </div>

          @for (tool of filteredTools(); track tool.num) {
            <button 
              type="button"
              (click)="selectTool(tool)"
              [class]="activeTool().num === tool.num 
                ? 'w-full text-right p-3 rounded-xl border-2 border-harvard-crimson bg-amber-50/70 shadow-xs cursor-pointer transition-all flex items-start gap-2.5' 
                : 'w-full text-right p-3 rounded-xl border border-stone-200 hover:border-stone-400 bg-white cursor-pointer transition-all flex items-start gap-2.5 hover:shadow-2xs'">
              <div class="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs flex-none shadow-inner border border-stone-200">
                #{{ tool.num }}
              </div>
              <div class="flex-1 space-y-0.5 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                    <mat-icon class="!w-4 !h-4 text-harvard-crimson text-sm leading-none flex-none">{{ tool.icon }}</mat-icon>
                    <span class="truncate">{{ tool.titleKurdish }}</span>
                  </h4>
                </div>
                <p class="text-[10px] text-stone-500 leading-snug line-clamp-2 text-right font-sans">{{ tool.description }}</p>
              </div>
            </button>
          } @empty {
            <div class="p-8 text-center text-stone-500 text-xs bg-stone-50 rounded-2xl border border-stone-200">
              هیچ ئامرازێک بەو ناوە یان ژمارەیە نەدۆزرایەوە.
            </div>
          }
        </div>

        <!-- Left Column: Active Tool Interactive Workspace (8 cols on lg) -->
        <div class="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
          <!-- Active Tool Header -->
          <div class="flex items-center justify-between border-b border-stone-150 pb-4 flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-harvard-crimson text-white flex items-center justify-center font-bold text-sm shadow-md">
                #{{ activeTool().num }}
              </div>
              <div>
                <h3 class="text-base font-bold text-stone-900 flex items-center gap-2">
                  <mat-icon class="text-harvard-crimson">{{ activeTool().icon }}</mat-icon>
                  <span>{{ activeTool().titleKurdish }}</span>
                </h3>
                <p class="text-xs text-stone-500 font-mono">{{ activeTool().titleEnglish }}</p>
              </div>
            </div>

            <!-- Optional Config Dropdowns -->
            <div class="flex items-center gap-3 flex-wrap">
              @if (activeTool().hasStyleOption) {
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-stone-700">شێواز:</span>
                  <select [ngModel]="selectedStyle()" (ngModelChange)="selectedStyle.set($event)" class="text-xs bg-stone-100 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-harvard-crimson">
                    <option value="APA">APA 7th</option>
                    <option value="Harvard">Harvard</option>
                    <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago</option>
                  </select>
                </div>
              }

              @if (activeTool().hasToneOption) {
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-stone-700">تۆن:</span>
                  <select [ngModel]="selectedTone()" (ngModelChange)="selectedTone.set($event)" class="text-xs bg-stone-100 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-harvard-crimson">
                    <option value="Formal Academic">Formal Academic</option>
                    <option value="Critical Review">Critical Review</option>
                    <option value="Analytical Objective">Analytical Objective</option>
                    <option value="Persuasive Argumentative">Persuasive Argumentative</option>
                  </select>
                </div>
              }

              @if (activeTool().hasLanguageOption) {
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-stone-700">زمان:</span>
                  <select [ngModel]="selectedLanguage()" (ngModelChange)="selectedLanguage.set($event)" class="text-xs bg-stone-100 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-harvard-crimson">
                    <option value="Kurdish Sorani">کوردیی سۆرانی</option>
                    <option value="English Academic">English Academic</option>
                    <option value="Arabic Academic">العربية الأكاديمية</option>
                  </select>
                </div>
              }
            </div>
          </div>

          <!-- Description Box -->
          <div class="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <mat-icon class="text-amber-700 flex-none text-base">info</mat-icon>
            <p class="leading-relaxed">{{ activeTool().description }}</p>
          </div>

          <!-- User Input Textarea -->
          <div class="space-y-1.5">
            <label for="ai-tool-input-text" class="block text-xs font-bold text-stone-800">دەق یان بابەتی ورودی بۆ شیکاری/نووسین:</label>
            <textarea
              id="ai-tool-input-text"
              [ngModel]="userInputText()"
              (ngModelChange)="userInputText.set($event)"
              [placeholder]="activeTool().placeholder"
              rows="6"
              class="w-full bg-stone-50 border border-stone-300 focus:border-harvard-crimson focus:bg-white text-stone-900 text-xs rounded-xl p-3.5 focus:outline-none transition-all leading-relaxed font-sans"></textarea>
          </div>

          <!-- Action Buttons Bar -->
          <div class="flex items-center justify-between gap-3 flex-wrap pt-1">
            <button
              type="button"
              (click)="executeTool()"
              [disabled]="isLoading() || !userInputText().trim()"
              class="px-6 py-2.5 bg-harvard-crimson hover:bg-harvard-crimson/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
              @if (isLoading()) {
                <mat-icon class="animate-spin text-sm">sync</mat-icon>
                <span>لە پرۆسەی دارشتن بە ژیریی دەستکرد...</span>
              } @else {
                <mat-icon class="text-sm">auto_awesome</mat-icon>
                <span>جێبەجێکردنی ئامرازی #{{ activeTool().num }}</span>
              }
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="injectActiveContext()"
                class="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                <mat-icon class="!text-xs">sync_saved_locally</mat-icon>
                <span>وەرگرتنی خۆکاری زانیاریی تێز و بەشی چالاک</span>
              </button>
              <button
                type="button"
                (click)="clearInput()"
                class="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-all cursor-pointer">
                سڕینەوەی ورودی
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          @if (errorMessage()) {
            <div class="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <mat-icon class="text-red-600 text-base flex-none">error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- AI Output Result Display Workspace -->
          @if (outputResult()) {
            <div class="space-y-2.5 pt-4 border-t border-stone-200 animate-fadeIn">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <h4 class="text-xs font-bold text-stone-900 flex items-center gap-2">
                  <mat-icon class="text-emerald-600 text-base">verified</mat-icon>
                  <span>دەرئەنجامی ئامرازەکە</span>
                </h4>
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    (click)="insertIntoManuscript()"
                    class="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs">
                    <mat-icon class="!w-4 !h-4 text-xs">edit_note</mat-icon>
                    <span>ناردن بۆ ناو دەستنووس</span>
                  </button>
                  <button
                    type="button"
                    (click)="saveAsCorpusCard()"
                    class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs">
                    <mat-icon class="!w-4 !h-4 text-xs">bookmark_add</mat-icon>
                    <span>پاشەکەوتکردن وەک فیش لە کۆرپەسدا</span>
                  </button>
                  <button
                    type="button"
                    (click)="copyOutput()"
                    class="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <mat-icon class="!w-4 !h-4 text-xs">{{ copySuccess() ? 'check' : 'content_copy' }}</mat-icon>
                    <span>{{ copySuccess() ? 'کۆپی کرا!' : 'کۆپیکردنی دەق' }}</span>
                  </button>
                </div>
              </div>

              <div class="bg-stone-900 text-stone-100 p-5 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-wrap border border-stone-800 shadow-inner max-h-[500px] overflow-y-auto">
                {{ outputResult() }}
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class AiToolsSuiteComponent {
  private http = inject(HttpClient);
  private editorService = inject(EditorService);
  private academicStore = inject(AcademicStoreService);
  private manuscriptBridge = inject(ManuscriptBridgeActionsService);
  private toastService = inject(AppNotificationsService);

  tools: AiToolItem[] = AI_TOOLS_CATALOG;

  activeTool = signal<AiToolItem>(this.tools[0]);
  selectedSection = signal<'all' | '1-30' | '31-60' | '61-90' | '91-120' | '121-130' | '131-160'>('all');
  searchQuery = signal<string>('');

  selectedStyle = signal<string>('APA');
  selectedTone = signal<string>('Formal Academic');
  selectedLanguage = signal<string>('Kurdish Sorani');

  userInputText = signal<string>('');
  outputResult = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  copySuccess = signal<boolean>(false);

  filteredTools = computed(() => {
    const sec = this.selectedSection();
    const q = this.searchQuery().trim().toLowerCase();

    return this.tools.filter(tool => {
      const matchSection = sec === 'all' || tool.section === sec;
      const matchQuery = !q ||
        tool.titleKurdish.toLowerCase().includes(q) ||
        tool.titleEnglish.toLowerCase().includes(q) ||
        tool.num.toString() === q ||
        tool.id.toLowerCase().includes(q);

      return matchSection && matchQuery;
    });
  });

  selectTool(tool: AiToolItem) {
    this.activeTool.set(tool);
    this.outputResult.set(null);
    this.errorMessage.set(null);
    if (!this.userInputText().trim()) {
      this.injectActiveContext();
    }
  }

  injectActiveContext() {
    const title = this.academicStore.manuscriptTitle() || 'تێزی ئەکادیمی';
    const chapters = this.editorService.chapters();
    const activeId = this.editorService.activeChapterId();
    const activeCh = (activeId !== null ? chapters.find(c => c.id === activeId) : null) || chapters[0];
    const questions = this.academicStore.verticalAlignmentMatrix().map(m => m.questionText).join('؛ ');

    let activeText = '';
    if (activeCh) {
      if (activeCh.axes && activeCh.axes.length > 0) {
        for (const ax of activeCh.axes) {
          for (const br of ax.branches) {
            if (br.content) activeText += `\n[${br.code} ${br.title}]: ${br.content}\n`;
          }
        }
      }
      if (!activeText) activeText = activeCh.content || '';
    }

    const snippet = `ناونیشانی تێز: ${title}\nپرسیارەکانی توێژینەوە: ${questions || 'کێشە و ئامانجە زانستییەکان'}\nبەشی کارپێکراو: ${activeCh?.title || 'بەشی یەکەم'}\nدەقی چالاکی دەستنووس:\n${activeText.slice(0, 1000)}`;
    this.userInputText.set(snippet);
    this.toastService.showSuccess('زانیاری بارکرا', 'زانیاریی دەستنووس و پرسیارەکانی توێژینەوە بە سەرکەوتوویی بارکران.');
  }

  insertIntoManuscript() {
    const text = this.outputResult();
    if (!text) return;
    this.manuscriptBridge.applyManuscriptUpdate(text, 'append');
  }

  saveAsCorpusCard() {
    const text = this.outputResult();
    if (!text) return;
    const activeId = this.editorService.activeChapterId();
    this.academicStore.addCorpusCard({
      title: `دەرئەنجامی ئامرازی #${this.activeTool().num}: ${this.activeTool().titleKurdish || this.activeTool().id}`,
      excerptText: text,
      sourceTitle: `ئامرازی ژیریی # ${this.activeTool().num}`,
      author: 'AI Academic Suite',
      targetChapterId: activeId !== null ? activeId : 1,
      category: 'corpus',
      tags: ['ai_tools', this.activeTool().id]
    });
    this.toastService.showSuccess('پاشەکەوت کرا', 'دەرئەنجامەکە وەک کارتی فیش لە کۆرپەسدا پاشەکەوت کرا.');
  }

  executeTool() {
    const text = this.userInputText().trim();
    if (!text || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.outputResult.set(null);
    this.copySuccess.set(false);

    const payload = {
      toolId: this.activeTool().id,
      inputText: text,
      options: {
        style: this.selectedStyle(),
        tone: this.selectedTone(),
        language: this.selectedLanguage()
      }
    };

    this.http.post<{ success: boolean; output: string; error?: string }>('/api/ai-tools/execute', payload)
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.output) {
            this.outputResult.set(res.output);
          } else {
            this.errorMessage.set(res.error || 'هیچ وەڵامێک نەگەڕایەوە.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err?.error?.error || err?.message || 'کێشەیەک لە پەیوەندی بە سێرڤەر ڕوویدا.';
          this.errorMessage.set(msg);
        }
      });
  }

  clearInput() {
    this.userInputText.set('');
    this.outputResult.set(null);
    this.errorMessage.set(null);
  }

  copyOutput() {
    const text = this.outputResult();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }
}
