export type MethodsLabMode = 'prisma' | 'power' | 'claim_map' | 'provenance' | 'framework' | 'risk_bias' | 'evidence_grade' | 'methodology_gate' | 'reporting_guideline';

const num = (v: unknown, fallback = 0): number => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const clamp = (n: number, min = 0, max = 1): number => Math.min(max, Math.max(min, n));

export type StudyDesign =
  | 'qualitative' | 'quantitative' | 'mixed_methods' | 'experimental'
  | 'observational_cohort' | 'observational_case_control' | 'observational_cross_sectional'
  | 'systematic_review' | 'case_report' | 'diagnostic' | 'prediction_model'
  | 'historical' | 'theoretical' | 'protocol' | 'quality_improvement'
  | 'economic_evaluation' | 'animal_preclinical';

const reportingGuidelines = [
  { id:'CONSORT 2010', design:'experimental', scope:'Randomized trials', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/consort/' },
  { id:'STROBE', design:'observational', scope:'Cohort, case-control and cross-sectional studies', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/strobe/' },
  { id:'PRISMA 2020', design:'systematic_review', scope:'Systematic reviews', source:'PRISMA Statement', url:'https://www.prisma-statement.org/prisma-2020-checklist' },
  { id:'COREQ', design:'qualitative', scope:'Interviews and focus groups', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/coreq/' },
  { id:'SRQR', design:'qualitative', scope:'Qualitative research reports', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/srqr/' },
  { id:'CARE', design:'case_report', scope:'Case reports', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/care/' },
  { id:'STARD', design:'diagnostic', scope:'Diagnostic accuracy studies', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/stard/' },
  { id:'TRIPOD', design:'prediction_model', scope:'Prediction model studies', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/tripod-statement/' },
  { id:'SPIRIT', design:'protocol', scope:'Study protocols', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/spirit-statement/' },
  { id:'SQUIRE', design:'quality_improvement', scope:'Quality improvement studies', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/squire/' },
  { id:'CHEERS', design:'economic_evaluation', scope:'Economic evaluations', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/cheers/' },
  { id:'ARRIVE', design:'animal_preclinical', scope:'Animal pre-clinical studies', source:'EQUATOR Network', url:'https://www.equator-network.org/reporting-guidelines/arrive/' }
] as const;

function reportingGuideline(p: Record<string, unknown>) {
  const design = String(p['design'] || 'quantitative') as StudyDesign;
  const normalized = design.startsWith('observational_') ? 'observational' : design;
  const matches = reportingGuidelines.filter(item => item.design === normalized);
  return {
    studyDesign: design,
    matches,
    note: matches.length > 0
      ? 'ئەمە هەڵبژاردنی guideline ـی گونجاوە بەپێی جۆری study ـە؛ پێش submit پێویستە journal و extension ـە تایبەتییەکانیش بپشکنرێن.'
      : 'بۆ ئەم جۆری study ـە guideline ـێکی سەرەکی لەم catalog ـەدا دیاری نەکراوە؛ EQUATOR بۆ guideline ـی تایبەت بگەڕێ.',
    source: 'EQUATOR Network reporting-guideline library'
  };
}

const methodologyFields: Record<string, string[]> = {
  qualitative: ['design','researchQuestion','sampling','recruitment','dataCollection','analysisPlan','reflexivity','ethics'],
  quantitative: ['design','researchQuestion','variables','populationSample','sampleSizeJustification','measurement','analysisPlan','missingData','ethics'],
  mixed_methods: ['design','researchQuestion','quantitativeComponent','qualitativeComponent','sampling','dataCollection','analysisPlan','integrationPlan','ethics'],
  experimental: ['design','researchQuestion','populationSample','allocation','intervention','comparator','outcomes','sampleSizeJustification','analysisPlan','ethics'],
  observational: ['design','researchQuestion','populationSample','inclusionExclusion','variables','confounders','measurement','analysisPlan','missingData','ethics'],
  systematic_review: ['design','researchQuestion','eligibility','informationSources','searchStrategy','selectionProcess','dataCollection','riskOfBias','synthesis','protocol'],
  case_report: ['design','caseDescription','timeline','diagnosticAssessment','intervention','outcome','consent'],
  diagnostic: ['design','researchQuestion','participantSelection','indexTest','referenceStandard','flowTiming','analysisPlan'],
  prediction_model: ['design','researchQuestion','participants','predictors','outcome','missingData','modelSpecification','validation'],
  historical: ['design','researchQuestion','sourceCorpus','sourceSelection','sourceCriticism','periodization','analyticalFramework','citationMethod'],
  theoretical: ['design','researchQuestion','conceptDefinitions','theoreticalFramework','literatureBasis','argumentStructure','counterarguments','scopeLimits'],
  protocol: ['design','researchQuestion','objectives','methodology','populationSample','analysisPlan','ethics','registration'],
  quality_improvement: ['design','problemDefinition','intervention','context','measures','analysisPlan','implementationFidelity','ethics'],
  economic_evaluation: ['design','perspective','alternatives','outcomes','costs','timeHorizon','analysisPlan','uncertainty'],
  animal_preclinical: ['design','researchQuestion','animals','housing','allocation','outcomes','sampleSizeJustification','analysisPlan','ethics']
};

function methodologyGate(p: Record<string, unknown>) {
  const raw = String(p['design'] || 'quantitative');
  const design = raw.startsWith('observational_') ? 'observational' : raw;
  const fields = methodologyFields[design] || methodologyFields['quantitative'];
  const rows = fields.map(key => ({ key, status: String(p[key] ?? '').trim() ? 'complete' : 'missing' }));
  const complete = rows.filter(row => row.status === 'complete').length;
  const missing = rows.filter(row => row.status === 'missing').length;
  return {
    studyDesign: raw,
    completed: complete,
    missing,
    total: rows.length,
    completionPercent: Math.round((complete / Math.max(1, rows.length)) * 100),
    readyForMethodReview: missing === 0,
    missingFields: rows.filter(row => row.status === 'missing').map(row => row.key),
    disclaimer: 'ئەمە preflight ـی methodology ـە، نە دڵنیابوونەوەی scientific validity. sample/data/result لە خۆیەوە دروست ناکات.'
  };
}

function normalCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = sign * (1 - poly * Math.exp(-ax * ax));
  return 0.5 * (1 + erf);
}

function normalCdfInverse(p: number): number {
  if (p <= 0 || p >= 1) throw new Error('Probability must be between 0 and 1.');
  let low = -8;
  let high = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (normalCdf(mid) < p) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function effectSize(p: Record<string, unknown>) {
  const mean1=num(p['mean1']), mean2=num(p['mean2']), sd1=num(p['sd1']), sd2=num(p['sd2']);
  const n1=Math.max(2,Math.round(num(p['n1'],2))), n2=Math.max(2,Math.round(num(p['n2'],2)));
  if (sd1<=0 || sd2<=0) return { error:'SD ـەکان دەبێت لە سفر گەورەتر بن.' };
  const pooled=Math.sqrt(((n1-1)*sd1**2+(n2-1)*sd2**2)/(n1+n2-2));
  const d=(mean1-mean2)/pooled; const correction=1-3/Math.max(1,4*(n1+n2)-9);
  return { cohensD:d, hedgesG:d*correction, pooledSd:pooled };
}

function power(p: Record<string, unknown>) {
  const alpha=clamp(num(p['alpha'],0.05),0.0001,0.5); const targetPower=clamp(num(p['power'],0.8),0.5,0.999);
  const zAlpha=normalCdfInverse(1-alpha/2), zPower=normalCdfInverse(targetPower);
  const design=String(p['design']||'two_group_t');
  if (design==='correlation') { const r=clamp(Math.abs(num(p['effect'],0.3)),0.001,0.99); const fisher=Math.atanh(r); const n=Math.ceil(((zAlpha+zPower)/fisher)**2+3); return {design,alpha,targetPower,effect:r,estimatedN:n,note:'Approximate two-sided Fisher-z calculation; final protocol should be checked in a dedicated statistical package.'}; }
  const d=Math.max(0.001,Math.abs(num(p['effect'],0.5))); const nPerGroup=Math.ceil(2*((zAlpha+zPower)/d)**2);
  return {design,alpha,targetPower,effect:d,estimatedNPerGroup:nPerGroup,estimatedTotalN:nPerGroup*2,note:'Approximate two-sided two-group calculation; account for attrition, clustering and analysis assumptions before finalizing.'};
}

function prisma(p: Record<string, unknown>) {
  const fields=[['title','ناونیشان و جۆری systematic review'],['rationale','هۆکار و gap'],['question','پرسیار/PICO یان framework'],['eligibility','inclusion/exclusion criteria'],['informationSources','database/register و بەرواری گەڕان'],['searchStrategy','search strings و limits'],['selectionProcess','screening و full-text process'],['dataCollection','data extraction process'],['riskOfBias','risk-of-bias method'],['synthesis','synthesis/meta-analysis plan'],['reportingBias','reporting-bias assessment'],['certainty','certainty of evidence'],['protocol','registration/protocol'],['funding','funding/support'],['conflicts','competing interests'],['dataCode','data/code/material availability']] as const;
  const checklist=fields.map(([key,label])=>({key,label,status:String(p[key]||'').trim()?'complete':'missing'}));
  const complete=checklist.filter(x=>x.status==='complete').length;
  return {framework:'PRISMA 2020',totalItems:checklist.length,complete,missing:checklist.length-complete,checklist,flow:{identified:num(p['identified']),screened:num(p['screened']),retrieved:num(p['retrieved']),excluded:num(p['excluded']),included:num(p['included'])}};
}

type FrameworkKind = 'PICO' | 'PICOS' | 'PECO' | 'SPIDER';

const frameworkDefinitions: Record<FrameworkKind, {labels: string[]; purpose: string}> = {
  PICO: { labels: ['Population', 'Intervention', 'Comparison', 'Outcome'], purpose: 'پرسیاری توێژینەوەی clinical/intervention' },
  PICOS: { labels: ['Population', 'Intervention', 'Comparison', 'Outcome', 'Study design'], purpose: 'PICO لەگەڵ جۆری design' },
  PECO: { labels: ['Population', 'Exposure', 'Comparator', 'Outcome'], purpose: 'توێژینەوەی exposure/association' },
  SPIDER: { labels: ['Sample', 'Phenomenon of Interest', 'Design', 'Evaluation', 'Research type'], purpose: 'توێژینەوەی qualitative و mixed-methods' }
};

function framework(p: Record<string, unknown>) {
  const requested = String(p['framework'] || 'PICO').toUpperCase() as FrameworkKind;
  const selected = frameworkDefinitions[requested] ? requested : 'PICO';
  const values = p['values'] && typeof p['values'] === 'object' ? p['values'] as Record<string, unknown> : p;
  const items = frameworkDefinitions[selected].labels.map(label => {
    const key = label.toLowerCase().replaceAll(' ', '_');
    const value = String(values[key] ?? values[label] ?? '').trim();
    return { label, key, value, status: value ? 'complete' : 'missing' };
  });
  return { framework: selected, purpose: frameworkDefinitions[selected].purpose, items, complete: items.filter(x => x.status === 'complete').length, total: items.length };
}

function riskBias(p: Record<string, unknown>) {
  const tool = String(p['tool'] || 'rob2').toLowerCase();
  const domainMap: Record<string, string[]> = {
    rob2: ['randomization process', 'deviations from intended intervention', 'missing outcome data', 'measurement of outcome', 'selection of reported result'],
    robins_i: ['confounding', 'selection of participants', 'classification of interventions', 'deviations from interventions', 'missing data', 'measurement of outcomes', 'selection of reported result'],
    quadas2: ['patient selection', 'index test', 'reference standard', 'flow and timing'],
    casp: ['validity', 'results', 'local applicability']
  };
  const domains = domainMap[tool] || domainMap['rob2'];
  const assessments = p['assessments'] && typeof p['assessments'] === 'object'
    ? p['assessments'] as Record<string, unknown>
    : {};
  const rows = domains.map(domain => {
    const value = String(assessments[domain] ?? '').trim();
    return { domain, judgement: value || 'not_assessed', evidence: String((p['evidence'] && typeof p['evidence'] === 'object' ? p['evidence'] as Record<string, unknown> : {})[domain] ?? '') };
  });
  return { tool, rows, assessed: rows.filter(x => x.judgement !== 'not_assessed').length, total: rows.length, note: 'ئەمە checklist ـی ڕێکخستنی risk-of-bias ـە؛ حوکمی کۆتایی پێویستی بە خوێندنەوەی study ـەکان و دوو داوەر هەیە.' };
}

function evidenceGrade(p: Record<string, unknown>) {
  const initial = String(p['initialCertainty'] || 'high') as 'high' | 'moderate' | 'low' | 'very_low';
  const order = ['high', 'moderate', 'low', 'very_low'] as const;
  let level = order.includes(initial) ? initial : 'high';
  const dimensions = ['riskOfBias', 'inconsistency', 'indirectness', 'imprecision', 'publicationBias'];
  const downgrades: string[] = [];
  for (const key of dimensions) {
    const value = String(p[key] || '').toLowerCase();
    if (value === 'serious' || value === 'high') {
      const index = order.indexOf(level);
      level = order[Math.min(order.length - 1, index + 1)];
      downgrades.push(key);
    }
  }
  return { initialCertainty: initial, finalCertainty: level, downgradedFor: downgrades, note: 'هەڵسەنگاندنەکە structured heuristic ـە و نابێت وەک GRADE adjudication ـی کۆتایی بەکاربهێنرێت.' };
}

function claimMap(p: Record<string, unknown>) {
  const claims=Array.isArray(p['claims'])?p['claims'] as Record<string,unknown>[]:[];
  return {claims:claims.map((claim,index)=>{ const sources=Array.isArray(claim['sources'])?claim['sources']:[]; const verified=sources.filter((s:any)=>s?.verified===true).length; return {claimId:String(claim['id']||('CLM-'+(index+1))),text:String(claim['text']||''),sourceCount:sources.length,verifiedSourceCount:verified,evidenceStatus:sources.length===0?'missing':verified>0?'supported':'unverified',pageOrLocationRequired:Boolean(claim['requiresLocation'])}; }),unmappedClaims:claims.filter(c=>!Array.isArray(c['sources'])||(c['sources'] as unknown[]).length===0).length};
}

function provenance(p: Record<string, unknown>) {
  const records=Array.isArray(p['records'])?p['records'] as Record<string,unknown>[]:[];
  return {records:records.map((r,i)=>({evidenceId:String(r['evidenceId']||('EVD-'+(i+1))),sourceId:String(r['sourceId']||''),documentFingerprint:String(r['documentFingerprint']||''),page:String(r['page']||''),locator:String(r['locator']||''),excerptHash:String(r['excerptHash']||''),retrievedAt:String(r['retrievedAt']||''),verified:r['verified']===true,complete:Boolean(r['sourceId']&&r['documentFingerprint']&&r['locator']&&r['retrievedAt'])})),incompleteCount:records.filter(r=>!(r['sourceId']&&r['documentFingerprint']&&r['locator']&&r['retrievedAt'])).length};
}

export class ResearchMethodsLabService { run(mode: MethodsLabMode,payload:Record<string,unknown>) { if(mode==='prisma') return prisma(payload); if(mode==='power') return {...power(payload),effectSize:effectSize(payload)}; if(mode==='claim_map') return claimMap(payload); if(mode==='provenance') return provenance(payload); if(mode==='framework') return framework(payload); if(mode==='risk_bias') return riskBias(payload); if(mode==='methodology_gate') return methodologyGate(payload); if(mode==='reporting_guideline') return reportingGuideline(payload); return evidenceGrade(payload); } }
export const researchMethodsLabService=new ResearchMethodsLabService();