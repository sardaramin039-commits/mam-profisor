export type MethodsLabMode = 'prisma' | 'power' | 'claim_map' | 'provenance';

const num = (v: unknown, fallback = 0): number => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const clamp = (n: number, min = 0, max = 1): number => Math.min(max, Math.max(min, n));

function normalCdfInverse(p: number): number {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425; const phigh = 1 - plow;
  if (p <= 0 || p >= 1) throw new Error('Probability must be between 0 and 1.');
  if (p < plow) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/(((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)); }
  if (p > phigh) { const q = Math.sqrt(-2 * Math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/(((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)); }
  const q = p - 0.5; const r = q*q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q)/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
}

function effectSize(p: Record<string, unknown>) {
  const mean1=num(p.mean1), mean2=num(p.mean2), sd1=num(p.sd1), sd2=num(p.sd2);
  const n1=Math.max(2,Math.round(num(p.n1,2))), n2=Math.max(2,Math.round(num(p.n2,2)));
  if (sd1<=0 || sd2<=0) return { error:'SD ـەکان دەبێت لە سفر گەورەتر بن.' };
  const pooled=Math.sqrt(((n1-1)*sd1**2+(n2-1)*sd2**2)/(n1+n2-2));
  const d=(mean1-mean2)/pooled; const correction=1-3/Math.max(1,4*(n1+n2)-9);
  return { cohensD:d, hedgesG:d*correction, pooledSd:pooled };
}

function power(p: Record<string, unknown>) {
  const alpha=clamp(num(p.alpha,0.05),0.0001,0.5); const targetPower=clamp(num(p.power,0.8),0.5,0.999);
  const zAlpha=normalCdfInverse(1-alpha/2), zPower=normalCdfInverse(targetPower);
  const design=String(p.design||'two_group_t');
  if (design==='correlation') { const r=clamp(Math.abs(num(p.effect,0.3)),0.001,0.99); const fisher=Math.atanh(r); const n=Math.ceil(((zAlpha+zPower)/fisher)**2+3); return {design,alpha,targetPower,effect:r,estimatedN:n,note:'Approximate two-sided Fisher-z calculation; final protocol should be checked in a dedicated statistical package.'}; }
  const d=Math.max(0.001,Math.abs(num(p.effect,0.5))); const nPerGroup=Math.ceil(2*((zAlpha+zPower)/d)**2);
  return {design,alpha,targetPower,effect:d,estimatedNPerGroup:nPerGroup,estimatedTotalN:nPerGroup*2,note:'Approximate two-sided two-group calculation; account for attrition, clustering and analysis assumptions before finalizing.'};
}

function prisma(p: Record<string, unknown>) {
  const fields=[['title','ناونیشان و جۆری systematic review'],['rationale','هۆکار و gap'],['question','پرسیار/PICO یان framework'],['eligibility','inclusion/exclusion criteria'],['informationSources','database/register و بەرواری گەڕان'],['searchStrategy','search strings و limits'],['selectionProcess','screening و full-text process'],['dataCollection','data extraction process'],['riskOfBias','risk-of-bias method'],['synthesis','synthesis/meta-analysis plan'],['reportingBias','reporting-bias assessment'],['certainty','certainty of evidence'],['protocol','registration/protocol'],['funding','funding/support'],['conflicts','competing interests'],['dataCode','data/code/material availability']] as const;
  const checklist=fields.map(([key,label])=>({key,label,status:String(p[key]||'').trim()?'complete':'missing'}));
  const complete=checklist.filter(x=>x.status==='complete').length;
  return {framework:'PRISMA 2020',totalItems:checklist.length,complete,missing:checklist.length-complete,checklist,flow:{identified:num(p.identified),screened:num(p.screened),retrieved:num(p.retrieved),excluded:num(p.excluded),included:num(p.included)}};
}

function claimMap(p: Record<string, unknown>) {
  const claims=Array.isArray(p.claims)?p.claims as Record<string,unknown>[]:[];
  return {claims:claims.map((claim,index)=>{ const sources=Array.isArray(claim.sources)?claim.sources:[]; const verified=sources.filter((s:any)=>s?.verified===true).length; return {claimId:String(claim.id||('CLM-'+(index+1))),text:String(claim.text||''),sourceCount:sources.length,verifiedSourceCount:verified,evidenceStatus:sources.length===0?'missing':verified>0?'supported':'unverified',pageOrLocationRequired:Boolean(claim.requiresLocation)}; }),unmappedClaims:claims.filter(c=>!Array.isArray(c.sources)||(c.sources as unknown[]).length===0).length};
}

function provenance(p: Record<string, unknown>) {
  const records=Array.isArray(p.records)?p.records as Record<string,unknown>[]:[];
  return {records:records.map((r,i)=>({evidenceId:String(r.evidenceId||('EVD-'+(i+1))),sourceId:String(r.sourceId||''),documentFingerprint:String(r.documentFingerprint||''),page:String(r.page||''),locator:String(r.locator||''),excerptHash:String(r.excerptHash||''),retrievedAt:String(r.retrievedAt||''),verified:r.verified===true,complete:Boolean(r.sourceId&&r.documentFingerprint&&r.locator&&r.retrievedAt)})),incompleteCount:records.filter(r=>!(r.sourceId&&r.documentFingerprint&&r.locator&&r.retrievedAt)).length};
}

export class ResearchMethodsLabService { run(mode: MethodsLabMode,payload:Record<string,unknown>) { if(mode==='prisma') return prisma(payload); if(mode==='power') return {...power(payload),effectSize:effectSize(payload)}; if(mode==='claim_map') return claimMap(payload); return provenance(payload); } }
export const researchMethodsLabService=new ResearchMethodsLabService();