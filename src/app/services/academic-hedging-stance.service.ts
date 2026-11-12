import { Injectable, signal } from '@angular/core';

export interface HedgingIssue {
  id: string;
  originalPhrase: string;
  suggestedPhrase: string;
  startIndex: number;
  endIndex: number;
  category: 'حوکمی ڕەها' | 'سۆزداری و ناپێویست' | 'بانگەشەی دەستەجەمعی' | 'پەلەکردن لە دەرئەنجام';
  academicRationale: string;
}

export interface HedgingAnalysisResult {
  neutralityScore: number; // 0 - 100
  totalAbsoluteTermsFound: number;
  academicToneClassification: 'تەواو ئەکادیمی و بێلایەن' | 'مامناوەند - پێویستی بە نەرمکردنەوەیە' | 'ڕەها و ناپرۆفشناڵ';
  issues: HedgingIssue[];
  hedgedTextPreview: string;
}

interface DogmaticRule {
  pattern: RegExp;
  category: HedgingIssue['category'];
  suggested: string;
  rationale: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicHedgingStanceService {
  private issueSequence = 0;
  readonly isEvaluating = signal<boolean>(false);
  readonly analysisResult = signal<HedgingAnalysisResult | null>(null);

  private readonly dogmaticRules: DogmaticRule[] = [
    {
      pattern: /بە دڵنیاییەوە/g,
      category: 'حوکمی ڕەها',
      suggested: 'بە ئەگەرێکی بەهێز',
      rationale: 'لە زانستدا دڵنیایی ڕەها بوونی نییە؛ گوتار دەبێت کراوە بێت بۆ ئەگەری نوێ.'
    },
    {
      pattern: /بێ هیچ گومانێک/g,
      category: 'حوکمی ڕەها',
      suggested: 'وەک لە داتاکانەوە ئاماژەی پێدەکرێت',
      rationale: 'گومان بنەمای میتۆدۆلۆژیای زانستییە؛ حوکمی بێ گومان گوتاری دۆگماتیکی دروست دەکات.'
    },
    {
      pattern: /سەلمێنەری ڕەهایە/g,
      category: 'پەلەکردن لە دەرئەنجام',
      suggested: 'پاڵپشتی لە گریمانەکە دەکات',
      rationale: 'توێژینەوەی ئەزموونی تەنها پاڵپشتی لە گریمانە دەکات و بە ڕەهایی نایسەلمێنێت.'
    },
    {
      pattern: /هەموو کەس دەزانێت/g,
      category: 'بانگەشەی دەستەجەمعی',
      suggested: 'بەپێی ئەدەبیاتی زانستیی بەردەست',
      rationale: 'بانگەشەی گشتی بۆچوونێکی ڕۆژنامەوانییە و جێگەی لە توێژینەوەی ئەکادیمیدا نییە.'
    },
    {
      pattern: /هەرگیز ناکرێت/g,
      category: 'حوکمی ڕەها',
      suggested: 'دەگمەنە کە ڕووبدات لە ژێر ئەم مەرجانەدا',
      rationale: 'سڕینەوەی ڕەهای ئەگەرەکان زانستی نییە.'
    },
    {
      pattern: /بە تەواوی ڕوونە/g,
      category: 'حوکمی ڕەها',
      suggested: 'بە شێوەیەکی دیار بەدەر دەکەوێت',
      rationale: 'دەستەواژەی تەواو ڕوون حوکمی پێشوەختەیە لەسەر تێگەیشتنی خوێنەر.'
    },
    {
      pattern: /هیچ کەس نکوڵی لەوە ناکات/g,
      category: 'بانگەشەی دەستەجەمعی',
      suggested: 'ڕەزامەندییەکی بەرچاو هەیە لە نێوان توێژەراندا',
      rationale: 'دەبێت ئاماژە بە کۆدەنگیی توێژەران بکرێت نەک نکوڵی نەکردنی هەمووان.'
    },
    {
      pattern: /کارەساتبارە/g,
      category: 'سۆزداری و ناپێویست',
      suggested: 'کاریگەریی زۆر نەرێنیی هەیە',
      rationale: 'وشەی سۆزداری کێشی بێلایەنیی لێکۆڵینەوە دادەبەزێنێت.'
    },
    {
      pattern: /بە باشترین شێوە/g,
      category: 'حوکمی ڕەها',
      suggested: 'بە شێوازێکی کاریگەر و گونجاو',
      rationale: 'باشترین دەستەواژەیەکی سوپەرلەتیڤی پێوانەنەکراوە.'
    },
    {
      pattern: /بێ کەم و کوڕی/g,
      category: 'حوکمی ڕەها',
      suggested: 'بە وردبینییەکی بەرچاوەوە',
      rationale: 'هیچ میتۆدۆلۆژیایەک بە تەواوی بێ کەم و کوڕی نییە.'
    }
  ];

  /**
   * شیکردنەوەی بێلایەنیی دەقی کوردی و پێشنیارکردنی هاوتا ئەکادیمییە نەرمەکان (Hedging)
   */
  evaluateText(text: string): HedgingAnalysisResult {
    this.isEvaluating.set(true);

    if (!text || text.trim().length === 0) {
      const emptyResult = this.createEmptyResult();
      this.analysisResult.set(emptyResult);
      this.isEvaluating.set(false);
      return emptyResult;
    }

    const issues: HedgingIssue[] = [];
    let modifiedText = text;

    for (const rule of this.dogmaticRules) {
      const regex = new RegExp(rule.pattern.source, 'g');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        issues.push({
          id: `hedge_${++this.issueSequence}`,
          originalPhrase: match[0],
          suggestedPhrase: rule.suggested,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          category: rule.category,
          academicRationale: rule.rationale
        });
      }

      modifiedText = modifiedText.replace(rule.pattern, rule.suggested);
    }

    const totalWords = text.trim().split(/\s+/).length;
    const penalty = Math.min(60, issues.length * 8);
    const neutralityScore = Math.max(25, 100 - penalty);

    const classification: HedgingAnalysisResult['academicToneClassification'] = 
      neutralityScore >= 85 
        ? 'تەواو ئەکادیمی و بێلایەن' 
        : neutralityScore >= 60 
          ? 'مامناوەند - پێویستی بە نەرمکردنەوەیە' 
          : 'ڕەها و ناپرۆفشناڵ';

    const result: HedgingAnalysisResult = {
      neutralityScore,
      totalAbsoluteTermsFound: issues.length,
      academicToneClassification: classification,
      issues,
      hedgedTextPreview: modifiedText
    };

    this.analysisResult.set(result);
    this.isEvaluating.set(false);
    return result;
  }

  /**
   * گۆڕینی خودکاری دەقەکە بە جێبەجێکردنی تەواوی پێشنیارەکانی نەرمکردنەوەی زانستی
   */
  applyAutoHedging(text: string): string {
    let result = text;
    for (const rule of this.dogmaticRules) {
      result = result.replace(rule.pattern, rule.suggested);
    }
    return result;
  }

  private createEmptyResult(): HedgingAnalysisResult {
    return {
      neutralityScore: 100,
      totalAbsoluteTermsFound: 0,
      academicToneClassification: 'تەواو ئەکادیمی و بێلایەن',
      issues: [],
      hedgedTextPreview: ''
    };
  }

  /**
   * دابینکردنی یاساکانی وریایی و دەربڕینی بێلایەنی زانستی بۆ پرۆمپی مۆدێل
   */
  getHedgingDirectives(): string {
    return `[یاساکانی نەرمکردنەوەی ئەکادیمی و بێلایەنی - Hedging Rigor]:
- قەدەغەکردنی ڕەهای وشەکانی وەک: (بە دڵنیاییەوە، بێ هیچ گومانێک، سەلمێنەری ڕەهایە، هەموو کەس دەزانێت، هەرگیز، کارەساتبارە).
- بەکارهێنانی دەستەواژەی پێوانەکراو: (وەک لە بەڵگەکاندا دەردەکەوێت، ئەگەری بەهێز، ئاماژە بەوە دەکات، پاڵپشتی لە گریمانە دەکات).
- بەکارهێنانی شێوازی کەسی سێیەمی بێلایەن بەبێ هیچ دەربڕینێکی کەسی یان ڕۆژنامەوانی.`;
  }
}

