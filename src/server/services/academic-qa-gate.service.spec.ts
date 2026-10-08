import { describe, expect, it } from 'vitest';
import { AcademicQAGateService } from './academic-qa-gate.service';

const gemini = () => ({
  models: {
    generateContent: async () => ({
      text: JSON.stringify({
        exportBlocked: false,
        overallQAScore: 100,
        criticalViolationsCount: 0,
        checks: [],
        kurdishSummaryStatus: 'QA passed'
      })
    })
  }
} as any);

describe('AcademicQAGateService strict evidence contract', () => {
  it('blocks a source that claims eligibility without server-verified full text', async () => {
    const service = new AcademicQAGateService();
    const result = await service.runQAGate(
      '',
      [{
        sourceId: 'SRC-1',
        citationEligible: true,
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        existenceVerified: true,
        rejectedAsFabricated: false,
        evidenceText: 'claim evidence',
        evidenceType: 'abstract',
        evidenceProvenance: 'unknown'
      }],
      gemini,
      {
        identityVerifiedSourceCount: 1,
        citationEligibleSourceCount: 1
      }
    );

    expect(result.exportBlocked).toBe(true);
    expect(result.criticalViolationsCount).toBeGreaterThan(0);
  });

  it('allows a source only when the strict evidence fields are complete', async () => {
    const service = new AcademicQAGateService();
    const result = await service.runQAGate(
      '',
      [{
        sourceId: 'SRC-2',
        citationEligible: true,
        identityStatus: 'verified',
        evidenceStatus: 'verified',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceText: 'claim evidence',
        existenceVerified: true,
        rejectedAsFabricated: false
      }],
      gemini,
      {
        identityVerifiedSourceCount: 1,
        citationEligibleSourceCount: 1
      }
    );

    expect(result.exportBlocked).toBe(false);
    expect(result.criticalViolationsCount).toBe(0);
    expect(result.exportContract.approved).toBe(true);
  });
});
