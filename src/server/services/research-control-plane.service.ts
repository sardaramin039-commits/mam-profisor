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
    verifiedEvidence: number;
    decisions: number;
    evidenceCoverage: number;
  };
  gates: {
    methodologyReady: boolean;
    evidenceReady: boolean;
    decisionTraceable: boolean;
    reviewRequired: boolean;
    exportBlocked: boolean;
    readyForManuscript: boolean;
    blockers: string[];
  };
}

class ResearchControlPlaneService {
  async snapshot(userId: string, projectId: string): Promise<ResearchControlPlane> {
    const memory = await researchMemoryService.hydrateProjectState(userId, projectId);
    const decisions = await researchDecisionLedgerService.list(userId, projectId);
    const evidenceItems = memory.memoryItems.filter(item => item.type === 'evidence');
    const verifiedEvidence = evidenceItems.filter(
      item => item.metadata?.['verified'] === true
    ).length;
    const methodologyReady = memory.memoryItems.some(
      item => item.tags.includes('methodology') && item.content.trim().length > 0
    );
    const evidenceReady =
      memory.sourcesCount > 0 &&
      verifiedEvidence > 0 &&
      memory.evidenceCoverage >= (memory.claimsCount > 0 ? 80 : 0);
    const decisionTraceable = decisions.length > 0;
    const reviewRequired = memory.claimsCount > 0 && memory.evidenceCoverage < 80;
    const gates = evaluateResearchControlGates({
      methodologyReady,
      evidenceReady,
      decisionTraceable,
      reviewRequired,
      sourcesCount: memory.sourcesCount,
      claimsCount: memory.claimsCount,
      evidenceCount: evidenceItems.length,
      decisionCount: decisions.length,
      evidenceCoverage: memory.evidenceCoverage
    });

    const stage = gates.exportBlocked
      ? !methodologyReady
        ? 'research'
        : !evidenceReady
          ? 'evidence'
          : reviewRequired
            ? 'review'
            : 'writing'
      : 'export';

    return {
      projectId,
      stage,
      metrics: {
        sources: memory.sourcesCount,
        claims: memory.claimsCount,
        evidence: evidenceItems.length,
        verifiedEvidence,
        decisions: decisions.length,
        evidenceCoverage: Math.max(0, Math.min(100, memory.evidenceCoverage))
      },
      gates
    };
  }
}

export const researchControlPlaneService = new ResearchControlPlaneService();
