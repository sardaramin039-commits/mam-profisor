import { GoogleGenAI } from '@google/genai';
import { claimEvidenceGraphService } from './claim-evidence-graph.service';
import { sourceVerificationService } from './source-verification.service';
import { downgradeUntrustedEvidence } from './untrusted-evidence';
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
import { researchIntelligenceService } from './research-intelligence.service';

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
  discoveredSources?: any[];
  sourceDiscoveryProviders?: string[];
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
    let effectiveSources = rawSources;
    let discovery: { sources: any[]; providers: string[] } = { sources: [], providers: [] };

    if (effectiveSources.length === 0) {
      const discovered = await researchIntelligenceService.discover(request.topic, request.discipline);
      effectiveSources = discovered.sources.slice(0, 100);
      discovery = { sources: effectiveSources, providers: discovered.providers };
      log(
        '00',
        'Automatic Source Discovery Agent',
        `${effectiveSources.length} candidate source(s) from ${discovered.providers.length} provider(s)`
      );
    }

    log('01', 'Research Planner Agent', 'Creating discipline-specific research framework');
    const verification = await sourceVerificationService.verifySources(
      effectiveSources.map(source => downgradeUntrustedEvidence(source)),
      getGeminiClient
    );
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
    const evidenceChunks = effectiveSources
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
          verificationStatus: 'unverified' as const,
          pageNumber: String(source.pageNumber ?? source.page ?? '').trim() || undefined,
          author: verified.author,
          year: verified.year || String(source.year ?? '').trim() || undefined,
          evidenceType: 'snippet' as const,
          provenance: 'user-supplied-content' as const
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const candidateDraft = request.draftText?.trim()
      || `${structure.thesisStatement}\n\n${structure.overallConclusion}`;

    const grounded = await evidenceGroundingService.generateGroundedContent(
      request.topic,
      candidateDraft,
      evidenceChunks,
      getGeminiClient
    );
    log('04', 'Evidence-Grounded Writer Agent',
      `${grounded.integrityMetrics.verifiedClaims}/${grounded.integrityMetrics.totalClaims} claims citation-grounded`);

    const groundedText = grounded.paragraphs.length
      ? grounded.paragraphs.map(paragraph => paragraph.text).join('\n\n').trim()
      : candidateDraft;

    const languageAnalysis = await kurdishAcademicLanguageService.analyzeAndRefineLanguage(
      groundedText,
      getGeminiClient
    );
    log('05', 'Kurdish Academic Language Agent', 'Validated Sorani grammar and academic terminology');

    const protectedFragments = Array.from(new Set([
      ...grounded.verifiedCitations.map(citation => citation.inTextCitation),
      ...grounded.paragraphs.flatMap(paragraph =>
        (paragraph.claims || []).map(claim => claim.citationText || '')
      )
    ].filter(Boolean)));

    const humanProse = await humanScholarlyProseService.refineGrounded(
      languageAnalysis.refinedTextKurdish,
      profile,
      protectedFragments,
      getGeminiClient
    );
    log('06', 'Natural Scholarly Prose Agent',
      humanProse.preservationPassed === false
        ? 'Preservation guard kept the previous text'
        : 'Applied natural scholarly variation without adding facts');

    const finalText = humanProse.refinedText || languageAnalysis.refinedTextKurdish;

    const graphSources = effectiveSources
      .map(source => {
        const verified = verifiedByKey.get(sourceKey(source));
        if (!verified) return null;

        const evidenceText = String(
          source.content ??
          source.fullText ??
          source.text ??
          source.chunkText ??
          ''
        ).trim();
        if (!evidenceText) return null;

        return {
          ...source,
          ...verified,
          identityStatus: 'verified' as const,
          evidenceStatus: 'unverified' as const,
          evidenceType: 'snippet' as const,
          evidenceProvenance: 'user-supplied-content' as const,
          provenance: 'user-supplied-content' as const,
          content: evidenceText
        };
      })
      .filter((source): source is NonNullable<typeof source> => Boolean(source));

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

    const similarity = textSimilarityService.screen(finalText, effectiveSources);
    const confidence = academicConfidenceService.assess({
      verifiedClaims: grounded.integrityMetrics.verifiedClaims,
      totalClaims: grounded.integrityMetrics.totalClaims,
      citationEligibleClaims: citationIntelligence.verifiedCitationCount,
      contradictionCount: contradictions.contradictionCount,
      similarityScore: similarity.overallSimilarityScore,
      sourceVerificationRate: effectiveSources.length
        ? (citationEligibleSources.length / effectiveSources.length) * 100
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
      finalThesisDraftKurdish: finalText,
      discoveredSources: discovery.sources,
      sourceDiscoveryProviders: discovery.providers
    };
  }
}

export const multiAgentOrchestratorService = new MultiAgentOrchestratorService();
