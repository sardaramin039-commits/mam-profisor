import { adminDb } from '../../lib/firebase-admin';

export type DecisionKind =
  | 'research_question'
  | 'methodology'
  | 'source_selection'
  | 'evidence_interpretation'
  | 'analysis'
  | 'writing'
  | 'citation'
  | 'revision'
  | 'other';

export interface ResearchDecision {
  id: string;
  projectId: string;
  userId: string;
  kind: DecisionKind;
  decision: string;
  rationale: string;
  evidenceIds: string[];
  conflictingEvidence: string[];
  impact: string;
  actor: 'user' | 'ai_assistant' | 'reviewer';
  createdAt: string;
}

class ResearchDecisionLedgerService {
  private ref(userId: string, projectId: string) {
    return adminDb.collection('research_decision_ledger').doc(userId).collection('projects').doc(projectId);
  }

  async list(userId: string, projectId: string): Promise<ResearchDecision[]> {
    const snapshot = await this.ref(userId, projectId).collection('decisions').orderBy('createdAt', 'desc').limit(300).get();
    return snapshot.docs.map(doc => doc.data() as ResearchDecision);
  }

  async add(
    userId: string,
    projectId: string,
    input: Omit<ResearchDecision, 'id' | 'userId' | 'projectId' | 'createdAt'>
  ): Promise<ResearchDecision> {
    const now = new Date().toISOString();
    const decision: ResearchDecision = {
      ...input,
      id: `DEC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      userId,
      createdAt: now,
      evidenceIds: input.evidenceIds.slice(0, 100),
      conflictingEvidence: input.conflictingEvidence.slice(0, 100)
    };
    await this.ref(userId, projectId).collection('decisions').doc(decision.id).set(decision);
    return decision;
  }
}

export const researchDecisionLedgerService = new ResearchDecisionLedgerService();
