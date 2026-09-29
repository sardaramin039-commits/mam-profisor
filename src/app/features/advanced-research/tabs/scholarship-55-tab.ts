import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResearchApiClientService } from '../services/research-api-client.service';

@Component({
  selector: 'app-scholarship-55-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scholarship-55-tab.html'
})
export class Scholarship55TabComponent {
  private readonly api = inject(ResearchApiClientService);
  catalog = signal<any[]>([]);
  result = signal<any>(null);
  loading = signal(false);

  constructor() {
    this.api.getScholarship55Catalog().subscribe({
      next: r => this.catalog.set(r.features || []),
      error: () => this.catalog.set([])
    });
  }

  run(): void {
    this.loading.set(true);
    const payload: Record<string, unknown> = {
      manuscript: true, claims: true, sources: true, citations: true,
      methodology: true, researchQuestion: true, analysisPlan: true,
      protocol: true, ethics: true, literature: true, bibliography: true
    };
    this.api.assessScholarship55(payload).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
