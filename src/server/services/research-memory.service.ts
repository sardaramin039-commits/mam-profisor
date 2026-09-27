import { GoogleGenAI } from '@google/genai';

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

  public addMemoryItem(userId: string, projectId: string, item: Omit<ResearchMemoryItem, 'id' | 'createdAt' | 'updatedAt'>): ResearchMemoryItem {
    const project = this.getOrCreateProjectState(userId, projectId, '', '');
    const newItem: ResearchMemoryItem = {
      ...item,
      id: `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    project.memoryItems.push(newItem);
    project.lastUpdated = new Date().toISOString();
    
    // Update stats
    if (item.type === 'claim') project.claimsCount++;
    if (item.type === 'source') project.sourcesCount++;
    
    return newItem;
  }

  public getProjectMemory(userId: string, projectId: string): ResearchProjectState {
    return this.getOrCreateProjectState(userId, projectId, '', '');
  }

  public async summarizeMemoryWithAI(userId: string, projectId: string, getGeminiClient: () => GoogleGenAI): Promise<string> {
    const project = this.getProjectMemory(userId, projectId);
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
