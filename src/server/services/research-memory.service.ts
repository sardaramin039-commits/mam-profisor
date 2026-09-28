import { GoogleGenAI } from '@google/genai';
import { adminDb } from '../../lib/firebase-admin';

export interface ResearchMemoryItem {
  id: string;
  userId: string;
  topic: string;
  type: 'note' | 'claim' | 'evidence' | 'source' | 'summary' | 'draft_chapter';
  content: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchProjectState {
  projectId: string;
  userId: string;
  title: string;
  discipline: string;
  memoryItems: ResearchMemoryItem[];
  claimsCount: number;
  sourcesCount: number;
  evidenceCoverage: number;
  lastUpdated: string;
}

class ResearchMemoryService {
  private inMemoryStore: Map<string, ResearchProjectState> = new Map();
  private memorySequence = 0;

  private projectRef(userId: string, projectId: string) {
    return adminDb.collection('research_memory').doc(userId).collection('projects').doc(projectId);
  }

  public async hydrateProjectState(
    userId: string,
    projectId: string
  ): Promise<ResearchProjectState> {
    const cached = this.getOrCreateProjectState(userId, projectId, '', '');
    try {
      const snapshot = await this.projectRef(userId, projectId).get();
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        cached.title = typeof data['title'] === 'string' ? data['title'] : cached.title;
        cached.discipline = typeof data['discipline'] === 'string' ? data['discipline'] : cached.discipline;
        cached.claimsCount = Number(data['claimsCount']) || 0;
        cached.sourcesCount = Number(data['sourcesCount']) || 0;
        cached.evidenceCoverage = Number(data['evidenceCoverage']) || 0;
        cached.lastUpdated = typeof data['lastUpdated'] === 'string' ? data['lastUpdated'] : cached.lastUpdated;

        const itemsSnapshot = await this.projectRef(userId, projectId)
          .collection('items')
          .orderBy('createdAt', 'desc')
          .limit(500)
          .get();

        cached.memoryItems = itemsSnapshot.docs
          .map(doc => doc.data() as ResearchMemoryItem)
          .reverse();

        return cached;
      }

      await this.persistProjectState(cached);
      return cached;
    } catch (error) {
      console.warn('[ResearchMemory Firestore hydrate unavailable]:', (error as Error)?.message || error);
      return cached;
    }
  }

  public async persistProjectState(project: ResearchProjectState): Promise<void> {
    const projectRef = this.projectRef(project.userId, project.projectId);
    await projectRef.set({
      projectId: project.projectId,
      userId: project.userId,
      title: project.title,
      discipline: project.discipline,
      claimsCount: project.claimsCount,
      sourcesCount: project.sourcesCount,
      evidenceCoverage: project.evidenceCoverage,
      lastUpdated: project.lastUpdated
    }, { merge: true });
  }

  private async persistMemoryItem(
    project: ResearchProjectState,
    item: ResearchMemoryItem
  ): Promise<void> {
    const db = adminDb;
    const projectRef = this.projectRef(project.userId, project.projectId);
    const itemRef = projectRef.collection('items').doc(item.id);
    const batch = db.batch();

    batch.set(itemRef, item, { merge: true });
    batch.set(projectRef, {
      projectId: project.projectId,
      userId: project.userId,
      title: project.title,
      discipline: project.discipline,
      claimsCount: project.claimsCount,
      sourcesCount: project.sourcesCount,
      evidenceCoverage: project.evidenceCoverage,
      lastUpdated: project.lastUpdated
    }, { merge: true });

    await batch.commit();
  }

  public getOrCreateProjectState(userId: string, projectId: string, title: string, discipline: string): ResearchProjectState {
    const key = `${userId}:${projectId}`;
    if (!this.inMemoryStore.has(key)) {
      this.inMemoryStore.set(key, {
        projectId,
        userId,
        title: title || 'پڕۆژەی توێژینەوەی ئەکادیمی',
        discipline: discipline || 'گشتی',
        memoryItems: [],
        claimsCount: 0,
        sourcesCount: 0,
        evidenceCoverage: 0,
        lastUpdated: new Date().toISOString()
      });
    }
    return this.inMemoryStore.get(key)!;
  }

  public async addMemoryItem(userId: string, projectId: string, item: Omit<ResearchMemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResearchMemoryItem> {
    const project = this.getOrCreateProjectState(userId, projectId, '', '');
    const newItem: ResearchMemoryItem = {
      ...item,
      id: `MEM-${Date.now()}-${++this.memorySequence}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const previousLastUpdated = project.lastUpdated;
    const previousClaimsCount = project.claimsCount;
    const previousSourcesCount = project.sourcesCount;

    project.lastUpdated = newItem.updatedAt;
    if (item.type === 'claim') project.claimsCount++;
    if (item.type === 'source') project.sourcesCount++;

    try {
      await this.persistMemoryItem(project, newItem);
      project.memoryItems.push(newItem);
      return newItem;
    } catch (error) {
      project.lastUpdated = previousLastUpdated;
      project.claimsCount = previousClaimsCount;
      project.sourcesCount = previousSourcesCount;
      console.error('[ResearchMemory Firestore persist failed]:', (error as Error)?.message || error);
      throw new Error('Research memory persistence failed.');
    }
  }

  public getProjectMemory(userId: string, projectId: string): ResearchProjectState {
    return this.getOrCreateProjectState(userId, projectId, '', '');
  }

  public async summarizeMemoryWithAI(userId: string, projectId: string, getGeminiClient: () => GoogleGenAI): Promise<string> {
    const project = await this.hydrateProjectState(userId, projectId);
    if (project.memoryItems.length === 0) {
      return 'هیچ زانیارییەک لە یادگەی توێژینەوەکەدا تۆمار نەکراوە.';
    }

    try {
      const ai = getGeminiClient();
      const prompt = `تۆ ئەی ئای ڕاوێژکاری ئەکادیمیت. وەکوو سەرنووسەرێکی باڵا، پوختەیەکی چڕی ئەکادیمی بۆ تێبینی و بەڵگەکانی یادگەی ئەم توێژینەوەیە بنووسە بە کوردی:
ناونیشانی پڕۆژە: ${project.title}
بوار: ${project.discipline}
مۆدیوڵە تۆمارکراوەکان:
${JSON.stringify(project.memoryItems.slice(-10), null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      return response.text || 'پوختەی ئەکادیمی بە سەرکەوتوویی دروست کرا.';
    } catch (err: unknown) {
      console.error('ResearchMemoryService summarize error:', err);
      return `پوختەی دروستکراو بۆ پڕۆژەی ${project.title}: کۆی ${project.memoryItems.length} بڕگەی یادگە تۆمار کراوە.`;
    }
  }
}

export const researchMemoryService = new ResearchMemoryService();
