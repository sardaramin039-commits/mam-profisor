import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';
import { TabContextBridgeService } from '../services/tab-context-bridge.service';

@Component({
  selector: 'app-advanced-research-fact-checker-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-fact-checker-tab.html'
})
export class AdvancedResearchFactCheckerTabComponent {
  readonly multiAgent = inject(MultiAgentService);
  readonly contextBridge = inject(TabContextBridgeService);
}
