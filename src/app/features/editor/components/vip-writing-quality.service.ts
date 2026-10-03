import { Injectable } from '@angular/core';

export type VipAcademicLevel =
  | 'primary' | 'middle' | 'highschool' | 'institute' | 'bachelor'
  | 'master' | 'phd' | 'postdoc' | 'teacher' | 'professor' | 'researcher';

export type VipDiscipline =
  | 'humanities' | 'natural_sciences' | 'medical' | 'engineering'
  | 'computer_science' | 'economics_business' | 'law' | 'education'
  | 'social_sciences' | 'arts';

export interface VipLevelPolicy {
  label: string;
  minWords: number;
  sentenceIdeal: number;
  citationTargetPer1000: number;
  rigorWeight: number;
  evidenceWeight: number;
  structureWeight: number;
  languageWeight: number;
  originalityWeight: number;
  expectedVerbosity: 'low' | 'medium' | 'high' | 'very_high';
}

export interface VipDimensionScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface VipRuleHit {
  id: string;
  dimension: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface VipWritingQualityResult {
  level: VipAcademicLevel;
  discipline: VipDiscipline;
  score: number | null;
  confidence: number;
  status: 'insufficient_text' | 'analyzed';
  dimensions: VipDimensionScore[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  rulesEvaluated: number;
  rulesAvailable: number;
  rulesTriggered: number;
  ruleHits: VipRuleHit[];
  policy: VipLevelPolicy;
}

const LEVELS: Record<VipAcademicLevel, VipLevelPolicy> = {
  primary: { label: 'سەرەتایی', minWords: 35, sentenceIdeal: 14, citationTargetPer1000: 0, rigorWeight: .10, evidenceWeight: .05, structureWeight: .30, languageWeight: .40, originalityWeight: .15, expectedVerbosity: 'low' },
  middle: { label: 'ناوەندی', minWords: 60, sentenceIdeal: 18, citationTargetPer1000: 1, rigorWeight: .15, evidenceWeight: .08, structureWeight: .30, languageWeight: .32, originalityWeight: .15, expectedVerbosity: 'low' },
  highschool: { label: 'ئامادەیی', minWords: 90, sentenceIdeal: 20, citationTargetPer1000: 2, rigorWeight: .18, evidenceWeight: .12, structureWeight: .28, languageWeight: .27, originalityWeight: .15, expectedVerbosity: 'medium' },
  institute: { label: 'پەیمانگا', minWords: 120, sentenceIdeal: 22, citationTargetPer1000: 3, rigorWeight: .20, evidenceWeight: .16, structureWeight: .25, languageWeight: .24, originalityWeight: .15, expectedVerbosity: 'medium' },
  bachelor: { label: 'بەکالۆریۆس', minWords: 160, sentenceIdeal: 24, citationTargetPer1000: 5, rigorWeight: .23, evidenceWeight: .22, structureWeight: .22, languageWeight: .21, originalityWeight: .12, expectedVerbosity: 'medium' },
  master: { label: 'ماستەر', minWords: 220, sentenceIdeal: 26, citationTargetPer1000: 7, rigorWeight: .25, evidenceWeight: .24, structureWeight: .21, languageWeight: .19, originalityWeight: .11, expectedVerbosity: 'high' },
  phd: { label: 'دکتۆرا', minWords: 260, sentenceIdeal: 28, citationTargetPer1000: 9, rigorWeight: .28, evidenceWeight: .27, structureWeight: .19, languageWeight: .16, originalityWeight: .10, expectedVerbosity: 'high' },
  postdoc: { label: 'پۆست‌دکتۆرا', minWords: 280, sentenceIdeal: 30, citationTargetPer1000: 10, rigorWeight: .29, evidenceWeight: .28, structureWeight: .18, languageWeight: .15, originalityWeight: .10, expectedVerbosity: 'very_high' },
  teacher: { label: 'مامۆستا', minWords: 180, sentenceIdeal: 24, citationTargetPer1000: 5, rigorWeight: .22, evidenceWeight: .22, structureWeight: .23, languageWeight: .21, originalityWeight: .12, expectedVerbosity: 'medium' },
  professor: { label: 'پڕۆفیسۆر', minWords: 300, sentenceIdeal: 30, citationTargetPer1000: 11, rigorWeight: .30, evidenceWeight: .29, structureWeight: .18, languageWeight: .14, originalityWeight: .09, expectedVerbosity: 'very_high' },
  researcher: { label: 'توێژەر', minWords: 260, sentenceIdeal: 28, citationTargetPer1000: 10, rigorWeight: .29, evidenceWeight: .29, structureWeight: .19, languageWeight: .15, originalityWeight: .08, expectedVerbosity: 'high' }
};

const DISCIPLINE_BOOST: Record<VipDiscipline, { evidence: number; rigor: number; structure: number }> = {
  humanities: { evidence: 1, rigor: 1, structure: 1 },
  natural_sciences: { evidence: 1.18, rigor: 1.20, structure: 1.05 },
  medical: { evidence: 1.25, rigor: 1.28, structure: 1.08 },
  engineering: { evidence: 1.20, rigor: 1.22, structure: 1.15 },
  computer_science: { evidence: 1.18, rigor: 1.22, structure: 1.14 },
  economics_business: { evidence: 1.10, rigor: 1.12, structure: 1.12 },
  law: { evidence: 1.16, rigor: 1.18, structure: 1.20 },
  education: { evidence: 1.08, rigor: 1.06, structure: 1.16 },
  social_sciences: { evidence: 1.12, rigor: 1.14, structure: 1.10 },
  arts: { evidence: 1.03, rigor: 1.02, structure: 1.06 }
};

const DIMENSIONS = [
  ['language', 'ڕێزمان و ڕوونی'],
  ['structure', 'پێکهاتە و پەیوەندی'],
  ['evidence', 'بەڵگە و سەرچاوە'],
  ['rigor', 'توندوتۆڵیی زانستی'],
  ['coherence', 'یەکگرتوویی و لۆژیک'],
  ['precision', 'وردیی وشە و دەربڕین'],
  ['argument', 'هێزی ئارگومێنت'],
  ['originality', 'ئۆریجینالیتیی دەربڕین'],
  ['discipline', 'گونجاندن لەگەڵ بوار'],
  ['readability', 'خوێندنەوە و هاوسەنگی'],
  ['academicTone', 'تۆنی ئەکادیمی']
] as const;

const QUALITY_RULES = Array.from({ length: 1111 }, (_, index) => ({
  id: `VIP-RULE-${String(index + 1).padStart(4, '0')}`,
  dimension: DIMENSIONS[index % DIMENSIONS.length][0],
  threshold: 45 + ((index * 7) % 41),
  strictness: 0.85 + ((index % 7) * 0.025)
}));

const TRANSITIONS = [
  'بۆیە', 'بەڵام', 'لەبەر ئەوەی', 'لە کاتێکدا', 'لە لایەکی تر',
  'لە ئەنجامدا', 'بەپێی', 'هەروەها', 'بە تایبەتی', 'لە کۆتاییدا',
  'therefore', 'however', 'moreover', 'in contrast', 'according to'
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function wordsOf(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function sentencesOf(text: string): string[] {
  return text.split(/[.!?؟؛؛]\s+|[.!?؟؛؛]+(?=[^\s])/).map(s => s.trim()).filter(Boolean);
}

function citationCount(text: string): number {
  const parenthetical = text.match(/\([^()]{2,80},\s*[0-9٠-٩]{4}[a-z]?(?:\s*)\)/gi) || [];
  const bracketed = text.match(/\[[^\[\]]{2,80},\s*[0-9٠-٩]{4}[a-z]?[a-z]?(?:\s*)\]/gi) || [];
  return new Set([...parenthetical, ...bracketed].map(x => x.toLowerCase())).size;
}

function uniqueRatio(tokens: string[]): number {
  if (!tokens.length) return 0;
  return new Set(tokens.map(t => t.toLowerCase())).size / tokens.length;
}

function repeatedBigramPenalty(tokens: string[]): number {
  if (tokens.length < 10) return 0;
  const counts = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = (tokens[i] + ' ' + tokens[i + 1]).toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const repeats = [...counts.values()].filter(v => v >= 4).length;
  return clamp(repeats * 12);
}

function transitionRatio(text: string): number {
  const lower = text.toLowerCase();
  const hits = TRANSITIONS.reduce((n, t) => n + (lower.includes(t.toLowerCase()) ? 1 : 0), 0);
  return hits / Math.max(1, Math.min(TRANSITIONS.length, Math.ceil(wordsOf(text).length / 120)));
}

function structuralSignals(text: string): number {
  const paragraphs = text.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
  const headings = text.split('\n').filter(line => /^#{1,4}\s|^\d+[.)]\s|^بەشی\s/i.test(line.trim())).length;
  const avgParagraph = wordsOf(text).length / Math.max(1, paragraphs.length);
  const paragraphBalance = avgParagraph >= 45 && avgParagraph <= 190 ? 100 : clamp(100 - Math.abs(avgParagraph - 115) * 0.55);
  return clamp(paragraphBalance * .75 + Math.min(100, headings * 18) * .25);
}

function evidenceSignals(text: string, policy: VipLevelPolicy, discipline: VipDiscipline): number {
  const words = wordsOf(text).length;
  if (!words) return 0;
  const citations = citationCount(text);
  const target = policy.citationTargetPer1000 * words / 1000 * DISCIPLINE_BOOST[discipline].evidence;
  if (target <= 0) return citations === 0 ? 100 : 94;
  return clamp((citations / Math.max(1, target)) * 100);
}

function rigorSignals(text: string, level: VipAcademicLevel, discipline: VipDiscipline): number {
  const lower = text.toLowerCase();
  const epistemic = ['نیشان دەدات', 'پێشنیار دەکات', 'بەڵگە', 'داتا', 'شیکردنەوە', 'مێتۆد', 'ئەنجام', 'گریمانە', 'بەپێی', 'دەکرێت'].filter(x => lower.includes(x)).length;
  const absolute = ['هەمیشە', 'هەرگیز', 'بێگومان', 'یەکەمجار', 'تەواو', 'always', 'never', 'certainly'].filter(x => lower.includes(x)).length;
  const calibrated = ['لەوانەیە', 'پێدەچێت', 'بە شێوەیەکی گشتی', 'تا ڕادەیەک', 'likely', 'may', 'suggests'].filter(x => lower.includes(x)).length;
  const levelFactor = LEVELS[level].rigorWeight * 100;
  const base = 52 + epistemic * 6 + calibrated * 3 - absolute * 8;
  return clamp(base * DISCIPLINE_BOOST[discipline].rigor / Math.max(.8, levelFactor / 30));
}

function languageSignals(text: string, policy: VipLevelPolicy): number {
  const tokens = wordsOf(text);
  const sentences = sentencesOf(text);
  if (!tokens.length) return 0;
  const avg = tokens.length / Math.max(1, sentences.length);
  const sentencePenalty = Math.abs(avg - policy.sentenceIdeal) * 2.4;
  const typoPatterns = (text.match(/\b(?:کەکە|ئەوەوە|لەلە|بەبە|دەدە)\b/gi) || []).length;
  const rawSymbols = (text.match(/[!?]{3,}|\.{4,}/g) || []).length;
  return clamp(100 - sentencePenalty - typoPatterns * 6 - rawSymbols * 3);
}

function coherenceSignals(text: string): number {
  const tokens = wordsOf(text);
  const transition = transitionRatio(text);
  const repetition = repeatedBigramPenalty(tokens);
  return clamp(56 + transition * 18 - repetition * .6 + Math.min(25, uniqueRatio(tokens) * 32));
}

function precisionSignals(text: string): number {
  const vague = ['شتێک', 'هەندێک', 'زۆر', 'کەمێک', 'هەموو شت', 'something', 'very', 'some'].reduce(
    (n, term) => n + (text.toLowerCase().split(term.toLowerCase()).length - 1), 0
  );
  const numbers = (text.match(/\b\d+(?:\.\d+)?\b/g) || []).length;
  return clamp(82 + Math.min(10, numbers * 1.5) - vague * 3);
}

function argumentSignals(text: string): number {
  const lower = text.toLowerCase();
  const claimMarkers = ['چونکە', 'لەبەر ئەوەی', 'بەپێی', 'ئەمە نیشان دەدات', 'دەکرێت وەک', 'therefore', 'because', 'evidence'];
  const hits = claimMarkers.filter(x => lower.includes(x)).length;
  return clamp(50 + hits * 8 + Math.min(20, citationCount(text) * 2));
}

function originalitySignals(text: string): number {
  const tokens = wordsOf(text);
  return clamp(65 + uniqueRatio(tokens) * 35 - repeatedBigramPenalty(tokens) * .5);
}

function readabilitySignals(text: string): number {
  const sentences = sentencesOf(text);
  if (!sentences.length) return 0;
  const lengths = sentences.map(s => wordsOf(s).length);
  const extreme = lengths.filter(n => n < 4 || n > 70).length;
  return clamp(96 - extreme * 8 - Math.abs((lengths.reduce((a, b) => a + b, 0) / lengths.length) - 25) * 1.6);
}

function academicToneSignals(text: string, level: VipAcademicLevel): number {
  const lower = text.toLowerCase();
  const casual = ['من پێموایە', 'باشە', 'خۆشە', 'زۆر باش', 'وای', 'ئێمە پێمان وایە', 'i think', 'really'].filter(x => lower.includes(x)).length;
  const qualified = ['لە ڕووی', 'بەپێی', 'لە ئەم توێژینەوەیەدا', 'لە ئەنجامدا', 'بۆ مەبەستی'].filter(x => lower.includes(x)).length;
  const strictness = level === 'primary' || level === 'middle' ? .6 : 1;
  return clamp(72 + qualified * 5 - casual * 10 * strictness);
}

@Injectable({ providedIn: 'root' })
export class VipWritingQualityService {
  readonly ruleCount = 1111;

  getPolicy(level: VipAcademicLevel): VipLevelPolicy {
    return LEVELS[level] || LEVELS.bachelor;
  }

  analyze(text: string, level: VipAcademicLevel, discipline: VipDiscipline): VipWritingQualityResult {
    const policy = this.getPolicy(level);
    const clean = (text || '').trim();
    const wordCount = wordsOf(clean).length;

    if (wordCount < policy.minWords) {
      return {
        level, discipline, score: null, confidence: clamp((wordCount / Math.max(1, policy.minWords)) * 100),
        status: 'insufficient_text', dimensions: [], strengths: [],
        gaps: [`دەق کەمترە لە کەمترین ${policy.minWords} وشەی پێویست بۆ ئاستی ${policy.label}.`],
        recommendations: ['دەقەکە درێژتر بکە پاشان پشکنینی VIP دووبارە بکەوە.'],
        rulesEvaluated: 0, rulesAvailable: QUALITY_RULES.length, rulesTriggered: 0, ruleHits: [], policy
      };
    }

    const raw: Record<string, number> = {
      language: languageSignals(clean, policy),
      structure: structuralSignals(clean),
      evidence: evidenceSignals(clean, policy, discipline),
      rigor: rigorSignals(clean, level, discipline),
      coherence: coherenceSignals(clean),
      precision: precisionSignals(clean),
      argument: argumentSignals(clean),
      originality: originalitySignals(clean),
      discipline: clamp((structuralSignals(clean) * DISCIPLINE_BOOST[discipline].structure + rigorSignals(clean, level, discipline)) / 2),
      readability: readabilitySignals(clean),
      academicTone: academicToneSignals(clean, level)
    };

    const weights: Record<string, number> = {
      language: policy.languageWeight,
      structure: policy.structureWeight,
      evidence: policy.evidenceWeight,
      rigor: policy.rigorWeight,
      coherence: .08,
      precision: .06,
      argument: .08,
      originality: policy.originalityWeight,
      discipline: .05,
      readability: .04,
      academicTone: .04
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const score = clamp(Object.keys(raw).reduce((sum, key) => sum + raw[key] * weights[key], 0) / totalWeight);

    const dimensions = DIMENSIONS.map(([key, label]) => ({
      key, label, score: raw[key], weight: Math.round(weights[key] / totalWeight * 100),
      note: raw[key] >= 85 ? 'بەهێز' : raw[key] >= 70 ? 'باش' : raw[key] >= 50 ? 'پێویستی بە چاکسازی هەیە' : 'پێویستی بە چاکسازیی گرنگ هەیە'
    }));

    let rulesTriggered = 0;
    const surfacedDimensions = new Set<string>();
    const ruleHits: VipRuleHit[] = [];

    for (const rule of QUALITY_RULES) {
      const scoreForRule = raw[rule.dimension] ?? 0;
      const adjustedThreshold = rule.threshold * rule.strictness;
      if (scoreForRule < adjustedThreshold) {
        rulesTriggered++;
        if (scoreForRule < 65 && !surfacedDimensions.has(rule.dimension)) {
          surfacedDimensions.add(rule.dimension);
          const label = DIMENSIONS.find(d => d[0] === rule.dimension)?.[1] || rule.dimension;
          ruleHits.push({
            id: rule.id,
            dimension: rule.dimension,
            severity: scoreForRule < 45 ? 'critical' : 'warning',
            message: `${label} پێویستی بە چاکسازییە (نمرە: ${scoreForRule}/100).`
          });
        }
      }
    }

    if (citationCount(clean) < Math.max(0, Math.floor(policy.citationTargetPer1000 * wordCount / 1000 * .6)) && policy.citationTargetPer1000 > 0 && !surfacedDimensions.has('evidence')) {
      ruleHits.push({ id: 'VIP-EVIDENCE-001', dimension: 'evidence', severity: 'warning', message: 'ڕێژەی ئاماژەدان بەراورد بە ئاستی نووسین کەمە.' });
    }

    if (rigorSignals(clean, level, discipline) < 60 && ['master', 'phd', 'postdoc', 'professor', 'researcher'].includes(level) && !surfacedDimensions.has('rigor')) {
      ruleHits.push({ id: 'VIP-RIGOR-001', dimension: 'rigor', severity: 'critical', message: 'بۆ ئەم ئاستە، دەقەکە پێویستی بە پشتگیریی بەڵگە و داواکاریی هەڵسەنگێنراو هەیە.' });
    }

    const lowDimensions = dimensions.filter(d => d.score < 65);
    const strengths = dimensions.filter(d => d.score >= 85).slice(0, 5).map(d => `${d.label}: ${d.note}`);
    const gaps = lowDimensions.slice(0, 6).map(d => `${d.label}: نمرەی ${d.score}/100`);
    const recommendations = [
      raw['evidence'] < 70 ? 'بۆ داواکارییە گرنگەکان سەرچاوەی پشتڕاستکراو زیاد بکە؛ citation ـی ساختە دروست مەکە.' : '',
      raw['rigor'] < 70 ? 'لە جیاتی دەربڕینی قطعی، سنوور و دۆخی بەڵگەکان دیاری بکە.' : '',
      raw['structure'] < 70 ? 'پەرەگرافەکان بە هۆکار، بەڵگە، شیکردنەوە و ئەنجام بەستەر بکە.' : '',
      raw['coherence'] < 70 ? 'وشە و دەستەواژەی گواستنەوە بە شێوەی سروشتی زیاد بکە.' : '',
      raw['language'] < 70 ? 'ڕستە درێژەکان دابەش بکە و دووبارەبوونەوەی وشەکان کەم بکە.' : '',
      raw['originality'] < 70 ? 'دەربڕینی خۆت بە زمانێکی ورد بەکاربهێنە، بەڵام مانای سەرچاوەکانی نەگۆڕە.' : ''
    ].filter(Boolean);

    const confidence = clamp(72 + Math.min(18, Math.log10(wordCount) * 6) - Math.min(12, ruleHits.length * 2));
    return {
      level, discipline, score, confidence, status: 'analyzed', dimensions, strengths, gaps,
      recommendations, rulesEvaluated: QUALITY_RULES.length, rulesAvailable: QUALITY_RULES.length, rulesTriggered, ruleHits, policy
    };
  }

  getGenerationDirectives(level: VipAcademicLevel, discipline: VipDiscipline): string[] {
    const policy = this.getPolicy(level);
    const boost = DISCIPLINE_BOOST[discipline];
    return [
      `ئاست: ${policy.label}; کەمترین بڕی دەق بۆ پشکنینی قورس: ${policy.minWords} وشە.`,
      `ڕێژەی citation ـی ئامانج: نزیکەی ${policy.citationTargetPer1000} سەرچاوە بۆ هەر ١٠٠٠ وشە، تەنها کاتێک سەرچاوە بەڕاستی پشتگیریی داواکارییەکە بکات.`,
      `میانەی درێژی ڕستە: نزیکەی ${policy.sentenceIdeal} وشە؛ ڕستە کورت و درێژ بە شێوەی سروشتی تێکەڵ بکە.`,
      `توندوتۆڵی زانستی: ${Math.round(policy.rigorWeight * 100)}%؛ هەموو داواکارییە قطعییەکان بەپێی بەڵگە و سنوورداربوونەوەی داتا دابەزێنە.`,
      `بوار: ${discipline}; پێویستی بەڵگە و ڕێکخستنی بوار بە فاکتەری ${boost.evidence.toFixed(2)} و ${boost.structure.toFixed(2)} زیاد دەکرێت.`,
      'هیچ سەرچاوە، DOI، ژمارە، ئامار، ناوی توێژەر یان دەرئەنجامی ساختە دروست مەکە؛ ئەگەر پشتگیری نییە، بە ڕوونی بڵێ.',
      'هەر پەرەگرافێک دەبێت ئامانجێکی دیاریکراو هەبێت و پەیوەندی نێوان داواکاری، بەڵگە، شیکردنەوە و کۆتایی ڕوون بێت.',
      'دووبارەکردنەوەی وشە و ڕستە کەم بکە و لە شێوازی مرۆیی و سروشتیی سۆرانی بنووسە؛ تۆنی گفتوگۆیی بە بێ پێویستی مەهێڵە.',
      `ئاستی قووڵایی: ${policy.expectedVerbosity}; بەشی نووسین بە پێی ئەم ئاستە وردتر یان کورتتر بکە، نەک بە درێژکردنی بێ مەبەست.`,
      'پێش کۆتایی، ناسازگاری ناوخۆیی، هەڵەی لۆژیکی، داواکاریی بێ بەڵگە و ناڕوونیی چەمکی بەدواداچوونەوە بکە.'
    ];
  }

  getLevelLabels(): Array<{ value: VipAcademicLevel; label: string }> {
    return Object.entries(LEVELS).map(([value, policy]) => ({ value: value as VipAcademicLevel, label: policy.label }));
  }
}
