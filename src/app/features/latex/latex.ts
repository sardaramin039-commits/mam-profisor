import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LatexService } from '../../services/latex';

@Component({
  selector: 'app-latex',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
      <div class="flex items-center gap-2">
        <mat-icon class="text-indigo-400">functions</mat-icon>
        <h3 class="text-lg font-bold text-slate-100">سێرڤەری گۆڕینی LaTeX (LaTeX Converter)</h3>
      </div>
      <button
        (click)="generateLatex()"
        class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        دروستکردنی کۆدی LaTeX
      </button>

      @if (latexOutput()) {
        <pre class="p-3 bg-slate-950 text-xs text-indigo-300 font-mono rounded-lg border border-slate-800 overflow-x-auto">{{ latexOutput() }}</pre>
      }
    </div>
  `
})
export class LatexComponent {
  private latexService = inject(LatexService);
  latexOutput = signal<string>('');

  generateLatex(): void {
    const code = this.latexService.convertToLatex('توێژینەوەی زانستی', 'کۆمپیوتەر', [
      { title: 'بەشی یەکەم', content: 'پێشەکی و چەمکە سەرەکییەکان' }
    ]);
    this.latexOutput.set(code);
  }
}
