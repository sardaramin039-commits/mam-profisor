import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { MultiAgentService } from '../services/multi-agent.service';
import { ResearchApiClientService } from '../services/research-api-client.service';
import { ExportContractService } from '../../../../services/export-contract.service';

@Component({
  selector: 'app-advanced-research-citation-export-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-citation-export-tab.html'
})
export class AdvancedResearchCitationExportTabComponent {
  readonly multiAgent = inject(MultiAgentService);
  private readonly researchApi = inject(ResearchApiClientService);
  private readonly exportContract = inject(ExportContractService);

  projectId = input<string>('current');
  exportBlocked = signal(true);
  exportGateMessage = signal('پێویستە دۆخی evidence و review پشکنرێت.');
  exporting = signal(false);

  constructor() {
    this.researchApi.getResearchControlPlane(this.projectId()).subscribe({
      next: state => {
        this.exportBlocked.set(state.gates.exportBlocked);
        this.exportGateMessage.set(
          state.gates.exportBlocked
            ? 'Export تا تەواوبوونی evidence/review قەدەغەیە.'
            : 'Export پێویستی بە پشکنینی کۆتایی هەیە.'
        );
      },
      error: () => {
        this.exportBlocked.set(true);
        this.exportGateMessage.set('نەتوانرا export gate پشتڕاست بکرێتەوە؛ export ڕاگیراوە.');
      }
    });
  }

  validateCitationsInput(rawText: string): void {
    if (!rawText) return;
    const list = rawText.split('\n').map(s => s.trim()).filter(Boolean);
    this.multiAgent.validateCitations(list);
  }

  async exportDocument(
    format: 'latex' | 'markdown',
    title: string,
    content: string
  ): Promise<void> {
    if (this.exporting() || !content.trim()) return;

    this.exporting.set(true);
    this.exportGateMessage.set('پشکنینی identity، evidence و QA بۆ export...');

    try {
      const workspace = await firstValueFrom(
        this.researchApi.getWorkspace(this.projectId())
      );
      const gate = await firstValueFrom(
        this.researchApi.requestExportGate(
          content.trim(),
          workspace.citationsList || []
        )
      );

      this.exportContract.assertApproved(gate);
      this.download(format, title.trim() || 'Paper', content.trim());
      this.exportBlocked.set(false);
      this.exportGateMessage.set('Export بە پشکنینی evidence و QA ڕێگەپێدرا.');
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Export سەرکەوتوو نەبوو.';
      this.exportBlocked.set(true);
      this.exportGateMessage.set(message);
    } finally {
      this.exporting.set(false);
    }
  }

  private download(format: 'latex' | 'markdown', title: string, content: string): void {
    const body = format === 'markdown'
      ? `# ${title}\n\n${content}\n`
      : `\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\begin{document}\n\\section*{${this.escapeLatex(title)}}\n${this.escapeLatex(content)}\n\\end{document}\n`;

    const blob = new Blob([body], {
      type: format === 'markdown'
        ? 'text/markdown;charset=utf-8'
        : 'application/x-latex;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replace(/\s+/g, '_')}.${format === 'latex' ? 'tex' : 'md'}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private escapeLatex(value: string): string {
    return value.replace(/[&%$#_{}]/g, '\\$&');
  }
}
