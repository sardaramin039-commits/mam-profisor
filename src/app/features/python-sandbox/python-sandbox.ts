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
  private sandbox = inject(PythonSandboxService);

  code = signal<string>(
`import scipy.stats as stats
import numpy as np

# تاقیکردنەوەی گریمانەی ئاماری (Hypothesis Testing)
group_a = [24.5, 26.1, 28.3, 22.9, 27.4, 29.0]
group_b = [19.2, 21.0, 20.5, 18.8, 22.1, 20.3]

t_stat, p_val = stats.ttest_ind(group_a, group_b)
print(f"تێکراوی گرووپی A: {np.mean(group_a):.2f}")
print(f"تێکراوی گرووپی B: {np.mean(group_b):.2f}")
print(f"نومەرەی t-statistic: {t_stat:.4f}")
print(f"بڕی p-value: {p_val:.6f}")
print("دەرئەنجام: گریمانەی پوچ (H0) ڕەتکرایەوە، جیاوازییەکە واتاداری ئاماری هەیە (p < 0.05)." if p_val < 0.05 else "دەرئەنجام: گریمانەی پوچ پەسەندکرا.")`
  );

  isRunning = signal<boolean>(false);
  output = signal<string>('');

  experimentData = signal<ExperimentRow[]>([
    // No synthetic results are shown. Rows appear only after a real sandbox execution.
  ]);

  loadPreset(preset: 'ttest' | 'anova' | 'regression' | 'chisquare'): void {
    if (preset === 'ttest') {
      this.code.set(
`import scipy.stats as stats
import numpy as np

# t-test تاقیکردنەوەی لێکچوونی دوو گرووپ
sample_1 = np.random.normal(loc=50, scale=10, size=30)
sample_2 = np.random.normal(loc=58, scale=10, size=30)
t_val, p_val = stats.ttest_ind(sample_1, sample_2)
print(f"t-statistic: {t_val:.4f}, p-value: {p_val:.6f}")`
      );
    } else if (preset === 'anova') {
      this.code.set(
`import scipy.stats as stats
# ANOVA تاقیکردنەوەی شیکاری جیاوازی
g1, g2, g3 = [12,14,15,11], [22,24,20,23], [31,33,29,32]
f_val, p_val = stats.f_oneway(g1, g2, g3)
print(f"ANOVA F-value: {f_val:.4f}, p-value: {p_val:.6f}")`
      );
    } else if (preset === 'regression') {
      this.code.set(
`import scipy.stats as stats
# ڕێگریسیۆنی هێڵی لەسەر گۆڕاوەکان
x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y = [2, 3, 5, 7, 8, 10, 11, 14, 15, 17]
slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
print(f"تەوەرە (R-squared): {r_value**2:.4f}, p-value: {p_value:.6f}")`
      );
    } else {
      this.code.set(
`import scipy.stats as stats
# چی دووجا (Chi-Square) بۆ داتای پۆلێنکراو
obs = [[10, 20, 30], [20, 15, 15]]
chi2, p_val, dof, ex = stats.chi2_contingency(obs)
print(f"Chi2 statistic: {chi2:.4f}, p-value: {p_val:.6f}")`
      );
    }
  }

  async runCode(): Promise<void> {
    this.isRunning.set(true);
    try {
      const res = await this.sandbox.executeCode(this.code());
      this.output.set(res.stdout || 'کۆدەکە بە سەرکەوتوویی جێبەجێ ببوو.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'هەڵەیەکی نەناسراو ڕوویدا.';
      this.output.set(
        `تاقیکردنەوە جێبەجێ نەکرا. هیچ ئەنجامی خەیاڵی نیشان نادرێت.\nهۆکار: ${message}`
      );
    } finally {
      this.isRunning.set(false);
    }
  }

  exportToCSV(): void {
    let csvContent = 'data:text/csv;charset=utf-8,Sample_Name,Variable_X,Variable_Y,Hypothesis_Status,p_Value,Significance\n';
    this.experimentData().forEach(row => {
      csvContent += `${row.sampleName},${row.variableX},${row.variableY},"${row.hypothesisStatus}",${row.pValue},"${row.significance}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Hypothesis_Test_Results_Lab.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToExcel(): void {
    // Generates a XML-based XLS spreadsheet file for Microsoft Excel
    let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Hypothesis Lab Results">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Sample Name</Data></Cell>
    <Cell><Data ss:Type="String">Variable X</Data></Cell>
    <Cell><Data ss:Type="String">Variable Y</Data></Cell>
    <Cell><Data ss:Type="String">Hypothesis Status</Data></Cell>
    <Cell><Data ss:Type="String">p-Value</Data></Cell>
    <Cell><Data ss:Type="String">Significance</Data></Cell>
   </Row>`;

    this.experimentData().forEach(row => {
      excelContent += `
   <Row>
    <Cell><Data ss:Type="String">${row.sampleName}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.variableX}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.variableY}</Data></Cell>
    <Cell><Data ss:Type="String">${row.hypothesisStatus}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.pValue}</Data></Cell>
    <Cell><Data ss:Type="String">${row.significance}</Data></Cell>
   </Row>`;
    });

    excelContent += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Hypothesis_Chart_Data_Lab.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
