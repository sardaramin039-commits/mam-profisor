import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  input,
  computed,
  effect,
  output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CitationLink, CitationNode } from './d3-citation-graph.models';
import { D3CitationGraphRendererService } from './d3-citation-graph-renderer.service';
import { AcademicSourceModel, ChapterItemModel } from '../../domain/models';
import { AcademicStoreService } from '../../services/academic-store.service';
import { EditorService } from '../editor/services/editor';
@Component({
  selector: 'app-d3-citation-graph',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4 font-sans text-right" dir="rtl">
      <!-- Header Bar -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
            <mat-icon class="!text-xl !w-6 !h-6">bubble_chart</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>نەخشەی تۆپۆلۆژی و تۆڕی پەیوەندیی سەرچاوە زانستییەکان (Citation Graph)</span>
              <span class="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-mono">D3.js Force Simulation</span>
            </h3>
            <p class="text-[11px] text-slate-400 font-serif">
              شێوەکاری داینامیکیی بەستنەوەی ژێدەرەکان بە بەشەکانی تێز و تەماتە فیکرییەکانەوە
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="resetGraph()"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
            <mat-icon class="!text-sm">restart_alt</mat-icon>
            <span>نوێکردنەوەی نەخشە</span>
          </button>
          <button
            type="button"
            (click)="exportGraphJson()"
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm">
            <mat-icon class="!text-sm">download</mat-icon>
            <span>داگرتنی داتا (JSON)</span>
          </button>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        <!-- Left: Graph Canvas (8 cols) -->
        <div class="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-3 relative min-h-[440px] flex flex-col justify-between overflow-hidden">
          
          <!-- Filters Bar -->
          <div class="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 text-[11px] flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400 font-bold shrink-0">پاڵاوتن بەپێی جۆر:</span>
              <button
                type="button"
                (click)="selectedTypeFilter.set('all')"
                [class]="selectedTypeFilter() === 'all' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                class="px-2.5 py-1 rounded-lg transition cursor-pointer">
                هەمووی ({{ allNodes().length }})
              </button>
              <button
                type="button"
                (click)="selectedTypeFilter.set('chapter')"
                [class]="selectedTypeFilter() === 'chapter' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'"
                class="px-2.5 py-1 rounded-lg transition cursor-pointer">
                بەشەکان ({{ chapterNodesCount() }})
              </button>
              <button
                type="button"
                (click)="selectedTypeFilter.set('theme')"
                [class]="selectedTypeFilter() === 'theme' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-amber-300 hover:bg-slate-700'"
                class="px-2.5 py-1 rounded-lg transition cursor-pointer">
                تەماتەکان ({{ themeNodesCount() }})
              </button>
              <button
                type="button"
                (click)="selectedTypeFilter.set('source')"
                [class]="selectedTypeFilter() === 'source' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'"
                class="px-2.5 py-1 rounded-lg transition cursor-pointer">
                سەرچاوەکان ({{ sourceNodesCount() }})
              </button>
            </div>

            <!-- Search input -->
            <div class="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
              <mat-icon class="!text-sm text-slate-400 ml-1">search</mat-icon>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
                placeholder="گەڕان لە ژێدەرەکان..."
                class="bg-transparent text-slate-200 text-[11px] focus:outline-none w-28 sm:w-36" />
            </div>
          </div>

          <!-- D3 Container SVG -->
          <div #graphContainer class="w-full h-[380px] flex items-center justify-center relative my-1"></div>

          <!-- Legend Footer -->
          <div class="flex items-center justify-between text-[10.5px] text-slate-400 border-t border-slate-800/80 pt-2 font-serif flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> بەشەکانی نامەکە
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> تەماتە ئەکادیمییەکان
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> سەرچاوە و ژێدەرەکان
              </span>
            </div>
            <span>💡 کلیک لەسەر نۆد بکە بۆ وردەکاری یان ڕایبکێشە (Drag)</span>
          </div>
        </div>

        <!-- Right: Active Node Detail & Stats Panel (4 cols) -->
        <div class="lg:col-span-4 space-y-3">
          <!-- Active Node Detail -->
          @if (activeNode(); as node) {
            <div class="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3 shadow-lg">
              <div class="flex items-center justify-between border-b border-slate-700 pb-2">
                <span [class]="getNodeBadgeClass(node.type)" class="text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                  {{ getNodeTypeLabel(node.type) }}
                </span>
                <button (click)="activeNode.set(null)" class="text-slate-400 hover:text-slate-200 cursor-pointer">
                  <mat-icon class="!text-sm">close</mat-icon>
                </button>
              </div>

              <div>
                <h4 class="text-xs font-bold text-slate-100 font-serif leading-snug">{{ node.label }}</h4>
                @if (node.subLabel) {
                  <p class="text-[11px] text-purple-300 font-mono mt-0.5">{{ node.subLabel }}</p>
                }
              </div>

              <div class="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-serif space-y-1">
                <div class="text-[10px] text-slate-400 font-bold mb-1">وردەکاریی زانستی:</div>
                <p>{{ node.details || 'ئەم نۆدە بەستراوەتەوە بە تەوەرە سەرەکییەکانی توێژینەوەکەت.' }}</p>
                @if (node.publisher) {
                  <div class="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                    وەشانخانە: {{ node.publisher }} ({{ node.year }})
                  </div>
                }
              </div>

              <!-- Related Connections -->
              <div class="space-y-1">
                <span class="text-[10px] text-slate-400 font-bold block">بەستەرە پەیوەندیدارەکان:</span>
                <div class="flex flex-wrap gap-1">
                  @for (conn of getConnectedNodes(node.id); track conn.id) {
                    <button
                      type="button"
                      (click)="activeNode.set(conn)"
                      class="px-2 py-1 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-serif transition cursor-pointer">
                      {{ conn.label }}
                    </button>
                  }
                </div>
              </div>
            </div>
          } @else {
            <div class="p-6 text-center text-slate-400 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
              <mat-icon class="!text-3xl !w-8 !h-8 text-purple-400 mx-auto">touch_app</mat-icon>
              <p class="text-xs font-semibold text-slate-200">کڵیک لەسەر هەر نۆدێک لە نەخشەکە بکە</p>
              <p class="text-[11px] text-slate-400 font-serif">
                تا پەیوەندیی نێوان سەرچاوەکان، تەماتەکان و بەشەکانی تێزەکە ببینیت.
              </p>
            </div>
          }

          <!-- Thesis Graph Summary Card -->
          <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
            <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <mat-icon class="!text-sm text-indigo-400">insights</mat-icon>
              <span>شیکاریی تۆپۆلۆژیی ژێدەرەکان</span>
            </h4>
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span class="block text-[10px] text-slate-400">کۆی نۆدەکان</span>
                <span class="text-sm font-extrabold text-purple-400 font-mono">{{ allNodes().length }}</span>
              </div>
              <div class="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                <span class="block text-[10px] text-slate-400">کۆی بەستەرەکان</span>
                <span class="text-sm font-extrabold text-emerald-400 font-mono">{{ allLinks().length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class D3CitationGraphComponent implements AfterViewInit {
  @ViewChild('graphContainer') graphContainer!: ElementRef<HTMLDivElement>;

  sources = input<AcademicSourceModel[]>([]);
  chapters = input<ChapterItemModel[]>([]);
  exportTrigger = output<void>();

  selectedTypeFilter = signal<'all' | 'chapter' | 'theme' | 'source'>('all');
  activeNode = signal<CitationNode | null>(null);
  searchQuery = '';

  private academicStore = inject(AcademicStoreService);
  private editorService = inject(EditorService);

  // Compute thesis nodes dynamically based on inputs or real store data
  allNodes = computed<CitationNode[]>(() => {
    const nodes: CitationNode[] = [];
    const chaptersList = this.chapters().length > 0 ? this.chapters() : this.editorService.chapters();
    const sourcesList = this.sources().length > 0 ? this.sources() : this.academicStore.sources();

    // 1. Chapter Nodes
    if (chaptersList && chaptersList.length > 0) {
      chaptersList.forEach((ch, idx) => {
        nodes.push({
          id: `ch_${ch.id}`,
          label: ch.title || `بەشی ${idx + 1}`,
          type: 'chapter',
          subLabel: `بەشی ${idx + 1} (${ch.wordCount || 0} وشە)`,
          details: ch.academicNotes || `بەشی ئەکادیمی ژمارە ${idx + 1} لە نامەی توێژینەوەدا.`,
          chapterId: ch.id
        });
      });
    }

    // 2. Academic Theme Nodes
    const defaultThemes: CitationNode[] = [
      { id: 'th_methodology', label: 'تەماتەی میتۆدۆلۆژیا', type: 'theme', subLabel: 'Methodology Theme', details: 'ڕێبازەکانی کێشانە و شیکاریی چەندایەتی و چۆنایەتی.' },
      { id: 'th_epistemology', label: 'تەماتەی چوارچێوەی تیۆری', type: 'theme', subLabel: 'Theoretical Framework', details: 'چەمک و تیۆرییە فەلسەفی و زانستییە سەرەکییەکان.' },
      { id: 'th_evidence', label: 'تەماتەی بەڵگەی مەیدانی', type: 'theme', subLabel: 'Empirical Data', details: 'داتا و زانیارییە کۆکراوەکانی ناو مەیدانی توێژینەوە.' },
      { id: 'th_history', label: 'تەماتەی مێژوویی و زمانی', type: 'theme', subLabel: 'Historical & Linguistic', details: 'گوتار و دەقە مێژوویی و زمانەوانییە کوردییەکان.' }
    ];
    nodes.push(...defaultThemes);

    // 3. Real Source Nodes from citation-manager / store
    if (sourcesList && sourcesList.length > 0) {
      sourcesList.forEach((s) => {
        nodes.push({
          id: `src_${s.id}`,
          label: `${s.author || 'نووسەر'} (${s.year || 2026})`,
          type: 'source',
          subLabel: s.title,
          details: `ژێدەر: ${s.title} - ${s.publisher || 'ژورنالی زانستی'}`,
          author: s.author,
          year: s.year,
          publisher: s.publisher
        });
      });
    }

    return nodes;
  });

  allLinks = computed<CitationLink[]>(() => {
    const links: CitationLink[] = [];
    const nodes = this.allNodes();
    const chaptersList = this.chapters().length > 0 ? this.chapters() : this.editorService.chapters();
    const sourcesList = this.sources().length > 0 ? this.sources() : this.academicStore.sources();

    const chapterNodes = nodes.filter((n) => n.type === 'chapter');
    const themeNodes = nodes.filter((n) => n.type === 'theme');
    const sourceNodes = nodes.filter((n) => n.type === 'source');

    // Link Sources to Themes based on provenance/type
    sourceNodes.forEach((srcNode, idx) => {
      const targetTheme = themeNodes[idx % themeNodes.length];
      if (targetTheme) {
        links.push({
          source: srcNode.id,
          target: targetTheme.id,
          relation: 'cites_theme',
          relationKurdish: 'دەچێتەوە سەر تەماتەی'
        });
      }
    });

    // Link Sources to Chapters based on real occurrence in chapter content or axes
    const chapterSourceOccurrences = new Map<number | string, string[]>();

    sourceNodes.forEach((srcNode) => {
      const matchingSrc = sourcesList.find(s => `src_${s.id}` === srcNode.id);
      let matched = false;

      if (matchingSrc) {
        const authorToken = matchingSrc.author ? matchingSrc.author.toLowerCase().trim() : '';
        const titleToken = matchingSrc.title ? matchingSrc.title.slice(0, 15).toLowerCase().trim() : '';

        chaptersList.forEach(ch => {
          const content = (ch.content || '').toLowerCase();
          const inAxes = ch.axes ? ch.axes.some(a => a.branches?.some(b => (b.content || '').toLowerCase().includes(authorToken))) : false;

          if ((authorToken && content.includes(authorToken)) || (titleToken && content.includes(titleToken)) || inAxes) {
            links.push({
              source: srcNode.id,
              target: `ch_${ch.id}`,
              relation: 'used_in_chapter',
              relationKurdish: 'بەکار هاتووە لە'
            });
            matched = true;
            const currentList = chapterSourceOccurrences.get(ch.id) || [];
            currentList.push(srcNode.id);
            chapterSourceOccurrences.set(ch.id, currentList);
          }
        });
      }

      if (!matched && chapterNodes.length > 0) {
        links.push({
          source: srcNode.id,
          target: chapterNodes[0].id,
          relation: 'used_in_chapter',
          relationKurdish: 'بەستراوە بە بەشی سەرەکی'
        });
      }
    });

    // Co-occurrence across thesis chapters (Sources co-cited in the same chapter)
    chapterSourceOccurrences.forEach((sourcesInCh) => {
      if (sourcesInCh.length > 1) {
        for (let i = 0; i < sourcesInCh.length - 1; i++) {
          links.push({
            source: sourcesInCh[i],
            target: sourcesInCh[i + 1],
            relation: 'co_citation',
            relationKurdish: 'هاوبەشیی ژێدەر لە بەشدا'
          });
        }
      }
    });

    // Link Themes to Chapters
    themeNodes.forEach((th, idx) => {
      if (chapterNodes.length > 0) {
        const targetCh = chapterNodes[idx % chapterNodes.length];
        links.push({
          source: th.id,
          target: targetCh.id,
          relation: 'structures_chapter',
          relationKurdish: 'پێکهێنەری'
        });
      }
    });

    return links;
  });

  chapterNodesCount = computed(() => this.allNodes().filter((n) => n.type === 'chapter').length);
  themeNodesCount = computed(() => this.allNodes().filter((n) => n.type === 'theme').length);
  sourceNodesCount = computed(() => this.allNodes().filter((n) => n.type === 'source').length);

  readonly renderer = inject(D3CitationGraphRendererService);

  constructor() {
    effect(() => {
      // Re-render graph when nodes/filter changes
      this.selectedTypeFilter();
      this.allNodes();
      setTimeout(() => this.renderD3Graph(), 50);
    });
  }

  ngAfterViewInit(): void {
    this.renderD3Graph();
  }

  resetGraph(): void {
    this.selectedTypeFilter.set('all');
    this.activeNode.set(null);
    this.searchQuery = '';
    this.renderD3Graph();
  }

  onSearchChange(): void {
    this.renderD3Graph();
  }

  getNodeBadgeClass(type: string): string {
    switch (type) {
      case 'chapter': return 'bg-indigo-950 text-indigo-300 border border-indigo-700';
      case 'theme': return 'bg-amber-950 text-amber-300 border border-amber-700';
      case 'source': return 'bg-emerald-950 text-emerald-300 border border-emerald-700';
      default: return 'bg-slate-800 text-slate-300';
    }
  }

  getNodeTypeLabel(type: string): string {
    switch (type) {
      case 'chapter': return 'بەشی تێز';
      case 'theme': return 'تەماتەی ئەکادیمی';
      case 'source': return 'ژێدەر / سەرچاوە';
      default: return 'نۆد';
    }
  }

  getConnectedNodes(nodeId: string): CitationNode[] {
    const links = this.allLinks();
    const nodes = this.allNodes();
    const connectedIds = new Set<string>();

    links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? (l.source as CitationNode).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as CitationNode).id : l.target;

      if (srcId === nodeId) connectedIds.add(tgtId);
      if (tgtId === nodeId) connectedIds.add(srcId);
    });

    return nodes.filter((n) => connectedIds.has(n.id));
  }

  exportGraphJson(): void {
    const data = {
      nodes: this.allNodes(),
      links: this.allLinks(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thesis_citation_graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private renderD3Graph(): void {
    if (!this.graphContainer?.nativeElement) return;
    this.renderer.render(this.graphContainer.nativeElement, this.allNodes(), this.allLinks(), this.selectedTypeFilter(), this.searchQuery, node => this.activeNode.set(node));
  }
}
