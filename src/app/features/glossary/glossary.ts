import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, afterNextRender, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';
import { GlossaryService } from '../../services/glossary';
import { ACADEMIC_GLOSSARY } from '../../../prompts/academic-glossary';
import { GlossaryEntry } from '../../domain/models';
import { TerminologyParserPanelComponent } from '../editor/components/terminology-parser-panel.component';

interface D3ConceptNode extends d3.SimulationNodeDatum {
  id: string;
  foreign: string;
  translation: string;
  category: string;
  sourceLang?: string;
  definition: string;
  radius: number;
}

interface D3ConceptLink extends d3.SimulationLinkDatum<D3ConceptNode> {
  source: string | D3ConceptNode;
  target: string | D3ConceptNode;
  relationKurdish: string;
}

@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TerminologyParserPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl font-sans text-right" dir="rtl">
      <!-- Header & View Switcher -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <mat-icon class="!text-xl leading-none">account_tree</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100 font-serif">فەرهەنگی زاراوە ئەکادیمییەکان، نەخشەی چەمکسازی و شیکارکەر</h3>
            <p class="text-xs text-slate-400 font-serif">پەیوەندی، تۆڕی زانستی و پشکنینی داینامیکیی بەشەکانی تێزەکە</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            type="button"
            (click)="activeView.set('parser')"
            [class]="activeView() === 'parser' ? 'bg-amber-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg text-xs font-serif flex items-center gap-1.5 transition cursor-pointer">
            <mat-icon class="!text-sm">spellcheck</mat-icon>
            <span>شیکارکەری دەقی بەشەکە (Terminology Parser)</span>
          </button>
          <button
            type="button"
            (click)="activeView.set('map')"
            [class]="activeView() === 'map' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg text-xs font-serif flex items-center gap-1.5 transition cursor-pointer">
            <mat-icon class="!text-sm">hub</mat-icon>
            <span>نەخشەی چەمکەکان (D3 Map)</span>
          </button>
          <button
            type="button"
            (click)="activeView.set('list')"
            [class]="activeView() === 'list' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg text-xs font-serif flex items-center gap-1.5 transition cursor-pointer">
            <mat-icon class="!text-sm">list</mat-icon>
            <span>لیستی زاراوەکان</span>
          </button>
        </div>
      </div>

      <!-- Search & Category Filters -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div class="relative flex-1 min-w-[200px]">
          <mat-icon class="absolute right-3 top-2.5 text-slate-500 !text-base">search</mat-icon>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)"
            placeholder="گەڕان لە زاراوە ئەکادیمی و چەمکەکاندا..."
            class="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-serif"
          />
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            (click)="selectedCategory.set('all')"
            [class]="selectedCategory() === 'all' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'"
            class="px-2.5 py-1.5 rounded-lg text-[11px] font-serif border border-slate-800 cursor-pointer shrink-0">
            هەموو پۆلەکان ({{ allEntries.length }})
          </button>
          @for (cat of categories(); track cat) {
            <button
              type="button"
              (click)="selectedCategory.set(cat)"
              [class]="selectedCategory() === cat ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'"
              class="px-2.5 py-1.5 rounded-lg text-[11px] font-serif border border-slate-800 cursor-pointer shrink-0">
              {{ cat }}
            </button>
          }
        </div>
      </div>

      <!-- View Mode 1: D3 Concept Map -->
      @if (activeView() === 'map') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[380px]">
          <!-- Interactive D3 Canvas -->
          <div class="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-center items-center min-h-[360px]">
            <div #conceptMapContainer class="w-full h-full min-h-[360px] flex items-center justify-center"></div>

            <div class="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs border border-slate-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-2">
              <span class="flex items-center gap-1">
                <mat-icon class="!text-xs text-purple-400">touch_app</mat-icon>
                کلیک بکە بۆ زانیاری و پەیوەندییەکان | ڕاکێشان و زووم کارایە
              </span>
              <div class="flex items-center gap-2.5">
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span> تیۆری</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-cyan-500"></span> شیکاری</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ئەزموونی</span>
              </div>
            </div>
          </div>

          <!-- Active Node Inspector Panel -->
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            @if (activeConcept(); as node) {
              <div class="space-y-3">
                <div class="flex items-start justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [class]="getCategoryBadgeClass(node.category)">
                      {{ node.category }}
                    </span>
                    <h4 class="text-sm font-bold text-slate-100 font-serif mt-1">{{ node.translation }}</h4>
                    <p class="text-xs text-purple-400 font-mono">{{ node.foreign }}</p>
                  </div>
                  @if (node.sourceLang) {
                    <span class="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {{ node.sourceLang }}
                    </span>
                  }
                </div>

                <div>
                  <span class="text-[11px] font-bold text-slate-300 font-serif block mb-1">پێناسەی زانستی:</span>
                  <p class="text-xs text-slate-300 leading-relaxed font-serif bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    {{ node.definition }}
                  </p>
                </div>

                <div>
                  <span class="text-[11px] font-bold text-slate-300 font-serif block mb-1">چەمکە بەستراوەکان:</span>
                  <div class="flex flex-wrap gap-1.5">
                    @for (rel of getConnectedNodes(node.id); track rel.id) {
                      <button
                        type="button"
                        (click)="selectConceptById(rel.id)"
                        class="px-2 py-0.5 bg-slate-900 hover:bg-purple-950/60 hover:border-purple-500/50 text-slate-300 hover:text-purple-200 border border-slate-800 rounded text-[10.5px] transition cursor-pointer flex items-center gap-1 font-serif">
                        <mat-icon class="!text-[10px] !w-3 !h-3 text-purple-400">link</mat-icon>
                        <span>{{ rel.translation.split('/')[0].trim() }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-2">
                <mat-icon class="text-3xl text-purple-500/50">hub</mat-icon>
                <p class="text-xs font-serif text-slate-400">کلیک لەسەر چەمکێک بکە لەسەر نەخشەکە بۆ شیکاری.</p>
              </div>
            }

            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>کۆی گشتی: {{ allEntries.length }} چەمک</span>
              <button
                type="button"
                (click)="resetMap()"
                class="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer">
                <mat-icon class="!text-xs">refresh</mat-icon>
                <span>ڕێکخستنەوە</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- View Mode 2: Glossary Cards List -->
      @if (activeView() === 'list') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
          @for (item of filteredListEntries(); track item.foreign) {
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/90 text-xs space-y-1.5 hover:border-purple-500/30 transition">
              <div class="flex items-center justify-between">
                <span class="font-bold text-purple-400 font-mono">{{ item.foreign }}</span>
                <span class="text-[10.5px] px-2 py-0.5 rounded-full" [class]="getCategoryBadgeClass(item.category)">
                  {{ item.category }}
                </span>
              </div>
              <p class="font-bold text-slate-200 font-serif">{{ item.translation }}</p>
              <p class="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{{ item.definition }}</p>
            </div>
          }
        </div>
      }
      <!-- View Mode 3: Terminology Parser Panel -->
      @if (activeView() === 'parser') {
        <app-terminology-parser-panel></app-terminology-parser-panel>
      }
    </div>
  `
})
export class GlossaryComponent {
  private glossaryService = inject(GlossaryService);
  conceptMapContainer = viewChild<ElementRef<HTMLDivElement>>('conceptMapContainer');

  activeView = signal<'map' | 'list' | 'parser'>('map');
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  activeConcept = signal<D3ConceptNode | null>(null);

  allEntries: GlossaryEntry[] = ACADEMIC_GLOSSARY;
  entries = signal<GlossaryEntry[]>(this.allEntries);

  private simulation: d3.Simulation<D3ConceptNode, D3ConceptLink> | null = null;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;

  categories = computed(() => {
    const set = new Set(this.allEntries.map(e => e.category).filter(Boolean));
    return Array.from(set);
  });

  filteredListEntries = computed(() => {
    const cat = this.selectedCategory();
    const list = this.entries();
    if (cat === 'all') return list;
    return list.filter(e => e.category === cat);
  });

  constructor() {
    afterNextRender(() => {
      this.initD3Graph();
    });

    effect(() => {
      const q = this.searchQuery().toLowerCase();
      const cat = this.selectedCategory();
      const view = this.activeView();
      if (view === 'map') {
        this.highlightNodes(q, cat);
      }
    });
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
    const filtered = this.glossaryService.filterGlossary(this.allEntries, q);
    this.entries.set(filtered);
  }

  private buildGraphData(): { nodes: D3ConceptNode[]; links: D3ConceptLink[] } {
    const nodes: D3ConceptNode[] = this.allEntries.map(e => ({
      id: e.foreign.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      foreign: e.foreign,
      translation: e.translation,
      category: e.category || 'گشتی',
      sourceLang: (e as any).sourceLang || 'ئینگلیزی',
      definition: e.definition,
      radius: e.category === 'تیۆری' ? 20 : e.category === 'شیکاری' ? 18 : 16
    }));

    const links: D3ConceptLink[] = [];
    const pairs: [string, string, string][] = [
      ['methodology', 'empirical', 'پشت دەبەستێت بە'],
      ['methodology', 'triangulation', 'بەکاردێنێت'],
      ['hypothesis', 'methodology', 'تاقی دەکرێتەوە لە ڕێگەی'],
      ['epistemology', 'ontology', 'پەیوەندی فەلسەفی'],
      ['epistemology', 'paradigm', 'چوارچێوە دابین دەکات بۆ'],
      ['ontology', 'world_of_forms', 'بنەمای واقیع دەپێوێت'],
      ['dialectic', 'hermeneutics', 'میتۆدی شیکاری'],
      ['dialectic', 'deconstruction', 'ڕەخنەگری فیکری'],
      ['inductive_reasoning', 'deductive_reasoning', 'هاوتای لۆژیکی'],
      ['inductive_reasoning', 'grounded_theory', 'بنەما بۆ'],
      ['qualitative', 'phenomenology', 'میتۆدی چۆنایەتی'],
      ['quantitative', 'meta_analysis', 'شیکاری چەندایەتی'],
      ['validity', 'reliability', 'پێوەرەکانی ڕەوایی'],
      ['conceptual_framework', 'literature_review', 'بنیات دەنرێت لە'],
      ['literature_review', 'citation', 'پشت دەبەستێت بە'],
      ['collective_memory', 'mythological_allegory', 'ڕەنگدانەوە لە'],
      ['tragic_archetype', 'tragic_epic_of_khaj___siyamand', 'نموونەی باڵا']
    ];

    for (const [s, t, rel] of pairs) {
      const matchS = nodes.find(n => n.id.includes(s));
      const matchT = nodes.find(n => n.id.includes(t));
      if (matchS && matchT && matchS.id !== matchT.id) {
        links.push({
          source: matchS.id,
          target: matchT.id,
          relationKurdish: rel
        });
      }
    }

    return { nodes, links };
  }

  private initD3Graph(): void {
    const el = this.conceptMapContainer()?.nativeElement;
    if (!el) return;

    d3.select(el).selectAll('*').remove();

    const width = el.clientWidth || 550;
    const height = Math.max(360, el.clientHeight || 360);

    const { nodes, links } = this.buildGraphData();

    const svg = d3.select(el)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .classed('select-none cursor-grab active:cursor-grabbing', true);

    this.svg = svg;
    const g = svg.append('g').attr('class', 'main-g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    if (nodes.length > 0) {
      this.activeConcept.set(nodes[0]);
    }

    const simulation = d3.forceSimulation<D3ConceptNode>(nodes)
      .force('link', d3.forceLink<D3ConceptNode, D3ConceptLink>(links).id(d => d.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(28));

    this.simulation = simulation;

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    const nodeGroup = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-circle cursor-pointer')
      .call(this.drag(simulation) as any)
      .on('click', (event, d) => {
        event.stopPropagation();
        this.activeConcept.set(d);
        this.highlightActive(d.id);
      });

    nodeGroup.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => this.getNodeColor(d.category))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-150 hover:stroke-white hover:stroke-2');

    nodeGroup.append('text')
      .text(d => d.translation.split('/')[0].trim().slice(0, 13))
      .attr('text-anchor', 'middle')
      .attr('dy', 26)
      .attr('fill', '#cbd5e1')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-sans-serif, system-ui')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }

  private highlightActive(id: string): void {
    if (!this.svg) return;
    this.svg.selectAll('.node-circle circle')
      .attr('stroke', (d: any) => d.id === id ? '#c084fc' : '#0f172a')
      .attr('stroke-width', (d: any) => d.id === id ? 3 : 2);
  }

  private highlightNodes(query: string, category: string): void {
    if (!this.svg) return;
    this.svg.selectAll('.node-circle').each(function (d: any) {
      const el = d3.select(this);
      const matchesQ = !query || 
        d.translation.toLowerCase().includes(query) || 
        d.foreign.toLowerCase().includes(query) || 
        d.definition.toLowerCase().includes(query);
      const matchesCat = category === 'all' || d.category === category;
      const isVisible = matchesQ && matchesCat;
      el.transition().duration(150).style('opacity', isVisible ? 1 : 0.15);
    });
  }

  resetMap(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.initD3Graph();
  }

  selectConceptById(id: string): void {
    const { nodes } = this.buildGraphData();
    const node = nodes.find(n => n.id === id);
    if (node) {
      this.activeConcept.set(node);
      this.highlightActive(id);
    }
  }

  getConnectedNodes(nodeId: string): D3ConceptNode[] {
    const { nodes, links } = this.buildGraphData();
    const connectedIds = new Set<string>();
    links.forEach(l => {
      const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      if (srcId === nodeId) connectedIds.add(tgtId);
      if (tgtId === nodeId) connectedIds.add(srcId);
    });
    return nodes.filter(n => connectedIds.has(n.id));
  }

  getNodeColor(category: string): string {
    switch (category) {
      case 'تیۆری': return '#9333ea';
      case 'شیکاری': return '#06b6d4';
      case 'توێژینەوەی ئەزموونی': return '#10b981';
      case 'پێکهاتە': return '#f59e0b';
      default: return '#6366f1';
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'تیۆری': return 'bg-purple-900/60 text-purple-300 border border-purple-700';
      case 'شیکاری': return 'bg-cyan-900/60 text-cyan-300 border border-cyan-700';
      case 'توێژینەوەی ئەزموونی': return 'bg-emerald-900/60 text-emerald-300 border border-emerald-700';
      case 'پێکهاتە': return 'bg-amber-900/60 text-amber-300 border border-amber-700';
      default: return 'bg-indigo-900/60 text-indigo-300 border border-indigo-700';
    }
  }

  private drag(simulation: d3.Simulation<D3ConceptNode, D3ConceptLink>) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag<SVGGElement, D3ConceptNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }
}

