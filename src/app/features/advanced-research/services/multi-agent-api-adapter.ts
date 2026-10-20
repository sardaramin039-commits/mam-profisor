import type { MultiAgentResponse } from '../../../../helpers/academic-integrations';
import type { ProfessorModeLevel, ResearchMemoryState } from '../models/multi-agent.types';

type RecordValue = Record<string, any>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function boundedScore(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 0;
}

export async function executeMultiAgentPipeline(
  topic: string,
  professorMode: ProfessorModeLevel,
  memory: ResearchMemoryState
): Promise<MultiAgentResponse> {
  const response = await fetch('/api/multi-agent/orchestrate', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topic.trim(),
      discipline: memory.discipline || 'گشتی',
      draftText: [...(memory.notes || []), ...(memory.hypotheses || [])].join('\n').slice(0, 250_000),
      rawSources: [],
      citationStyle: 'APA7'
    })
  });

  const body = await response.json() as {
    success?: boolean;
    result?: RecordValue;
    error?: string;
    executionReceipt?: { stageId?: string; status?: string; errorCode?: string };
  };

  if (!response.ok) {
    const receipt = body.executionReceipt;
    const detail = receipt
      ? ` قۆناغ: ${receipt.stageId || 'نادیار'}، دۆخ: ${receipt.status || 'نادیار'}.`
      : '';
    throw new Error((body.error || `Multi-Agent API HTTP ${response.status}.`) + detail);
  }

  const data = body.result;
  if (body.success !== true || !data || typeof data.finalThesisDraftKurdish !== 'string') {
    throw new Error('وەڵامی ئۆرکێستراکردنی Multi-Agent شێوەی دروستی نییە؛ هیچ ئەنجامی ساختە پیشان نادرێت.');
  }

  const sources = (Array.isArray(data.discoveredSources) ? data.discoveredSources : [])
    .filter((source: unknown) => source && typeof source === 'object' && !Array.isArray(source))
    .map((item: unknown, index: number) => {
      const source = asRecord(item);
      const authors = Array.isArray(source.authors)
        ? source.authors.map(String).filter(Boolean)
        : source.author ? [String(source.author)] : [];
      return {
        id: String(source.id || source.sourceId || source.doi || `pipeline-source-${index + 1}`),
        title: String(source.title || source.sourceTitle || 'ناونیشانی سەرچاوە بەردەست نییە'),
        authors,
        year: String(source.year || source.publicationYear || 'n.d.'),
        sourceType: 'MultiAgentResearchPipeline' as const,
        url: String(source.url || source.sourceUrl || ''),
        snippet: String(source.snippet || source.evidenceText || ''),
        ...(source.doi ? { doi: String(source.doi) } : {}),
        ...(source.publisher ? { publisher: String(source.publisher) } : {}),
        ...(source.evidenceText ? { evidenceText: String(source.evidenceText) } : {}),
        confidenceScore: boundedScore(source.confidenceScore),
        peerReviewed: source.peerReviewed === true
      };
    });

  const citation = asRecord(data.citationIntelligence);
  const reviewer = asRecord(data.reviewerReport);
  const qa = asRecord(data.qaGateResult);
  const apa = asStrings(citation.formattedCitationsAPA || citation.formattedReferencesAPA);
  const harvard = asStrings(citation.formattedCitationsHarvard || citation.formattedReferencesHarvard);
  const scores = sources.map(source => source.confidenceScore).filter(score => score > 0);
  const sourceConfidenceAverage = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  return {
    professorMode,
    topic,
    researchAgentOutput: {
      sources,
      keyConcepts: asStrings(asRecord(data.thesisStructurePlan).keyConcepts)
    },
    writerAgentOutput: {
      title: String(asRecord(data.thesisStructurePlan).title || asRecord(data.thesisStructurePlan).thesisTitle || topic),
      academicProse: data.finalThesisDraftKurdish,
      kurdishSynthesis: typeof data.humanScholarlyProse === 'string'
        ? data.humanScholarlyProse
        : data.finalThesisDraftKurdish
    },
    citationAgentOutput: {
      formattedCitationsAPA: apa,
      formattedCitationsHarvard: harvard,
      citationsCount: apa.length
    },
    reviewerAgentOutput: {
      strengths: asStrings(reviewer.strengths),
      literatureGaps: asStrings(reviewer.literatureGaps),
      methodologyCritique: String(reviewer.methodologyCritique || 'ڕاپۆرتی تایبەتی ڕەخنەی مێتۆدۆلۆژی لەم وەڵامەدا بەردەست نییە.'),
      improvementSuggestions: asStrings(reviewer.improvementSuggestions)
    },
    qaGateResult: {
      exportBlocked: qa.exportBlocked === true,
      overallQAScore: typeof qa.overallQAScore === 'number' && Number.isFinite(qa.overallQAScore)
        ? qa.overallQAScore : null,
      criticalViolationsCount: typeof qa.criticalViolationsCount === 'number'
        ? qa.criticalViolationsCount : 0,
      kurdishSummaryStatus: String(qa.kurdishSummaryStatus || 'دۆخی QA بەردەست نییە.'),
      checks: Array.isArray(qa.checks) ? qa.checks : []
    },
    knowledgeGraph: { nodes: [], links: [] },
    sourceConfidenceAverage
  } as MultiAgentResponse;
}
