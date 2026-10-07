import { GoogleGenAI } from '@google/genai';
import {
  fetchSemanticScholar,
  fetchPubMed,
  fetchDOAJ,
  fetchOpenLibrary,
  fetchInternetArchive,
  fetchLibraryOfCongress,
  fetchEuropeana
} from '../../helpers/academic-integrations';
import { fetchOpenAlex, fetchCrossref } from '../../helpers/academic-discovery-providers';
import { robustParseJson } from '../utils/json-repair';
import { sourceVerificationService } from './source-verification.service';
import { linkClaimsToEvidence } from './research-evidence-linking';

export interface ResearchIntelligenceRequest {
  topic: string;
  discipline: string;
  academicLevel?: string;
  draftText?: string;
  chapters?: Array<{ id?: string; title?: string; content?: string }>;
  researchQuestion?: string;
  objectives?: string;
  hypotheses?: string;
  methodology?: string;
  populationSample?: string;
  variables?: string;
  dataCollection?: string;
  analysisPlan?: string;
  rawSources?: any[];
}

export interface ResearchIntelligenceResult {
  discovery: {
    query: string;
    sources: any[];
    total: number;
    providers: string[];
    verificationPolicy: string;
  };
  analysisStatus: {
    planner: 'ok' | 'degraded';
    methodology: 'ok' | 'degraded';
    factCheck: 'ok' | 'degraded';
    consistency: 'ok' | 'degraded';
  };
  planner: any;
  factCheck: any;
  evidenceLinks: Array<{
    claim: string;
    sourceId: string;
    sourceTitle: string;
    evidenceText: string;
    overlapScore: number;
    status: 'candidate' | 'strong-candidate';
    verificationStatus: 'verified' | 'unverified' | 'not_available';
    claimCitationEligible: boolean;
    evidenceUrl?: string;
    evidenceType?: 'abstract' | 'snippet' | 'full-text';
    provider?: string;
    evidenceFingerprint: string;
  }>;
  methodology: any;
  consistency: any;
  sourceVerification: {
    received: number;
    identityVerified: number;
    citationEligible: number;
    rejected: number;
    reports: Array<{
      sourceId: string;
      sourceTitle: string;
      identityStatus: string;
      evidenceStatus: string;
      citationEligible: boolean;
      trustLevel: string;
      metadataAccuracy: number;
      rejectionReasonKurdish?: string;
    }>;
  };
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeSources(sources: any[], limit = 24): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const source of sources) {
    const title = normalize(source?.title);
    const author = normalize(Array.isArray(source?.authors) ? source.authors.join(' ') : source?.author);
    const doi = normalize(source?.doi);
    const key = doi || [title, author].filter(Boolean).join('|');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(source);
    if (out.length >= limit) break;
  }
  return out;
}

function safeJson(responseText: string, fallback: any): any {
  try {
    const parsed = robustParseJson(responseText || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

export class ResearchIntelligenceService {
  async discover(topic: string, discipline: string) {
    const query = [topic.trim(), discipline.trim()].filter(Boolean).join(' ');
    const tasks = [
      ['Semantic Scholar', fetchSemanticScholar(query)],
      ['PubMed', fetchPubMed(query)],
      ['DOAJ', fetchDOAJ(query)],
      ['Open Library', fetchOpenLibrary(query)],
      ['Internet Archive', fetchInternetArchive(query)],
      ['Library of Congress', fetchLibraryOfCongress(query)],
      ['Europeana', fetchEuropeana(query)],
      ['OpenAlex', fetchOpenAlex(query)],
      ['Crossref', fetchCrossref(query)]
    ] as const;

    const results = await Promise.allSettled(tasks.map(([, task]) => task));
    const raw = results.flatMap(result =>
      result.status === 'fulfilled' ? result.value : []
    );
    const sources = dedupeSources(raw);
    const providers = results
      .map((result, index) => result.status === 'fulfilled' && result.value.length
        ? tasks[index][0]
        : '')
      .filter(Boolean);

    return {
      query,
      sources,
      total: sources.length,
      providers,
      verificationPolicy: 'discovery candidates are not citations until identity and evidence are verified'
    };
  }

  async execute(
    request: ResearchIntelligenceRequest,
    getGeminiClient: () => GoogleGenAI
  ): Promise<ResearchIntelligenceResult> {
    const discovery = await this.discover(request.topic, request.discipline);
    const ai = getGeminiClient();

    const chapters = (request.chapters || [])
      .filter(ch => String(ch.content || '').trim())
      .slice(0, 20)
      .map(ch => ({
        id: ch.id || '',
        title: String(ch.title || '').slice(0, 300),
        content: String(ch.content || '').slice(0, 12000)
      }));

    const plannerPrompt = `بەپێی پێوەرەی توێژینەوەی زانستی، Research Plan ـێکی ڕاستەقینە بۆ ئەم توێژینەوەیە دروست بکە.
بابەت: ${request.topic}
دیسیپلین: ${request.discipline}
ئاست: ${request.academicLevel || 'ماستەر'}
سەرچاوەکانی دۆزرابوون: ${JSON.stringify(discovery.sources.slice(0, 18))}

هیچ سەرچاوەیەک دروست مەکە. تەنها candidate ـەکانی سەرەوە و زانیارییە پێدراوەکان بەکاربهێنە.
JSON:
{
 "researchQuestion": "...",
 "subQuestions": ["..."],
 "objectives": ["..."],
 "searchConcepts": ["..."],
 "inclusionCriteria": ["..."],
 "exclusionCriteria": ["..."],
 "evidenceNeeds": ["..."],
 "plannedSections": ["..."],
 "riskNotes": ["..."]
}`;

    const methodologyPrompt = `مێتۆدۆلۆژیای توێژینەوەکە بە شێوەی independent validator هەڵسەنگێنە.
بابەت: ${request.topic}
دیسیپلین: ${request.discipline}
Research Question: ${request.researchQuestion || ''}
Objectives: ${request.objectives || ''}
Hypotheses: ${request.hypotheses || ''}
Methodology: ${request.methodology || ''}
Population/Sample: ${request.populationSample || ''}
Variables: ${request.variables || ''}
Data Collection: ${request.dataCollection || ''}
Analysis Plan: ${request.analysisPlan || ''}

ئەگەر خانەیەک بەتاڵە، نمرەی بەرز مەدە و بە ڕوونی بڵێ پێویستە پڕ بکرێت.
JSON:
{
 "overallScore": 0,
 "status": "pass|review|fail",
 "checks": [
   {"area":"question_alignment","status":"pass|review|fail","score":0,"finding":"...","recommendation":"..."}
 ],
 "blockingIssues": [],
 "strengths": []
}`;

    const factEvidence = (request.rawSources || [])
      .slice(0, 30)
      .map(source => ({
        id: source?.id || source?.sourceId || source?.doi || source?.title || '',
        title: source?.title || source?.sourceTitle || '',
        author: source?.author || (Array.isArray(source?.authors) ? source.authors.join(', ') : ''),
        year: source?.year || '',
        evidence: String(source?.evidenceText || source?.content || source?.fullText || source?.text || source?.chunkText || '').slice(0, 5000)
      }))
      .filter(item => item.title && item.evidence);

    const factPrompt = `Claim-by-Claim Fact Check. تەنها ئەو claim ـانە هەڵسەنگێنە کە لە دەقی خوارەوە هەن.
هیچ fact، citation، DOI یان ناوی سەرچاوەی نوێ دروست مەکە.
یاسا: بێ evidence ـی پێدراو، دۆخی claim نابێت "supported" بێت.
دەقی توێژینەوە:
${String(request.draftText || '').slice(0, 40000)}

Evidence records:
${JSON.stringify(factEvidence)}

JSON:
{
 "summary":{"totalClaims":0,"supported":0,"insufficientEvidence":0,"unsupported":0},
 "claims":[
   {"claim":"...","status":"supported|insufficient_evidence|unsupported","sourceIds":[],"reason":"...","action":"..."}
 ],
 "policy":"AI assessment is a review aid; unsupported claims must not receive fabricated citations."
}`;

    const consistencyPrompt = `Long-Form Consistency Audit بۆ manuscript ـێکی ئەکادیمی.
بابەت: ${request.topic}
دیسیپلین: ${request.discipline}
بەشەکان:
${JSON.stringify(chapters)}

پشکنین بکە: ناونیشان و terminology، research question، claim ـە دووبارەکان، ژمارە و ڕووداوە ناگونجاوەکان، methodology drift، conclusion alignment.
هیچ داتای نوێ دروست مەکە.
JSON:
{
 "overallScore":0,
 "status":"consistent|review|conflict",
 "conflicts":[
  {"type":"terminology|claim|number|methodology|conclusion","severity":"low|medium|high","locations":[],"description":"...","recommendation":"..."}
 ],
 "stableElements":[],
 "normalizationSuggestions":[]
}`;

    const analysisResults = await Promise.allSettled([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: plannerPrompt,
        config: { responseMimeType: 'application/json', temperature: 0.2 }
      }),
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: methodologyPrompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      }),
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: factPrompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      }),
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: consistencyPrompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    ]);

    const textOf = (result: PromiseSettledResult<{ text?: string }>): string =>
      result.status === 'fulfilled' ? String(result.value.text || '') : '';
    const statusOf = (result: PromiseSettledResult<unknown>): 'ok' | 'degraded' =>
      result.status === 'fulfilled' ? 'ok' : 'degraded';

    const plannerRes = analysisResults[0];
    const methodologyRes = analysisResults[1];
    const factRes = analysisResults[2];
    const consistencyRes = analysisResults[3];

    const providedSources = Array.isArray(request.rawSources) ? request.rawSources.slice(0, 100) : [];
    const verificationSources = providedSources.length
      ? providedSources
      : discovery.sources.slice(0, 100);

    type VerificationResult = Awaited<ReturnType<typeof sourceVerificationService.verifySources>>;
    let verification: VerificationResult;
    try {
      verification = await sourceVerificationService.verifySources(
        verificationSources,
        getGeminiClient
      );
    } catch {
      verification = {
        verifiedSources: [],
        citationEligibleSources: [],
        rejectedSources: [],
        unverifiedSources: [],
        allReports: [],
        rejectedSourcesCount: 0
      };
    }

    const factCheck = safeJson(textOf(factRes), {
      summary: { totalClaims: 0, supported: 0, insufficientEvidence: 0, unsupported: 0 },
      claims: [],
      policy: 'هیچ claim ـێک بەبێ evidence بە پشتڕاستکراو دانانرێت.'
    });
    const claimTexts = Array.isArray(factCheck?.claims)
      ? factCheck.claims.map((item: any) => String(item?.claim || '').trim()).filter(Boolean)
      : [];
    const evidenceLinks = linkClaimsToEvidence(
      claimTexts,
      discovery.sources.map((source: any) => ({
        id: source?.id,
        sourceId: source?.sourceId,
        title: source?.title,
        evidenceText: source?.evidenceText,
        evidenceUrl: source?.evidenceUrl,
        evidenceType: source?.evidenceType,
        sourceType: source?.sourceType
      })),
      verification.allReports
    );

    return {
      discovery,
      analysisStatus: {
        planner: statusOf(plannerRes),
        methodology: statusOf(methodologyRes),
        factCheck: statusOf(factRes),
        consistency: statusOf(consistencyRes)
      },
      planner: safeJson(textOf(plannerRes), {
        researchQuestion: request.researchQuestion || '',
        subQuestions: [],
        objectives: [],
        searchConcepts: [request.topic],
        inclusionCriteria: [],
        exclusionCriteria: [],
        evidenceNeeds: [],
        plannedSections: [],
        riskNotes: ['پلان بەهۆی کێشەی AI بە تەواوی نەدرا.']
      }),
      factCheck,
      evidenceLinks,
      methodology: safeJson(textOf(methodologyRes), {
        overallScore: 0,
        status: 'review',
        checks: [],
        blockingIssues: ['پشکنینی مێتۆدۆلۆژیا تەواو نەبوو.'],
        strengths: []
      }),
      consistency: safeJson(textOf(consistencyRes), {
        overallScore: chapters.length ? 0 : null,
        status: chapters.length ? 'review' : 'consistent',
        conflicts: [],
        stableElements: [],
        normalizationSuggestions: []
      }),
      sourceVerification: {
        received: verificationSources.length,
        identityVerified: verification.verifiedSources?.length || 0,
        citationEligible: verification.citationEligibleSources?.length || 0,
        rejected: verification.rejectedSources?.length || 0,
        reports: (verification.allReports || []).slice(0, 30).map(report => ({
          sourceId: report.sourceId,
          sourceTitle: report.sourceTitle,
          identityStatus: report.identityStatus,
          evidenceStatus: report.evidenceStatus,
          citationEligible: report.citationEligible,
          trustLevel: report.trustLevel,
          metadataAccuracy: report.metadataAccuracy,
          rejectionReasonKurdish: report.rejectionReasonKurdish
        }))
      }
    };
  }
}

export const researchIntelligenceService = new ResearchIntelligenceService();
