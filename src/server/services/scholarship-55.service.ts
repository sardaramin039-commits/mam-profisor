export type Scholarship55Status = 'ready' | 'partial' | 'missing';

export interface Scholarship55Feature {
  id: string;
  category: string;
  name: string;
  purpose: string;
  required: string[];
}

export interface Scholarship55Result extends Scholarship55Feature {
  status: Scholarship55Status;
  coverage: number;
  evidence: string[];
}

const F = (id: string, category: string, name: string, purpose: string, required: string[]): Scholarship55Feature =>
  ({ id, category, name, purpose, required });

export const SCHOLARSHIP_55: Scholarship55Feature[] = [
F('F01','Evidence','Evidence fingerprinting','Track the exact document/version behind each evidence unit.',['sources']),
F('F02','Evidence','Claim-evidence graph','Connect every important claim to supporting and contradicting evidence.',['claims','sources']),
F('F03','Evidence','Counter-evidence radar','Require an explicit search for evidence that could weaken a conclusion.',['claims','counterEvidence']),
F('F04','Evidence','Evidence freshness clock','Detect claims whose supporting literature may be outdated.',['claims','sources','publicationDates']),
F('F05','Evidence','Source independence detector','Flag conclusions supported only by dependent or repeated sources.',['sources']),
F('F06','Evidence','Citation context integrity','Check whether a citation actually supports the sentence context rather than merely appearing nearby.',['claims','citations']),
F('F07','Evidence','Quote-to-page anchoring','Require page/section locators for direct quotations and precise claims.',['citations']),
F('F08','Evidence','Evidence saturation map','Show where a chapter has dense evidence and where claims are unsupported.',['chapters','claims']),
F('F09','Evidence','Negative-result preservation','Prevent null or contrary findings from disappearing during synthesis.',['findings','counterEvidence']),
F('F10','Evidence','Evidence uncertainty ledger','Store uncertainty separately from factual claims.',['claims','uncertainty']),
F('F11','Review','Adversarial peer reviewer','Generate a structured hostile-but-fair challenge set before submission.',['manuscript','claims']),
F('F12','Review','Reviewer-response matrix','Map every reviewer comment to an exact manuscript change or justified response.',['reviewComments','manuscript']),
F('F13','Review','Blind-review leakage check','Detect author-identifying text, acknowledgements and self-identifying metadata.',['manuscript']),
F('F14','Review','Journal-fit fingerprint','Compare manuscript structure against a target journal profile.',['manuscript','journalProfile']),
F('F15','Review','Desk-rejection radar','Check common structural and scope failure conditions before submission.',['manuscript','journalProfile']),
F('F16','Review','Reviewer disagreement map','Separate disagreements caused by evidence, method, interpretation or terminology.',['reviewComments']),
F('F17','Review','Revision debt tracker','Track unresolved academic weaknesses across manuscript versions.',['manuscript','revisionHistory']),
F('F18','Review','Argument stress test','Try to break the central argument using alternative explanations.',['claims','alternatives']),
F('F19','Review','Publication-readiness gate','Require critical checks to pass before a manuscript is marked ready.',['manuscript','claims','citations']),
F('F20','Review','Retraction-risk scan','Flag dependence on retracted, corrected or questionable sources when source status is supplied.',['sources','sourceStatus']),
F('F21','Method','Design-to-question compiler','Check whether the chosen design can answer the research question.',['researchQuestion','methodology']),
F('F22','Method','Measurement construct audit','Check constructs, operational definitions and measurement alignment.',['constructs','variables','measures']),
F('F23','Method','Sampling bias simulator','Enumerate likely selection, coverage and non-response biases.',['population','sampling']),
F('F24','Method','Attrition sensitivity planner','Model how dropout can weaken the planned sample.',['sampleSize','attrition']),
F('F25','Method','Power-analysis assumptions ledger','Keep effect, alpha, power and design assumptions explicit.',['powerPlan']),
F('F26','Method','Analysis-plan lock','Freeze a declared analysis plan and flag post-hoc changes.',['analysisPlan','analysisHistory']),
F('F27','Method','Researcher degrees-of-freedom radar','Identify flexible analysis choices that could inflate false positives.',['analysisPlan']),
F('F28','Method','Reproducibility passport','Bundle protocol, instruments, code, data and environment metadata.',['protocol','materials','code']),
F('F29','Method','Protocol deviation ledger','Record deviations without silently rewriting the original protocol.',['protocol','deviations']),
F('F30','Method','Ethics edge-case scanner','Look for consent, privacy, vulnerable-group and data-retention gaps.',['ethics','population','data']),
F('F31','Novelty','Novelty claim verifier','Separate genuinely new contribution from new wording or a new dataset.',['noveltyClaim','literature']),
F('F32','Novelty','Contribution decomposition','Split contribution into theory, method, data, context and practice.',['contribution']),
F('F33','Novelty','Gap-to-contribution bridge','Require each claimed literature gap to connect to a concrete contribution.',['gaps','contribution']),
F('F34','Novelty','Prior-art collision map','Find concepts or results that may overlap with earlier work.',['claims','literature']),
F('F35','Novelty','Concept genealogy','Trace the intellectual ancestry of central concepts and definitions.',['concepts','literature']),
F('F36','Synthesis','Contradiction reconciliation matrix','Explain disagreements instead of averaging them away.',['claims','contradictions']),
F('F37','Synthesis','Theory triangulation','Compare interpretations across competing theoretical frameworks.',['theories','claims']),
F('F38','Synthesis','Method triangulation','Compare evidence produced by qualitative, quantitative and mixed methods.',['methods','findings']),
F('F39','Synthesis','Temporal synthesis','Detect whether conclusions change across historical periods.',['findings','publicationDates']),
F('F40','Synthesis','Context-transfer warning','Flag when evidence is generalized beyond its original population or setting.',['findings','population','context']),
F('F41','Synthesis','Causal-language guard','Detect causal wording where the design only supports association or description.',['claims','methodology']),
F('F42','Synthesis','Boundary-condition ledger','Record when, where and for whom a conclusion may not hold.',['claims','context']),
F('F43','Synthesis','Mechanism-vs-correlation splitter','Separate proposed mechanisms from observed associations.',['claims','mechanisms','findings']),
F('F44','Synthesis','Evidence-to-conclusion distance','Measure how many interpretive steps separate data from the final conclusion.',['findings','conclusions']),
F('F45','Synthesis','Alternative-explanation register','Preserve plausible explanations that were not selected as the main interpretation.',['alternatives','claims']),
F('F46','Integrity','AI contribution ledger','Record where AI assisted, what it generated and what a human verified.',['aiUse','humanVerification']),
F('F47','Integrity','Human-verification gate','Prevent AI-generated factual claims from being treated as verified without evidence.',['aiUse','claims','verification']),
F('F48','Integrity','Source fabrication sentinel','Detect citation-like records lacking sufficient bibliographic identity.',['citations','sources']),
F('F49','Integrity','Bibliographic drift detector','Detect mismatches between in-text citations and the final reference list.',['citations','bibliography']),
F('F50','Integrity','Version lineage graph','Track manuscript lineage from raw notes through submitted version.',['versionHistory']),
F('F51','Integrity','Research decision journal','Record major methodological decisions and their rationale.',['decisions']),
F('F52','Integrity','Data-provenance passport','Track origin, transformation and destination of research data.',['data','transformations']),
F('F53','Integrity','Uncertainty budget','Quantify and label major uncertainty sources instead of hiding them.',['uncertainty','claims']),
F('F54','Integrity','Reproducibility replay card','Define the minimal steps another researcher needs to replay the analysis.',['protocol','code','analysisPlan']),
F('F55','Integrity','Scholarship readiness certificate','Combine critical gates into a transparent readiness report without inventing a score.',['manuscript','claims','sources','methodology'])
];

const has = (payload: Record<string, unknown>, key: string): boolean => {
  const v = payload[key];
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  return true;
};

export class Scholarship55Service {
  list(): Scholarship55Feature[] { return SCHOLARSHIP_55; }

  assess(payload: Record<string, unknown>) {
    const results: Scholarship55Result[] = SCHOLARSHIP_55.map(feature => {
      const evidence = feature.required.filter(key => has(payload, key));
      const coverage = feature.required.length ? evidence.length / feature.required.length : 1;
      const status: Scholarship55Status = coverage === 1 ? 'ready' : coverage > 0 ? 'partial' : 'missing';
      return { ...feature, status, coverage, evidence };
    });
    const critical = results.filter(r => ['F02','F03','F06','F19','F21','F26','F28','F47','F48','F49','F55'].includes(r.id));
    return {
      framework: 'Mam Professor Scholarship Intelligence 55',
      version: '1.0',
      featureCount: results.length,
      ready: results.filter(r => r.status === 'ready').length,
      partial: results.filter(r => r.status === 'partial').length,
      missing: results.filter(r => r.status === 'missing').length,
      criticalGates: critical,
      results,
      principle: 'No feature invents evidence, citations, data or research results.'
    };
  }
}

export const scholarship55Service = new Scholarship55Service();
