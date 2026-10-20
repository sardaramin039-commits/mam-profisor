import { describe, expect, it, vi } from 'vitest';
import { ContradictionDetectionService } from './contradiction-detection.service';

const sources = [
  {
    sourceId: 'SRC-A', sourceTitle: 'Source A', title: 'Source A',
    identityStatus: 'verified', evidenceStatus: 'verified', evidenceType: 'full-text',
    evidenceProvenance: 'server-verified-fulltext', existenceVerified: true,
    evidenceText: 'Study A states the intervention improved reading scores in this sample.'
  },
  {
    sourceId: 'SRC-B', sourceTitle: 'Source B', title: 'Source B',
    identityStatus: 'verified', evidenceStatus: 'verified', evidenceType: 'full-text',
    evidenceProvenance: 'server-verified-fulltext', existenceVerified: true,
    evidenceText: 'Study B states the intervention did not improve reading scores in this sample.'
  }
];

const claims = [
  {
    claimId: 'CLAIM-A', sourceId: 'SRC-A', evidenceId: 'EVI-A',
    quote: 'the intervention improved reading scores', text: 'The intervention improved reading scores.',
    verificationStatus: 'verified', evidenceProvenance: 'server-verified-fulltext'
  },
  {
    claimId: 'CLAIM-B', sourceId: 'SRC-B', evidenceId: 'EVI-B',
    quote: 'the intervention did not improve reading scores', text: 'The intervention did not improve reading scores.',
    verificationStatus: 'verified', evidenceProvenance: 'server-verified-fulltext'
  }
];

function clientWithFindings(findings: unknown) {
  const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify({ findings }) });
  return {
    client: { models: { generateContent } } as any,
    generateContent
  };
}

describe('contradiction detection evidence and reference integrity', () => {
  it('returns insufficient evidence without invoking the model for unverified claims', async () => {
    const { client, generateContent } = clientWithFindings([]);
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      claims.map(claim => ({ ...claim, verificationStatus: 'unverified' })),
      sources,
      () => client
    );
    expect(result.status).toBe('insufficient_evidence');
    expect(result.findings).toEqual([]);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('does not treat verified identity without server-verified full text as contradiction evidence', async () => {
    const { client, generateContent } = clientWithFindings([]);
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      claims,
      sources.map(source => ({ ...source, evidenceType: 'abstract' })),
      () => client
    );
    expect(result.status).toBe('insufficient_evidence');
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns a supported candidate only when both exact claims and eligible sources match', async () => {
    const { client } = clientWithFindings([{
      id: 'CON-1',
      claimA: 'The intervention improved reading scores.',
      claimB: 'The intervention did not improve reading scores.',
      sourceA: 'SRC-A',
      sourceB: 'SRC-B',
      severity: 'high',
      explanationKurdish: 'دو بانگەشە لەبارەی کاریگەریی هەمان جێبەجێکردن جیاوازن.'
    }]);
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      claims,
      sources,
      () => client
    );
    expect(result.status).toBe('review_required');
    expect(result.contradictionCount).toBe(1);
    expect(result.highSeverityCount).toBe(1);
    expect(result.findings[0]).toMatchObject({
      id: 'CON-1',
      sourceA: 'Source A',
      sourceB: 'Source B',
      status: 'supported',
      severity: 'high'
    });
  });

  it('does not bind a source reference to a different claim from that same source', async () => {
    const { client } = clientWithFindings([{
      claimA: 'A made-up claim not in the evidence graph.',
      claimB: 'The intervention did not improve reading scores.',
      sourceA: 'SRC-A',
      sourceB: 'SRC-B',
      severity: 'high',
      explanationKurdish: 'ساختە'
    }]);
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      claims,
      sources,
      () => client
    );
    expect(result.findings).toEqual([]);
    expect(result.contradictionCount).toBe(0);
    expect(result.status).toBe('clear');
  });

  it('blocks claims whose quote does not appear in the linked source evidence', async () => {
    const { client, generateContent } = clientWithFindings([]);
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      [{ ...claims[0], quote: 'this text does not appear in source A' }, claims[1]],
      sources,
      () => client
    );
    expect(result.status).toBe('insufficient_evidence');
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('fails closed when source IDs are duplicated or unavailable', async () => {
    const { client, generateContent } = clientWithFindings([]);
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      claims,
      [...sources, { ...sources[0], title: 'Ambiguous duplicate' }],
      () => client
    );
    expect(result.status).toBe('insufficient_evidence');
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('rejects malformed provider response and reports insufficient evidence', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: '{broken' });
    const result = await new ContradictionDetectionService().analyze(
      'Reading intervention',
      claims,
      sources,
      () => ({ models: { generateContent } } as any)
    );
    expect(result).toMatchObject({
      findings: [],
      contradictionCount: 0,
      highSeverityCount: 0,
      status: 'insufficient_evidence'
    });
  });
});
