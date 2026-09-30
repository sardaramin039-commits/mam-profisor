import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService } from '../services/multi-agent.service';
import { ResearchApiClientService } from '../services/research-api-client.service';

interface ResearchVersionView {
  id: string;
  projectId: string;
  chapter: string;
  content: string;
  source: string;
  createdAt: string;
  contentHash: string;
}

@Component({
  selector: 'app-advanced-research-memory-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research-memory-tab.html'
})
export class AdvancedResearchMemoryTabComponent {
  readonly multiAgent = inject(MultiAgentService);
  private readonly api = inject(ResearchApiClientService);
  readonly versions = signal<ResearchVersionView[]>([]);
  readonly selectedVersion = signal<ResearchVersionView | null>(null);
  readonly versionsLoading = signal(false);

  constructor() {
    this.loadVersions();
  }

  loadVersions(): void {
    this.versionsLoading.set(true);
    this.api.listResearchVersions(20).subscribe({
      next: result => {
        this.versions.set(result.versions as unknown as ResearchVersionView[]);
        this.versionsLoading.set(false);
      },
      error: () => this.versionsLoading.set(false)
    });
  }

  previewVersion(version: ResearchVersionView): void {
    this.selectedVersion.set(version);
  }
}
