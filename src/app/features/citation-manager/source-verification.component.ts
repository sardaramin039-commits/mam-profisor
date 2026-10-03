import { Component, ChangeDetectionStrategy, signal, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SourceEvidenceTabsComponent } from './components/source-evidence-tabs.component';
import { IntegrityDashboardComponent } from '../dashboard/components/integrity-dashboard.component';
import { HybridRagClientService, RerankedEvidenceChunk } from '../../services/hybrid-rag-client.service';
import {
  SourceVerificationEngine,
  VerifiedCitationRecord,
  VerificationAuditReport,
  VerificationStatus,
  EvidenceLinkedClaim,
  ResearchGateAuditResult,
  ContentKind
} from '../../helpers/source-verification-engine';

@Component({
  selector: 'app-source-verification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    SourceEvidenceTabsComponent,
    IntegrityDashboardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-verification.component.html',
})
export class SourceVerificationComponent {
  private hybridRagService = inject(HybridRagClientService);

  initialRecords = input<VerifiedCitationRecord[]>([]);

  activeTab = signal<'VERIFICATION' | 'RANKING' | 'DEDUPLICATION' | 'EVIDENCE_LINK' | 'RESEARCH_GATE' | 'INTEGRITY_DASHBOARD' | 'RERANKING'>('VERIFICATION');
  copiedReport = signal<boolean>(false);

  // Form bindings
  claimInput = '';
  titleInput = '';
  authorInput = '';
  yearInput: number | null = null;
  pageInput = '';
  snippetInput = '';

  // Cross-Encoder Reranking Inputs & Results
  rerankQuery = signal<string>('پەرەسەندنی ڕێزمانی سۆرانی لە سەدەی بیستەمدا');
  rerankedResults = signal<RerankedEvidenceChunk[]>([]);

  // Production starts with no fabricated scholarly records.
  // Real records enter through search/retrieval and are verified explicitly.
  records = signal<VerifiedCitationRecord[]>([]);

  auditReport = computed<VerificationAuditReport>(() => {
    return SourceVerificationEngine.generateAuditReport(this.records());
  });

  deduplicatedSources = computed<VerifiedCitationRecord[]>(() => {
    return SourceVerificationEngine.deduplicateSources(this.records());
  });

  filteredRecords = computed<VerifiedCitationRecord[]>(() => {
    return this.records();
  });

  linkedClaims = computed<EvidenceLinkedClaim[]>(() => {
    return this.deduplicatedSources()
      .filter(source => (source.claimText || '').trim().length > 0)
      .map(source => SourceVerificationEngine.createLinkedClaim(source.claimText || '', source, 'SOURCE-BASED'));
  });

  researchGateAudit = computed<ResearchGateAuditResult>(() => {
    return SourceVerificationEngine.auditResearchGate(this.records(), this.linkedClaims());
  });

  runVerificationTest(): void {
    if (!this.claimInput.trim()) return;

    const result = SourceVerificationEngine.processWorkflow(this.claimInput, {
      title: this.titleInput.trim(),
      author: this.authorInput.trim(),
      publicationYear: this.yearInput,
      publisherOrJournal: 'چاپکراوی ئەکادیمی',
      pageNumber: this.pageInput.trim() || null,
      retrievedTextSnippet: this.snippetInput.trim()
    });

    this.records.update((prev) => [result, ...prev]);

    // Clear form
    this.claimInput = '';
    this.titleInput = '';
    this.authorInput = '';
    this.yearInput = null;
    this.pageInput = '';
    this.snippetInput = '';
  }

  executeCrossEncoderRerank(): void {
    const query = this.rerankQuery().trim();
    if (!query) return;

    const candidates = this.records().map(rec => ({
      chunkId: `CHK-${rec.id}`,
      sourceId: rec.id,
      sourceTitle: rec.title,
      text: rec.exactEvidenceSnippet || rec.verificationNotes || '',
      verificationStatus: (rec.verificationStatus === 'VERIFIED' ? 'verified' :
                           rec.verificationStatus === 'PARTIALLY_VERIFIED' ? 'partially_verified' : 'unverified') as any,
      score: rec.reliabilityScore / 100,
      provenance: {
        author: rec.author,
        year: rec.publicationYear?.toString(),
        publisher: rec.publisherOrJournal,
        pageNumber: rec.pageNumber
      }
    }));

    const reranked = this.hybridRagService.rerankEvidenceForClaim(query, candidates);
    this.rerankedResults.set(reranked);
  }

  copyAuditReport(): void {
    const report = this.auditReport();
    navigator.clipboard.writeText(report.formattedSummaryMarkdown).then(() => {
      this.copiedReport.set(true);
      setTimeout(() => this.copiedReport.set(false), 2000);
    });
  }

  jsonStringify(val: any): string {
    try {
      return JSON.stringify(val);
    } catch {
      return '{}';
    }
  }
}
