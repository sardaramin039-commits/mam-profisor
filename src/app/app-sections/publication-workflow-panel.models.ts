export interface SubmissionItem {
  id: string;
  journalName: string;
  manuscriptType: string;
  currentStatus: string;
  currentVersionId?: string;
  versionCount: number;
  updatedAt: string;
}

export interface EditorialDecision {
  id: string;
  decisionType: string;
  resultingStatus: string;
  submissionVersionId: string;
  note: string;
  externalReference?: string;
  decidedAt: string;
}

export type DecisionType = 'MINOR_REVISION' | 'MAJOR_REVISION' | 'ACCEPT' | 'REJECT' | 'WITHDRAW';

export interface DecisionTaskDraft {
  title: string;
  details: string;
  scope: 'MANUSCRIPT' | 'SECTION' | 'CITATION' | 'FORMATTING' | 'OTHER';
  required: boolean;
  dueAt: string;
}

export interface RevisionTask {
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

export interface RevisionPlan {
  id: string;
  submissionVersionId: string;
  severity: 'MINOR' | 'MAJOR';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  tasks: RevisionTask[];
}

export interface RevisionGate {
  ready: boolean;
  reason?: string;
  pendingRequiredTasks: RevisionTask[];
}

export interface SubmissionVersion {
  id: string;
  submissionId: string;
  cycle: number;
  kind: 'READY' | 'RESUBMISSION' | 'LEGACY_READY';
  statusAtCapture: string;
  packageFingerprint: string;
  previousFingerprint?: string;
  note: string;
  externalReference?: string;
  capturedAt: string;
  immutableHash: string;
}

export interface VersionReport {
  status: 'VERIFIED' | 'INVALID' | 'EMPTY' | 'LEGACY_RECONSTRUCTED';
  versionCount: number;
  latestCycle: number;
  latestFingerprint: string;
  errors: string[];
}

export interface SubmissionPolicy {
  journalName: string;
  manuscriptType?: 'article' | 'review' | 'thesis' | 'book-chapter';
  maxWords?: number;
  maxAbstractWords?: number;
  minKeywords?: number;
  maxKeywords?: number;
  maxReferences?: number;
  blindedReview?: boolean;
  requiredSections?: Array<'abstract' | 'research-question' | 'methodology' | 'chapter' | 'conclusion'>;
  requireCoverLetter?: boolean;
  requireAuthorMetadata?: boolean;
}

export interface SubmissionManifestSummary {
  id: string;
  versionId: string;
  policy: SubmissionPolicy;
  journalName: string;
  manuscriptType: string;
  policyFingerprint: string;
  referenceCount: number;
}
