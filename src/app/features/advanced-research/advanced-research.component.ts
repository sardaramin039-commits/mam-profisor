import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MultiAgentService, ProfessorModeLevel } from './services/multi-agent.service';
import { AdvancedResearchOrchestratorTabComponent } from './tabs/advanced-research-orchestrator-tab';
import { AdvancedResearchFactCheckerTabComponent } from './tabs/advanced-research-fact-checker-tab';
import { AdvancedResearchMultiapiTabComponent } from './tabs/advanced-research-multiapi-tab';
import { AdvancedResearchKnowledgeGraphTabComponent } from './tabs/advanced-research-knowledge-graph-tab';
import { AdvancedResearchOcrTabComponent } from './tabs/advanced-research-ocr-tab';
import { AdvancedResearchPeerReviewTabComponent } from './tabs/advanced-research-peer-review-tab';
import { AdvancedResearchCitationExportTabComponent } from './tabs/advanced-research-citation-export-tab';
import { AdvancedResearchExtendedToolsTabComponent } from './tabs/advanced-research-extended-tools-tab';
import { AdvancedResearchMemoryTabComponent } from './tabs/advanced-research-memory-tab';
import { AdvancedResearchMethodsLabTabComponent } from './tabs/advanced-research-methods-lab-tab';
import { SystematicReviewTabComponent } from './tabs/systematic-review-tab.component';

type NavigationGroupId = 'workspace' | 'evidence' | 'review' | 'output' | 'memory';
type AdvancedResearchTab = 'orchestrator' | 'factchecker' | 'multiapi' | 'ocr' | 'peer_review' | 'citation_export' | 'extended_tools' | 'journal_metrics' | 'ultimate_ai' | 'knowledgegraph' | 'memory' | 'methods_lab' | 'systematic_review';

@Component({
  selector: 'app-advanced-research-hub',
  standalone: true,
  imports: [CommonModule, MatIconModule,
    AdvancedResearchOrchestratorTabComponent,
    AdvancedResearchFactCheckerTabComponent,
    AdvancedResearchMultiapiTabComponent,
    AdvancedResearchKnowledgeGraphTabComponent,
    AdvancedResearchOcrTabComponent,
    AdvancedResearchPeerReviewTabComponent,
    AdvancedResearchCitationExportTabComponent,
    AdvancedResearchExtendedToolsTabComponent,
    AdvancedResearchMemoryTabComponent,
    AdvancedResearchMethodsLabTabComponent,
    SystematicReviewTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advanced-research.component.html'
})
export class AdvancedResearchHubComponent {
  multiAgent = inject(MultiAgentService);
  navigationGroup = signal<NavigationGroupId>('workspace');

  private readonly groupTabs: Record<NavigationGroupId, AdvancedResearchTab[]> = {
    workspace: ['orchestrator'],
    evidence: ['factchecker', 'multiapi', 'ocr', 'knowledgegraph'],
    review: ['peer_review', 'methods_lab', 'systematic_review'],
    output: ['citation_export', 'extended_tools'],
    memory: ['memory']
  };

  readonly navigationGroups = [
    { id: 'workspace', label: 'سەرەکی', icon: 'hub', note: 'AI و سەرپەرشتیاری' },
    { id: 'evidence', label: 'سەرچاوە و بەڵگە', icon: 'verified_user', note: 'گەڕان و پشتڕاستکردنەوە' },
    { id: 'review', label: 'مێتۆد و پشکنین', icon: 'science', note: 'methodology و review' },
    { id: 'output', label: 'Citation و هەناردە', icon: 'file_download', note: 'citation و tools' },
    { id: 'memory', label: 'بیرگە و مێژوو', icon: 'history', note: 'memory و versions' }
  ] as const;

  setNavigationGroup(group: NavigationGroupId): void {
    this.navigationGroup.set(group);
    const allowedTabs = this.groupTabs[group];
    if (!allowedTabs.includes(this.activeTab())) this.activeTab.set(allowedTabs[0]);
  }

  activeTab = signal<AdvancedResearchTab>('orchestrator');

  readonly professorModes: { level: ProfessorModeLevel; icon: string; activeClass: string }[] = [
    { level: 'سەرەتایی', icon: '🟢', activeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' },
    { level: 'بەکالۆریۆس', icon: '🔵', activeClass: 'bg-blue-950 text-blue-300 border border-blue-800 font-bold' },
    { level: 'ماستەر', icon: '🟣', activeClass: 'bg-purple-950 text-purple-300 border border-purple-800 font-bold' },
    { level: 'دکتۆرا', icon: '🔴', activeClass: 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' },
    { level: 'پڕۆفیسۆر', icon: '👑', activeClass: 'bg-amber-950 text-amber-300 border border-amber-800 font-bold' },
  ];

}
