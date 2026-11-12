import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ToulminComponent {
  id: string;
  name: string;
  description: string;
  found: boolean;
  score: number;
  extractedSnippet?: string;
  critique: string;
  recommendation: string;
}

export interface ToulminAnalysisReport {
  overallScore: number;
  academicRigorLevel: 'پتەو و پێشکەوتوو' | 'مامناوەند - پێویستی بە بەڵگەیە' | 'سەرەتایی و لاواز';
  claims: ToulminComponent;
  grounds: ToulminComponent;
  warrants: ToulminComponent;
  backing: ToulminComponent;
  rebuttals: ToulminComponent;
  qualifiers: ToulminComponent;
  researchGapIdentified: boolean;
  researchGapDescription: string;
  actionableSteps: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AcademicToulminArgumentService {
  private http = inject(HttpClient);

  readonly isAnalyzing = signal<boolean>(false);
  readonly currentReport = signal<ToulminAnalysisReport | null>(null);
  readonly lastError = signal<string | null>(null);

  /**
   * شیکردنەوەی دەقی بەش یان تێز بەپێی مۆدێلی بەڵگەنامەیی تولمین
   */
  analyzeText(text: string, thesisTitle = 'تێزی ئەکادیمی'): Observable<ToulminAnalysisReport> {
    if (!text || text.trim().length < 30) {
      const fallback = this.generateFallbackReport(text);
      this.currentReport.set(fallback);
      return of(fallback);
    }

    this.isAnalyzing.set(true);
    this.lastError.set(null);

    const promptPayload = {
      methodologyType: 'toulmin_argument_rigor',
      researchTopic: thesisTitle,
      literatureScope: text.slice(0, 15000)
    };

    return this.http.post<any>('/api/advanced_methodology_builder', promptPayload).pipe(
      map(response => {
        const report = this.parseResponseToReport(response, text);
        this.currentReport.set(report);
        this.isAnalyzing.set(false);
        return report;
      }),
      catchError(err => {
        console.warn('Toulmin API fallback engaged:', err);
        const report = this.generateFallbackReport(text);
        this.currentReport.set(report);
        this.isAnalyzing.set(false);
        return of(report);
      })
    );
  }

  private parseResponseToReport(resp: any, rawText: string): ToulminAnalysisReport {
    if (resp && resp.components && typeof resp.overallScore === 'number') {
      return resp as ToulminAnalysisReport;
    }
    return this.generateFallbackReport(rawText);
  }

  /**
   * هەڵسەنگاندنی پێکهاتەکانی تولمین بە شێوازی ناوخۆیی و بنەڕەتی
   */
  private generateFallbackReport(text: string): ToulminAnalysisReport {
    const hasClaims = /(بانگەشە|دەردەخات|گریمانە|ئامانج|سەلماندن)/i.test(text);
    const hasGrounds = /(داتا|ئامار|سەرچاوە|نموونە|ڕاپرسی|خشتە|بەپێی)/i.test(text);
    const hasWarrants = /(لەبەر ئەوەی|چونکە|پەیوەندیی نێوان|دەبێتە هۆی|دەرەنجام)/i.test(text);
    const hasBacking = /(توێژینەوەی پێشوو|تیۆری|پشتیوانی|میتۆدۆلۆژیا)/i.test(text);
    const hasRebuttals = /(لە بەرامبەردا|ڕەخنە|بۆچوونی جیاواز|هەرچەندە|لەلایەکی تر)/i.test(text);
    const hasQualifiers = /(بە شێوەیەکی گشتی|لە سنووری|دەکرێت|ئەگەری هەیە|زۆرجار)/i.test(text);
    const hasGap = /(کەلێن|کەمیی توێژینەوە|ڕوون نەکراوەتەوە|پێویستی بە لێکۆڵینەوە)/i.test(text);

    let score = 20;
    if (hasClaims) score += 15;
    if (hasGrounds) score += 15;
    if (hasWarrants) score += 15;
    if (hasBacking) score += 10;
    if (hasRebuttals) score += 15;
    if (hasQualifiers) score += 10;

    const rigorLevel = score >= 80 
      ? 'پتەو و پێشکەوتوو' 
      : score >= 55 
        ? 'مامناوەند - پێویستی بە بەڵگەیە' 
        : 'سەرەتایی و لاواز';

    return {
      overallScore: score,
      academicRigorLevel: rigorLevel,
      claims: {
        id: 'claim',
        name: 'بانگەشە و تێزی سەرەکی (Claim)',
        description: 'دەستنیشانکردنی ئەنجام یان ئەو بۆچوونەی توێژەر دەیەوێت بیسەلمێنێت.',
        found: hasClaims,
        score: hasClaims ? 85 : 30,
        critique: hasClaims ? 'تێزەکە خاوەنی ئاراستەیەکی دیاریکراوی گوتارە.' : 'بانگەشەی سەرەکی ڕوون نییە و لەناو دەقدا ون بووە.',
        recommendation: 'لە سەرەتای هەر بەشێکدا، ڕستەی سەرەکی (Topic Sentence) بە ڕوونی بنووسە.'
      },
      grounds: {
        id: 'grounds',
        name: 'داتا و بەڵگە زانستییەکان (Grounds / Data)',
        description: 'بەڵگەنامە، ئامار و ئەو زانیارییانەی پشتگیری لە بانگەشەکە دەکەن.',
        found: hasGrounds,
        score: hasGrounds ? 80 : 35,
        critique: hasGrounds ? 'دەقەکە پشتی بە چەند ئامار و بەڵگەیەک بەستووە.' : 'بەڵگەی تەجروبی یان ئاماریی پێویست بەدی ناکرێت.',
        recommendation: 'سەرچاوەی بڕواپێکراو و ژمارەیی بۆ هەموو ڕستەیەکی حوکمبەخش دابنێ.'
      },
      warrants: {
        id: 'warrants',
        name: 'پردی لۆژیکی و پەیوەندی (Warrants)',
        description: 'ئەو پرەنسیپ یان تیۆرییەی داتاکان بە ئەنجامی بانگەشەکەوە دەبەستێتەوە.',
        found: hasWarrants,
        score: hasWarrants ? 75 : 40,
        critique: hasWarrants ? 'پەیوەندیی هۆ و ئەنجام بە ڕێژەیی ڕوونکراوەتەوە.' : 'بازدانی لۆژیکی هەیە لە نێوان داتا و ئەنجامەکاندا.',
        recommendation: 'ڕوونی بکەرەوە کە چۆن ئەم داتایە دەگات بەو دەرەنجامە زانستییە.'
      },
      backing: {
        id: 'backing',
        name: 'پاڵپشتی تیۆری و پێشینە (Backing)',
        description: 'پشتئەستوورکردنی متمانەی پردە لۆژیکییەکە بە تیۆرییە زانستییەکان.',
        found: hasBacking,
        score: hasBacking ? 70 : 30,
        critique: hasBacking ? 'پاڵپشتی بە تێکڕای چەمکەکان کراوە.' : 'چوارچێوەی تیۆریی دەقەکە کەمێک کورتە.',
        recommendation: 'ئاماژە بە تیۆریست و توێژینەوە هاوتا متمانەپێکراوەکان بدە.'
      },
      rebuttals: {
        id: 'rebuttals',
        name: 'ڕەخنە و دژە-بۆچوونەکان (Rebuttals / Counter-Arguments)',
        description: 'لەبەرچاوگرتنی دیدگا پێچەوانەکان و وەڵامدانەوەی زانستییان.',
        found: hasRebuttals,
        score: hasRebuttals ? 80 : 25,
        critique: hasRebuttals ? 'دەقەکە چاوی لەسەر بۆچوونی دژ هەبووە.' : 'دەقەکە یەکلایەنەیە و وەڵامی ڕەخنەگرانی نەداوەتەوە.',
        recommendation: 'بڕگەیەک بۆ وەڵامدانەوەی بۆچوونی ناکۆک لەگەڵ تێزەکەت تەرخان بکە.'
      },
      qualifiers: {
        id: 'qualifiers',
        name: 'سنوردارکردنی گوتار (Qualifiers)',
        description: 'دیاریکردنی پلەی متمانە و مەرجەکانی بەکارچوونی دەرئەنجامەکان.',
        found: hasQualifiers,
        score: hasQualifiers ? 75 : 45,
        critique: hasQualifiers ? 'زمانی نووسین تا ڕادەیەک بێلایەنە.' : 'حوکمی ڕەها بەکارهاتووە لەبری دەربڕینی ڕێژەیی.',
        recommendation: 'دەستەواژەکانی وەک "لەوانەیە"، "تا ڕادەیەکی زۆر"، و "بەپێی نموونەکە" بەکاربهێنە.'
      },
      researchGapIdentified: hasGap,
      researchGapDescription: hasGap 
        ? 'کەلێنی زانستی لە دەقەکەدا بە ڕوونی ئاماژەی پێکراوە کە دەبێتە پاساوی بنەڕەتیی توێژینەوەکە.'
        : 'کەلێنی زانستی (Research Gap) ڕوون نەکراوەتەوە؛ پێویستە دەستنیشان بکرێت کە ئەم توێژینەوەیە چ کەلێنێکی نەگوتراو پڕ دەکاتەوە.',
      actionableSteps: [
        'پتەوکردنی ڕستەی بانگەشە لە سەرەتای بڕگە سەرەکییەکاندا',
        'زیادکردنی خشتەی بەراوردی داتا بۆ پتەوکردنی (Grounds)',
        'تەرخانکردنی بڕگەیەکی سەربەخۆ بۆ شرۆڤەی ڕەخنە و بەرپەرچدانەوە (Rebuttal)',
        'تۆخکردنەوەی کەلێنی مەعریفی (Research Gap) لە پێشەکیی بەشەکەدا'
      ]
    };
  }

  /**
   * دابینکردنی یاساکانی ئەرگیومێنتسازیی تولمین بۆ بەکارهێنان لە پرۆمپی بزوێنەری نووسین
   */
  getToulminDirectives(): string {
    return `[بنەماکانی ئەرگیومێنتسازیی تولمین - Toulmin Model]:
- بانگەشەی زانستی (Claim): هەر بەشێک دەبێت بە ئامانج و گریمانەی سەرەکی دەست پێ بکات.
- داتا و بەڵگە (Grounds): پشتبەستن بە ئامار، بەڵگەی سەلمێنەر و نموونەی ئەزموونی.
- پاساوی تیۆری (Warrant): شیکردنەوەی چۆنیەتیی گەیشتنی بەڵگەکان بە دەرەنجامی داواکراو.
- پاڵپشتیی مەعریفی (Backing): پەیوەستکردنی پاساوەکان بە ئەدەبیاتی پێشوو.
- ڕوانگەی نەیار (Rebuttal): شیکردنەوەی ڕەخنە و بەرپەرچدانەوەی زانستی بە بێلایەنی.
- سنوردارکردن (Qualifiers): بەکارهێنانی دەربڕینی پێوانەکراو و دوورکەوتنەوە لە حوکمی ڕەها.`;
  }
}

