import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ResearchApiClientService } from '../services/research-api-client.service';
import { ResearchIntegrityAuditResult } from '../models/multi-agent.types';

@Component({
  selector: 'app-advanced-research-integrity-audit-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-integrity-audit-tab.html'
})
export class AdvancedResearchIntegrityAuditTabComponent {
  private readonly api = inject(ResearchApiClientService);

  readonly isRunning = signal(false);
  readonly result = signal<ResearchIntegrityAuditResult | null>(null);
  readonly error = signal<string | null>(null);

  title = '';
  discipline = '';
  academicLevel = 'ماستەر';
  researchQuestion = '';
  objectives = '';
  hypotheses = '';
  methodology = '';
  populationSample = '';
  variables = '';
  dataCollection = '';
  analysisPlan = '';
  ethics = '';
  draftText = '';
  bibliography = '';

  runAudit(): void {
    const title = this.title.trim();
    if (!title || this.isRunning()) return;

    this.isRunning.set(true);
    this.error.set(null);
    this.result.set(null);

    this.api.auditResearchIntegrity({
      title,
      discipline: this.discipline.trim() || undefined,
      academicLevel: this.academicLevel.trim() || undefined,
      researchQuestion: this.researchQuestion.trim() || undefined,
      objectives: this.objectives.trim() || undefined,
      hypotheses: this.hypotheses.trim() || undefined,
      methodology: this.methodology.trim() || undefined,
      populationSample: this.populationSample.trim() || undefined,
      variables: this.variables.trim() || undefined,
      dataCollection: this.dataCollection.trim() || undefined,
      analysisPlan: this.analysisPlan.trim() || undefined,
      ethics: this.ethics.trim() || undefined,
      draftText: this.draftText.trim() || undefined,
      bibliography: this.bibliography.trim() || undefined
    }).subscribe({
      next: result => {
        this.result.set(result);
        this.isRunning.set(false);
      },
      error: err => {
        this.error.set(err?.error?.error || 'نەتوانرا پشکنینی Research Integrity تەواو بکرێت.');
        this.isRunning.set(false);
      }
    });
  }

  reset(): void {
    this.result.set(null);
    this.error.set(null);
  }
}
