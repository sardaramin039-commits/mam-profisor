import { researchDecisionLedgerService } from './research-decision-ledger.service';
import { researchMemoryService } from './research-memory.service';
import { evaluateResearchControlGates } from './research-validation-policy';

export interface ResearchControlPlane {
  projectId: string;
  stage: 'setup' | 'research' | 'evidence' | 'writing' | 'review' | 'export';
  metrics: {
    sources: number;
    claims: number;
    evidence: number;
    decisions: number;
    evidenceCoverage: number;
  };
  gates: {
    methodologyReady: boolean;
    evidenceReady: boolean;
    decisionTraceable: boolean;
    reviewRequired: boolean;
    exportBlocked: boolean;
  };
}

class ResearchControlPlaneService {
  async snapshot(userId: string, projectId: string): Promise<ResearchControlPlane> {
    const memory = await researchMemoryService.hydrateProjectState(userId, projectId);
    const decisions = await researchDecisionLedgerService.list(userId, projectId);
    const evidence = memory.memoryItems.filter(item => item.type === 'evidence').length;
    const methodologyReady = memory.memoryItems.some(item => item.tags.includes('methodology'));
    const evidenceReady = memory.sourcesCount > 0 && evidence > 0;
    const decisionTraceable = decisions.length > 0;
    const reviewRequired = memory.claimsCount > 0 && memory.evidenceCoverage < 80;
    const gates = evaluateResearchControlGates({
      methodologyReady,
      evidenceReady,
      decisionTraceable,
      reviewRequired
    });
    const stage = gates.exportBlocked
      ? (memory.claimsCount > 0 ? 'review' : memory.sourcesCount > 0 ? 'evidence' : 'research')
      : 'export';

    return {
      projectId,
      stage,
      metrics: {
        sources: memory.sourcesCount,
        claims: memory.claimsCount,
        evidence,
        decisions: decisions.length,
        evidenceCoverage: Math.max(0, Math.min(100, memory.evidenceCoverage))
      },
      gates
    };
  }
}

export const researchControlPlaneService = new ResearchControlPlaneService();
