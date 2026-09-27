import { Injectable, inject } from '@angular/core';
import { AcademicStoreService } from '../services/academic-store.service';
import { ACADEMIC_AGENTS, AcademicAgent } from './index';

@Injectable({
  providedIn: 'root'
})
export class OrchestratorAgentService {
  private store = inject(AcademicStoreService);

  getAllAgents(): AcademicAgent[] {
    return ACADEMIC_AGENTS;
  }

  getAgentMetadata(agentId = 'research-planner'): AcademicAgent | undefined {
    return ACADEMIC_AGENTS.find(a => a.id === agentId);
  }

  async orchestrateWorkflow(taskType: string, payload: unknown) {
    console.log(`[UltimateAcademicOrchestrator] Initiating workflow task: ${taskType}`, payload);
    this.store.addLog(`[12-Agent System] جێبەجێکردنی پرۆسەی زانستی: ${taskType}`);
    return { status: 'success', taskType, agentCount: ACADEMIC_AGENTS.length, timestamp: new Date().toISOString() };
  }
}

