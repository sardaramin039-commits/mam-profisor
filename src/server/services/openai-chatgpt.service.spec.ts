import { afterEach, describe, expect, it } from 'vitest';
import { OpenAiChatGptService } from './openai-chatgpt.service';

const originalFetch = globalThis.fetch;
const originalKey = process.env['OPENAI_API_KEY'];
const originalReferenceFormatting = process.env['ENABLE_OPENAI_REFERENCE_FORMATTING'];
const originalDiscovery = process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'];

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env['OPENAI_API_KEY'];
  else process.env['OPENAI_API_KEY'] = originalKey;
  if (originalReferenceFormatting === undefined) delete process.env['ENABLE_OPENAI_REFERENCE_FORMATTING'];
  else process.env['ENABLE_OPENAI_REFERENCE_FORMATTING'] = originalReferenceFormatting;
  if (originalDiscovery === undefined) delete process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'];
  else process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] = originalDiscovery;
});

describe('OpenAiChatGptService reference integrity', () => {
  it('uses free academic indexes by default without an OpenAI key', async () => {
    delete process.env['OPENAI_API_KEY'];
    delete process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'];
    const service = new OpenAiChatGptService();
    const result = await service.discoverAcademicSources({
      query: 'social learning theory',
      discipline: 'education',
      limit: 3
    });
    expect(result.provider).toBe('Free academic indexes');
  });

  it('rejects LLM reference metadata not present in raw input', async () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    const service = new OpenAiChatGptService();

    globalThis.fetch = (async () => jsonResponse({
      choices: [{
        message: {
          content: JSON.stringify({
            sortedReferences: [
              {
                title: 'Real Study',
                authors: ['Researcher'],
                year: 2025,
                journalOrPublisher: 'Example Journal',
                sourceType: 'journal',
                citationAPA: 'Fabricated APA citation',
                citationHarvard: 'Fabricated Harvard citation',
                citationMLA: 'Fabricated MLA citation'
              },
              {
                title: 'Fabricated Study',
                authors: ['Invented Author'],
                year: 2026,
                journalOrPublisher: 'Invented Journal',
                sourceType: 'journal',
                doi: '10.9999/fake'
              }
            ],
            curatedBibliography: 'Fabricated Study should never escape.',
            inTextCitationGuide: '(Researcher, 2025)'
          })
        }
      }]
    })) as typeof fetch;

    const result = await service.organizeAndFormatReferences({
      topic: 'topic',
      rawReferences: 'Real Study; Researcher; 2025; Example Journal',
      citationStyle: 'apa'
    });

    expect(result.sortedReferences).toHaveLength(1);
    expect(result.sortedReferences[0]?.title).toBe('Real Study');
    expect(result.sortedReferences[0]?.verificationStatus).toBe('retrieved-not-verified');
    expect(result.sortedReferences[0]?.citationAPA).toBe(
      'Researcher (2025). Real Study. Example Journal.'
    );
    expect(result.sortedReferences[0]?.citationAPA).not.toContain('Fabricated');
    expect(result.curatedBibliography).toContain('Real Study');
    expect(result.curatedBibliography).not.toContain('Fabricated Study');
    expect(result.curatedBibliography).not.toContain('10.9999/fake');
  });

  it('does not create references when raw input is empty', async () => {
    const service = new OpenAiChatGptService();
    const result = await service.organizeAndFormatReferences({
      topic: 'topic',
      rawReferences: ''
    });

    expect(result.sortedReferences).toEqual([]);
    expect(result.curatedBibliography).toBe('');
    expect(result.provider).toBe('No-Language-Model');
  });

  it('formats raw references for free without an OpenAI key', async () => {
    delete process.env['OPENAI_API_KEY'];
    delete process.env['ENABLE_OPENAI_REFERENCE_FORMATTING'];
    const service = new OpenAiChatGptService();

    const result = await service.organizeAndFormatReferences({
      topic: 'topic',
      rawReferences: 'Social Learning; Albert Bandura; 1977; Prentice-Hall',
      citationStyle: 'apa'
    });

    expect(result.provider).toBe('Free deterministic formatter');
    expect(result.sortedReferences).toHaveLength(1);
    expect(result.sortedReferences[0]?.title).toBe('Social Learning');
    expect(result.sortedReferences[0]?.authors).toEqual(['Albert Bandura']);
    expect(result.sortedReferences[0]?.year).toBe('1977');
    expect(result.curatedBibliography).toContain('Social Learning');
    expect(result.curatedBibliography).not.toContain('Invented');
  });

  it('uses ChatGPT web search as the source discovery engine when explicitly enabled', async () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['ENABLE_OPENAI_SOURCE_DISCOVERY'] = 'true';
    const service = new OpenAiChatGptService();

    globalThis.fetch = (async () => jsonResponse({
      output: [
        {
          type: 'web_search_call',
          action: {
            sources: [
              {
                title: 'Verified Study Candidate',
                url: 'https://doi.org/10.1000/example'
              },
              {
                title: 'Second Study Candidate',
                url: 'https://openalex.org/W123456'
              }
            ]
          }
        },
        {
          type: 'message',
          content: [{
            text: JSON.stringify({
              thematicSummary: 'Academic summary',
              suggestedKeywords: ['learning', 'education']
            })
          }]
        }
      ],
      output_text: JSON.stringify({
        thematicSummary: 'Academic summary',
        suggestedKeywords: ['learning', 'education']
      })
    })) as typeof fetch;

    const result = await service.discoverAcademicSources({
      query: 'social learning theory',
      discipline: 'education',
      limit: 5
    });

    expect(result.provider).toBe('OpenAI Responses API web_search');
    expect(result.discoveredSources).toHaveLength(2);
    expect(result.discoveredSources[0]?.url).toBe('https://doi.org/10.1000/example');
    expect(result.discoveredSources[0]?.title).toBe('Verified Study Candidate');
    expect(result.discoveredSources[0]?.verificationStatus).toBe('retrieved-not-verified');
    expect(result.discoveredSources[1]?.url).toBe('https://openalex.org/W123456');
    expect(result.discoveredSources[0]?.doi).toBe('10.1000/example');
    expect(result.discoveredSources[1]?.openAlexId).toBe('W123456');
    expect(result.discoveredSources[0]?.authors).toEqual([]);
    expect(result.discoveredSources[0]?.year).toBe('n.d.');
  });

  it('builds the in-text citation guide only from validated references', async () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    const service = new OpenAiChatGptService();

    globalThis.fetch = (async () => jsonResponse({
      choices: [{
        message: {
          content: JSON.stringify({
            sortedReferences: [{
              title: 'Social Learning',
              authors: ['Albert Bandura', 'Richard H. Walters'],
              year: 1977,
              journalOrPublisher: 'Prentice-Hall',
              sourceType: 'book'
            }],
            inTextCitationGuide: '(Invented Author, 2099)'
          })
        }
      }]
    })) as typeof fetch;

    const result = await service.organizeAndFormatReferences({
      topic: 'social learning',
      rawReferences: 'Social Learning; Albert Bandura; Richard H. Walters; 1977; Prentice-Hall',
      citationStyle: 'apa'
    });

    expect(result.inTextCitationGuide).toBe(
      '- Social Learning: (Bandura & Walters, 1977)'
    );
    expect(result.inTextCitationGuide).not.toContain('Invented Author');
    expect(result.inTextCitationGuide).not.toContain('2099');
  });
});
