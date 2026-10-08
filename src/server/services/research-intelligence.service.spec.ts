import { afterEach, describe, expect, it } from 'vitest';
import { researchIntelligenceService } from './research-intelligence.service';
import { sourceVerificationService } from './source-verification.service';

const originalFetch = globalThis.fetch;
const originalOpenAiKey = process.env['OPENAI_API_KEY'];
const originalOpenAiDiscovery = process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'];
const originalBillable = process.env['ALLOW_BILLABLE_AI'];

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOpenAiKey === undefined) delete process.env['OPENAI_API_KEY'];
  else process.env['OPENAI_API_KEY'] = originalOpenAiKey;
  if (originalOpenAiDiscovery === undefined) delete process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'];
  else process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] = originalOpenAiDiscovery;
  if (originalBillable === undefined) delete process.env['ALLOW_BILLABLE_AI'];
  else process.env['ALLOW_BILLABLE_AI'] = originalBillable;
});

function response(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

describe('research intelligence discovery', () => {
  it('uses ChatGPT web search as the primary discovery source when explicitly enabled', async () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] = 'true';
    process.env['ALLOW_BILLABLE_AI'] = 'true';
    globalThis.fetch = (async () => response({
      output: [{
        type: 'web_search_call',
        action: {
          sources: [
            {
              title: 'ChatGPT Discovered Academic Study',
              url: 'https://doi.org/10.1000/example'
            },
            {
              title: 'ChatGPT Discovered University Source',
              url: 'https://example.edu/research'
            }
          ]
        }
      }],
      output_text: JSON.stringify({
        thematicSummary: 'Academic source discovery summary',
        suggestedKeywords: ['learning', 'education']
      })
    })) as typeof fetch;

    const result = await researchIntelligenceService.discover(
      'کاریگەریی فێربوون',
      'دەروونناسی'
    );

    expect(result.providers).toContain('OpenAI Responses API web_search');
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0]?.url).toBe('https://doi.org/10.1000/example');
    expect(result.sources[0]?.title).toBe('ChatGPT Discovered Academic Study');
    expect(result.sources[0]?.verificationStatus).toBe('retrieved-not-verified');
    expect(result.sources[0]?.authors).toEqual([]);
    expect(result.sources[0]?.year).toBe('n.d.');
  });
});


describe('research intelligence verification flow', () => {
  it('verifies discovered candidates when no source records are provided', async () => {
    const originalDiscover = researchIntelligenceService.discover;
    const originalVerify = sourceVerificationService.verifySources;

    researchIntelligenceService.discover = async () => ({
      query: 'topic discipline',
      sources: [{
        id: 'S-DISC-1',
        title: 'Discovered Study',
        authors: ['Researcher'],
        year: '2025',
        sourceType: 'OpenAlex',
        url: 'https://openalex.org/W1',
        snippet: '',
        confidenceScore: 70,
        peerReviewed: false
      }],
      total: 1,
      providers: ['OpenAlex'],
      verificationPolicy: 'verified-only'
    });

    let verifiedInput: any[] = [];
    sourceVerificationService.verifySources = async (sources: any[]) => {
      verifiedInput = sources;
      return {
        verifiedSources: [{
          sourceId: 'S-DISC-1',
          sourceTitle: 'Discovered Study',
          author: 'Researcher',
          publisher: 'Journal',
          integrityScore: 80,
          trustLevel: 'C',
          existenceVerified: true,
          identityStatus: 'verified',
          evidenceStatus: 'not_available',
          citationEligible: false,
          metadataAccuracy: 100,
          peerReviewed: false,
          rejectedAsFabricated: false,
          kurdishVerificationDetails: 'verified identity'
        }],
        citationEligibleSources: [],
        rejectedSources: [],
        unverifiedSources: [],
        allReports: [],
        rejectedSourcesCount: 0
      };
    };

    const ai = {
      models: {
        generateContent: async () => ({ text: '{}' })
      }
    } as any;

    try {
      const result = await researchIntelligenceService.execute({
        topic: 'topic',
        discipline: 'discipline'
      }, () => ai);

      expect(verifiedInput).toHaveLength(1);
      expect(verifiedInput[0]?.id).toBe('S-DISC-1');
      expect(result.sourceVerification.received).toBe(1);
      expect(result.sourceVerification.identityVerified).toBe(1);
    } finally {
      researchIntelligenceService.discover = originalDiscover;
      sourceVerificationService.verifySources = originalVerify;
    }
  });
});


describe('research intelligence resilience', () => {
  it('keeps the audit usable when one AI analysis module fails', async () => {
    const originalDiscover = researchIntelligenceService.discover;
    const originalVerify = sourceVerificationService.verifySources;

    researchIntelligenceService.discover = async () => ({
      query: 'topic discipline',
      sources: [],
      total: 0,
      providers: [],
      verificationPolicy: 'verified-only'
    });

    sourceVerificationService.verifySources = async () => ({
      verifiedSources: [{
        sourceId: 'S-EVID-1',
        sourceTitle: 'Evidence Study',
        author: 'Researcher',
        publisher: 'Journal',
        integrityScore: 80,
        trustLevel: 'C',
        existenceVerified: true,
        identityStatus: 'verified',
        evidenceStatus: 'not_available',
        citationEligible: false,
        metadataAccuracy: 100,
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: 'verified identity'
      }],
      citationEligibleSources: [],
      rejectedSources: [],
      unverifiedSources: [],
      allReports: [{
        sourceId: 'S-EVID-1',
        sourceTitle: 'Evidence Study',
        author: 'Researcher',
        publisher: 'Journal',
        integrityScore: 80,
        trustLevel: 'C',
        existenceVerified: true,
        identityStatus: 'verified',
        evidenceStatus: 'not_available',
        citationEligible: false,
        metadataAccuracy: 100,
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: 'verified identity'
      }],
      rejectedSourcesCount: 0
    });

    let callCount = 0;
    const ai = {
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount === 2) throw new Error('forced methodology failure');
          return { text: '{}' };
        }
      }
    } as any;

    try {
      const result = await researchIntelligenceService.execute({
        topic: 'topic',
        discipline: 'discipline'
      }, () => ai);

      expect(result.analysisStatus.planner).toBe('ok');
      expect(result.analysisStatus.methodology).toBe('degraded');
      expect(result.analysisStatus.factCheck).toBe('ok');
      expect(result.analysisStatus.consistency).toBe('ok');
      expect(result.methodology.status).toBe('review');
    } finally {
      researchIntelligenceService.discover = originalDiscover;
      sourceVerificationService.verifySources = originalVerify;
    }
  });
});


describe('claim to evidence linking', () => {
  it('links claims only to sources with evidence and never marks them verified', async () => {
    const originalDiscover = researchIntelligenceService.discover;
    const originalVerify = sourceVerificationService.verifySources;

    researchIntelligenceService.discover = async () => ({
      query: 'topic discipline',
      sources: [{
        id: 'S-EVID-1',
        title: 'Evidence Study',
        authors: ['Researcher'],
        year: '2025',
        sourceType: 'OpenAlex',
        url: 'https://openalex.org/W1',
        snippet: '',
        evidenceText: 'peer tutoring improves academic achievement among students',
        evidenceType: 'abstract',
        evidenceUrl: 'https://example.org/evidence',
        confidenceScore: 70,
        peerReviewed: false
      }],
      total: 1,
      providers: ['OpenAlex'],
      verificationPolicy: 'verified-only'
    });

    sourceVerificationService.verifySources = async () => ({
      verifiedSources: [{
        sourceId: 'S-EVID-1',
        sourceTitle: 'Evidence Study',
        author: 'Researcher',
        publisher: 'Journal',
        integrityScore: 80,
        trustLevel: 'C',
        existenceVerified: true,
        identityStatus: 'verified',
        evidenceStatus: 'not_available',
        citationEligible: false,
        metadataAccuracy: 100,
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: 'verified identity'
      }],
      citationEligibleSources: [],
      rejectedSources: [],
      unverifiedSources: [],
      allReports: [{
        sourceId: 'S-EVID-1',
        sourceTitle: 'Evidence Study',
        author: 'Researcher',
        publisher: 'Journal',
        integrityScore: 80,
        trustLevel: 'C',
        existenceVerified: true,
        identityStatus: 'verified',
        evidenceStatus: 'not_available',
        citationEligible: false,
        metadataAccuracy: 100,
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: 'verified identity'
      }],
      rejectedSourcesCount: 0
    });

    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claim: 'peer tutoring improves academic achievement among students'
            }]
          })
        })
      }
    } as any;

    try {
      const result = await researchIntelligenceService.execute({
        topic: 'topic',
        discipline: 'discipline',
        draftText: 'peer tutoring improves academic achievement among students'
      }, () => ai);

      expect(result.evidenceLinks).toHaveLength(1);
      expect(result.evidenceLinks[0]?.sourceId).toBe('S-EVID-1');
      expect(result.evidenceLinks[0]?.overlapScore).toBeGreaterThanOrEqual(70);
      expect(result.evidenceLinks[0]?.verificationStatus).toBe('verified');
      expect(result.evidenceLinks[0]?.claimCitationEligible).toBe(false);
      expect(result.evidenceLinks[0]?.evidenceUrl).toBe('https://example.org/evidence');
      expect(result.evidenceLinks[0]?.evidenceType).toBe('abstract');
      expect(result.evidenceLinks[0]?.provider).toBe('OpenAlex');
      expect(result.evidenceLinks[0]?.evidenceProvenance).toBe('unknown');
      expect(result.evidenceLinks[0]?.evidenceFingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(result.sourceVerification.citationEligible).toBe(0);
    } finally {
      researchIntelligenceService.discover = originalDiscover;
      sourceVerificationService.verifySources = originalVerify;
    }
  });
});


describe('strict citation evidence gate', () => {
  it('allows citation eligibility only for server-verified full text', async () => {
    const originalDiscover = researchIntelligenceService.discover;
    const originalVerify = sourceVerificationService.verifySources;

    researchIntelligenceService.discover = async () => ({
      query: 'topic discipline',
      sources: [{
        id: 'S-FULL-1',
        title: 'Full Text Study',
        authors: ['Researcher'],
        year: '2025',
        sourceType: 'OpenAlex',
        url: 'https://example.org/full',
        snippet: '',
        evidenceText: 'peer tutoring improves academic achievement among students',
        evidenceType: 'full-text',
        evidenceProvenance: 'server-verified-fulltext',
        evidenceUrl: 'https://example.org/full',
        confidenceScore: 90,
        peerReviewed: false
      }],
      total: 1,
      providers: ['OpenAlex'],
      verificationPolicy: 'verified-only'
    });

    sourceVerificationService.verifySources = async () => ({
      verifiedSources: [{
        sourceId: 'S-FULL-1',
        sourceTitle: 'Full Text Study',
        author: 'Researcher',
        publisher: 'Journal',
        integrityScore: 90,
        trustLevel: 'C',
        existenceVerified: true,
        identityStatus: 'verified',
        evidenceStatus: 'not_available',
        citationEligible: false,
        metadataAccuracy: 100,
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: 'verified identity'
      }],
      citationEligibleSources: [],
      rejectedSources: [],
      unverifiedSources: [],
      allReports: [{
        sourceId: 'S-FULL-1',
        sourceTitle: 'Full Text Study',
        author: 'Researcher',
        publisher: 'Journal',
        integrityScore: 90,
        trustLevel: 'C',
        existenceVerified: true,
        identityStatus: 'verified',
        evidenceStatus: 'not_available',
        citationEligible: false,
        metadataAccuracy: 100,
        peerReviewed: false,
        rejectedAsFabricated: false,
        kurdishVerificationDetails: 'verified identity'
      }],
      rejectedSourcesCount: 0
    });

    const ai = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            claims: [{
              claim: 'peer tutoring improves academic achievement among students'
            }]
          })
        })
      }
    } as any;

    try {
      const result = await researchIntelligenceService.execute({
        topic: 'topic',
        discipline: 'discipline',
        draftText: 'peer tutoring improves academic achievement among students'
      }, () => ai);

      expect(result.evidenceLinks[0]?.claimCitationEligible).toBe(true);
      expect(result.evidenceLinks[0]?.evidenceType).toBe('full-text');
      expect(result.evidenceLinks[0]?.evidenceProvenance).toBe('server-verified-fulltext');
    } finally {
      researchIntelligenceService.discover = originalDiscover;
      sourceVerificationService.verifySources = originalVerify;
    }
  });
});
