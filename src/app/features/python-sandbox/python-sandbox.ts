import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PythonSandboxService } from '../../services/python-sandbox';

export interface ExperimentRow {
  sampleName: string;
  variableX: number;
  variableY: number;
  hypothesisStatus: string;
  pValue: number;
  significance: string;
}

@Component({
  selector: 'app-python-sandbox',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4 dir-rtl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <mat-icon class="text-indigo-400">query_stats</mat-icon>
          <h3 class="text-lg font-bold text-slate-100">ژینگەی پایتۆن و تاقیکردنەوەی گریمانەکان (Python Hypothesis Testing Lab)</h3>
        </div>
        <span class="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-full font-mono">
          Python execution sandbox پێویستی بە backend ـی پارێزراو هەیە
        </span>
      </div>

      <!-- Presets for Hypothesis Testing -->
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="text-slate-400 font-bold self-center">تاقیکردنەوە ئامارییەکان:</span>
        <button (click)="loadPreset('ttest')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700">
          🧪 t-test تاقیکردنەوەی
        </button>
        <button (click)="loadPreset('anova')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700">
          📊 ANOVA هێڵکاری
        </button>
        <button (click)="loadPreset('regression')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700">
          📈 ڕێگریسیۆنی هێڵی
        </button>
        <button (click)="loadPreset('chisquare')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700">
          📐 کاى دووجا (Chi-Square)
        </button>
      </div>

      <!-- Python Code Editor -->
      <textarea
        [ngModel]="code()"
        (ngModelChange)="code.set($event)"
        rows="5"
        class="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 shadow-inner"
      ></textarea>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <button
          (click)="runCode()"
          [disabled]="isRunning()"
          class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <mat-icon class="text-sm">play_arrow</mat-icon>
          {{ isRunning() ? 'لە جێبەجێکردندایە...' : 'جێبەجێکردنی تاقیکردنەوە لە تاقیگەدا' }}
        </button>

        <!-- CSV & Excel Export Buttons -->
        <div class="flex items-center gap-2">
          <button
            (click)="exportToCSV()"
            class="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md"
            title="داگرتنی داتای ئاماری بە شێوازی CSV بۆ تاقیگەکان"
          >
            <mat-icon class="text-sm">download</mat-icon>
            داگرتنی ئەنجامەکان (CSV)
          </button>
          <button
            (click)="exportToExcel()"
            class="bg-teal-700 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md"
            title="داگرتنی ئەنجامەکان و هێڵکارییەکان بە شێوازی Excel"
          >
            <mat-icon class="text-sm">table_chart</mat-icon>
            داگرتنی هێڵکارییەکان (Excel)
          </button>
        </div>
      </div>

      <!-- Terminal Raw Output -->
      @if (output()) {
        <pre class="p-3 bg-slate-950 text-xs text-slate-300 font-mono rounded-lg border border-slate-800 overflow-x-auto">{{ output() }}</pre>
      }

      <!-- Experiment Data Results Table for Lab Use -->
      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
        <div class="flex items-center justify-between text-xs text-indigo-300 font-bold border-b border-slate-800 pb-2">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm">biotech</mat-icon>
            خشتەی ئاماری تاقیکردنەوەی گریمانەکانی پایتۆن (Lab Results Dataset):
          </span>
          <span class="text-[10px] text-slate-400">تا execution ـی ڕاستەقینە ئەنجام نەدراوە، هیچ داتای تاقیکراوە نییە.</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs text-slate-300 border-collapse">
            <thead>
              <tr class="bg-slate-900 border-b border-slate-800 text-slate-400">
                <th class="p-2 font-semibold">نموونە (Sample)</th>
                <th class="p-2 font-semibold">گۆڕاوی X</th>
                <th class="p-2 font-semibold">گۆڕاوی Y</th>
                <th class="p-2 font-semibold">بارودۆخی گریمانە (Hypothesis)</th>
                <th class="p-2 font-semibold">p-value</th>
                <th class="p-2 font-semibold">ئاستی واتاداری (Significance)</th>
              </tr>
            </thead>
            <tbody>
              @for (row of experimentData(); track row.sampleName) {
                <tr class="border-b border-slate-800/50 hover:bg-slate-900/50">
                  <td class="p-2 font-mono text-indigo-300">{{ row.sampleName }}</td>
                  <td class="p-2 font-mono">{{ row.variableX }}</td>
                  <td class="p-2 font-mono">{{ row.variableY }}</td>
                  <td class="p-2">
                    <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {{ row.hypothesisStatus }}
                    </span>
                  </td>
                  <td class="p-2 font-mono text-amber-300">{{ row.pValue }}</td>
                  <td class="p-2 text-slate-400">{{ row.significance }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PythonSandboxComponent {
  code = signal<string>('mean');
  dataInput = signal<string>('24,26,28,22,27,29');
  isRunning = signal<boolean>(false);
  output = signal<string>('');
  experimentData = signal<ExperimentRow[]>([]);

  loadPreset(preset: 'ttest' | 'anova' | 'regression' | 'chisquare'): void {
    const presets: Record<string, string> = {
      ttest: 'ttest',
      anova: 'mean',
      regression: 'pearson',
      chisquare: 'frequency'
    };
    this.code.set(presets[preset]);
  }

  runCode(): void {
    this.isRunning.set(true);
    try {
      const values = this.parseValues(this.dataInput());
      const operation = this.code().trim().toLowerCase();
      let result = '';
      if (operation === 'mean') result = this.meanTable(values);
      else if (operation === 'sd' || operation === 'standard-deviation') result = this.sdTable(values);
      else if (operation === 'frequency') result = this.frequencyTable(values);
      else if (operation === 'pearson') result = this.pearsonTable(values);
      else if (operation === 'cronbach') result = 'Cronbach’s alpha پێویستی بە داتای چەند پرسیارێکە؛ CSV ـی ستوون-بە-پرسیار بنووسە.';
      else if (operation === 'ttest') result = 'بۆ t-test داتای دوو گرووپ بە شێوەی A:1,2,3 و B:4,5,6 بنووسە.';
      else throw new Error('فەرمان ناسراو نییە. یەکێک لەم فەرمانانە بنووسە: mean, sd, frequency, pearson, cronbach, ttest.');
      this.output.set(result);
      this.experimentData.set(values.map((value, index) => ({
        sampleName: `نمونە ${index + 1}`,
        variableX: value,
        variableY: 0,
        hypothesisStatus: 'داتای داخڵکراو',
        pValue: 0,
        significance: 'هێشتا تاقیکردنەوەی گریمانە نەکراوە'
      })));
    } catch (error) {
      this.output.set(error instanceof Error ? error.message : 'هەڵە لە شیکاری داتادا ڕوویدا.');
      this.experimentData.set([]);
    } finally {
      this.isRunning.set(false);
    }
  }

  private parseValues(raw: string): number[] {
    const values = raw.split(/[\\s,;\\t\\r\\n]+/).filter(Boolean).map(Number);
    if (values.length < 1 || values.some(value => !Number.isFinite(value))) {
      throw new Error('تکایە تەنها ژمارەی دروست بە کاما یان هێڵی نوێ جیا بکەرەوە.');
    }
    return values;
  }

  private mean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private sampleSd(values: number[]): number {
    if (values.length < 2) throw new Error('بۆ لادانی پێوەرەیی نموونە لانیکەم دوو داتا پێویستە.');
    const mean = this.mean(values);
    return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
  }

  private meanTable(values: number[]): string {
    return `خشتەی ئاماری (APA)
پێوەر | نمرە
N | ${values.length}
M | ${this.mean(values).toFixed(3)}
SD | ${values.length > 1 ? this.sampleSd(values).toFixed(3) : 'نەپێوانرا'}
تێبینی: ئەنجامەکە لە داتای داخڵکراوی بەکارهێنەرەوە حیساب کراوە.`;
  }

  private sdTable(values: number[]): string {
    return `خشتەی ئاماری (APA)
N | ${values.length}
SD | ${this.sampleSd(values).toFixed(3)}`;
  }

  private frequencyTable(values: number[]): string {
    const counts = new Map<number, number>();
    values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
    const rows = [...counts.entries()].sort((a, b) => a[0] - b[0]);
    return ['خشتەی دابەشبوونی دووبارەبوون', 'نمرە | دووبارەبوون | ڕێژە %',
      ...rows.map(([value, count]) => `${value} | ${count} | ${(count / values.length * 100).toFixed(1)}%`)].join('\n');
  }

  private pearsonTable(values: number[]): string {
    if (values.length < 4 || values.length % 2 !== 0) throw new Error('بۆ Pearson، ژمارەی داتا دەبێت جووت بێت: نیوەی یەکەم X و نیوەی دووەم Y، لانیکەم ٢ جووت.');
    const half = values.length / 2;
    const x = values.slice(0, half);
    const y = values.slice(half);
    const mx = this.mean(x), my = this.mean(y);
    const numerator = x.reduce((sum, value, i) => sum + (value - mx) * (y[i] - my), 0);
    const denominator = Math.sqrt(x.reduce((sum, value) => sum + (value - mx) ** 2, 0) * y.reduce((sum, value) => sum + (value - my) ** 2, 0));
    if (!denominator) throw new Error('Pearson پێوانە ناکرێت کاتێک گۆڕاوێک هەموو نمرەکانی یەکسانن.');
    return `خشتەی پەیوەندی Pearson
N | ${half}
r | ${(numerator / denominator).toFixed(3)}
تێبینی: X و Y بە ڕیز لە نیوەی یەکەم و دووەمی لیستەکە وەرگیراون.`;
  }

  exportToCSV(): void {
    const rows = [['نموونە', 'گۆڕاوی X', 'گۆڕاوی Y', 'دۆخ', 'p-value', 'واتاداری'],
      ...this.experimentData().map(row => [row.sampleName, String(row.variableX), String(row.variableY), row.hypothesisStatus, String(row.pValue), row.significance])];
    const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    this.download(csv, 'خشتەی-ئاماری.csv', 'text/csv;charset=utf-8');
  }

  exportToExcel(): void {
    const rows = this.experimentData().map(row => `<Row><Cell><Data ss:Type="String">${row.sampleName}</Data></Cell><Cell><Data ss:Type="Number">${row.variableX}</Data></Cell></Row>`).join('');
    const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Statistics"><Table>${rows}</Table></Worksheet></Workbook>`;
    this.download(xml, 'خشتەی-ئاماری.xls', 'application/vnd.ms-excel');
  }

  private download(content: string, filename: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
