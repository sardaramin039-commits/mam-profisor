import type { SubmissionReceipt } from './publication-submission-receipt.service';

export interface MemorySubmissionRecord {
  id: string;
  userId: string;
  workspaceId: string;
  journalName: string;
  manuscriptType: string;
  submissionFingerprint: string;
  currentStatus: any;
  version: number;
  events: any[];
  submissionReceiptId?: string;
  auditHeadHash: string;
  currentVersionId?: string;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryManifestRecord {
  id: string;
  submissionId: string;
  userId: string;
  workspaceId: string;
  capturedAt: string;
}

class PublicationSubmissionMemoryStore {
  private records = new Map<string, Map<string, any>>();
  private receipts = new Map<string, Map<string, SubmissionReceipt>>();
  private manifests = new Map<string, Map<string, any>>();

  private getUserMap<T>(store: Map<string, Map<string, T>>, userId: string): Map<string, T> {
    let map = store.get(userId);
    if (!map) {
      map = new Map<string, T>();
      store.set(userId, map);
    }
    return map;
  }

  saveRecord(record: any): void {
    const map = this.getUserMap(this.records, record.userId);
    map.set(record.id, { ...record });
  }

  getRecord(userId: string, submissionId: string): any | null {
    const map = this.records.get(userId);
    const item = map?.get(submissionId);
    return item ? { ...item } : null;
  }

  listRecords(userId: string, workspaceId: string, limit = 50): any[] {
    const map = this.records.get(userId);
    if (!map) return [];
    return Array.from(map.values())
      .filter(item => item.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, Math.min(Math.max(limit, 1), 100))
      .map(item => ({ ...item }));
  }

  saveReceipt(userId: string, submissionId: string, receipt: SubmissionReceipt): void {
    const key = `${userId}:${submissionId}`;
    const map = this.getUserMap(this.receipts, key);
    map.set(receipt.id, { ...receipt });
  }

  getReceipt(userId: string, submissionId: string, receiptId: string): SubmissionReceipt | null {
    const key = `${userId}:${submissionId}`;
    const map = this.receipts.get(key);
    const item = map?.get(receiptId);
    return item ? { ...item } : null;
  }

  saveManifest(manifest: any): void {
    const map = this.getUserMap(this.manifests, manifest.userId);
    map.set(manifest.id, { ...manifest });
  }

  listManifests(userId: string, workspaceId: string, limit = 50): any[] {
    const map = this.manifests.get(userId);
    if (!map) return [];
    return Array.from(map.values())
      .filter(item => item.workspaceId === workspaceId)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
      .slice(0, Math.min(Math.max(limit, 1), 100))
      .map(item => ({ ...item }));
  }

  getManifest(userId: string, manifestId: string): any | null {
    const map = this.manifests.get(userId);
    const item = map?.get(manifestId);
    return item ? { ...item } : null;
  }
}

export const submissionMemoryStore = new PublicationSubmissionMemoryStore();
