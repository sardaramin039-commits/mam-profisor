export type MethodsLabMode = 'prisma' | 'power' | 'claim_map' | 'provenance';

const num = (v: unknown, fallback = 0): number => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const clamp = (n: number, min = 0, max = 1): number => Math.min(max, Math.max(min, n));

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

function claimMap(p: Record<string, unknown>) {
  const claims=Array.isArray(p['claims'])?p['claims'] as Record<string,unknown>[]:[];
  return {claims:claims.map((claim,index)=>{ const sources=Array.isArray(claim['sources'])?claim['sources']:[]; const verified=sources.filter((s:any)=>s?.verified===true).length; return {claimId:String(claim['id']||('CLM-'+(index+1))),text:String(claim['text']||''),sourceCount:sources.length,verifiedSourceCount:verified,evidenceStatus:sources.length===0?'missing':verified>0?'supported':'unverified',pageOrLocationRequired:Boolean(claim['requiresLocation'])}; }),unmappedClaims:claims.filter(c=>!Array.isArray(c['sources'])||(c['sources'] as unknown[]).length===0).length};
}

function provenance(p: Record<string, unknown>) {
  const records=Array.isArray(p['records'])?p['records'] as Record<string,unknown>[]:[];
  return {records:records.map((r,i)=>({evidenceId:String(r['evidenceId']||('EVD-'+(i+1))),sourceId:String(r['sourceId']||''),documentFingerprint:String(r['documentFingerprint']||''),page:String(r['page']||''),locator:String(r['locator']||''),excerptHash:String(r['excerptHash']||''),retrievedAt:String(r['retrievedAt']||''),verified:r['verified']===true,complete:Boolean(r['sourceId']&&r['documentFingerprint']&&r['locator']&&r['retrievedAt'])})),incompleteCount:records.filter(r=>!(r['sourceId']&&r['documentFingerprint']&&r['locator']&&r['retrievedAt'])).length};
}

export class ResearchMethodsLabService { run(mode: MethodsLabMode,payload:Record<string,unknown>) { if(mode==='prisma') return prisma(payload); if(mode==='power') return {...power(payload),effectSize:effectSize(payload)}; if(mode==='claim_map') return claimMap(payload); return provenance(payload); } }
export const researchMethodsLabService=new ResearchMethodsLabService();