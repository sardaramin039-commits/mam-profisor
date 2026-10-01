import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';
import { ResearchApiClientService } from '../services/research-api-client.service';

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
  projectId = input<string>('current');
  exportBlocked = signal(true);
  exportGateMessage = signal('پێویستە دۆخی evidence و review پشکنرێت.');

  constructor() {
    this.researchApi.getResearchControlPlane(this.projectId()).subscribe({
      next: state => {
        this.exportBlocked.set(state.gates.exportBlocked);
        this.exportGateMessage.set(state.gates.exportBlocked ? 'Export تا تەواوبوونی evidence/review قەدەغەیە.' : 'Export ئامادەیە بۆ پشکنینی کۆتایی.');
      },
      error: () => this.exportGateMessage.set('نەتوانرا export gate پشتڕاست بکرێتەوە؛ export ڕاگیراوە.')
    });
  }

  validateCitationsInput(rawText: string): void {
    if (!rawText) return;
    const list = rawText.split('\n').map(s => s.trim()).filter(Boolean);
    this.multiAgent.validateCitations(list);
  }
}
