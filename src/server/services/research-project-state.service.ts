import { GoogleGenAI } from '@google/genai';
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

  public updateWorkspaceContent(userId: string, workspaceId: string, content: string, chapter?: string): WorkspaceSession {
    const ws = this.getOrCreateWorkspace(userId, workspaceId);
    ws.draftContent = content;
    if (chapter) ws.activeChapter = chapter;
    ws.lastSavedAt = new Date().toISOString();

    // Also sync to Research Memory as draft_chapter
    researchMemoryService.addMemoryItem(userId, workspaceId, {
      userId,
      topic: ws.projectName,
      type: 'draft_chapter',
      content: content.slice(0, 500),
      tags: [ws.activeChapter, 'workspace_auto_save']
    });

    return ws;
  }

  public async runFullWorkspaceOrchestration(
    userId: string,
    workspaceId: string,
    topic: string,
    discipline: string,
    getGeminiClient: () => GoogleGenAI
  ): Promise<any> {
    const ws = this.getOrCreateWorkspace(userId, workspaceId, topic);
    
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

    return {
      workspace: ws,
      orchestration: orchestrationResult
    };
  }
}

export const researchProjectStateService = new ResearchProjectStateService();
