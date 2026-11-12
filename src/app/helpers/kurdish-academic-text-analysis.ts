/**
 * src/app/helpers/kurdish-academic-text-analysis.ts
 *
 * Core pure-TypeScript text-checking algorithms ported from server services:
 * - Contradiction Detection between scholarly claims & evidence
 * - Human Scholarly Prose refinement & citation preservation
 * - Kurdish Academic Language (Sorani) quality analyzer
 * - Kurdish Word Frequency & Readability Analyzers
 * - Academic Cliche Detection & Professorial Rewrite
 */

export type ContradictionSeverity = 'low' | 'medium' | 'high';

export interface ContradictionFinding {
  id: string;
  claimA: string;
  claimB: string;
  sourceA: string;
  sourceB: string;
  severity: ContradictionSeverity;
  explanationKurdish: string;
  status: 'candidate' | 'supported';
}

export interface ContradictionReport {
  findings: ContradictionFinding[];
  contradictionCount: number;
  highSeverityCount: number;
  status: 'clear' | 'review_required' | 'insufficient_evidence';
}

export interface ScholarlyProseResult {
  refinedText: string;
  changes: string[];
  unsupportedContentBlocked: number;
  humanReviewRequired: boolean;
  stylePolicy: string;
  preservationPassed?: boolean;
}

export interface KurdishLanguageIssue {
  type: 'grammar' | 'spelling' | 'terminology' | 'tone' | 'cohesion';
  originalText: string;
  suggestedText: string;
  explanationKurdish: string;
}

export interface KurdishLanguageAnalysis {
  overallLanguageScore: number;
  academicTonePassed: boolean;
  issues: KurdishLanguageIssue[];
  refinedTextKurdish: string;
  kurdishSummary: string;
}

export interface WordFrequencyItem {
  word: string;
  count: number;
  percentage: number;
  isOverused?: boolean;
}

export interface WordFrequencyResult {
  totalWords: number;
  uniqueWords: number;
  vocabularyRichnessPct: number;
  diversityRatio: number;
  diversityLabel: string;
  topWords: WordFrequencyItem[];
  overusedWords: WordFrequencyItem[];
}

export interface KurdishReadabilityResult {
  readabilityScore: number;
  score: number;
  readingLevel: string;
  levelLabel: string;
  badgeClass: string;
  recommendation: string;
  averageSentenceLength: number;
  averageWordLength: number;
  complexWordCount: number;
  verdictKurdish: string;
}

export interface AcademicClicheFinding {
  cliche: string;
  formalAlternative: string;
  reason: string;
  count: number;
}

export interface AcademicClicheReport {
  score: number;
  clichesCount: number;
  hasCliche: boolean;
  generalizationsCount: number;
  findings: AcademicClicheFinding[];
  verdict: string;
}

const KURDISH_STOP_WORDS = new Set([
  'لە', 'بە', 'بۆ', 'لەگەڵ', 'کە', 'وە', 'وەک', 'ئەم', 'ئەو', 'ئەمانە', 'ئەوانە',
  'تا', 'بێ', 'یان', 'ئەگەر', 'هەروەها', 'بەڵام', 'چونکە', 'پاش', 'پێش', 'سەر',
  'ژێر', 'نێوان', 'ناو', 'دەرەوە', 'خۆی', 'خۆیان', 'خۆت', 'من', 'ئێمە', 'تۆ', 'ئێوە'
]);

function countOccurrences(text: string, fragment: string): number {
  if (!fragment) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= text.length) {
    const index = text.indexOf(fragment, offset);
    if (index < 0) break;
    count++;
    offset = index + fragment.length;
  }
  return count;
}

export function extractCitationFragments(text: string): string[] {
  const matches = [
    ...(text.match(/\[[0-9]+(?:\s*[,;]\s*[0-9]+)*\]/g) || []),
    ...(text.match(/\([^()\n]{1,120}\b(?:19|20)\d{2}[a-z]?\)/g) || [])
  ];
  return Array.from(new Set(matches.map(item => item.trim()).filter(Boolean)));
}

export function verifyCitationPreservation(
  original: string,
  refined: string,
  protectedFragments: string[] = []
): boolean {
  const uniqueFragments = Array.from(
    new Set([
      ...protectedFragments.map(item => String(item || '').trim()).filter(Boolean),
      ...extractCitationFragments(original)
    ])
  );
  return uniqueFragments.every(
    fragment => countOccurrences(refined, fragment) >= countOccurrences(original, fragment)
  );
}

export function detectLocalContradictions(claims: { id: string; text: string; source: string }[]): ContradictionReport {
  if (!claims || claims.length < 2) {
    return { findings: [], contradictionCount: 0, highSeverityCount: 0, status: 'insufficient_evidence' };
  }

  const findings: ContradictionFinding[] = [];
  const negations = ['پێچەوانە', 'ڕەتکردنەوە', 'دژ', 'نەگونجاو', 'جیاوازە لە', 'بەرپەرچ'];

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];
      const hasConflict = negations.some(n => a.text.includes(n) || b.text.includes(n));

      if (hasConflict) {
        findings.push({
          id: `contra_${i}_${j}`,
          claimA: a.text,
          claimB: b.text,
          sourceA: a.source,
          sourceB: b.source,
          severity: 'medium',
          explanationKurdish: `دژبەری یان جیاوازیی گوتار لە نێوان سەرچاوەی (${a.source}) و (${b.source}) بەدیکرا.`,
          status: 'candidate'
        });
      }
    }
  }

  return {
    findings,
    contradictionCount: findings.length,
    highSeverityCount: findings.filter(f => f.severity === 'high').length,
    status: findings.length > 0 ? 'review_required' : 'clear'
  };
}

export function analyzeKurdishAcademicLanguage(text: string): KurdishLanguageAnalysis {
  const issues: KurdishLanguageIssue[] = [];
  const informalWords: Record<string, string> = {
    'زۆر زۆر': 'تا ئاستێکی بەرچاو',
    'ئیش': 'کار / توێژینەوە',
    'شت': 'دیاردە / بابەتی لێکۆڵراو',
    'هەموو کەس دەزانێت': 'بەپێی ئەدەبیاتی زانستی سەلمێنراوە کە'
  };

  for (const [informal, formal] of Object.entries(informalWords)) {
    if (text.includes(informal)) {
      issues.push({
        type: 'tone',
        originalText: informal,
        suggestedText: formal,
        explanationKurdish: `دەستەواژەی گشتی «${informal}» بگۆڕدرێت بە وشەی ئەکادیمی «${formal}».`
      });
    }
  }

  const overallScore = Math.max(70, 100 - issues.length * 8);

  return {
    overallLanguageScore: overallScore,
    academicTonePassed: overallScore >= 80,
    issues,
    refinedTextKurdish: text,
    kurdishSummary: `شیکاریی زمانەوانی: نمرەی ئەکادیمی ${overallScore} لە ١٠٠. ${issues.length} تێبینی تۆمارکرا.`
  };
}

export function calculateKurdishWordFrequency(
  text: string,
  excludeStopWords: boolean = true,
  topN: number = 10
): WordFrequencyResult {
  if (!text || !text.trim()) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      vocabularyRichnessPct: 100,
      diversityRatio: 100,
      diversityLabel: 'دەوڵەمەند و هەمەچەشن',
      topWords: [],
      overusedWords: []
    };
  }

  const words = text
    .trim()
    .replace(/[«»"،.؟!؛:\-—()\[\]{}"'\\\/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const totalWords = words.length;
  const counts = new Map<string, number>();

  for (const w of words) {
    if (excludeStopWords && KURDISH_STOP_WORDS.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  const items: WordFrequencyItem[] = Array.from(counts.entries())
    .map(([word, count]) => {
      const percentage = totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(1)) : 0;
      const isOverused = count >= 4 && percentage >= 3.0;
      return { word, count, percentage, isOverused };
    })
    .sort((a, b) => b.count - a.count);

  const topWords = items.slice(0, topN);
  const overusedWords = items.filter(i => i.isOverused);
  const uniqueWords = counts.size;
  const richness = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 100;
  const diversityRatio = richness;
  const diversityLabel = richness > 65 ? 'دەوڵەمەند و هەمەچەشن' : (richness > 45 ? 'ئاسایی' : 'دووبارەبوونەوەی زۆر');

  return {
    totalWords,
    uniqueWords,
    vocabularyRichnessPct: richness,
    diversityRatio,
    diversityLabel,
    topWords,
    overusedWords
  };
}

export function calculateKurdishAcademicReadability(text: string): KurdishReadabilityResult {
  if (!text || !text.trim()) {
    return {
      readabilityScore: 100,
      score: 100,
      readingLevel: 'ئاسان',
      levelLabel: 'ئاسان',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      recommendation: 'دەقەکە بەتاڵە.',
      averageSentenceLength: 0,
      averageWordLength: 0,
      complexWordCount: 0,
      verdictKurdish: 'دەق بەتاڵە.'
    };
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.؟!؛\n]+/).filter(s => s.trim().length > 3);
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);

  const avgSentenceLen = Number((wordCount / sentenceCount).toFixed(1));
  const totalChars = words.reduce((acc, w) => acc + w.length, 0);
  const avgWordLen = wordCount > 0 ? Number((totalChars / wordCount).toFixed(1)) : 0;
  const complexWords = words.filter(w => w.length >= 8).length;

  let score = 100 - (avgSentenceLen * 1.5) - (avgWordLen * 5);
  score = Math.max(35, Math.min(98, Math.round(score)));

  let level = 'مامناوەند (گونجاو بۆ خوێندنی باڵا)';
  let badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
  let recommendation = 'ئاستی ڕستەکان گونجاوە بۆ نامەی ئەکادیمی.';
  if (score > 80) {
    level = 'ڕەوان و ئاسان';
    badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    recommendation = 'تێکستەکە تەواو ڕەوان و خوێنەرپەسەندە.';
  } else if (score < 50) {
    level = 'چڕ و قورس (پێویستی بە کورتکردنەوەی ڕستەکانە)';
    badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
    recommendation = 'پێشنیار دەکرێت ڕستە درێژەکان کورت بکرێنەوە بۆ خوێندنەوەی ئاسانتر.';
  }

  return {
    readabilityScore: score,
    score,
    readingLevel: level,
    levelLabel: level,
    badgeClass,
    recommendation,
    averageSentenceLength: avgSentenceLen,
    averageWordLength: avgWordLen,
    complexWordCount: complexWords,
    verdictKurdish: `ڕێژەی ڕەوانیی تێکست ${score} لە ١٠٠. تێکڕای درێژیی ڕستە ${avgSentenceLen} وشەیە.`
  };
}

export function detectAcademicClichesAndFlaws(text: string): AcademicClicheReport {
  const clicheDictionary: Array<{ phrase: string; formal: string; reason: string }> = [
    { phrase: 'وەک هەموومان دەزانین', formal: 'وەک لە ئەدەبیاتی زانستیدا سەلمێنراوە', reason: 'دەرکەوتنی گوتاری گشتی' },
    { phrase: 'لە کۆنەوە تا ئێستا', formal: 'لە ڕەوتی مێژووییدا', reason: 'کلیشەی دەستپێکی باو' },
    { phrase: 'زۆر زۆر گرنگە', formal: 'گرنگییەکی ستراتیژی و بنەڕەتی هەیە', reason: 'تۆنی سۆزدار و نا-ئەکادیمی' },
    { phrase: 'من پێم وایە', formal: 'توێژینەوەکە ئاماژە بەوە دەکات کە', reason: 'بەکارھێنانی کەسی یەکەم لە جیاتی دەنگی نادیار' },
    { phrase: 'هیچ گومانی تێدا نییە', formal: 'بەڵگەکان بە ئاشکرا دەیسەلمێنن کە', reason: 'بڕیاردانی ڕەها بێ هێنانەوەی سەرچاوە' }
  ];

  const findings: AcademicClicheFinding[] = [];
  let totalCliches = 0;

  for (const item of clicheDictionary) {
    const count = countOccurrences(text, item.phrase);
    if (count > 0) {
      totalCliches += count;
      findings.push({
        cliche: item.phrase,
        formalAlternative: item.formal,
        reason: item.reason,
        count
      });
    }
  }

  const score = Math.max(50, 100 - (totalCliches * 10));
  return {
    score,
    clichesCount: totalCliches,
    hasCliche: totalCliches > 0,
    generalizationsCount: totalCliches,
    findings,
    verdict: totalCliches === 0 ? 'دەقەکە لە دەربڕینی باو و کلیشەی نا-ئەکادیمی پارێزراوە.' : `${totalCliches} کلیشە و دەستەواژەی گشتی دۆزرایەوە.`
  };
}

export function executeDeepProfessorialRewrite(text: string): string {
  if (!text) return '';
  let rewritten = text;
  const replacements: Record<string, string> = {
    'وەک هەموومان دەزانین': 'وەک لە ئەدەبیاتی زانستیدا سەلمێنراوە',
    'لە کۆنەوە تا ئێستا': 'لە ڕەوتی مێژووییدا',
    'زۆر زۆر گرنگە': 'گرنگییەکی ستراتیژی و بنەڕەتی هەیە',
    'من پێم وایە': 'داتاکان ئاماژە بەوە دەکەن کە',
    'هیچ گومانی تێدا نییە': 'بەڵگەکان بە تەواوی پشتگیری لەوە دەکەن کە',
    'ئیش دەکەین لەسەر': 'لێکۆڵینەوە ئەنجام دەدەین لەبارەی'
  };

  for (const [k, v] of Object.entries(replacements)) {
    rewritten = rewritten.split(k).join(v);
  }
  return rewritten;
}
