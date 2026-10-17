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
      <h3 class="text-lg font-bold text-slate-100">تاقیگەی ئاماری ڕاستەقینە</h3>
      <p class="text-xs text-slate-300">داتاکان بە کاما یان هێڵی نوێ جیا بکەرەوە. فەرمانە بەردەستەکان: mean، sd، frequency، pearson.</p>
      <label class="block text-xs text-slate-300">فەرمانی شیکاری
        <input [ngModel]="code()" (ngModelChange)="code.set($event)" class="w-full mt-1 p-2 rounded bg-slate-950 text-white border border-slate-700" />
      </label>
      <label class="block text-xs text-slate-300">داتای ژمارەیی
        <textarea [ngModel]="dataInput()" (ngModelChange)="dataInput.set($event)" rows="4" class="w-full mt-1 p-2 rounded bg-slate-950 text-white border border-slate-700 font-mono"></textarea>
      </label>
      <div class="flex gap-2 flex-wrap">
        <button (click)="loadPreset('ttest')" class="px-3 py-2 rounded bg-slate-800 text-white text-xs">t-test</button>
        <button (click)="loadPreset('anova')" class="px-3 py-2 rounded bg-slate-800 text-white text-xs">ناوەند و SD</button>
        <button (click)="loadPreset('regression')" class="px-3 py-2 rounded bg-slate-800 text-white text-xs">Pearson</button>
        <button (click)="loadPreset('chisquare')" class="px-3 py-2 rounded bg-slate-800 text-white text-xs">دووبارەبوون</button>
        <button (click)="runCode()" [disabled]="isRunning()" class="px-4 py-2 rounded bg-indigo-600 text-white text-xs">{{ isRunning() ? 'شیکاری دەکرێت...' : 'شیکردنەوە' }}</button>
        <button (click)="exportToCSV()" class="px-3 py-2 rounded bg-emerald-700 text-white text-xs">هەناردەی CSV</button>
      </div>
      @if (output()) { <pre class="p-3 bg-slate-950 text-slate-100 rounded whitespace-pre-wrap text-xs">{{ output() }}</pre> }
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
      else if (operation === 'cronbach') result = this.cronbachAlpha(this.dataInput());
      else if (operation === 'ttest') result = this.independentTTest(this.dataInput());
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

  private cronbachAlpha(raw: string): string {
    const rows = raw.trim().split(/\\r?\\n/).map(line => line.split(/[,;\\t]/).map(Number));
    if (rows.length < 2 || rows.some(row => row.length < 2 || row.some(value => !Number.isFinite(value)))) {
      throw new Error('Cronbach alpha: هەر ڕیزێک یەک بەشداربووە و هەر ستوونێک پرسیارێکە؛ لانیکەم دوو ڕیز و دوو ستوون بنووسە.');
    }
    const items = rows[0].length;
    const variance = (values: number[]) => {
      const mean = this.mean(values);
      return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
    };
    const itemVariance = Array.from({ length: items }, (_, col) => variance(rows.map(row => row[col])));
    const totals = rows.map(row => row.reduce((sum, value) => sum + value, 0));
    const totalVariance = variance(totals);
    if (!totalVariance) throw new Error('Cronbach alpha پێوانە ناکرێت چونکە گۆڕانی نمرەی کۆیی سفرە.');
    const alpha = items / (items - 1) * (1 - itemVariance.reduce((sum, value) => sum + value, 0) / totalVariance);
    return `خشتەی ڕەوایی ناوخۆیی (Cronbach’s alpha)\\nژمارەی پرسیار | ${items}\\nژمارەی بەشداربووان | ${rows.length}\\nAlpha | ${alpha.toFixed(3)}\\nتێبینی: ئەنجامەکە لە داتای داخڵکراوی بەکارهێنەرەوە حیساب کراوە.`;
  }

  private independentTTest(raw: string): string {
    const groups = raw.split(/\\r?\\n/).filter(Boolean).map(line => line.split(':').slice(1).join(':').split(/[,;\\s]+/).filter(Boolean).map(Number));
    if (groups.length !== 2 || groups.some(group => group.length < 2 || group.some(value => !Number.isFinite(value)))) {
      throw new Error('t-test: دوو هێڵ بنووسە بە شێوەی A:1,2,3 و B:4,5,6؛ هەر گرووپێک لانیکەم دوو نمرە.');
    }
    const [a, b] = groups;
    const variance = (values: number[]) => this.sampleSd(values) ** 2;
    const se = Math.sqrt(variance(a) / a.length + variance(b) / b.length);
    if (!se) throw new Error('t-test پێوانە ناکرێت چونکە جیاوازی ناوخۆیی هەردوو گرووپ سفرە.');
    const t = (this.mean(a) - this.mean(b)) / se;
    return `خشتەی t-test بۆ دوو گرووپی سەربەخۆ\\nN1 | ${a.length}\\nM1 | ${this.mean(a).toFixed(3)}\\nSD1 | ${this.sampleSd(a).toFixed(3)}\\nN2 | ${b.length}\\nM2 | ${this.mean(b).toFixed(3)}\\nSD2 | ${this.sampleSd(b).toFixed(3)}\\nt | ${t.toFixed(3)}\\nتێبینی: ئەم وەشانە p-value حیساب ناکات؛ دەرئەنجام بە واتاداری ئاماری ناونیشان مەکە.`;
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
