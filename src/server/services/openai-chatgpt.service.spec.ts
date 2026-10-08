import { afterEach, describe, expect, it } from 'vitest';
import { OpenAiChatGptService } from './openai-chatgpt.service';

const originalFetch = globalThis.fetch;
const originalKey = process.env['OPENAI_API_KEY'];

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
});

describe('OpenAiChatGptService reference integrity', () => {
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
