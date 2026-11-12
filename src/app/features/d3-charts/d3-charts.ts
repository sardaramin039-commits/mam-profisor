import { Component, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { D3ChartHelper, ChartDataPoint } from '../../helpers/d3-charts';

@Component({
  selector: 'app-d3-charts',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
      <div class="flex items-center gap-2">
        <mat-icon class="text-teal-400">bar_chart</mat-icon>
        <h3 class="text-lg font-bold text-slate-100">شێوەکاری ئاماری D3 (D3 Charts)</h3>
      </div>
      <div #chartContainer class="w-full flex justify-center bg-slate-950 p-3 rounded-lg border border-slate-800"></div>
    </div>
  `
})
export class D3ChartsComponent implements AfterViewInit {
  @ViewChild('chartContainer') container!: ElementRef<HTMLDivElement>;

  data = input<ChartDataPoint[]>([
    { label: 'بۆشایی ١', value: 45 },
    { label: 'بۆشایی ٢', value: 75 },
    { label: 'بۆشایی ٣', value: 60 },
    { label: 'بۆشایی ٤', value: 90 }
  ]);

  constructor() {
    effect(() => {
      const chartData = this.data();
      if (this.container && this.container.nativeElement) {
        this.renderChart(chartData);
      }
    });
  }

  ngAfterViewInit(): void {
    this.renderChart(this.data());
  }

  private renderChart(chartData: ChartDataPoint[]): void {
    if (!this.container) return;
    this.container.nativeElement.id = 'd3-chart-instance';
    D3ChartHelper.renderBarChart('#d3-chart-instance', chartData, 380, 200);
  }
}
