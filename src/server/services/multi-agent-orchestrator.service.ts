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
import { citationIntelligenceService, CitationStyle } from './citation-intelligence.service';
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
    log('02', 'Source Discovery Agent', 'Using caller-provided source records only');

    const verification = await sourceVerificationService.verifySources(rawSources, getGeminiClient);
    log('03', 'Source Verification Agent', `${verification.verifiedSources.length} sources verified`);

    const graph = await claimEvidenceGraphService.buildGraph(
      request.topic,
      request.draftText || request.topic,
      verification.verifiedSources,
      getGeminiClient
    );
    log('04', 'Claim-Evidence Agent', `${graph.claims.length} claims analyzed`);

    const contradictions = await contradictionDetectionService.analyze(
      request.topic,
      graph.claims,
      verification.verifiedSources,
      getGeminiClient
    );
    log('05', 'Contradiction Agent', contradictions.contradictionCount
      ? `${contradictions.contradictionCount} contradiction(s) require review`
      : 'No supported contradictions found');

    const structure = await academicWritingEngineService.generateArgumentArchitecture(
      request.topic,
      request.discipline,
      getGeminiClient
    );
    log('06', 'Argument & Methodology Agent', 'Built discipline-specific argument architecture');

    const verifiedByKey = new Map(
      verification.verifiedSources.map(source => [source.sourceId, source])
    );
    const evidenceChunks = rawSources
      .map(source => {
        const id = sourceKey(source);
        const verified = verifiedByKey.get(id);
        if (!verified) return null;
        const chunkText = String(source.content ?? source.fullText ?? source.text ?? source.chunkText ?? '').trim();
        if (!chunkText) return null;
        return {
          sourceId: id,
          sourceTitle: verified.sourceTitle,
          chunkText,
          verificationStatus: 'verified' as const,
          pageNumber: String(source.pageNumber ?? source.page ?? '').trim() || undefined,
          author: verified.author,
          year: String(source.year ?? verified['year'] ?? '').trim() || undefined
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const grounded = await evidenceGroundingService.generateGroundedContent(
      request.topic,
      request.draftText || `بەڵگە و پێکهاتەی نووسین بۆ ${structure.thesisStatement}`,
      evidenceChunks,
      getGeminiClient
    );
    log('07', 'Evidence-Grounded Writer Agent', `${grounded.integrityMetrics.verifiedClaims}/${grounded.integrityMetrics.totalClaims} claims grounded`);

    const groundedText = grounded.paragraphs.map(paragraph => paragraph.text).join('\n\n').trim();
    const candidateText = grounded.integrityMetrics.eligibilityGateStatus === 'FAIL'
      ? (request.draftText || `${structure.thesisStatement}\n\n${structure.overallConclusion}`)
      : groundedText;

    const humanProse = await humanScholarlyProseService.refine(candidateText, profile, getGeminiClient);
    log('08', 'Human Scholarly Prose Agent', 'Applied natural scholarly prose without adding evidence');

    const languageAnalysis = await kurdishAcademicLanguageService.analyzeAndRefineLanguage(
      humanProse.refinedText,
      getGeminiClient
    );
    log('09', 'Kurdish Academic Language Agent', 'Validated Sorani grammar and academic terminology');

    const similarity = textSimilarityService.screen(languageAnalysis.refinedTextKurdish, rawSources);
    const citationIntelligence = citationIntelligenceService.build(
      grounded.paragraphs,
      verification.verifiedSources,
      request.citationStyle || 'APA7'
    );

    const confidence = academicConfidenceService.assess({
      verifiedClaims: grounded.integrityMetrics.verifiedClaims,
      totalClaims: grounded.integrityMetrics.totalClaims,
      citationEligibleClaims: citationIntelligence.verifiedCitationCount,
      contradictionCount: contradictions.contradictionCount,
      similarityScore: similarity.overallSimilarityScore,
      sourceVerificationRate: rawSources.length
        ? (verification.verifiedSources.length / rawSources.length) * 100
        : 0
    });
    log('10', 'Academic Confidence Agent', confidence.labelKurdish);

    const review = await academicReviewerService.evaluateThesis(
      languageAnalysis.refinedTextKurdish,
      request.topic,
      getGeminiClient
    );
    log('11', 'Professor Reviewer Agent', 'Completed independent academic review');

    const qa = await academicQAGateService.runQAGate(
      languageAnalysis.refinedTextKurdish,
      verification.verifiedSources,
      getGeminiClient,
      {
        confidence,
        similarity,
        contradictionCount: contradictions.contradictionCount,
        citationIntegrity: citationIntelligence.verifiedCitationCount,
        totalClaims: grounded.integrityMetrics.totalClaims
      }
    );
    log('12', 'Final Academic QA Gate', qa.exportBlocked ? 'Export blocked pending evidence/review' : 'QA passed');

    observabilityService.logEvent({
      endpoint: '/api/platform/multi-agent-orchestrate',
      modelUsed: 'gemini-3.8-flash',
      latencyMs: Date.now() - startTime,
      tokensPrompt: 0,
      tokensCompletion: 0,
      estimatedCostUsd: 0,
      success: !qa.exportBlocked,
      citationFailuresCount: grounded.integrityMetrics.blockedSyntheticCitations + citationIntelligence.blockedCitationCount,
      ragQualityScore: graph.graphIntegrityScore
    });

    return {
      executionPipelineLog: pipelineLog,
      verifiedSourcesCount: verification.verifiedSources.length,
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
      finalThesisDraftKurdish: languageAnalysis.refinedTextKurdish
    };
  }
}

export const multiAgentOrchestratorService = new MultiAgentOrchestratorService();
