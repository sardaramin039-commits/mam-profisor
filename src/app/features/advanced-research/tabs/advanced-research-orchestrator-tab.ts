import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';
import { TabContextBridgeService } from '../services/tab-context-bridge.service';

@Component({
  selector: 'app-advanced-research-orchestrator-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-orchestrator-tab.html'
})
export class AdvancedResearchOrchestratorTabComponent {
  readonly multiAgent = inject(MultiAgentService);
  readonly contextBridge = inject(TabContextBridgeService);
  topicText = signal<string>('');

  injectThesisContext(): void {
    const ctx = this.contextBridge.getActiveThesisContext();
    this.topicText.set(ctx.slice(0, 300));
  }

  runOrchestrator(topic?: string): void {
    const query = (topic || this.topicText()).trim();
    if (!query || this.multiAgent.isLoadingPipeline()) return;
    this.multiAgent.runMultiAgentPipeline(query);
  }
}
