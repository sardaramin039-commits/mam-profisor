import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';

@Component({
  selector: 'app-advanced-research-orchestrator-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-orchestrator-tab.html'
})
export class AdvancedResearchOrchestratorTabComponent {
  readonly multiAgent = inject(MultiAgentService);

  runOrchestrator(topic: string): void {
    if (!topic.trim() || this.multiAgent.isLoadingPipeline()) return;
    this.multiAgent.runMultiAgentPipeline(topic.trim());
  }
}
