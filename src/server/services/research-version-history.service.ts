import { createHash, randomUUID } from 'node:crypto';
import { adminDb } from '../../lib/firebase-admin';

export type ResearchVersionSource = 'manual' | 'autosave' | 'orchestration';

export interface ResearchVersion {
  id: string;
  userId: string;
  projectId: string;
  workspaceId: string;
  chapter: string;
  content: string;
  contentHash: string;
  summary: string;
  source: ResearchVersionSource;
  createdAt: string;
}

class ResearchVersionHistoryService {
  private ref(userId: string) {
    return adminDb.collection('research_versions').doc(userId).collection('items');
  }

  async list(userId: string, limit = 50): Promise<ResearchVersion[]> {
    const snapshot = await this.ref(userId).orderBy('createdAt', 'desc').limit(Math.min(Math.max(limit, 1), 100)).get();
    return snapshot.docs.map(doc => doc.data() as ResearchVersion);
  }

  async create(
    userId: string,
    input: Omit<ResearchVersion, 'id' | 'userId' | 'contentHash' | 'createdAt'>
  ): Promise<ResearchVersion | null> {
    const content = input.content.slice(0, 500_000);
    const contentHash = createHash('sha256').update(content, 'utf8').digest('hex');
    const recent = await this.ref(userId)
      .where('contentHash', '==', contentHash)
      .limit(1)
      .get();
    if (!recent.empty) return recent.docs[0].data() as ResearchVersion;

    const version: ResearchVersion = {
      ...input,
      id: `VER-${randomUUID()}`,
      userId,
      content,
      contentHash,
      createdAt: new Date().toISOString()
    };
    await this.ref(userId).doc(version.id).set(version);
    return version;
  }
}

export const researchVersionHistoryService = new ResearchVersionHistoryService();
