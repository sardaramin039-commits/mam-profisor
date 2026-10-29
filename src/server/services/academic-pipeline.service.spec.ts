import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateGeminiContent: vi.fn(),
  verifyAndRefineSection: vi.fn(),
  discover: vi.fn()
}));

vi.mock('./gemini.service', () => ({
  generateGeminiContent: mocks.generateGeminiContent
}));

vi.mock('./academic-level-critic.service', () => ({
  academicLevelCriticService: {
    verifyAndRefineSection: mocks.verifyAndRefineSection
  }
}));

vi.mock('./academic-source-discovery.service', () => ({
  academicSourceDiscoveryService: {
    discover: mocks.discover
  }
}));

import { executeAcademicPipeline } from './academic-pipeline.service';

const validOutline = {
  introductionOutline: ['Background', 'Research problem'],
  chapters: [{
    title: 'Chapter one',
    purpose: 'Establish the context',
    sections: [{
      title: 'Section one',
      subSections: [{
        code: '1.1',
        title: 'First subsection',
        purpose: 'Explain the central concept',
        keyQuestions: ['What is the concept?']
      }]
    }]
  }],
  conclusionOutline: ['Supported conclusions', 'Limitations']
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.discover.mockResolvedValue([]);
});

describe('academic pipeline integrity and sequencing', () => {
  it('rejects a blank title before making any provider request', async () => {
    const iterator = executeAcademicPipeline({ title: '   ', level: 'phd' });

    await expect(iterator.next()).rejects.toThrow('research title is required');
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
    expect(mocks.discover).not.toHaveBeenCalled();
  });

  it('rejects an outline with no chapters instead of falling back to a generic thesis template', async () => {
    mocks.generateGeminiContent.mockResolvedValueOnce({
      introductionOutline: [],
      chapters: [],
      conclusionOutline: []
    });

    const iterator = executeAcademicPipeline({ title: 'A valid research topic', level: 'master' });
    expect(await iterator.next()).toMatchObject({
      done: false,
      value: { stage: 'grounding' }
    });
    expect(await iterator.next()).toMatchObject({
      done: false,
      value: { stage: 'blueprint' }
    });

    await expect(iterator.next()).rejects.toThrow('contains no chapters');
  });

  it('uses validated external source candidates and labels them unverified', async () => {
    const getGeminiClient = () => ({} as never);
    mocks.discover.mockResolvedValue([
        {
          id: 'source-1',
          title: 'A real indexed candidate',
          authors: ['Example Author'],
          year: 2024,
          sourceType: 'Crossref',
          url: 'https://doi.org/10.1234/example',
          abstract: 'A short metadata description.'
        },
        {
          id: 'unsafe',
          title: 'Untrusted URL',
          url: 'javascript:alert(1)'
        },
        {
          id: 'duplicate',
          title: 'Duplicate candidate',
          url: 'https://doi.org/10.1234/example'
        }
    ]);
    mocks.generateGeminiContent
      .mockResolvedValueOnce(validOutline)
      .mockResolvedValueOnce('A cautious introduction that identifies evidence gaps.')
      .mockResolvedValueOnce('A draft subsection that requires source verification.')
      .mockResolvedValueOnce('A conclusion limited to the manuscript content.');
    mocks.verifyAndRefineSection.mockResolvedValue({
      isSuitableForLevel: true,
      detectedIssues: [],
      refinedMarkdown: 'A critically refined subsection.'
    });

    const events = [];
    for await (const event of executeAcademicPipeline({
      title: 'A topic-specific research title',
      level: 'phd',
      discipline: 'History',
      getGeminiClient
    })) {
      events.push(event);
    }

    expect(mocks.discover).toHaveBeenCalledWith(
      'A topic-specific research title',
      'History',
      getGeminiClient
    );
    const blueprintEvent = events.find(event => event.stage === 'blueprint' && event.partialMarkdown);
    expect(blueprintEvent?.partialMarkdown).toContain('A real indexed candidate');
    expect(blueprintEvent?.partialMarkdown).toContain('https://doi.org/10.1234/example');
    expect(blueprintEvent?.partialMarkdown).toContain('retrieved-not-verified');
    expect(blueprintEvent?.partialMarkdown).not.toContain('javascript:');
    expect(mocks.generateGeminiContent.mock.calls[0]?.[0].prompt).toContain('A real indexed candidate');

    const stages = events.map(event => event.stage);
    expect(stages[0]).toBe('grounding');
    expect(stages).toContain('blueprint');
    expect(stages).toContain('critic_refining');
    expect(stages).toContain('writing_subsection');
    expect(stages).toContain('conclusion');
    expect(stages.at(-1)).toBe('completed');
    expect(events.at(-1)?.partialMarkdown).toContain('retrieved-not-verified');
    expect(events.at(-1)?.partialMarkdown).toContain('DOI/URL');
    expect(mocks.verifyAndRefineSection).toHaveBeenCalledOnce();
    expect(mocks.verifyAndRefineSection).toHaveBeenCalledWith(
      'A draft subsection that requires source verification.',
      'phd',
      'First subsection'
    );
    expect(mocks.generateGeminiContent).toHaveBeenCalledTimes(4);
  });
});
