import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppTemplateSectionBase } from '../app-template-section-base';

interface SubmissionItem {
  id: string;
  journalName: string;
  manuscriptType: string;
  currentStatus: string;
  currentVersionId?: string;
  versionCount: number;
  updatedAt: string;
}

interface EditorialDecision {
  id: string;
  decisionType: string;
  resultingStatus: string;
  submissionVersionId: string;
  note: string;
  externalReference?: string;
  decidedAt: string;
}

type DecisionType = 'MINOR_REVISION' | 'MAJOR_REVISION' | 'ACCEPT' | 'REJECT' | 'WITHDRAW';

interface DecisionTaskDraft {
  title: string;
  details: string;
  scope: 'MANUSCRIPT' | 'SECTION' | 'CITATION' | 'FORMATTING' | 'OTHER';
  required: boolean;
  dueAt: string;
}

interface RevisionTask {
  id: string;
  order: number;
  title: string;
  details: string;
  scope: string;
  required: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'WAIVED';
  dueAt?: string;
  completionNote?: string;
}

interface RevisionPlan {
  id: string;
  submissionVersionId: string;
  severity: 'MINOR' | 'MAJOR';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  tasks: RevisionTask[];
}

interface RevisionGate {
  ready: boolean;
  reason?: string;
  pendingRequiredTasks: RevisionTask[];
}

@Component({
  selector: 'app-publication-workflow-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './publication-workflow-panel.component.html'
})
export class AppPublicationWorkflowPanelComponent extends AppTemplateSectionBase {
  private readonly workflowHttp = inject(HttpClient);
  readonly submissions = signal<SubmissionItem[]>([]);
  readonly decisions = signal<EditorialDecision[]>([]);
  readonly revisionPlan = signal<RevisionPlan | null>(null);
  readonly revisionGate = signal<RevisionGate | null>(null);
  readonly workspaceId = signal('');
  readonly submissionId = signal('');
  readonly loading = signal(false);
  readonly taskLoading = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly taskStatuses = ['IN_PROGRESS', 'DONE', 'WAIVED'] as const;
  readonly decisionTypes: DecisionType[] = ['MINOR_REVISION', 'MAJOR_REVISION', 'ACCEPT', 'REJECT', 'WITHDRAW'];
  readonly decisionScopes: DecisionTaskDraft['scope'][] = ['MANUSCRIPT', 'SECTION', 'CITATION', 'FORMATTING', 'OTHER'];
  readonly decisionType = signal<DecisionType>('MINOR_REVISION');
  readonly decisionNote = signal('');
  readonly decisionExternalReference = signal('');
  readonly decisionTasks = signal<DecisionTaskDraft[]>([]);
  readonly decisionTaskDraft = signal<DecisionTaskDraft>({
    title: '', details: '', scope: 'MANUSCRIPT', required: true, dueAt: ''
  });
  readonly decisionLoading = signal(false);

  override ngOnInit(): void {
    this.workspaceId.set(this.host.historyList()[0]?.id || '');
    if (this.workspaceId()) void this.loadSubmissions();
  }

  setWorkspace(value: string): void {
    this.workspaceId.set(value.trim());
    this.submissionId.set('');
    this.clearEvidence();
  }

  selectSubmission(value: string): void {
    this.submissionId.set(value.trim());
    if (this.submissionId()) void this.loadSubmissionEvidence();
  }

  async loadSubmissions(): Promise<void> {
    if (!this.workspaceId()) {
      this.errorMessage.set('تکایە Workspace ID دیاری بکە.');
      return;
    }
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.workflowHttp.get<{ submissions: SubmissionItem[] }>(
        `/api/publication-submission-lifecycle/${encodeURIComponent(this.workspaceId())}`
      ));
      const items = response.submissions || [];
      this.submissions.set(items);
      const selected = items.find(item => item.id === this.submissionId()) || items[0];
      this.submissionId.set(selected?.id || '');
      if (selected) await this.loadSubmissionEvidence();
      else this.clearEvidence();
    } catch (error) {
      this.handleError(error, 'نەتوانرا submission ـەکان باربکرێن.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSubmissionEvidence(): Promise<void> {
    if (!this.workspaceId() || !this.submissionId()) return this.clearEvidence();
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const base = `/api/publication-submission-editorial/${encodeURIComponent(this.workspaceId())}/${encodeURIComponent(this.submissionId())}`;
      const [decisions, revision] = await Promise.all([
        firstValueFrom(this.workflowHttp.get<{ decisions: EditorialDecision[] }>(`${base}/decisions`)),
        firstValueFrom(this.workflowHttp.get<{ plan: RevisionPlan | null; gate: RevisionGate }>(`${base}/revision`))
      ]);
      this.decisions.set(decisions.decisions || []);
      this.revisionPlan.set(revision.plan);
      this.revisionGate.set(revision.gate);
    } catch (error) {
      this.handleError(error, 'نەتوانرا زانیاریی submission و revision بخوێندرێتەوە.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateTask(task: RevisionTask, status: RevisionTask['status']): Promise<void> {
    if (!this.workspaceId() || !this.submissionId()) return;
    this.taskLoading.set(task.id);
    this.errorMessage.set('');
    try {
      const base = `/api/publication-submission-editorial/${encodeURIComponent(this.workspaceId())}/${encodeURIComponent(this.submissionId())}`;
      const body = status === 'WAIVED'
        ? { status, completionNote: 'لە لایەن بەکارهێنەرەوە waiver تۆمارکرا.' }
        : { status };
      const response = await firstValueFrom(
        this.workflowHttp.patch<{ plan: RevisionPlan }>(`${base}/revision/${encodeURIComponent(task.id)}`, body)
      );
      this.revisionPlan.set(response.plan);
      await this.loadSubmissionEvidence();
      this.host.toastService.showSuccess('Revision نوێکرایەوە', 'دۆخی task بە سەرکەوتوویی نوێکرایەوە.');
    } catch (error) {
      this.handleError(error, 'نەتوانرا دۆخی revision task نوێ بکرێتەوە.');
    } finally {
      this.taskLoading.set(null);
    }
  }

  currentSubmission(): SubmissionItem | null {
    return this.submissions().find(item => item.id === this.submissionId()) ?? null;
  }

  isDecisionRevision(): boolean {
    return this.decisionType() === 'MINOR_REVISION' || this.decisionType() === 'MAJOR_REVISION';
  }

  decisionTypeLabel(type: DecisionType): string {
    const labels: Record<DecisionType, string> = {
      MINOR_REVISION: 'چاکسازیی بچووک',
      MAJOR_REVISION: 'چاکسازیی گەورە',
      ACCEPT: 'پەسەندکردن',
      REJECT: 'ڕەتکردنەوە',
      WITHDRAW: 'کشاندنەوە'
    };
    return labels[type];
  }

  decisionScopeLabel(scope: DecisionTaskDraft['scope']): string {
    const labels: Record<DecisionTaskDraft['scope'], string> = {
      MANUSCRIPT: 'هەموو دەستنووس',
      SECTION: 'بەش',
      CITATION: 'سەرچاوە/سایتیشن',
      FORMATTING: 'فۆرمات',
      OTHER: 'هی تر'
    };
    return labels[scope];
  }

  setDecisionType(value: string): void {
    if (this.decisionTypes.includes(value as DecisionType)) {
      this.decisionType.set(value as DecisionType);
    }
  }

  updateDecisionTaskDraft(field: keyof DecisionTaskDraft, value: string | boolean): void {
    this.decisionTaskDraft.update(current => ({ ...current, [field]: value }));
  }

  addDecisionTask(): void {
    const draft = this.decisionTaskDraft();
    if (!draft.title.trim() || !draft.details.trim()) {
      this.errorMessage.set('بۆ زیادکردنی task، ناونیشان و وردەکاری پێویستە.');
      return;
    }
    this.decisionTasks.update(tasks => [...tasks, {
      title: draft.title.trim(),
      details: draft.details.trim(),
      scope: draft.scope,
      required: draft.required,
      dueAt: draft.dueAt.trim()
    }]);
    this.decisionTaskDraft.set({ title: '', details: '', scope: 'MANUSCRIPT', required: true, dueAt: '' });
    this.errorMessage.set('');
  }

  removeDecisionTask(index: number): void {
    this.decisionTasks.update(tasks => tasks.filter((_, taskIndex) => taskIndex !== index));
  }

  resetDecisionForm(): void {
    this.decisionType.set('MINOR_REVISION');
    this.decisionNote.set('');
    this.decisionExternalReference.set('');
    this.decisionTasks.set([]);
    this.decisionTaskDraft.set({ title: '', details: '', scope: 'MANUSCRIPT', required: true, dueAt: '' });
  }

  async submitDecision(): Promise<void> {
    if (!this.workspaceId() || !this.submissionId()) return;
    if (this.isDecisionRevision() && this.decisionTasks().length === 0) {
      this.errorMessage.set('بڕیاری revision دەبێت لانیکەم یەک task ـی ڕێکخراو هەبێت.');
      return;
    }
    if (!this.decisionNote().trim() && !this.decisionExternalReference().trim()) {
      this.errorMessage.set('تکایە note یان external reference بنووسە.');
      return;
    }
    this.decisionLoading.set(true);
    this.errorMessage.set('');
    try {
      const base = `/api/publication-submission-editorial/${encodeURIComponent(this.workspaceId())}/${encodeURIComponent(this.submissionId())}`;
      const tasks = this.isDecisionRevision()
        ? this.decisionTasks().map(task => ({
          title: task.title,
          details: task.details,
          scope: task.scope,
          required: task.required,
          ...(task.dueAt ? { dueAt: task.dueAt } : {})
        }))
        : undefined;
      await firstValueFrom(this.workflowHttp.post<{ success: boolean }>(`${base}/decision`, {
        decisionType: this.decisionType(),
        note: this.decisionNote().trim(),
        ...(this.decisionExternalReference().trim()
          ? { externalReference: this.decisionExternalReference().trim() }
          : {}),
        ...(tasks ? { tasks } : {})
      }));
      this.resetDecisionForm();
      await this.loadSubmissions();
      this.host.toastService.showSuccess('بڕیاری editorial تۆمارکرا', 'دۆخی publication بە سەرکەوتوویی نوێکرایەوە.');
    } catch (error) {
      this.handleError(error, 'نەتوانرا بڕیاری editorial تۆمار بکرێت.');
    } finally {
      this.decisionLoading.set(false);
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'ڕەشنووس', READY: 'ئامادە', SUBMITTED: 'نێردراو',
      UNDER_REVIEW: 'لە پێداچوونەوەدایە', REVISION_REQUESTED: 'revision داواکراوە',
      RESUBMITTED: 'دووبارە نێردراو', ACCEPTED: 'پەسەندکراو',
      REJECTED: 'ڕەتکراوە', WITHDRAWN: 'کشایەوە'
    };
    return labels[status] || status;
  }

  private clearEvidence(): void {
    this.decisions.set([]);
    this.revisionPlan.set(null);
    this.revisionGate.set(null);
    this.errorMessage.set('');
  }

  private handleError(error: unknown, fallback: string): void {
    const message = this.extractError(error) || fallback;
    this.errorMessage.set(message);
    this.host.toastService.showError('کێشە لە publication workflow', message);
  }

  private extractError(error: unknown): string {
    const candidate = error as { error?: { error?: string } | string };
    if (typeof candidate?.error === 'string') return candidate.error;
    return typeof candidate?.error?.error === 'string' ? candidate.error.error : '';
  }
}
