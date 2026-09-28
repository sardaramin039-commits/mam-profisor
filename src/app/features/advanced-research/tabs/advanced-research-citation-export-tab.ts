import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';

@Component({
  selector: 'app-advanced-research-citation-export-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-citation-export-tab.html'
})
export class AdvancedResearchCitationExportTabComponent {
  readonly multiAgent = inject(MultiAgentService);

  validateCitationsInput(rawText: string): void {
    if (!rawText) return;
    const list = rawText.split('\n').map(s => s.trim()).filter(Boolean);
    this.multiAgent.validateCitations(list);
  }
}
