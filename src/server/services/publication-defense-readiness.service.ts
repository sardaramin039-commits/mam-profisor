export type ReadinessStatus = 'READY' | 'REVISE' | 'BLOCKED';

export interface DefenseQuestion {
  category: 'research-question' | 'methodology' | 'evidence' | 'limitations' | 'contribution';
  question: string;
  purpose: string;
}

export interface PublicationDefenseReadinessInput {
  title: string;
  abstract?: string;
  researchQuestion?: string;
  methodology?: string;
  conclusion?: string;
  chapterCount: number;
  referencedCitationCount: number;
  verifiedCitationCount: number;
  bibliographyCount: number;
  structuralStatus: 'PASS' | 'REJECT';
  exportBlocked: boolean;
  overallQAScore?: number;
  criticalViolationsCount?: number;
  topic?: string;
}

export interface PublicationDefenseReadinessReport {
  publicationStatus: ReadinessStatus;
  defenseStatus: ReadinessStatus;
  publicationScore: number;
  defenseScore: number;
  blockers: string[];
  revisions: string[];
  strengths: string[];
  defenseQuestions: DefenseQuestion[];
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluatePublicationDefenseReadiness(
  input: PublicationDefenseReadinessInput
): PublicationDefenseReadinessReport {
  const blockers: string[] = [];
  const revisions: string[] = [];
  const strengths: string[] = [];

  if (!clean(input.title)) blockers.push('ناونیشانی manuscript بەتاڵە.');
  if (input.chapterCount < 1) blockers.push('هیچ بەشێکی manuscript نییە.');
  if (input.structuralStatus !== 'PASS') blockers.push('integrity ـی بونیادی manuscript پاس نەکردووە.');
  if (input.exportBlocked) blockers.push('export gate هێشتا داخراوە.');
  if ((input.criticalViolationsCount ?? 0) > 0) blockers.push('QA violation ـی گرنگ هەیە.');
  if (!clean(input.methodology)) blockers.push('methodology بۆ publication readiness بەردەست نییە.');
  if (input.referencedCitationCount > input.verifiedCitationCount) blockers.push('هەندێک citation ـی بەکارهاتوو verified نیین.');
  if (input.referencedCitationCount > 0 && input.bibliographyCount < input.referencedCitationCount) blockers.push('bibliography پاشکەوتی تەواوی citation ـە بەکارهاتووەکان نییە.');

  if (!clean(input.abstract)) revisions.push('پوختەی manuscript زیاد یان پەرە پێبدە.');
  if (!clean(input.researchQuestion)) revisions.push('پرسیاری توێژینەوە بە ڕوونی لە package ـی کۆتایی دابنێ.');
  if (!clean(input.conclusion)) revisions.push('ئەنجامی کۆتایی manuscript زیاد یان تەواو بکە.');
  if (input.referencedCitationCount === 0) revisions.push('هیچ citation ـی verified ـی بەکارهاتوو نییە؛ پێداچوونەوەی evidence پێویستە.');
  if (input.overallQAScore !== undefined && input.overallQAScore < 80) revisions.push('نمرەی QA کەمترە لە ٨٠؛ پێش publication پێداچوونەوە بکە.');

  if (blockers.length === 0) strengths.push('بونیادی manuscript و export gate لە دۆخی ڕێگەپێدراودان.');
  if (input.verifiedCitationCount > 0) strengths.push('citation ـە بەکارهاتووەکان پشتگیریی verification ـیان هەیە.');
  if (clean(input.researchQuestion) && clean(input.methodology)) strengths.push('پەیوەندیی نێوان research question و methodology لە package ـەکەدا هەیە.');

  const publicationBase = [
    clean(input.title) ? 15 : 0,
    input.chapterCount > 0 ? 15 : 0,
    input.structuralStatus === 'PASS' ? 15 : 0,
    !input.exportBlocked ? 20 : 0,
    clean(input.methodology) ? 10 : 0,
    clean(input.abstract) ? 5 : 0,
    clean(input.researchQuestion) ? 5 : 0,
    clean(input.conclusion) ? 5 : 0,
    input.referencedCitationCount > 0 && input.bibliographyCount >= input.referencedCitationCount ? 10 : 0
  ].reduce((sum, value) => sum + value, 0);

  const defenseBase = [
    clean(input.researchQuestion) ? 25 : 0,
    clean(input.methodology) ? 20 : 0,
    clean(input.conclusion) ? 15 : 0,
    input.verifiedCitationCount > 0 ? 15 : 0,
    (input.overallQAScore ?? 0) >= 70 ? 15 : 0,
    input.chapterCount >= 2 ? 10 : 0
  ].reduce((sum, value) => sum + value, 0);

  const publicationScore = clamp(publicationBase - blockers.length * 10 - revisions.length * 3);
  const defenseScore = clamp(defenseBase - blockers.length * 8 - revisions.length * 2);

  const publicationStatus: ReadinessStatus = blockers.length > 0 ? 'BLOCKED' : publicationScore >= 85 ? 'READY' : 'REVISE';
  const defenseStatus: ReadinessStatus = blockers.length > 2 ? 'BLOCKED' : defenseScore >= 80 ? 'READY' : 'REVISE';

  const topic = clean(input.topic) || clean(input.title) || 'توێژینەوەکە';
  const defenseQuestions: DefenseQuestion[] = [
    { category: 'research-question', question: 'بۆچی ئەم پرسیاری توێژینەوەیە بۆ «' + topic + '» هەڵبژێردراوە و سنووری توێژینەوەکە چییە؟', purpose: 'پشکنینی ڕوونی پرسیار و scope.' },
    { category: 'methodology', question: 'بۆچی ئەم methodology ـە هەڵبژێردراوە و چۆن گونجانییەکەی لەگەڵ پرسیاری توێژینەوە دڵنیابوویت؟', purpose: 'پشکنینی هەڵبژاردنی مێتۆد.' },
    { category: 'evidence', question: 'کام evidence ـە سەرەکییەکان پشتگیریی claim ـە گرنگەکان دەکەن و چۆن verification ـیان کراوە؟', purpose: 'پشکنینی claim-evidence traceability.' },
    { category: 'limitations', question: 'سنووردارییە سەرەکییەکانی توێژینەوەکە چین و چۆن کاریگەرییان لەسەر دەرئەنجامەکان کەم کراوەتەوە؟', purpose: 'پشکنینی ڕاستگۆیی زانستی و limitation awareness.' },
    { category: 'contribution', question: 'بەشدارییە سەرەکییەکەی ئەم توێژینەوەیە بۆ ئەدەبیاتی بواری خۆی چییە؟', purpose: 'پشکنینی contribution بەبێ بانگەشەی زیادە.' }
  ];

  return { publicationStatus, defenseStatus, publicationScore, defenseScore, blockers: [...new Set(blockers)], revisions: [...new Set(revisions)], strengths: [...new Set(strengths)], defenseQuestions };
}
