import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';

@Component({
  selector: 'app-advanced-research-memory-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-memory-tab.html'
})
export class AdvancedResearchMemoryTabComponent {
  readonly multiAgent = inject(MultiAgentService);
}
