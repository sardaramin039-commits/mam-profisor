import { evaluatePublicationDefenseReadiness } from './publication-defense-readiness.service';

export type DefenseAnswerStatus = 'STRONG' | 'ADEQUATE' | 'WEAK' | 'MISSING';

export interface DefenseQuestionRecord {
  id: string;
  category: 'research-question' | 'methodology' | 'evidence' | 'limitations' | 'contribution';
  question: string;
  rationale: string;
  requiredElements: string[];
}

export interface DefenseAnswerAssessment {
  questionId: string;
  status: DefenseAnswerStatus;
  score: number;
  coveredElements: string[];
  missingElements: string[];
  feedback: string;
}

export interface DefenseSessionInput {
  topic: string;
  title: string;
  researchQuestion?: string;
  methodology?: string;
  conclusion?: string;
  limitations?: string;
  contribution?: string;
  evidenceSummary?: string;
  chapterTitles: string[];
  referencedCitationCount: number;
  verifiedCitationCount: number;
  bibliographyCount: number;
  structuralStatus: 'PASS' | 'REJECT';
  exportBlocked: boolean;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

const TERM_ALIASES: Record<string, string[]> = {
  'methodology': ['methodology', 'میتۆدۆلۆژیا', 'مێتۆد', 'ڕێبازی توێژینەوە'],
  'validation': ['validation', 'پشتڕاستکردنەوە', 'سەلماندن'],
  'evidence': ['evidence', 'بەڵگە', 'بەڵگەنامە'],
  'verification': ['verification', 'پشتڕاستکردن', 'دڵنیابوونەوە'],
  'confidence': ['confidence', 'دڵنیایی', 'متمانە'],
  'سنوور': ['سنوور', 'سنووری', 'سنوورداری'],
  'سنوورداری': ['سنوورداری', 'سنوور'],
  'بەشداری': ['بەشداری', 'contribution'],
  'ئەدەبیات': ['ئەدەبیات', 'literature'],
  'block': ['block', 'blockکردن', 'بلۆک'],
  'داتا': ['داتا', 'زانیاری', 'data'],
  'بەش': ['بەش', 'chapter'],
};

function includesAny(text: string, terms: string[]): boolean {
  const normalized = normalize(text);
  return terms.some(term =>
    [term, ...(TERM_ALIASES[term] || [])].some(alias => normalized.includes(normalize(alias)))
  );
}

function scoreAnswer(answer: string, requiredElements: string[]): DefenseAnswerAssessment {
  const cleanAnswer = clean(answer);
  if (!cleanAnswer) return { questionId: '', status: 'MISSING', score: 0, coveredElements: [], missingElements: requiredElements, feedback: 'وەڵام نەدراوە؛ پێویستە بۆ بەرگری وەڵامێکی ڕوون و پشتبەستوو ئامادە بکرێت.' };

  const coveredElements = requiredElements.filter(element => includesAny(cleanAnswer, [element]));
  const missingElements = requiredElements.filter(element => !coveredElements.includes(element));
  const lengthBonus = cleanAnswer.length >= 180 ? 20 : cleanAnswer.length >= 90 ? 10 : 0;
  const coverage = requiredElements.length ? (coveredElements.length / requiredElements.length) * 65 : 0;
  const score = Math.max(0, Math.min(100, Math.round(coverage + lengthBonus)));
  const status: DefenseAnswerStatus = score >= 80 ? 'STRONG' : score >= 55 ? 'ADEQUATE' : 'WEAK';
  return {
    questionId: '',
    status,
    score,
    coveredElements,
    missingElements,
    feedback: missingElements.length
      ? 'وەڵامەکە هەندێک خاڵی گرنگی بەرگری نەگرتووەتەوە: ' + missingElements.join('، ') + '. '
      : 'وەڵامەکە پێویستی بە بەستنی ڕوونتر بە evidence و سنووردارییەکانی توێژینەوە هەیە.'
  };
}

export class DefenseRehearsalService {
  prepare(input: DefenseSessionInput): { readiness: ReturnType<typeof evaluatePublicationDefenseReadiness>; questions: DefenseQuestionRecord[] } {
    const readiness = evaluatePublicationDefenseReadiness({
      title: input.title,
      researchQuestion: input.researchQuestion,
      methodology: input.methodology,
      conclusion: input.conclusion,
      chapterCount: input.chapterTitles.length,
      referencedCitationCount: input.referencedCitationCount,
      verifiedCitationCount: input.verifiedCitationCount,
      bibliographyCount: input.bibliographyCount,
      structuralStatus: input.structuralStatus,
      exportBlocked: input.exportBlocked,
      topic: input.topic
    });
    const topic = clean(input.topic) || clean(input.title) || 'توێژینەوەکە';
    const chapterContext = input.chapterTitles.filter(Boolean).slice(0, 6);
    const questions: DefenseQuestionRecord[] = [
      { id: 'DEF-01', category: 'research-question', question: 'پرسیاری سەرەکیی توێژینەوەکەت چییە و بۆچی ئەم سنوورەی بۆ هەڵبژاردووە؟', rationale: 'پشکنینی scope و پەیوەندیی پرسیار بە بابەتی ' + topic + '.', requiredElements: ['پرسیاری سەرەکی', 'سنوور'] },
      { id: 'DEF-02', category: 'methodology', question: 'بۆچی methodology ـی بەکارهاتوو گونجاوە و چۆن دڵنیابوویتەوە لە گونجانییەکەی لەگەڵ پرسیاری توێژینەوە؟', rationale: 'پشکنینی هەڵبژاردنی مێتۆد و ڕەوشی validation.', requiredElements: ['methodology', 'validation'] },
      { id: 'DEF-03', category: 'evidence', question: 'کام evidence ـە سەرەکییەکان پشتگیریی claim ـە گرنگەکان دەکەن و verification ـیان چۆن کراوە؟', rationale: 'پشکنینی claim-evidence traceability.', requiredElements: ['evidence', 'verification'] },
      { id: 'DEF-04', category: 'limitations', question: 'سنووردارییە سەرەکییەکانی توێژینەوەکەت چین و چییان دەکەن بە confidence ـی دەرئەنجامەکان؟', rationale: 'پشکنینی ڕاستگۆیی زانستی.', requiredElements: ['سنوورداری', 'confidence'] },
      { id: 'DEF-05', category: 'contribution', question: 'بەشدارییە سەرەکییەکەی توێژینەوەکەت بۆ ئەدەبیاتی بواری خۆی چییە؟', rationale: 'پشکنینی contribution بەبێ بانگەشەی زیادە.', requiredElements: ['بەشداری', 'ئەدەبیات'] }
    ];
    if (!clean(input.methodology)) questions.push({ id: 'DEF-06', category: 'methodology', question: 'ئەگەر methodology ئێستا تەواو نەکراوە، چ کۆدەکانی توێژینەوە دەبێت پێش بڕیاری کۆتایی زیاد بکرێن؟', rationale: 'دۆزینەوەی بۆشایی method.', requiredElements: ['methodology', 'داتا'] });
    if (input.verifiedCitationCount < input.referencedCitationCount) questions.push({ id: 'DEF-07', category: 'evidence', question: 'چۆن مامەڵە لەگەڵ citation ـێک دەکەیت کە پشتڕاستنەکراوە یان evidence ـی تەواوی نییە؟', rationale: 'پشکنینی citation integrity و fail-closed behavior.', requiredElements: ['verification', 'block'] });
    if (chapterContext.length > 0) questions.push({ id: 'DEF-08', category: 'contribution', question: 'کام بەش لە نێوان ئەمانەدا گرنگترین بەشداریی manuscript ـەکەی هەیە: ' + chapterContext.join('، ') + '؟', rationale: 'پشکنینی پەیوەندیی chapter ـەکان بە contribution.', requiredElements: ['بەش', 'بەشداری'] });
    return { readiness, questions };
  }

  assess(question: DefenseQuestionRecord, answer: string): DefenseAnswerAssessment {
    const result = scoreAnswer(answer, question.requiredElements);
    return { ...result, questionId: question.id, feedback: result.feedback + (question.category === 'evidence' ? ' هەمان claim ـە بە source و evidence ـی دیاریکراو پشتبەستە بکە.' : '') };
  }
}

export const defenseRehearsalService = new DefenseRehearsalService();
