export type GeminiModelRole = 'pro' | 'flash';

export interface GeminiModelDescriptor {
  name?: string;
  supportedActions?: string[];
  supportedGenerationMethods?: string[];
  description?: string;
}

export interface DiscoveredGeminiModels {
  pro: string;
  flash: string;
  all: string[];
}

function modelName(model: GeminiModelDescriptor): string {
  return String(model.name || '').replace(/^models\//, '').trim();
}

function versionParts(name: string): [number, number, number] {
  const embedding = name.match(/embedding[-.]?(\d+)/i);
  if (embedding) return [Number(embedding[1] || 0), 0, 0];
  const match = name.match(/gemini-(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
  return match
    ? [Number(match[1] || 0), Number(match[2] || 0), Number(match[3] || 0)]
    : [0, 0, 0];
}

function stabilityScore(name: string): number {
  if (/(?:preview|experimental|\bexp\b|alpha|beta)/i.test(name)) return 0;
  if (/(?:latest|stable|-\d{3,})$/i.test(name)) return 2;
  return 1;
}

function capabilityPenalty(name: string, role: GeminiModelRole): number {
  let score = 0;
  if (/(?:embedding|image|audio|tts|speech|live|robotics|computer-use)/i.test(name)) return 10_000;
  if (role === 'flash' && /flash-lite/i.test(name)) score += 2;
  if (role === 'pro' && /flash/i.test(name)) score += 100;
  if (role === 'flash' && /pro/i.test(name)) score += 100;
  if (/image/i.test(name)) score += 10_000;
  return score;
}

function compareModels(left: string, right: string, role: GeminiModelRole): number {
  const penalty = capabilityPenalty(left, role) - capabilityPenalty(right, role);
  if (penalty !== 0) return penalty;
  const leftVersion = versionParts(left);
  const rightVersion = versionParts(right);
  for (let i = 0; i < leftVersion.length; i++) {
    if (leftVersion[i] !== rightVersion[i]) return rightVersion[i] - leftVersion[i];
  }
  const stable = stabilityScore(right) - stabilityScore(left);
  if (stable !== 0) return stable;
  return left.localeCompare(right);
}

export function discoverGeminiTextModels(models: GeminiModelDescriptor[]): DiscoveredGeminiModels {
  const unique = new Map<string, GeminiModelDescriptor>();
  for (const model of models) {
    const name = modelName(model);
    if (!name.startsWith('gemini-')) continue;
    if (/(?:embedding|image|audio|tts|speech|live|robotics|computer-use)/i.test(name)) continue;
    const actions = model.supportedActions || model.supportedGenerationMethods;
    if (Array.isArray(actions) && actions.length > 0 && !actions.includes('generateContent')) continue;
    unique.set(name, model);
  }

  const all = [...unique.keys()].sort((a, b) => {
    const version = compareModels(a, b, 'flash');
    return version || compareModels(a, b, 'pro');
  });
  const flashCandidates = all.filter(name => /flash/i.test(name))
    .sort((a, b) => compareModels(a, b, 'flash'));
  const proCandidates = all.filter(name => /pro/i.test(name))
    .sort((a, b) => compareModels(a, b, 'pro'));
  const generalCandidates = all.filter(name => !/flash|lite/i.test(name))
    .sort((a, b) => compareModels(a, b, 'pro'));

  const flash = flashCandidates[0];
  const pro = proCandidates[0] || generalCandidates[0] || flash;
  if (!flash || !pro) {
    throw new Error('Google AI Studio did not return a supported Gemini text-generation model.');
  }
  return { pro, flash, all };
}

export function modelSupportsExplicitCaching(name: string): boolean {
  const version = versionParts(name);
  return name.startsWith('gemini-') && version[0] > 0 && version[0] < 4;
}

export function modelSupportsThinkingBudget(name: string): boolean {
  const version = versionParts(name);
  return version[0] === 2 && version[1] >= 5;
}

export function discoverGeminiEmbeddingModel(models: GeminiModelDescriptor[]): string {
  const candidates = models.map(model => ({
    name: modelName(model),
    actions: model.supportedActions || model.supportedGenerationMethods
  })).filter(candidate => {
    if (!candidate.name || !/embedding/i.test(candidate.name)) return false;
    return !Array.isArray(candidate.actions) || candidate.actions.length === 0 || candidate.actions.includes('embedContent');
  }).map(candidate => candidate.name);
  candidates.sort((left, right) => {
    const leftVersion = versionParts(left);
    const rightVersion = versionParts(right);
    for (let i = 0; i < leftVersion.length; i++) {
      if (leftVersion[i] !== rightVersion[i]) return rightVersion[i] - leftVersion[i];
    }
    const stability = stabilityScore(right) - stabilityScore(left);
    return stability || left.localeCompare(right);
  });
  if (!candidates.length) throw new Error('Google AI Studio did not return an embedding model that supports embedContent.');
  return candidates[0];
}
