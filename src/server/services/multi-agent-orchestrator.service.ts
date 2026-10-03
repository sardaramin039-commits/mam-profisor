import { GoogleGenAI } from '@google/genai';
import { claimEvidenceGraphService } from './claim-evidence-graph.service';
import { sourceVerificationService } from './source-verification.service';
import { evidenceGroundingService } from './evidence-grounding.service';
import { academicWritingEngineService } from './academic-writing-engine.service';
import { academicReviewerService } from './academic-reviewer.service';
import { academicQAGateService } from './academic-qa-gate.service';
import { kurdishAcademicLanguageService } from './kurdish-academic-language.service';
import { disciplineProfileService } from './discipline-profile.service';
import { contradictionDetectionService } from './contradiction-detection.service';
import { academicConfidenceService } from './academic-confidence.service';
import { humanScholarlyProseService } from './human-scholarly-prose.service';
import { citationIntelligenceService } from './citation-intelligence.service';
import type { CitationStyle } from './citation-intelligence.service';
import { textSimilarityService } from './text-similarity.service';
import { observabilityService } from './observability.service';

export interface MultiAgentOrchestrationRequest {
  topic: string;
  discipline: string;
  draftText?: string;
  rawSources?: any[];
  citationStyle?: CitationStyle;
}

export interface MultiAgentOrchestrationResult {
  executionPipelineLog: Array<{ step: string; agentName: string; status: string; timestamp: string }>;
  identityVerifiedSourcesCount: number;
  citationEligibleSourcesCount: number;
  verifiedSourcesCount: number;
  claimEvidenceGraphIntegrity: number;
  thesisStructurePlan: any;
  contradictionReport: any;
  confidenceAssessment: any;
  groundedGeneration: any;
  citationIntelligence: any;
  similarityScreening: any;
  humanScholarlyProse: any;
  reviewerReport: any;
  qaGateResult: any;
  kurdishLanguageAnalysis: any;
  disciplineProfile: any;
  finalThesisDraftKurdish: string;
}

function sourceKey(source: any): string {
  return String(source?.id ?? source?.sourceId ?? source?.doi ?? source?.title ?? '').trim();
}

export class MultiAgentOrchestratorService {
  public async executePipeline(
    request: MultiAgentOrchestrationRequest,
    getGeminiClient: () => GoogleGenAI
  ): Promise<MultiAgentOrchestrationResult> {
    const startTime = Date.now();
    const pipelineLog: Array<{ step: string; agentName: string; status: string; timestamp: string }> = [];
    const log = (step: string, agentName: string, status: string) =>
      pipelineLog.push({ step, agentName, status, timestamp: new Date().toISOString() });

    const profile = disciplineProfileService.getProfile(request.discipline);
    const rawSources = Array.isArray(request.rawSources) ? request.rawSources.slice(0, 100) : [];

    log('01', 'Research Planner Agent', 'Creating discipline-specific research framework');
    const verification = await sourceVerificationService.verifySources(rawSources, getGeminiClient);
    const citationEligibleSources = verification.citationEligibleSources;
    log(
      '02',
      'Source Verification Agent',
      `${verification.verifiedSources.length} identity-verified; ${citationEligibleSources.length} citation-eligible`
    );

    const structure = await academicWritingEngineService.generateArgumentArchitecture(
      request.topic,
      request.discipline,
      getGeminiClient
    );
    log('03', 'Argument & Methodology Agent', 'Built discipline-specific argument architecture');

    const verifiedByKey = new Map(
      citationEligibleSources.map(source => [source.sourceId, source])
    );
    const evidenceChunks = rawSources
      .map(source => {
        const id = sourceKey(source);
        const verified = verifiedByKey.get(id);
        if (!verified) return null;

        const chunkText = String(
          source.content ?? source.fullText ?? source.text ?? source.chunkText ?? ''
        ).trim();
        if (!chunkText) return null;

        return {
          sourceId: id,
          sourceTitle: verified.sourceTitle,
          chunkText,
          verificationStatus: 'verified' as const,
          pageNumber: String(source.pageNumber ?? source.page ?? '').trim() || undefined,
          author: verified.author,
          year: verified.year || String(source.year ?? '').trim() || undefined,
          provenance: 'user-supplied-content' as const
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const candidateDraft = request.draftText?.trim()
      || `${structure.thesisStatement}\\n\\n${structure.overallConclusion}`;

    const humanProse = await humanScholarlyProseService.refine(
      candidateDraft,
      profile,
      getGeminiClient
    );
    log('04', 'Human Scholarly Prose Agent', 'Applied natural scholarly prose without inventing sources');

    const languageAnalysis = await kurdishAcademicLanguageService.analyzeAndRefineLanguage(
      humanProse.refinedText,
      getGeminiClient
    );
    log('05', 'Kurdish Academic Language Agent', 'Validated Sorani grammar and academic terminology');

    const grounded = await evidenceGroundingService.generateGroundedContent(
      request.topic,
      languageAnalysis.refinedTextKurdish,
      evidenceChunks,
      getGeminiClient
    );
    log('06', 'Evidence-Grounded Writer Agent',
      `${grounded.integrityMetrics.verifiedClaims}/${grounded.integrityMetrics.totalClaims} claims citation-grounded`);

    const finalText = grounded.paragraphs.length
      ? grounded.paragraphs.map(paragraph => paragraph.text).join('\\n\\n').trim()
      : languageAnalysis.refinedTextKurdish;

    const graphSources = rawSources.map(source => {
      const verified = verifiedByKey.get(sourceKey(source));
      return {
        ...source,
        ...(verified || {}),
        evidenceProvenance: 'user-supplied-content'
      };
    });

    const graph = await claimEvidenceGraphService.buildGraph(
      request.topic,
      finalText,
      graphSources,
      getGeminiClient
    );
    log('07', 'Claim-Evidence Graph Agent', `${graph.claims.length} final claims analyzed`);

    const contradictions = await contradictionDetectionService.analyze(
      request.topic,
      graph.claims,
      citationEligibleSources,
      getGeminiClient
    );
    log('08', 'Contradiction Agent', contradictions.contradictionCount
      ? `${contradictions.contradictionCount} contradiction(s) require review`
      : 'No supported contradictions found');

    const citationIntelligence = citationIntelligenceService.build(
      grounded.paragraphs,
      citationEligibleSources,
      request.citationStyle || 'APA7'
    );

    const similarity = textSimilarityService.screen(finalText, rawSources);
    const confidence = academicConfidenceService.assess({
      verifiedClaims: grounded.integrityMetrics.verifiedClaims,
      totalClaims: grounded.integrityMetrics.totalClaims,
      citationEligibleClaims: citationIntelligence.verifiedCitationCount,
      contradictionCount: contradictions.contradictionCount,
      similarityScore: similarity.overallSimilarityScore,
      sourceVerificationRate: rawSources.length
        ? (citationEligibleSources.length / rawSources.length) * 100
        : 0
    });
    log('09', 'Academic Confidence Agent', confidence.labelKurdish);

    const review = await academicReviewerService.evaluateThesis(
      finalText,
      request.topic,
      getGeminiClient,
      {
        discipline: request.discipline,
        verifiedSources: citationEligibleSources.map(source => ({
          sourceId: source.sourceId,
          sourceTitle: source.sourceTitle,
          author: source.author,
          year: source.year,
          publisher: source.publisher,
          doiOrIsbn: source.doiOrIsbn,
          evidenceText: source.evidenceText,
          pageNumber: source.pageNumber,
          verificationStatus: 'verified' as const
        }))
      }
    );
    log('10', 'Professor Reviewer Agent', 'Completed independent academic review');

    const qa = await academicQAGateService.runQAGate(
      finalText,
      citationEligibleSources,
      getGeminiClient,
      {
        confidence,
        similarity,
        contradictionCount: contradictions.contradictionCount,
        citationIntegrity: citationIntelligence.verifiedCitationCount,
        totalClaims: grounded.integrityMetrics.totalClaims
      }
    );
    log('11', 'Final Academic QA Gate', qa.exportBlocked
      ? 'Export blocked pending evidence/review'
      : 'QA passed');

    observabilityService.logEvent({
      endpoint: '/api/platform/multi-agent-orchestrate',
      modelUsed: 'gemini-3.8-flash',
      latencyMs: Date.now() - startTime,
      tokensPrompt: null,
      tokensCompletion: null,
      estimatedCostUsd: null,
      success: !qa.exportBlocked,
      citationFailuresCount:
        grounded.integrityMetrics.blockedSyntheticCitations +
        citationIntelligence.blockedCitationCount,
      ragQualityScore: graph.graphIntegrityScore
    });

    return {
      executionPipelineLog: pipelineLog,
      identityVerifiedSourcesCount: verification.verifiedSources.length,
      citationEligibleSourcesCount: citationEligibleSources.length,
      verifiedSourcesCount: citationEligibleSources.length,
      claimEvidenceGraphIntegrity: graph.graphIntegrityScore,
      thesisStructurePlan: structure,
      contradictionReport: contradictions,
      confidenceAssessment: confidence,
      groundedGeneration: grounded,
      citationIntelligence,
      similarityScreening: similarity,
      humanScholarlyProse: humanProse,
      reviewerReport: review,
      qaGateResult: qa,
      kurdishLanguageAnalysis: languageAnalysis,
      disciplineProfile: profile,
      finalThesisDraftKurdish: finalText
    };
  }
}

export const multiAgentOrchestratorService = new MultiAgentOrchestratorService();
