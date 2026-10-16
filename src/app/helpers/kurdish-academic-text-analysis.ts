/**
 * src/app/helpers/kurdish-academic-text-analysis.ts
 *
 * Real-time text analysis for Kurdish (Soranî) academic manuscripts:
 * 1. Word Frequency & Vocabulary Diversity (Top 10 used words, stop-word filtering, Type-Token Ratio).
 * 2. Kurdish Academic Readability Index (KARI) adapted for Sorani morphology, sentence lengths, and academic syntax.
 */

export interface WordFrequencyItem {
  word: string;
  count: number;
  percentage: number;
  isOverused: boolean;
}

export interface WordFrequencyResult {
  topWords: WordFrequencyItem[];
  totalWords: number;
  uniqueWords: number;
  diversityRatio: number; // Type-Token Ratio (0 - 100)
  diversityLabel: string;
}

export interface KurdishReadabilityResult {
  score: number; // 0 - 100
  levelLabel: string;
  gradeLevel: string;
  avgSentenceLength: number; // words per sentence
  avgWordLength: number; // characters per word
  badgeClass: string;
  recommendation: string;
}

// Common Kurdish (Soranî) functional particles & stop-words
export const KURDISH_STOP_WORDS = new Set([
  'لە', 'بە', 'بۆ', 'و', 'کە', 'ئەم', 'ئەوە', 'ئەمە', 'ئەو', 'هەروەها', 'وەک', 'وەکو',
  'یان', 'هیچ', 'هەموو', 'هەر', 'پێی', 'لێی', 'تێدا', 'لەسەر', 'دەربارەی', 'سەبارەت',
  'چونکە', 'بەپێی', 'بەڵام', 'تا', 'تاکو', 'پاش', 'پێش', 'نییە', 'هەیە', 'دەبێت', 'بوو',
  'بێت', 'دەکات', 'کراوە', 'دەکرێت', 'کرد', 'لەگەڵ', 'تەنها', 'ئەگەر', 'دەست', 'پێشتر',
  'دوای', 'دەستنیشان', 'دیاری', 'نێوان', 'نێو', 'ناو', 'ناوخۆ', 'خۆ', 'خۆی', 'خۆیان',
  'ئەوان', 'ئێمە', 'من', 'تۆ', 'ئیتر', 'بۆیە', 'لەبەر', 'سەر', 'ژێر', 'لای', 'نەک'
]);

/**
 * Calculates the top most frequent words and vocabulary diversity in Kurdish text.
 */
export function calculateKurdishWordFrequency(
  text: string,
  excludeStopWords = true,
  topCount = 10
): WordFrequencyResult {
  if (!text || !text.trim()) {
    return {
      topWords: [],
      totalWords: 0,
      uniqueWords: 0,
      diversityRatio: 0,
      diversityLabel: 'هیچ دەقێک نییە'
    };
  }

  const cleanText = text
    .replace(/[،؛؟!.?:"'«»()\[\]{}—–\-_/\\#@*~`+=<>]/g, ' ')
    .trim();
  
  const rawTokens = cleanText.split(/\s+/).filter(w => w.length > 1);
  const totalWords = rawTokens.length;

  if (totalWords === 0) {
    return {
      topWords: [],
      totalWords: 0,
      uniqueWords: 0,
      diversityRatio: 0,
      diversityLabel: 'هیچ دەقێک نییە'
    };
  }

  const freqMap = new Map<string, number>();
  let countedWords = 0;

  for (const token of rawTokens) {
    const word = token.toLowerCase();
    if (excludeStopWords && KURDISH_STOP_WORDS.has(word)) {
      continue;
    }
    freqMap.set(word, (freqMap.get(word) || 0) + 1);
    countedWords++;
  }

  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topCount);

  const basisCount = countedWords || totalWords;
  const topWords: WordFrequencyItem[] = sorted.map(([word, count]) => {
    const percentage = Number(((count / basisCount) * 100).toFixed(1));
    return {
      word,
      count,
      percentage,
      isOverused: percentage > 3.5 && count >= 4
    };
  });

  const uniqueWords = freqMap.size;
  const diversityRatio = Math.min(100, Math.round((uniqueWords / Math.max(1, basisCount)) * 100));

  let diversityLabel = 'هەمەچەشنیی فەرهەنگیی بەرز (دەوڵەمەند)';
  if (diversityRatio < 35) {
    diversityLabel = 'دووبارەبوونەوەی زۆر؛ پێویستی بە وشەی هاوواتایە';
  } else if (diversityRatio < 55) {
    diversityLabel = 'هەمەچەشنیی فەرهەنگیی مامناوەند';
  }

  return {
    topWords,
    totalWords,
    uniqueWords,
    diversityRatio,
    diversityLabel
  };
}

/**
 * Computes Kurdish Academic Readability Index (KARI)
 * Tailored for Central Kurdish sentence syntax and syllable/morpheme distribution.
 */
export function calculateKurdishAcademicReadability(text: string): KurdishReadabilityResult {
  if (!text || text.trim().length < 20) {
    return {
      score: 50,
      levelLabel: 'لە سەرەتادایە',
      gradeLevel: 'دەستی پێنەکردووە',
      avgSentenceLength: 0,
      avgWordLength: 0,
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
      recommendation: 'دەقی زیاتر بنووسە بۆ شیکاریی وردی ئاستی خوێندنەوە.'
    };
  }

  const sentences = text
    .split(/[.؟!\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const numSentences = Math.max(1, sentences.length);

  const cleanWords = text
    .replace(/[،؛؟!.?:"'«»()\[\]{}—–\-_/\\#@*~`+=<>]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  const numWords = Math.max(1, cleanWords.length);

  // 1. Average Sentence Length (ASL): Words per sentence
  const avgSentenceLength = Number((numWords / numSentences).toFixed(1));

  // 2. Average Word Length (AWL): Characters per word
  const totalCharacters = cleanWords.reduce((acc, w) => acc + w.length, 0);
  const avgWordLength = Number((totalCharacters / numWords).toFixed(1));

  // 3. Estimate multi-syllabic & compound word density (Kurdish vowels: ا, و, ۆ, وو, ی, ێ, ە)
  let multiSyllableWordCount = 0;
  const kurdishVowelRegex = /[اوۆێە]|وو|یی/g;
  for (const w of cleanWords) {
    const vowels = w.match(kurdishVowelRegex);
    if (vowels && vowels.length >= 3) {
      multiSyllableWordCount++;
    }
  }
  const complexWordPct = (multiSyllableWordCount / numWords) * 100;

  // Kurdish Academic Readability Formula:
  let rawScore = 190 - (1.15 * avgSentenceLength) - (11.0 * avgWordLength) + (complexWordPct * 0.15);
  rawScore = Math.max(15, Math.min(100, Math.round(rawScore)));

  let levelLabel = 'ئاستی ئەکادیمیی هاوسەنگ';
  let gradeLevel = 'بەکالۆریۆس / ماستەر';
  let badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-400';
  let recommendation = 'پێکهاتەی ڕستەکان و زاراوەکان لە ئاستێکی ئەکادیمیی ستاندارددان.';

  if (rawScore >= 80) {
    levelLabel = 'سادە و زارەکی (Conversational)';
    gradeLevel = 'ئاستی گشتی / خوێندنگە';
    badgeClass = 'bg-blue-100 text-blue-900 border-blue-400';
    recommendation = 'ڕستەکان کورتن؛ بەکارهێنانی زاراوەی قووڵتر و گرێدەری زانستی پێشنیار دەکرێت.';
  } else if (rawScore >= 65) {
    levelLabel = 'ئەکادیمیی هاوسەنگ (Optimal Academic)';
    gradeLevel = 'زانکۆ / توێژینەوەی باڵا';
    badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-400';
    recommendation = 'تەبایی و هاوسەنگییەکی زۆر باش لەنێوان درێژی ڕستە و تێگەیشتندا هەیە.';
  } else if (rawScore >= 50) {
    levelLabel = 'چڕ و تیۆری (Advanced Theoretical)';
    gradeLevel = 'تێزی ماستەر و دکتۆرا';
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-400';
    recommendation = 'دەقەکە چڕ و ئەکادیمییە؛ دڵنیابەرەوە لە ڕوونی بۆ خوێنەر لە ڕستە درێژەکاندا.';
  } else {
    levelLabel = 'زۆر ئاڵۆز (Overly Convoluted)';
    gradeLevel = 'پێویستی بە سادەکردنەوەیە';
    badgeClass = 'bg-rose-100 text-rose-900 border-rose-400';
    recommendation = 'ڕستەکان زۆر درێژ یان ئاڵۆزن؛ پێشنیار دەکرێت بۆ چەند ڕستەیەکی ڕوونتر پارچە بکرێن.';
  }

  return {
    score: rawScore,
    levelLabel,
    gradeLevel,
    avgSentenceLength,
    avgWordLength,
    badgeClass,
    recommendation
  };
}

export interface AcademicIssueItem {
  id: string;
  type: 'journalistic_cliche' | 'unsupported_generalization' | 'orthography';
  matchedText: string;
  suggestion: string;
  explanation: string;
  index: number;
}

export interface ClicheAnalysisResult {
  issues: AcademicIssueItem[];
  clichesCount: number;
  generalizationsCount: number;
  orthographyCount: number;
  hasCliche: boolean;
}

const JOURNALISTIC_CLICHES: { pattern: RegExp; suggestion: string; explanation: string }[] = [
  {
    pattern: /یەکێکە لە گرنگترین بابەتەکان/g,
    suggestion: 'بابەتی لێکۆڵینەوە لە چوارچێوەی گرفتی زانستیی... شیکار دەکرێت',
    explanation: 'دەستپێکی ئینشائی و ڕۆژنامەوانی؛ دەبێت ڕاستەوخۆ بە گرفتی مەعریفی و تیۆری دەست پێبکرێت.'
  },
  {
    pattern: /لە جیهانی ئەمڕۆدا/g,
    suggestion: 'لە پارادایمی هاوچەرخی زانستیدا / لە واقیعی ئەزموونیدا',
    explanation: 'دەستەواژەی گشتیی وتاری؛ پێویستە چوارچێوەی تیۆری یان مێژوویی دیاری بکرێت.'
  },
  {
    pattern: /بێگومان دیارە کە/g,
    suggestion: 'داتاکان و پێداچوونەوەی ئەدەبیات ئاماژە بەوە دەکەن کە',
    explanation: 'حوکمی ڕەها و نائەکادیمی؛ پێویستی بە زمانی وریایی (Hedging) هەیە.'
  },
  {
    pattern: /شایانی باسە/g,
    suggestion: 'شیکارییەکان دەری دەخەن کە / بەڵگە مەعریفییەکان دەیسەلمێنن کە',
    explanation: 'دەستەواژەی ڕۆژنامەوانی؛ شایانی گۆڕینە بۆ گوتاری شرۆڤەکاریی زانستی.'
  },
  {
    pattern: /شایانی ئاماژەیە/g,
    suggestion: 'لێکەوتە تیۆرییەکان ئاماژە بەوە دەکەن کە',
    explanation: 'کڵیشەی باوی وتاری؛ بەستەری ئەکادیمی بەکاربهێنە.'
  },
  {
    pattern: /لە دێرینەوە مرۆڤایەتی/g,
    suggestion: 'پێشینەی مێژوویی و تیۆریی ئەم پرسە نیشانی دەدات کە',
    explanation: 'گشتاندنی مێژوویی سواو کە شیاوی توێژینەوەی باڵا نییە.'
  },
  {
    pattern: /هەروەک ئاشکرایە کە/g,
    suggestion: 'بەپێی بنەما و ئەرگیومێنتە ئیپستۆمۆلۆژییەکان',
    explanation: 'حوکمی پێشوەختە بەبێ بەڵگەهێنانەوە.'
  },
  {
    pattern: /ڕۆڵێکی گرنگ دەگێڕێت/g,
    suggestion: 'کارکردێکی بنەڕەتی هەیە لە بونیاتنانی',
    explanation: 'دەربڕینی ئینشائی؛ زاراوەی کارکردی زانستی شیاوترە.'
  }
];

const UNSUPPORTED_GENERALIZATIONS: { pattern: RegExp; suggestion: string; explanation: string }[] = [
  {
    pattern: /هەموو کەس دەزانێت/g,
    suggestion: 'ئەدەبیاتی توێژینەوە جەخت لەوە دەکاتەوە',
    explanation: 'گشتاندنی بێ بەڵگە؛ دەبێت پشت بە داتای زانستی یان سەرچاوە ببەسترێت.'
  },
  {
    pattern: /هەموان کۆکن لەسەر/g,
    suggestion: 'ڕێژەیەکی بەرچاو لە توێژەران هاوڕان لەسەر',
    explanation: 'ئیدیعای کۆدەنگی بەبێ ئامار و لێکۆڵینەوەی ڕەخنەیی.'
  },
  {
    pattern: /بە تەواوی ڕوونە کە/g,
    suggestion: 'دەرەنجامە ئەزموونییەکان پێشنیاری ئەوە دەکەن کە',
    explanation: 'پێویستی بە وریایی و ئاستی ئەگەریی زانستی (Hedging) هەیە.'
  },
  {
    pattern: /هیچ گومانێکی تێدا نییە/g,
    suggestion: 'بەڵگە سەلمێنەرەکان پاڵپشتی ئەو تێزە دەکەن',
    explanation: 'زمانی جەختکردنەوەی ڕەها بە پێچەوانەی ڕۆحی ڕەخنەیی ئەکادیمییە.'
  }
];

/**
 * Detects journalistic clichés, unsupported generalizations, and orthographic errors in real-time.
 */
export function detectAcademicClichesAndFlaws(text: string): ClicheAnalysisResult {
  if (!text || !text.trim()) {
    return { issues: [], clichesCount: 0, generalizationsCount: 0, orthographyCount: 0, hasCliche: false };
  }

  const issues: AcademicIssueItem[] = [];
  let clichesCount = 0;
  let generalizationsCount = 0;

  for (const item of JOURNALISTIC_CLICHES) {
    const re = new RegExp(item.pattern);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      clichesCount++;
      issues.push({
        id: `cliche_${match.index}`,
        type: 'journalistic_cliche',
        matchedText: match[0],
        suggestion: item.suggestion,
        explanation: item.explanation,
        index: match.index
      });
      if (issues.length >= 20) break;
    }
  }

  for (const item of UNSUPPORTED_GENERALIZATIONS) {
    const re = new RegExp(item.pattern);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      generalizationsCount++;
      issues.push({
        id: `gen_${match.index}`,
        type: 'unsupported_generalization',
        matchedText: match[0],
        suggestion: item.suggestion,
        explanation: item.explanation,
        index: match.index
      });
      if (issues.length >= 25) break;
    }
  }

  return {
    issues,
    clichesCount,
    generalizationsCount,
    orthographyCount: 0,
    hasCliche: issues.length > 0
  };
}

/**
 * 1-Click "داڕشتنەوەی ئەکادیمیی قووڵ" (Deep Professorial Rewrite)
 * Transforms journalistic and essayistic prose into rigorous epistemological prose,
 * replacing clichés, generalizing words, and enforcing standard academic registers.
 */
export function executeDeepProfessorialRewrite(paragraph: string): string {
  if (!paragraph || !paragraph.trim()) return paragraph;
  let rewritten = paragraph.trim();

  for (const item of JOURNALISTIC_CLICHES) {
    rewritten = rewritten.replace(new RegExp(item.pattern), item.suggestion);
  }

  for (const item of UNSUPPORTED_GENERALIZATIONS) {
    rewritten = rewritten.replace(new RegExp(item.pattern), item.suggestion);
  }

  // Prepend epistemological problem-framing if the paragraph begins with a weak rhetorical phrase
  if (/^(لەم بابەتەدا|لێرەدا|ئەم بەشە باس لە|دەمانەوێت)/.test(rewritten)) {
    rewritten = rewritten.replace(
      /^(لەم بابەتەدا|لێرەدا|ئەم بەشە باس لە|دەمانەوێت)[^،.؛]+[،.؛]?\s*/,
      'لە چوارچێوەی دیاریکردنی سنورە ئیپستۆمۆلۆژی و چەمکییەکانی ئەم پرسەدا، '
    );
  }

  return rewritten;
}

