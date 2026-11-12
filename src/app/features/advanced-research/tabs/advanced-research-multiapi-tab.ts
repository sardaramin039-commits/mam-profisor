import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';

@Component({
  selector: 'app-advanced-research-multiapi-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-multiapi-tab.html'
})
export class AdvancedResearchMultiapiTabComponent {
  readonly multiAgent = inject(MultiAgentService);

  getSourceTypeClass(type: string): string {
    switch (type) {
      case 'PubMed': return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
      case 'SemanticScholar': return 'bg-indigo-950 text-indigo-300 border border-indigo-800';
      case 'OpenLibrary': return 'bg-amber-950 text-amber-300 border border-amber-800';
      default: return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  }
}
