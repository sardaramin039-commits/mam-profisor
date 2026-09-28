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

  // Compute thesis nodes dynamically based on inputs or robust defaults
  allNodes = computed<CitationNode[]>(() => {
    const nodes: CitationNode[] = [];
    const chaptersList = this.chapters();
    const sourcesList = this.sources();

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
    } else {
      nodes.push(
        { id: 'ch_1', label: 'بەشی ١: پێشەکی و کێشەی توێژینەوە', type: 'chapter', subLabel: 'بەشی ١', details: 'چوارچێوەی گشتی و ئامانجەکانی توێژینەوە.' },
        { id: 'ch_2', label: 'بەشی ٢: پیاچوونەوەی ئەدەبیات', type: 'chapter', subLabel: 'بەشی ٢', details: 'پیاچوونەوە لە توێژینەوە و تیۆرییە پێشووەکان.' },
        { id: 'ch_3', label: 'بەشی ٣: میتۆدۆلۆژیا', type: 'chapter', subLabel: 'بەشی ٣', details: 'شێواز و ئامرازەکانی کۆکردنەوەی داتا.' },
        { id: 'ch_4', label: 'بەشی ٤: شیکاری و دۆزینەوەکان', type: 'chapter', subLabel: 'بەشی ٤', details: 'خستنەڕووی داتاکان و دەرئەنجامە زانستییەکان.' }
      );
    }

    // 2. Academic Theme Nodes
    const defaultThemes: CitationNode[] = [
      { id: 'th_methodology', label: 'تەماتەی میتۆدۆلۆژیا', type: 'theme', subLabel: 'Methodology Theme', details: 'ڕێبازەکانی کێشانە و شیکاریی چەندایەتی و چۆنایەتی.' },
      { id: 'th_epistemology', label: 'تەماتەی چوارچێوەی تیۆری', type: 'theme', subLabel: 'Theoretical Framework', details: 'چەمک و تیۆرییە فەلسەفی و زانستییە سەرەکییەکان.' },
      { id: 'th_evidence', label: 'تەماتەی بەڵگەی مەیدانی', type: 'theme', subLabel: 'Empirical Data', details: 'داتا و زانیارییە کۆکراوەکانی ناو مەیدانی توێژینەوە.' },
      { id: 'th_history', label: 'تەماتەی مێژوویی و زمانی', type: 'theme', subLabel: 'Historical & Linguistic', details: 'گوتار و دەقە مێژوویی و زمانەوانییە کوردییەکان.' }
    ];
    nodes.push(...defaultThemes);

    // 3. Source Nodes
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
    } else {
      nodes.push(
        { id: 'src_1', label: 'ئەمین (2025)', type: 'source', subLabel: 'گوتاری ئەکادیمیی کوردی', details: 'میتۆدۆلۆژیی گەشەسەندنی سۆرانیک لە توێژینەوە زانستییەکاندا.', author: 'ئەمین', year: 2025, publisher: 'گۆڤاری زانستی' },
        { id: 'src_2', label: 'Smith & Johnson (2024)', type: 'source', subLabel: 'Qualitative Research Methods', details: 'کۆکراوەی میتۆدۆلۆژیای چۆنایەتی لە زانستە مرۆڤایەتییەکاندا.', author: 'Smith & Johnson', year: 2024, publisher: 'Oxford University Press' },
        { id: 'src_3', label: 'کەریم (2023)', type: 'source', subLabel: 'شیکاریی دەقی مێژوویی', details: 'تایبەتمەندییە زمانەوانییەکانی سۆرانی لە سەدەی بیستەمدا.', author: 'کەریم', year: 2023, publisher: 'چاپخانەی زانکۆ' },
        { id: 'src_4', label: 'Derrida (2022)', type: 'source', subLabel: 'Deconstruction and Discourse', details: 'تیۆریی پێکهاتەشکێنی لە شیکاریی دەقە ئەدەبییەکاندا.', author: 'Derrida', year: 2022, publisher: 'Academic Press' }
      );
    }

    return nodes;
  });

  allLinks = computed<CitationLink[]>(() => {
    const links: CitationLink[] = [];
    const nodes = this.allNodes();

    const chapterIds = nodes.filter((n) => n.type === 'chapter').map((n) => n.id);
    const themeIds = nodes.filter((n) => n.type === 'theme').map((n) => n.id);
    const sourceIds = nodes.filter((n) => n.type === 'source').map((n) => n.id);

    // Link Sources to Themes
    sourceIds.forEach((srcId, idx) => {
      const targetTheme = themeIds[idx % themeIds.length];
      if (targetTheme) {
        links.push({
          source: srcId,
          target: targetTheme,
          relation: 'cites_theme',
          relationKurdish: 'دەچێتەوە سەر تەماتەی'
        });
      }
    });

    // Link Sources to Chapters
    sourceIds.forEach((srcId, idx) => {
      const targetCh = chapterIds[idx % chapterIds.length];
      if (targetCh) {
        links.push({
          source: srcId,
          target: targetCh,
          relation: 'used_in_chapter',
          relationKurdish: 'بەکار هاتووە لە'
        });
      }
    });

    // Link Themes to Chapters
    themeIds.forEach((thId, idx) => {
      const targetCh = chapterIds[(idx + 1) % chapterIds.length];
      if (targetCh) {
        links.push({
          source: thId,
          target: targetCh,
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
