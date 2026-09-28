import { GoogleGenAI } from '@google/genai';
import { adminDb } from '../../lib/firebase-admin';
import { researchMemoryService, ResearchProjectState } from './research-memory.service';
import { multiAgentOrchestratorService } from './multi-agent-orchestrator.service';

export interface WorkspaceSession {
  workspaceId: string;
  userId: string;
  projectName: string;
  activeChapter: string;
  draftContent: string;
  citationsList: any[];
  integrityScore: number;
  lastSavedAt: string;
}

class ResearchProjectStateService {
  private workspaces: Map<string, WorkspaceSession> = new Map();

  private workspaceRef(userId: string, workspaceId: string) {
    return adminDb.collection('research_workspaces').doc(userId).collection('items').doc(workspaceId);
  }

  public async hydrateWorkspace(
    userId: string,
    workspaceId: string,
    projectName?: string
  ): Promise<WorkspaceSession> {
    const workspace = this.getOrCreateWorkspace(userId, workspaceId, projectName);
    try {
      const snapshot = await this.workspaceRef(userId, workspaceId).get();
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        workspace.projectName = typeof data['projectName'] === 'string' ? data['projectName'] : workspace.projectName;
        workspace.activeChapter = typeof data['activeChapter'] === 'string' ? data['activeChapter'] : workspace.activeChapter;
        workspace.draftContent = typeof data['draftContent'] === 'string' ? data['draftContent'] : workspace.draftContent;
        workspace.citationsList = Array.isArray(data['citationsList']) ? data['citationsList'] : workspace.citationsList;
        workspace.integrityScore = Number.isFinite(Number(data['integrityScore']))
          ? Math.max(0, Math.min(100, Number(data['integrityScore'])))
          : workspace.integrityScore;
        workspace.lastSavedAt = typeof data['lastSavedAt'] === 'string' ? data['lastSavedAt'] : workspace.lastSavedAt;
      } else {
        await this.persistWorkspace(workspace);
      }
    } catch (error) {
      console.warn('[ResearchWorkspace Firestore hydrate unavailable]:', (error as Error)?.message || error);
    }
    return workspace;
  }

  public async persistWorkspace(workspace: WorkspaceSession): Promise<void> {
    await this.workspaceRef(workspace.userId, workspace.workspaceId).set({
      workspaceId: workspace.workspaceId,
      userId: workspace.userId,
      projectName: workspace.projectName,
      activeChapter: workspace.activeChapter,
      draftContent: workspace.draftContent.slice(0, 500_000),
      citationsList: workspace.citationsList.slice(0, 500),
      integrityScore: Math.max(0, Math.min(100, workspace.integrityScore)),
      lastSavedAt: workspace.lastSavedAt
    }, { merge: true });
  }

  public getOrCreateWorkspace(userId: string, workspaceId: string, projectName?: string): WorkspaceSession {
    const key = `${userId}:${workspaceId}`;
    if (!this.workspaces.has(key)) {
      this.workspaces.set(key, {
        workspaceId,
        userId,
        projectName: projectName || 'واڕکسپەی سی توێژینەوەی ئەکادیمی',
        activeChapter: 'دەروازە و پێشەکی',
        draftContent: '',
        citationsList: [],
        integrityScore: 0,
        lastSavedAt: new Date().toISOString()
      });
    }
    return this.workspaces.get(key)!;
  }

  public async updateWorkspaceContent(userId: string, workspaceId: string, content: string, chapter?: string): Promise<WorkspaceSession> {
    const ws = this.getOrCreateWorkspace(userId, workspaceId);
    ws.draftContent = content;
    if (chapter) ws.activeChapter = chapter;
    ws.lastSavedAt = new Date().toISOString();

    // Also sync to Research Memory as draft_chapter
    await researchMemoryService.addMemoryItem(userId, workspaceId, {
      userId,
      topic: ws.projectName,
      type: 'draft_chapter',
      content: content.slice(0, 500),
      tags: [ws.activeChapter, 'workspace_auto_save']
    });

    await this.persistWorkspace(ws);
    return ws;
  }

  public async runFullWorkspaceOrchestration(
    userId: string,
    workspaceId: string,
    topic: string,
    discipline: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<any> {
    const ws = await this.hydrateWorkspace(userId, workspaceId, topic);
    
    // Execute Multi-Agent Orchestration
    const orchestrationResult = await multiAgentOrchestratorService.executePipeline(
      {
        topic,
        discipline,
        draftText: ws.draftContent || topic
      },
      getGeminiClient
    );

    ws.draftContent = orchestrationResult.finalThesisDraftKurdish || ws.draftContent;
    const qaBlocked = orchestrationResult.qaGateResult?.exportBlocked === true;
    ws.integrityScore = qaBlocked ? 0 : Math.max(0, Math.min(100, Number(orchestrationResult.qaGateResult?.overallQAScore) || 0));
    ws.lastSavedAt = new Date().toISOString();

    await this.persistWorkspace(ws);

    return {
      workspace: ws,
      orchestration: orchestrationResult
    };
  }
}

export const researchProjectStateService = new ResearchProjectStateService();
