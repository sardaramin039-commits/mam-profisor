import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { AI_TOOLS_CATALOG, AiToolItem } from './ai-tools-catalog';
import { EditorService } from '../../services/editor.service';
import { AcademicStoreService } from '../../services/academic-store.service';

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

            <button
              type="button"
              (click)="clearInput()"
              class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-all cursor-pointer">
              سڕینەوەی ورودی
            </button>
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
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-stone-900 flex items-center gap-2">
                  <mat-icon class="text-emerald-600 text-base">verified</mat-icon>
                  <span>دەرئەنجامی ئامرازەکە</span>
                </h4>
                <button
                  type="button"
                  (click)="copyOutput()"
                  class="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <mat-icon class="!w-4 !h-4 text-xs">{{ copySuccess() ? 'check' : 'content_copy' }}</mat-icon>
                  <span>{{ copySuccess() ? 'کۆپی کرا!' : 'کۆپیکردنی دەق' }}</span>
                </button>
              </div>

              <div class="bg-stone-900 text-stone-100 p-5 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-wrap border border-stone-800 shadow-inner max-h-[500px] overflow-y-auto">
                {{ outputResult() }}
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" (click)="insertOutputIntoManuscript()" class="px-3 py-2 bg-emerald-800 text-white rounded-lg text-xs">ناردن بۆ ناو دەستنووس</button>
                <button type="button" (click)="saveOutputAsCorpusCard()" class="px-3 py-2 bg-indigo-800 text-white rounded-lg text-xs">پاشەکەوتکردن وەک فیش لە کۆرپەسدا</button>
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
  private editor = inject(EditorService);
  private academicStore = inject(AcademicStoreService);

  private activeResearchContext(): string {
    const chapters = this.editor.chapters();
    const activeId = this.editor.activeChapterId();
    const chapter = chapters.find(item => item.id === activeId) || chapters[0];
    const title = this.academicStore.projectTitle?.() || this.academicStore.manuscriptTitle?.() || '';
    return [
      'CONTEXT (use as source context, do not invent missing facts):',
      title ? `Thesis title: ${title}` : '',
      chapter ? `Selected chapter: ${chapter.title}\\nChapter text:\\n${chapter.content || ''}` : 'No active chapter selected.',
      'Preserve factual uncertainty and cite only sources supplied or verified.'
    ].filter(Boolean).join('\\n\\n');
  }

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
      inputText: `${this.activeResearchContext()}\\n\\nTOOL REQUEST:\\n${text}`,
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

  insertOutputIntoManuscript(): void {
    const result = this.outputResult()?.trim();
    if (!result) return;
    const chapters = this.editor.chapters();
    const id = this.editor.activeChapterId() ?? chapters[0]?.id;
    if (id == null) { this.errorMessage.set('سەرەتا بەشێکی چالاک دروست بکە.'); return; }
    const chapter = chapters.find(item => item.id === id);
    if (!chapter) { this.errorMessage.set('بەشی چالاک نەدۆزرایەوە.'); return; }
    this.editor.updateChapterContent(id, [chapter.content?.trim(), result].filter(Boolean).join('\\n\\n'), 'ناردنی دەرئەنجامی ئامرازی ئەکادیمی');
  }

  saveOutputAsCorpusCard(): void {
    const result = this.outputResult()?.trim();
    if (!result) return;
    const chapter = this.editor.chapters().find(item => item.id === this.editor.activeChapterId());
    this.academicStore.researchCorpusCards.update(cards => [...cards, {
      id: `tool-result-${Date.now()}`,
      sourceTitle: this.activeTool().titleKurdish,
      author: 'Mam Professor AI Tool',
      excerptText: result,
      targetChapterId: chapter?.id,
      createdAt: new Date().toISOString()
    } as any]);
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
