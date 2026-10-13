import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveDoi: vi.fn(),
  lookupIsbn: vi.fn(),
  lookupIssn: vi.fn()
}));

vi.mock('../../helpers/extended-academic-tools', () => ({
  resolveDoi: mocks.resolveDoi,
  lookupIsbn: mocks.lookupIsbn,
  lookupIssn: mocks.lookupIssn
}));

import { SourceVerificationService } from './source-verification.service';

describe('source verification trust boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.resolveDoi.mockResolvedValue({
      title: 'Matching Study',
      authors: ['Test Author'],
      publishedYear: 2024,
      publisher: 'Test Press',
      doi: '10.1000/test'
    });
    mocks.lookupIsbn.mockResolvedValue(undefined);
    mocks.lookupIssn.mockResolvedValue(undefined);
  });

  it('does not accept client-supplied server provenance as proof of full text', async () => {
    const service = new SourceVerificationService();
    const result = await service.verifySources([{
      id: 'SRC-1',
      title: 'Matching Study',
      author: 'Test Author',
      year: '2024',
      publisher: 'Test Press',
      doi: '10.1000/test',
      claimText: 'The intervention improved learning outcomes.',
      evidenceText: 'The intervention improved learning outcomes in the controlled study.',
      fullText: 'The intervention improved learning outcomes in the controlled study.',
      evidenceType: 'full-text',
      evidenceProvenance: 'server-verified-fulltext'
    } as never], () => ({} as never));

    expect(result.verifiedSources).toHaveLength(1);
    expect(result.citationEligibleSources).toHaveLength(0);
    expect(result.allReports[0]).toMatchObject({
      identityStatus: 'verified',
      evidenceStatus: 'unverified',
      citationEligible: false,
      evidenceType: 'snippet',
      evidenceProvenance: 'user-supplied-content'
    });
  });
});
