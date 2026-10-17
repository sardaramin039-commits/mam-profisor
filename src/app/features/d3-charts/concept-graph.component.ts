import { Component, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, signal, output, input, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { D3ConceptGraphHelper } from '../../helpers/concept-graph';
import { ConceptNodeModel, ConceptLinkModel } from '../../helpers/thesis-context-map';
import { AcademicStoreService } from '../../services/academic-store.service';
import { EditorService } from '../editor/services/editor';

@Component({
  selector: 'app-concept-graph',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4 font-sans text-right" dir="rtl">
      
      <!-- Top Bar -->
      <div class="flex items-center justify-between border-b border-stone-150 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">hub</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold font-serif text-stone-900 flex items-center gap-2">
              نەخشەی تۆپۆلۆژیی و پێوەندیی چەمکە ئەکادیمییەکان (D3 Force-Directed Graph)
            </h3>
            <p class="text-[10.5px] text-stone-500 font-serif">
              شێوەکاری داینامیکیی پەیوەندی نێوان میتۆدۆلۆژی، فەرزنامە، بەڵگەی مەیدانی و کەلێنی توێژینەوە
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="resetGraphView()"
            class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer">
            <mat-icon class="!text-xs">restart_alt</mat-icon>
            <span>نوێکردنەوەی نەخشە</span>
          </button>

          <button
            type="button"
            (click)="exportTrigger.emit()"
            class="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-amber-400 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs">
            <mat-icon class="!text-xs">download</mat-icon>
            <span>داگرتنی Context Map (JSON)</span>
          </button>
        </div>
      </div>

      <!-- Main Interactive Viewport & Details Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        <!-- Left: D3 Graph Canvas (8 cols) -->
        <div class="lg:col-span-8 bg-stone-50 border border-stone-250 rounded-xl p-3 relative min-h-[420px] flex flex-col justify-between overflow-hidden">
          
          <!-- Category Filter Bar -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 text-[10.5px]">
            <span class="text-stone-500 font-bold shrink-0">پاڵاوتن:</span>
            <button
              type="button"
              (click)="selectedCategory.set('all')"
              [class]="'px-2.5 py-1 rounded-full font-bold transition cursor-pointer ' + 
                (selectedCategory() === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100')">
              هەمووی ({{ nodes().length }})
            </button>
            <button
              type="button"
              (click)="selectedCategory.set('methodology')"
              [class]="'px-2.5 py-1 rounded-full font-bold transition cursor-pointer ' + 
                (selectedCategory() === 'methodology' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100')">
              میتۆدۆلۆژی
            </button>
            <button
              type="button"
              (click)="selectedCategory.set('hypothesis')"
              [class]="'px-2.5 py-1 rounded-full font-bold transition cursor-pointer ' + 
                (selectedCategory() === 'hypothesis' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100')">
              فەرزنامە
            </button>
            <button
              type="button"
              (click)="selectedCategory.set('evidence')"
              [class]="'px-2.5 py-1 rounded-full font-bold transition cursor-pointer ' + 
                (selectedCategory() === 'evidence' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100')">
              بەڵگەی مەیدانی
            </button>
            <button
              type="button"
              (click)="selectedCategory.set('gap')"
              [class]="'px-2.5 py-1 rounded-full font-bold transition cursor-pointer ' + 
                (selectedCategory() === 'gap' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100')">
              کەلێنی توێژینەوە
            </button>
          </div>

          <!-- D3 Container SVG -->
          <div #graphContainer class="w-full h-[380px] flex items-center justify-center my-1"></div>

          <!-- Canvas Footer controls hint -->
          <div class="flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-200 pt-2 font-serif">
            <span>💡 ئامۆژگاری: دەتوانیت نۆدەکان ڕابکێشیت (Drag) یان بۆ نزیککردنەوە زووم (Scroll Zoom) بکەیت.</span>
            <span>تێکرا: {{ filteredNodes().length }} چەمک</span>
          </div>

        </div>

        <!-- Right: Selected Node Details & Concept Creator (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          
          <!-- Selected Node Details Card -->
          @if (activeNode(); as node) {
            <div class="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 animate-fade-in">
              <div class="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <span class="text-[10px] font-bold text-amber-900 uppercase tracking-wider font-mono bg-amber-100 px-2 py-0.5 rounded">
                  {{ node.category }}
                </span>
                <button (click)="activeNode.set(null)" class="text-stone-400 hover:text-stone-700 cursor-pointer">
                  <mat-icon class="!text-sm">close</mat-icon>
                </button>
              </div>

              <div>
                <h4 class="text-sm font-bold text-amber-950 font-serif">{{ node.kurdishTranslation }}</h4>
                <p class="text-[11px] text-amber-800 font-mono mt-0.5">({{ node.name }})</p>
              </div>

              <div class="p-2.5 bg-white rounded-lg border border-amber-200/80 text-xs text-stone-800 leading-relaxed font-serif">
                <strong class="text-[10px] text-stone-500 block mb-1">پێناسەی چەمک:</strong>
                {{ node.definition }}
              </div>
            </div>
          } @else {
            <div class="p-6 text-center text-stone-400 bg-stone-50 border border-dashed border-stone-250 rounded-xl space-y-1">
              <mat-icon class="!text-3xl !w-8 !h-8 text-stone-300 mx-auto">touch_app</mat-icon>
              <p class="text-xs font-serif text-stone-600">کرتە لەسەر هەر چەمکێک بکە بۆ شیکاری و زانیاری زیاتر.</p>
            </div>
          }

          <!-- New Concept Creator Form -->
          <div class="p-4 bg-white border border-stone-200 rounded-xl space-y-3 shadow-2xs">
            <div class="flex items-center gap-1.5 border-b border-stone-150 pb-2 text-stone-900">
              <mat-icon class="!text-sm text-stone-700">add_circle</mat-icon>
              <span class="text-xs font-bold font-serif">زیادکردنی چەمکی نوێ بۆ نەخشەی توێژینەوە:</span>
            </div>

            <div class="space-y-2 text-xs">
              <div>
                <label class="block text-[10.5px] font-bold text-stone-700 mb-0.5">ناوی چەمک بە کوردی:</label>
                <input
                  type="text"
                  [(ngModel)]="newKurdishName"
                  placeholder="بۆ نموونە: دیالێکتیکی فیکری"
                  class="w-full p-2 border border-stone-300 rounded focus:border-stone-800 focus:outline-none" />
              </div>

              <div>
                <label class="block text-[10.5px] font-bold text-stone-700 mb-0.5">پۆلێن (Category):</label>
                <select
                  [(ngModel)]="newCategory"
                  class="w-full p-2 border border-stone-300 rounded focus:border-stone-800 focus:outline-none font-sans font-bold bg-white cursor-pointer">
                  <option value="methodology">میتۆدۆلۆژی (Methodology)</option>
                  <option value="hypothesis">فەرزنامە (Hypothesis)</option>
                  <option value="evidence">بەڵگەی مەیدانی (Evidence)</option>
                  <option value="gap">کەلێنی توێژینەوە (Literature Gap)</option>
                  <option value="theory">چوارچێوەی تیۆری (Theory)</option>
                  <option value="finding">دەرئەنجام (Finding)</option>
                </select>
              </div>

              <div>
                <label class="block text-[10.5px] font-bold text-stone-700 mb-0.5">پێناسەی کورت:</label>
                <input
                  type="text"
                  [(ngModel)]="newDefinition"
                  placeholder="پێناسەیەکی ئەکادیمی بۆ ئەم چەمکە..."
                  class="w-full p-2 border border-stone-300 rounded focus:border-stone-800 focus:outline-none" />
              </div>

              <button
                type="button"
                (click)="addCustomConcept()"
                [disabled]="!newKurdishName.trim()"
                class="w-full py-2 bg-stone-900 hover:bg-black disabled:bg-stone-200 text-white font-bold rounded-lg transition cursor-pointer text-xs flex items-center justify-center gap-1 shadow-xs">
                <mat-icon class="!text-xs">add</mat-icon>
                <span>زیادکردن بۆ نەخشەی D3</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
})
export class ConceptGraphComponent implements AfterViewInit {
  @ViewChild('graphContainer') graphContainer!: ElementRef<HTMLDivElement>;

  exportTrigger = output<void>();

  nodes = input<ConceptNodeModel[]>([]);
  links = input<ConceptLinkModel[]>([]);

  activeNode = signal<ConceptNodeModel | null>(null);
  selectedCategory = signal<string>('all');

  // Form fields
  newKurdishName = '';
  newCategory: 'methodology' | 'hypothesis' | 'evidence' | 'gap' | 'theory' | 'finding' = 'methodology';
  newDefinition = '';

  private academicStore = inject(AcademicStoreService);
  private editorService = inject(EditorService);

  localNodes = signal<ConceptNodeModel[]>([]);
  localLinks = signal<ConceptLinkModel[]>([]);
  filteredNodes = signal<ConceptNodeModel[]>([]);

  constructor() {
    effect(() => {
      const chs = this.editorService.chapters();
      const cards = this.academicStore.researchCorpusCards();
      const matrix = this.academicStore.verticalAlignmentMatrix();
      const glossaryTerms: any[] = [];

      if (chs.length > 0) {
        const dynamicNodes: ConceptNodeModel[] = [];
        const dynamicLinks: ConceptLinkModel[] = [];

        chs.forEach((ch, idx) => {
          const cat = idx === 0 ? 'methodology' : (idx === chs.length - 1 ? 'finding' : 'theory');
          dynamicNodes.push({
            id: `ch_${ch.id}`,
            name: ch.title || `بەشی ${idx + 1}`,
            kurdishTranslation: ch.title || `بەشی ${idx + 1}`,
            category: cat,
            definition: ch.academicNotes || `بەشی ${idx + 1} بە قەبارەی ${ch.wordCount || 0} وشە.`,
            importance: 'high'
          });
          if (idx > 0) {
            dynamicLinks.push({
              source: `ch_${chs[idx - 1].id}`,
              target: `ch_${ch.id}`,
              relation: 'پەیوەندیی زنجیرەیی',
              relationKurdish: 'پەیوەندیی زنجیرەیی'
            });
          }
        });

        cards.forEach((c) => {
          const cardId = `card_${c.id}`;
          dynamicNodes.push({
            id: cardId,
            name: `${c.sourceTitle} (${c.author})`,
            kurdishTranslation: c.sourceTitle,
            category: 'evidence',
            definition: c.excerptText.slice(0, 100) + '...',
            importance: 'medium'
          });
          const targetChId = c.targetChapterId ? `ch_${c.targetChapterId}` : `ch_${chs[0].id}`;
          dynamicLinks.push({
            source: targetChId,
            target: cardId,
            relation: 'بەڵگەی کۆرپەس',
            relationKurdish: 'بەڵگەی کۆرپەس'
          });
        });

        glossaryTerms.forEach((term: any) => {
          const id = `glossary_${term.id || term.foreign || term.translation}`;
          dynamicNodes.push({ id, name: term.translation || term.kurdishTerm || term.foreign, kurdishTranslation: term.translation || term.kurdishTerm || term.foreign, category: 'theory', definition: term.definition || '', importance: 'medium' });
          const related = chs.find(ch => (ch.content || '').toLowerCase().includes(String(term.foreign || term.translation || '').toLowerCase()));
          if (related) dynamicLinks.push({ source: `ch_${related.id}`, target: id, relation: 'glossary_term', relationKurdish: 'زاراوەی بەکارهاتوو لەم بەشەدا' });
        });

        matrix.forEach((m) => {
          const qId = `q_${m.id}`;
          dynamicNodes.push({
            id: qId,
            name: `پرسیاری ${m.questionNumber}`,
            kurdishTranslation: m.questionText.slice(0, 30),
            category: 'hypothesis',
            definition: m.questionText,
            importance: 'high'
          });
          const targetChId = m.targetChapterId ? `ch_${m.targetChapterId}` : `ch_${chs[0].id}`;
          dynamicLinks.push({
            source: qId,
            target: targetChId,
            relation: 'هاوتابوونی ستوونی',
            relationKurdish: 'هاوتابوونی ستوونی'
          });
        });

        this.localNodes.set(dynamicNodes);
        this.localLinks.set(dynamicLinks);
      } else {
        this.localNodes.set([]);
        this.localLinks.set([]);
      }
    });

    effect(() => {
      const cat = this.selectedCategory();
      const all = this.localNodes();
      if (cat === 'all') {
        this.filteredNodes.set(all);
      } else {
        this.filteredNodes.set(all.filter((n) => n.category === cat));
      }
      this.reRenderGraph();
    });
  }

  ngAfterViewInit(): void {
    this.reRenderGraph();
  }

  resetGraphView(): void {
    this.localNodes.set([...D3ConceptGraphHelper.DEFAULT_NODES]);
    this.localLinks.set([...D3ConceptGraphHelper.DEFAULT_LINKS]);
    this.selectedCategory.set('all');
    this.activeNode.set(null);
    this.reRenderGraph();
  }

  addCustomConcept(): void {
    if (!this.newKurdishName.trim()) return;

    const id = `concept_${Date.now()}`;
    const newNode: ConceptNodeModel = {
      id,
      name: this.newKurdishName.trim(),
      kurdishTranslation: this.newKurdishName.trim(),
      category: this.newCategory,
      definition: this.newDefinition.trim() || 'چەمکی تایبەت کە لە لایەن توێژەرەوە بۆ نەخشەی تێز زیادکراوە.',
      importance: 'high'
    };

    const currentNodes = [...this.localNodes(), newNode];
    const newLink: ConceptLinkModel = {
      source: 'methodology',
      target: id,
      relation: 'connects_to',
      relationKurdish: 'پەیوەستە بە'
    };
    const currentLinks = [...this.localLinks(), newLink];

    this.localNodes.set(currentNodes);
    this.localLinks.set(currentLinks);

    this.newKurdishName = '';
    this.newDefinition = '';
    this.activeNode.set(newNode);
    this.reRenderGraph();
  }

  private reRenderGraph(): void {
    if (!this.graphContainer || !this.graphContainer.nativeElement) return;

    this.graphContainer.nativeElement.id = 'd3-concept-graph-canvas';
    const nodesToRender = this.filteredNodes();
    const linksToRender = this.localLinks().filter(
      (l) =>
        nodesToRender.some((n) => n.id === l.source || n.name === l.source) &&
        nodesToRender.some((n) => n.id === l.target || n.name === l.target)
    );

    D3ConceptGraphHelper.renderForceGraph(
      {
        width: 650,
        height: 380,
        containerSelector: '#d3-concept-graph-canvas',
        onNodeClick: (node) => this.activeNode.set(node)
      },
      nodesToRender.length > 0 ? nodesToRender : this.localNodes(),
      linksToRender.length > 0 ? linksToRender : this.localLinks()
    );
  }
}
