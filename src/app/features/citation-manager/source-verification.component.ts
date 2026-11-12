import { Component, ChangeDetectionStrategy, signal, computed, input, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SourceEvidenceTabsComponent } from './components/source-evidence-tabs.component';
import { IntegrityDashboardComponent } from '../dashboard/components/integrity-dashboard.component';
import { HybridRagClientService, RerankedEvidenceChunk } from '../../services/hybrid-rag-client.service';
import { SourceVerificationService, VerifiedAcademicSource, SourceVerificationStatus } from '../../services/source-verification.service';
import { ManuscriptBridgeActionsService } from '../../services/manuscript-bridge-actions.service';
import { AppNotificationsService } from '../../core/app.notifications';
import {
  SourceVerificationEngine,
  VerifiedCitationRecord,
  VerificationAuditReport,
  VerificationStatus,
  EvidenceLinkedClaim,
  ResearchGateAuditResult
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
  public sourceVerificationService = inject(SourceVerificationService);
  private hybridRagService = inject(HybridRagClientService);
  private bridgeActions = inject(ManuscriptBridgeActionsService);
  private toastService = inject(AppNotificationsService);

  initialRecords = input<VerifiedCitationRecord[]>([]);

  activeTab = signal<'VERIFICATION' | 'RANKING' | 'DEDUPLICATION' | 'EVIDENCE_LINK' | 'RESEARCH_GATE' | 'INTEGRITY_DASHBOARD' | 'RERANKING'>('VERIFICATION');
  copiedReport = signal<boolean>(false);

  // Live Crossref / OpenAlex Retrieval State
  lookupQuery = signal<string>('');
  selectedProvider = signal<'auto' | 'crossref' | 'openalex'>('auto');
  isRetrieving = signal<boolean>(false);
  retrievalStatusMessage = signal<string | null>(null);

  // Manual source input modal/form state
  showManualSourceModal = signal<boolean>(false);
  manualTitle = '';
  manualAuthor = '';
  manualYear: number | null = null;
  manualVenue = '';
  manualDoi = '';
  manualUrl = '';
  manualClaim = '';
  manualSnippet = '';
  manualPage = '';

  // Claim-to-source traceability state
  claimTraceSourceId = signal<string | null>(null);
  claimTraceText = '';
  claimTraceSnippet = '';
  claimTracePage = '';

  // Legacy form bindings for testing pipeline
  claimInput = '';
  titleInput = '';
  authorInput = '';
  yearInput: number | null = null;
  pageInput = '';
  snippetInput = '';

  // Evidence relevance heuristic inputs & results
  rerankQuery = signal<string>('پەرەسەندنی ڕێزمانی سۆرانی لە سەدەی بیستەمدا');
  rerankedResults = signal<RerankedEvidenceChunk[]>([]);

  records = signal<VerifiedCitationRecord[]>([]);

  constructor() {
    effect(() => {
      this.records.set(this.initialRecords());
    });
  }

  // Proxies for template convenience
  readonly verifiedSources = this.sourceVerificationService.filteredSources;
  readonly totalSourcesCount = this.sourceVerificationService.totalCount;
  readonly verifiedCount = this.sourceVerificationService.verifiedCount;
  readonly approvedCount = this.sourceVerificationService.approvedCount;
  readonly needsReviewCount = this.sourceVerificationService.needsReviewCount;
  readonly failedCount = this.sourceVerificationService.failedCount;

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

  setSearchQuery(q: string): void {
    this.sourceVerificationService.searchQuery.set(q);
  }

  setStatusFilter(status: 'ALL' | SourceVerificationStatus): void {
    this.sourceVerificationService.statusFilter.set(status);
  }

  /**
   * Real Crossref / OpenAlex retrieval without hallucination
   */
  async executeLiveRetrieval(): Promise<void> {
    const query = this.lookupQuery().trim();
    if (!query) {
      this.toastService.showWarning('تکایە زانیاری بنووسە', 'تکایە ناونیشان یان DOI ی سەرچاوەکە بنووسە.');
      return;
    }

    this.isRetrieving.set(true);
    this.retrievalStatusMessage.set('گەڕان لە داتابەیسی زانستی فەرمیدا...');

    try {
      const provider = this.selectedProvider();
      let res: VerifiedAcademicSource;

      if (provider === 'crossref') {
        res = await this.sourceVerificationService.verifyWithCrossref(query);
      } else if (provider === 'openalex') {
        res = await this.sourceVerificationService.verifyWithOpenAlex(query);
      } else {
        res = await this.sourceVerificationService.verifySource(query);
      }

      this.sourceVerificationService.addOrUpdateSource(res);

      if (res.status === 'VERIFIED') {
        this.toastService.showSuccess(
          'سەرچاوەکە پشتڕاستکرایەوە',
          `سەرچاوەی «${res.title}» لە ${res.provider.toUpperCase()} دۆزرایەوە و تۆمارکرا. پێویستی بە پەسەندکردنی تۆیە بۆ Citation.`
        );
        this.lookupQuery.set('');
      } else if (res.status === 'NEEDS_REVIEW') {
        this.toastService.showWarning(
          'پێویستی بە پێداچوونەوەیە',
          res.failureReason || 'هەندێک لە داتای سەرچاوەکە ناتەواوە و لە بەشی سەرچاوەکان دەتوانیت زانیاریی دەستی زیاد بکەیت.'
        );
      } else {
        this.toastService.showError(
          'پشتڕاستکردنەوە سەرکەوتوو نەبوو',
          res.failureReason || 'سەرچاوەکە نەدۆزرایەوە. تکایە سەرچاوەی دەستی زیاد بکە.'
        );
      }
    } catch (err: any) {
      this.toastService.showError('هەڵەی پەیوەندی', err?.message || 'نەتوانرا پەیوەندی بە سێرڤەری گەڕانەوە بکرێت.');
    } finally {
      this.isRetrieving.set(false);
      this.retrievalStatusMessage.set(null);
    }
  }

  /**
   * User approval toggle
   */
  onApproveSource(id: string): void {
    const res = this.sourceVerificationService.approveSource(id);
    if (res.success) {
      this.toastService.showSuccess('پەسەندکرا', res.message);
    } else {
      this.toastService.showError('نەتوانرا پەسەند بکرێت', res.message);
    }
  }

  onRevokeApproval(id: string): void {
    this.sourceVerificationService.revokeApproval(id);
    this.toastService.showInfo('هەڵوەشێندرایەوە', 'پەسەندکردنی ئەم سەرچاوەیە هەڵوەشێندرایەوە.');
  }

  onRemoveSource(id: string): void {
    this.sourceVerificationService.removeSource(id);
    this.toastService.showInfo('سڕایەوە', 'سەرچاوەکە لە لیستی تۆمارەکان سڕایەوە.');
  }

  /**
   * Gated citation insertion
   */
  onInsertCitation(source: VerifiedAcademicSource, mode: 'inline' | 'footnote' | 'bibliography' = 'inline'): void {
    this.bridgeActions.injectAcademicSourceCitation(source, mode);
  }

  /**
   * Open manual source entry dialog
   */
  openManualEntry(existingTitle?: string, existingDoi?: string): void {
    this.manualTitle = existingTitle || '';
    this.manualAuthor = '';
    this.manualYear = null;
    this.manualVenue = '';
    this.manualDoi = existingDoi || '';
    this.manualUrl = '';
    this.manualClaim = '';
    this.manualSnippet = '';
    this.manualPage = '';
    this.showManualSourceModal.set(true);
  }

  closeManualEntry(): void {
    this.showManualSourceModal.set(false);
  }

  async submitManualSource(): Promise<void> {
    if (!this.manualTitle.trim()) {
      this.toastService.showWarning('ناونیشان پێویستە', 'تکایە ناونیشانی فەرمیی سەرچاوەکە بنووسە.');
      return;
    }

    const authors = this.manualAuthor.trim()
      ? this.manualAuthor.split(/[,،]/).map(a => a.trim()).filter(Boolean)
      : [];

    const verified = await this.sourceVerificationService.verifyCustomUserSource({
      title: this.manualTitle.trim(),
      authors,
      author: this.manualAuthor.trim(),
      year: this.manualYear || undefined,
      venue: this.manualVenue.trim(),
      doi: this.manualDoi.trim() || undefined,
      claimText: this.manualClaim.trim() || undefined,
      evidenceSnippet: this.manualSnippet.trim() || undefined,
      pageNumber: this.manualPage.trim() || undefined
    });

    if (this.manualUrl.trim() && !verified.url) {
      verified.url = this.manualUrl.trim();
    }

    this.sourceVerificationService.addOrUpdateSource(verified);
    this.showManualSourceModal.set(false);

    if (verified.status === 'VERIFIED') {
      this.toastService.showSuccess('تۆمارکرا', 'سەرچاوە دەستییەکە پشتڕاستکرایەوە و تۆمارکرا.');
    } else {
      this.toastService.showWarning('پێویستی بە پەسەندکردنە', 'سەرچاوەکە بە دۆخی Needs Review تۆمارکرا.');
    }
  }

  /**
   * Claim-to-Source Traceability
   */
  openClaimTrace(sourceId: string): void {
    this.claimTraceSourceId.set(sourceId);
    const source = this.sourceVerificationService.sources().find(s => s.id === sourceId);
    this.claimTraceText = source?.claimText || '';
    this.claimTraceSnippet = source?.evidenceSnippet || '';
    this.claimTracePage = source?.pageNumber ? String(source.pageNumber) : '';
  }

  saveClaimTrace(): void {
    const id = this.claimTraceSourceId();
    if (!id) return;
    this.sourceVerificationService.linkClaimToSource(
      id,
      this.claimTraceText.trim(),
      this.claimTraceSnippet.trim() || undefined,
      this.claimTracePage.trim() || undefined
    );
    this.claimTraceSourceId.set(null);
    this.toastService.showSuccess('بەستراوەتەوە', 'بانگەشەی تێزەکە بە سەرچاوە پشتڕاستکراوەکە بەستراوەتەوە.');
  }

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

    this.claimInput = '';
    this.titleInput = '';
    this.authorInput = '';
    this.yearInput = null;
    this.pageInput = '';
    this.snippetInput = '';
  }

  executeEvidenceRelevanceRerank(): void {
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
