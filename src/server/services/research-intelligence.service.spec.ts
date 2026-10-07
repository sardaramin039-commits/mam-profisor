import { afterEach, describe, expect, it } from 'vitest';
import { researchIntelligenceService } from './research-intelligence.service';
import { sourceVerificationService } from './source-verification.service';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function response(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

describe('research intelligence discovery', () => {
  it('uses OpenAlex and Crossref and deduplicates identical DOI records', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('api.openalex.org/works')) {
        return response({
          results: [{
            id: 'https://openalex.org/W123',
            doi: 'https://doi.org/10.1000/example',
            title: 'Example Academic Study',
            publication_year: 2025,
            authorships: [{ author: { display_name: 'Example Author' } }],
            primary_location: {
              landing_page_url: 'https://example.org/paper',
              source: { display_name: 'Example Journal' }
            },
            cited_by_count: 12,
            abstract_inverted_index: {
              Example: [0],
              'academic': [1],
              abstract: [2]
            }
          }]
        });
      }

      if (url.includes('api.crossref.org/works')) {
        return response({
          message: {
            items: [{
              DOI: '10.1000/example',
              title: ['Example Academic Study'],
              author: [{ given: 'Example', family: 'Author' }],
              publisher: 'Example Publisher',
              published: { 'date-parts': [[2025]] },
              URL: 'https://doi.org/10.1000/example',
              'container-title': ['Example Journal'],
              'is-referenced-by-count': 12,
              abstract: '<jats:p>Example academic abstract evidence.</jats:p>'
            }]
          }
        });
      }

      return response({ results: [], data: [], message: { items: [] }, response: { docs: [] }, items: [] });
    }) as typeof fetch;

    const result = await researchIntelligenceService.discover(
      'کاریگەریی فێربوون',
      'دەروونناسی'
    );

    expect(result.providers).toContain('OpenAlex');
    expect(result.providers).toContain('Crossref');
    expect(result.sources.filter(source => source.doi === '10.1000/example')).toHaveLength(1);
    expect(result.sources[0]?.title).toBe('Example Academic Study');
    expect(result.sources[0]?.evidenceText).toBeTruthy();
    expect(result.sources[0]?.evidenceType).toBe('abstract');
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
        confidenceScore: 70,
        peerReviewed: false
      }],
      total: 1,
      providers: ['OpenAlex'],
      verificationPolicy: 'verified-only'
    });

    sourceVerificationService.verifySources = async () => ({
      verifiedSources: [],
      citationEligibleSources: [],
      rejectedSources: [],
      unverifiedSources: [],
      allReports: [],
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
      expect(result.evidenceLinks[0]?.claimCitationEligible).toBe(true);
      expect(result.sourceVerification.citationEligible).toBe(0);
    } finally {
      researchIntelligenceService.discover = originalDiscover;
      sourceVerificationService.verifySources = originalVerify;
    }
  });
});
