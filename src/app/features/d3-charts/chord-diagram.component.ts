import { Component, ChangeDetectionStrategy, ElementRef, viewChild, effect, input, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { toSoraniNumber } from '../../pipes/sorani-number.pipe';
import { EditorService } from '../editor/services/editor';
import { AcademicStoreService } from '../../services/academic-store.service';
import * as d3 from 'd3';

export interface ChapterCrossReferenceData {
  names: string[];
  matrix: number[][];
}

@Component({
  selector: 'app-d3-chord-diagram',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-right shadow-lg" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">grain</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-100 font-serif">دیاگرامی کوردی D3 Chord (Cross-References Visualizer)</h4>
            <p class="text-[10px] text-slate-400">نیشاندانی پەیوەندی و بەستەرە هاوبەشەکانی نێوان بەشەکانی توێژینەوە و سەرچاوە زانستییەکان</p>
          </div>
        </div>

        <span class="text-[9.5px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-mono">
          D3.js Chord Engine
        </span>
      </div>

      <!-- Container for D3 Canvas -->
      <div class="w-full flex justify-center items-center p-2 sm:p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl min-h-[260px] sm:min-h-[320px] overflow-hidden">
        <div #chordContainer class="w-full max-w-[340px] sm:max-w-[480px] aspect-square sm:aspect-auto h-[260px] sm:h-[340px] flex justify-center items-center overflow-hidden"></div>
      </div>

      <!-- Legend & Info -->
      <div class="text-[10.5px] text-slate-400 font-serif flex items-center justify-between px-2 flex-wrap gap-2">
        <span>💡 هێڵەکان نیشاندەری هاوبەشیی سەرچاوە و زاراوە ئەکادیمییەکانن لە نێوان بەشە جیاوازەکاندا.</span>
        <span class="text-cyan-400 font-mono">Inter-Chapter Citations</span>
      </div>
    </div>
  `
})
export class D3ChordDiagramComponent implements OnDestroy {
  data = input<ChapterCrossReferenceData>();
  chordContainer = viewChild<ElementRef<HTMLDivElement>>('chordContainer');

  private editorService = inject(EditorService);
  private academicStore = inject(AcademicStoreService);

  constructor() {
    effect(() => {
      const container = this.chordContainer();
      if (!container) return;

      const inputData = this.data();
      const resolvedData = inputData && inputData.names.length > 0 ? inputData : this.buildDynamicChordData();
      if (resolvedData && resolvedData.names.length >= 2) {
        this.renderChordDiagram(container.nativeElement, resolvedData);
      }
    });
  }

  private buildDynamicChordData(): ChapterCrossReferenceData {
    const chapters = this.editorService.chapters();
    const sources = this.academicStore.sources();

    if (chapters.length === 0) {
      return {
        names: ['بەشی ١: پێشەکی', 'بەشی ٢: ئەدەبیات', 'بەشی ٣: میتۆد', 'سەرچاوەکان'],
        matrix: [
          [0, 15, 12, 18],
          [15, 0, 20, 25],
          [12, 20, 0, 14],
          [18, 25, 14, 0]
        ]
      };
    }

    const names = chapters.map((c, i) => c.title || `بەشی ${i + 1}`);
    const n = names.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    // Calculate cross-references from shared sources and inter-chapter references
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 0;
          continue;
        }

        const chA = chapters[i];
        const chB = chapters[j];
        const textA = (chA.content || '').toLowerCase();
        const textB = (chB.content || '').toLowerCase();

        // Check shared sources
        let sharedCitations = 0;
        sources.forEach(s => {
          const auth = (s.author || '').toLowerCase().trim();
          if (auth && textA.includes(auth) && textB.includes(auth)) {
            sharedCitations += 8;
          }
        });

        // Adjacency baseline weight for chapter continuity
        const dist = Math.abs(i - j);
        const continuityWeight = dist === 1 ? 12 : (dist === 2 ? 6 : 3);

        matrix[i][j] = Math.max(continuityWeight, sharedCitations);
      }
    }

    return { names, matrix };
  }

  private renderChordDiagram(element: HTMLDivElement, chordData: ChapterCrossReferenceData): void {
    d3.select(element).selectAll('*').remove();

    const width = 360;
    const height = 340;
    const outerRadius = Math.min(width, height) * 0.5 - 40;
    const innerRadius = outerRadius - 18;

    const names = chordData.names || ['بەشی ١', 'بەشی ٢', 'بەشی ٣', 'سەرچاوەی Harvard'];
    const matrix = chordData.matrix || [
      [0, 10, 20, 15],
      [10, 0, 25, 5],
      [20, 25, 0, 12],
      [15, 5, 12, 0]
    ];

    const chord = d3.chord()
      .padAngle(0.06)
      .sortSubgroups(d3.descending);

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = (d3 as any).ribbon()
      .radius(innerRadius);

    const color = d3.scaleOrdinal<string>()
      .domain(names)
      .range(['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']);

    const svg = d3.select(element)
      .append('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
      .attr('width', '100%')
      .attr('height', '100%')
      .style('max-width', '100%')
      .style('height', 'auto')
      .style('display', 'block')
      .style('font-family', 'sans-serif');

    const chords = chord(matrix);

    // Render group arcs
    const group = svg.append('g')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    group.append('path')
      .attr('fill', (d: any) => color(names[d.index]))
      .attr('stroke', '#0f172a')
      .attr('d', arc as any);

    // Group labels
    group.append('text')
      .each((d: any) => { (d as any).angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', (d: any) => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 10})
        ${d.angle > Math.PI ? 'rotate(180)' : ''}
      `)
      .attr('text-anchor', (d: any) => d.angle > Math.PI ? 'end' : 'start')
      .text((d: any) => toSoraniNumber(names[d.index]))
      .style('fill', '#f8fafc')
      .style('font-size', '9px')
      .style('font-weight', 'bold');

    // Render ribbons
    svg.append('g')
      .attr('fill-opacity', 0.65)
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon as any)
      .attr('fill', (d: any) => color(names[d.target.index]))
      .attr('stroke', '#0f172a')
      .style('mix-blend-mode', 'screen');
  }

  ngOnDestroy(): void {}
}
