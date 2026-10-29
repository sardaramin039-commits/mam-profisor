import { describe, expect, it, vi } from 'vitest';
import { AcademicWritingEngineService } from './academic-writing-engine.service';

function makeClient(payload: unknown) {
  return {
    models: {
      generateContent: vi.fn(async () => ({ text: JSON.stringify(payload) }))
    }
  } as any;
}

describe('AcademicWritingEngineService evidence and output safety', () => {
  it('never returns model-suggested quotes when no source evidence is provided', async () => {
    const client = makeClient({
      researchQuestion: 'What effects does the intervention have?',
      thesisStatement: 'The intervention may affect learning outcomes.',
      overallConclusion: 'The proposed claim requires source verification.',
      arguments: [{
        id: 'ARG-01',
        claim: 'The intervention changes outcomes.',
        evidenceQuotes: ['Fabricated quote with fake citation (Smith, 2022).'],
        subArguments: [' One sub-argument  ', '', 15],
        counterArguments: ['Possible alternative explanation.'],
        synthesisKurdish: ' Synthesis text '
      }]
    });
    const service = new AcademicWritingEngineService();

    const result = await service.generateArgumentArchitecture(
      'Learning outcomes',
      'Education',
      () => client
    );

    expect(result.status).toBe('generated');
    expect(result.arguments[0]?.evidenceQuotes).toEqual([]);
    expect(result.arguments[0]?.subArguments).toEqual(['One sub-argument']);
    expect(result.arguments[0]?.synthesisKurdish).toBe('Synthesis text');
  });

  it('short-circuits blank or overlong inputs without calling the model', async () => {
    const client = makeClient({});
    const service = new AcademicWritingEngineService();

    const blank = await service.generateArgumentArchitecture('  ', 'Education', () => client);
    const overlong = await service.generateArgumentArchitecture('x'.repeat(501), 'Education', () => client);

    expect(blank.status).toBe('degraded');
    expect(overlong.status).toBe('degraded');
    expect(blank.arguments).toEqual([]);
    expect(client.models.generateContent).not.toHaveBeenCalled();
    expect(overlong.researchQuestion.length).toBeLessThan(600);
  });

  it('bounds model output lists and rejects incomplete model output to an explicit draft', async () => {
    const client = makeClient({
      researchQuestion: 'Question',
      thesisStatement: 'Thesis',
      overallConclusion: 'Conclusion',
      arguments: [{
        claim: 'Claim',
        subArguments: Array.from({ length: 40 }, (_, index) => `Point ${index}`),
        counterArguments: ['x'.repeat(801)],
        evidenceQuotes: ['fake quote'],
        synthesisKurdish: 'x'.repeat(4_001)
      }]
    });
    const result = await new AcademicWritingEngineService().generateArgumentArchitecture(
      'Topic',
      'History',
      () => client
    );

    expect(result.status).toBe('generated');
    expect(result.arguments[0]?.subArguments).toHaveLength(20);
    expect(result.arguments[0]?.counterArguments).toEqual([]);
    expect(result.arguments[0]?.synthesisKurdish).toBe('');
    expect(result.arguments[0]?.evidenceQuotes).toEqual([]);
  });

  it('falls back to a visibly degraded plan when the model response is malformed', async () => {
    const client = {
      models: { generateContent: vi.fn(async () => ({ text: 'not JSON' })) }
    } as any;
    const result = await new AcademicWritingEngineService().generateArgumentArchitecture(
      'Topic',
      'History',
      () => client
    );

    expect(result.status).toBe('degraded');
    expect(result.arguments).toEqual([]);
    expect(result.overallConclusion).toBe('');
    expect(result.degradationReason).toBe('invalid_model_response');
  });
});
