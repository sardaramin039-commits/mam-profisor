import { GoogleGenAI } from '@google/genai';
import { adminDb } from '../../lib/firebase-admin';
import { researchMemoryService, ResearchProjectState } from './research-memory.service';
import { multiAgentOrchestratorService } from './multi-agent-orchestrator.service';
import { researchVersionHistoryService } from './research-version-history.service';
import { researchDecisionLedgerService } from './research-decision-ledger.service';
import { researchControlPlaneService } from './research-control-plane.service';

export interface WorkspaceSession {
  workspaceId: string;
  userId: string;
  projectName: string;
  activeChapter: string;
  draftContent: string;
  citationsList: unknown[];
  integrityScore: number;
  lastSavedAt: string;
  lastMemorySnapshotHash: string;
}

function contentHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

class ResearchProjectStateService {
  private workspaces: Map<string, WorkspaceSession> = new Map();

  private workspaceRef(userId: string, workspaceId: string) {
    return adminDb.collection('research_workspaces').doc(userId).collection('items').doc(workspaceId);
  }

  private async loadUserSources(userId: string): Promise<unknown[]> {
    try {
      const sourceSnapshot = await adminDb
        .collection('sources')
        .where('userId', '==', userId)
        .limit(500)
        .get();

      return sourceSnapshot.docs.map(sourceDoc => ({
        id: sourceDoc.id,
        ...sourceDoc.data()
      }));
    } catch (error) {
      console.warn(
        '[ResearchWorkspace source hydration unavailable]:',
        (error as Error)?.message || error
      );
      return [];
    }
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

        if (workspace.citationsList.length === 0) {
          workspace.citationsList = await this.loadUserSources(userId);
        }

        workspace.integrityScore = Number.isFinite(Number(data['integrityScore']))
          ? Math.max(0, Math.min(100, Number(data['integrityScore'])))
          : workspace.integrityScore;
        workspace.lastSavedAt = typeof data['lastSavedAt'] === 'string' ? data['lastSavedAt'] : workspace.lastSavedAt;
        workspace.lastMemorySnapshotHash = typeof data['lastMemorySnapshotHash'] === 'string'
          ? data['lastMemorySnapshotHash']
          : contentHash(workspace.draftContent.slice(0, 500));
      } else {
        workspace.citationsList = await this.loadUserSources(userId);
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
      lastSavedAt: workspace.lastSavedAt,
      lastMemorySnapshotHash: workspace.lastMemorySnapshotHash
    }, { merge: true });
  }

  public getOrCreateWorkspace(userId: string, workspaceId: string, projectName?: string): WorkspaceSession {
    const key = `${userId}:${workspaceId}`;
    if (!this.workspaces.has(key)) {
      this.workspaces.set(key, {
        workspaceId,
        userId,
        projectName: projectName || 'پڕۆژەی توێژینەوەی ئەکادیمی',
        activeChapter: 'دەروازە و پێشەکی',
        draftContent: '',
        citationsList: [],
        integrityScore: 0,
        lastMemorySnapshotHash: '',
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

    const snapshot = content.slice(0, 500);
    const snapshotHash = contentHash(snapshot);

    if (snapshotHash !== ws.lastMemorySnapshotHash) {
      await researchMemoryService.addMemoryItem(userId, workspaceId, {
        userId,
        topic: ws.projectName,
        type: 'draft_chapter',
        content: snapshot,
        tags: [ws.activeChapter, 'workspace_auto_save']
      });
      ws.lastMemorySnapshotHash = snapshotHash;
    }

    await this.persistWorkspace(ws);
    try {
      await researchVersionHistoryService.create(userId, {
        projectId: workspaceId,
        workspaceId,
        chapter: ws.activeChapter,
        content: ws.draftContent,
        summary: ws.projectName,
        source: 'autosave'
      });
    } catch (error) {
      console.warn('[ResearchVersionHistory save skipped]:', (error as Error)?.message || error);
    }
    return ws;
  }

  private async syncOrchestrationArtifacts(
    userId: string,
    workspaceId: string,
    topic: string,
    result: any
  ): Promise<void> {
    const memory = await researchMemoryService.hydrateProjectState(userId, workspaceId);
    const grounded = result.groundedGeneration;
    const citations = Array.isArray(grounded?.verifiedCitations) ? grounded.verifiedCitations : [];
    const existing = memory.memoryItems;

    for (const citation of citations.slice(0, 25)) {
      const sourceId = String(citation?.sourceId || '').trim();
      if (!sourceId) continue;
      const duplicate = existing.some(item =>
        item.type === 'source' &&
        String(item.metadata?.['sourceId'] || '') === sourceId
      );
      if (duplicate) continue;

      await researchMemoryService.addMemoryItem(userId, workspaceId, {
        userId,
        topic,
        type: 'source',
        content: String(citation?.evidenceQuote || citation?.inTextCitation || sourceId).slice(0, 20_000),
        tags: ['orchestration', 'verified_source'],
        metadata: {
          sourceId,
          citationId: String(citation?.citationId || ''),
          verified: true,
          evidenceId: String(citation?.evidenceId || '')
        }
      });
    }

    const paragraphs = Array.isArray(grounded?.paragraphs) ? grounded.paragraphs : [];
    for (const paragraph of paragraphs) {
      const claims = Array.isArray(paragraph?.claims) ? paragraph.claims : [];
      for (const claim of claims.slice(0, 20)) {
        if (claim?.citationEligible !== true) continue;
        const sourceId = String(claim?.sourceId || '').trim();
        const sentence = String(claim?.sentenceText || '').trim();
        const evidenceQuote = String(claim?.evidenceQuote || '').trim();
        if (!sourceId || !sentence || !evidenceQuote) continue;

        const duplicate = existing.some(item =>
          item.type === 'claim' &&
          String(item.metadata?.['sourceId'] || '') === sourceId &&
          item.content === sentence
        );
        if (duplicate) continue;

        const claimItem = await researchMemoryService.addMemoryItem(userId, workspaceId, {
          userId,
          topic,
          type: 'claim',
          content: sentence.slice(0, 20_000),
          tags: ['orchestration', 'verified_claim'],
          metadata: {
            sourceId,
            evidenceId: String(claim?.evidenceId || ''),
            citationText: String(claim?.citationText || ''),
            verified: true
          }
        });

        const evidenceDuplicate = existing.some(item =>
          item.type === 'evidence' &&
          String(item.metadata?.['sourceId'] || '') === sourceId &&
          item.content === evidenceQuote
        );
        if (!evidenceDuplicate) {
          await researchMemoryService.addMemoryItem(userId, workspaceId, {
            userId,
            topic,
            type: 'evidence',
            content: evidenceQuote.slice(0, 20_000),
            tags: ['orchestration', 'verified_evidence'],
            metadata: {
              claimId: claimItem.id,
              sourceId,
              evidenceId: String(claim?.evidenceId || ''),
              verified: true
            }
          });
        }
      }
    }
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
        draftText: ws.draftContent || topic,
        rawSources: ws.citationsList as Array<Record<string, unknown>>
      },
      getGeminiClient
    );

    ws.draftContent = orchestrationResult.finalThesisDraftKurdish || ws.draftContent;
    await this.syncOrchestrationArtifacts(userId, workspaceId, topic, orchestrationResult);

    try {
      await researchDecisionLedgerService.add(userId, workspaceId, {
        kind: 'source_selection',
        decision: 'Orchestration sources were selected only after server-side verification.',
        rationale: 'P7 memory now stores the verified source and evidence trail used by the P6 pipeline.',
        evidenceIds: Array.isArray(orchestrationResult.groundedGeneration?.verifiedCitations)
          ? orchestrationResult.groundedGeneration.verifiedCitations
            .map((item: any) => String(item?.evidenceId || '')).filter(Boolean).slice(0, 100)
          : [],
        conflictingEvidence: [],
        impact: 'Updates the traceable research record before validation and manuscript assembly.',
        actor: 'ai_assistant'
      });
      await researchDecisionLedgerService.add(userId, workspaceId, {
        kind: 'writing',
        decision: 'The workspace draft was updated from the multi-agent academic pipeline.',
        rationale: 'The generated draft is linked to the workspace version and evidence-grounded output.',
        evidenceIds: [],
        conflictingEvidence: [],
        impact: 'Provides an explicit decision trace for P9 export validation.',
        actor: 'ai_assistant'
      });
    } catch (error) {
      console.warn('[ResearchDecisionLedger orchestration trace skipped]:', (error as Error)?.message || error);
    }

    const controlPlane = await researchControlPlaneService.snapshot(userId, workspaceId);
    const qaBlocked = orchestrationResult.qaGateResult?.exportBlocked === true;
    ws.integrityScore = qaBlocked || controlPlane.gates.exportBlocked
      ? 0
      : Math.max(0, Math.min(100, Number(orchestrationResult.qaGateResult?.overallQAScore) || 0));
    ws.lastSavedAt = new Date().toISOString();

    await this.persistWorkspace(ws);
    try {
      await researchVersionHistoryService.create(userId, {
        projectId: workspaceId,
        workspaceId,
        chapter: ws.activeChapter,
        content: ws.draftContent,
        summary: topic,
        source: 'orchestration'
      });
    } catch (error) {
      console.warn('[ResearchVersionHistory orchestration skipped]:', (error as Error)?.message || error);
    }

    return {
      workspace: ws,
      orchestration: orchestrationResult,
      controlPlane
    };
  }
}

export const researchProjectStateService = new ResearchProjectStateService();
