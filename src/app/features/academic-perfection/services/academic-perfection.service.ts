import { Injectable } from '@angular/core';
import {
  AuthenticityDeclaration,
  CreditAuthorRole,
  StatisticalRigorPlan,
  StructuredImradAbstract
} from '../models/academic-perfection.models';

const STORAGE_KEY = 'mam_academic_perfection_v1';

@Injectable({
  providedIn: 'root'
})
export class AcademicPerfectionService {
  public getDefaultAbstract(): StructuredImradAbstract {
    return {
      backgroundKurdish: 'لەم توێژینەوەیەدا تیشک خراوەتە سەر کەلێنە تیۆری و کردارەکییەکانی پەیوەست بە بابەتەکە لە چوارچێوەی ئەدەبیاتی زانستی.',
      backgroundEnglish: 'This study investigates the theoretical and practical gaps related to the core subject matter within current academic literature.',
      methodsKurdish: 'میتۆدی شیکاریی چەندایەتی/چۆنایەتی لەگەڵ نموونەیەکی گونجاو لە ڕێگەی ئامرازی پێوانەکردنی سەلمێنراو پەیڕەو کراوە.',
      methodsEnglish: 'A validated methodological design employing empirical data collection instruments and representative sampling was applied.',
      resultsKurdish: 'ئەنجامە سەرەکییەکان دەریانخست پەیوەندییەکی ئەرێنی و ماناداری ئاماری لە نێوان گۆڕاوە سەرەکییەکاندا بوونی هەیە.',
      resultsEnglish: 'The empirical findings revealed statistically significant positive correlations between the core investigated variables.',
      conclusionKurdish: 'دەرئەنجامەکان جەخت لەسەر گرنگیی جێبەجێکردنی ڕاسپاردەکان بۆ پێشخستنی کایە زانستییەکە دەکەنەوە.',
      conclusionEnglish: 'The findings underscore strategic theoretical and policy implications for advancement within the academic domain.',
      keywordsKurdish: ['توێژینەوەی ئەکادیمی', 'میتۆدۆلۆژیا', 'شیکاریی داتا', 'زمانەوانی'],
      keywordsEnglish: ['Academic Research', 'Methodology', 'Data Analysis', 'Linguistics']
    };
  }

  public getDefaultCreditRoles(): CreditAuthorRole[] {
    return [
      { roleId: 'conceptualization', roleNameKurdish: 'داڕشتنی چەمک و بیرۆکە', roleNameEnglish: 'Conceptualization', assignedAuthor: '', selected: true },
      { roleId: 'methodology', roleNameKurdish: 'دیزاینی میتۆدۆلۆژیا', roleNameEnglish: 'Methodology', assignedAuthor: '', selected: true },
      { roleId: 'formal_analysis', roleNameKurdish: 'شیکاریی فەرمیی ئاماری/دەقی', roleNameEnglish: 'Formal Analysis', assignedAuthor: '', selected: true },
      { roleId: 'investigation', roleNameKurdish: 'لێکۆڵینەوە و پشکنینی داتا', roleNameEnglish: 'Investigation', assignedAuthor: '', selected: true },
      { roleId: 'data_curation', roleNameKurdish: 'کۆکردنەوە و ڕێکخستنی داتا', roleNameEnglish: 'Data Curation', assignedAuthor: '', selected: false },
      { roleId: 'writing_draft', roleNameKurdish: 'نووسینی ڕەشنووسی سەرەتایی', roleNameEnglish: 'Writing - Original Draft', assignedAuthor: '', selected: true },
      { roleId: 'writing_review', roleNameKurdish: 'پێداچوونەوە و دەستکاریی زانستی', roleNameEnglish: 'Writing - Review & Editing', assignedAuthor: '', selected: true },
      { roleId: 'supervision', roleNameKurdish: 'سەرپەرشتیاری و ڕێنوێنیی باڵا', roleNameEnglish: 'Supervision', assignedAuthor: '', selected: false }
    ];
  }

  public getDefaultDeclaration(): AuthenticityDeclaration {
    return {
      authorName: '',
      affiliation: 'کۆلێژی خوێندنی باڵا',
      submissionDate: new Date().toLocaleDateString('ckb-IQ'),
      statementAccepted: true,
      hasConflictOfInterest: false,
      conflictDetails: 'هیچ ململانێیەکی بەرژەوەندی لەم توێژینەوەیەدا نییە (No conflict of interest).',
      fundingStatement: 'ئەم توێژینەوەیە خەرجی و پاڵپشتیی تایبەتی خۆیی بووە (Self-funded research).',
      verificationHash: 'AUTH-SHA256-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    };
  }

  public getDefaultStatisticalPlan(): StatisticalRigorPlan {
    return {
      researchDesign: 'correlational',
      independentVariables: ['گۆڕاوی سەربەخۆ (Independent Variable)'],
      dependentVariables: ['گۆڕاوی سەرپێچ/پاشکۆ (Dependent Variable)'],
      reliabilityMethod: 'cronbach_alpha',
      targetAlphaScore: 0.85,
      recommendedTests: [
        'پشکنینی ئاساییبوون (Shapiro-Wilk / Kolmogorov-Smirnov Normality Test)',
        'پشکنینی سەقامگیری ناوەکی (Cronbach’s Alpha Reliability Coeff >= 0.70)',
        'پشکنینی پەیوەندی (Pearson / Spearman Correlation)',
        'شیکاریی پاشەکشە (Multiple Linear Regression Analysis)'
      ]
    };
  }

  public loadState(): {
    imrad: StructuredImradAbstract;
    creditRoles: CreditAuthorRole[];
    declaration: AuthenticityDeclaration;
    statisticalPlan: StatisticalRigorPlan;
  } {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          imrad: { ...this.getDefaultAbstract(), ...(parsed.imrad || {}) },
          creditRoles: parsed.creditRoles || this.getDefaultCreditRoles(),
          declaration: { ...this.getDefaultDeclaration(), ...(parsed.declaration || {}) },
          statisticalPlan: { ...this.getDefaultStatisticalPlan(), ...(parsed.statisticalPlan || {}) }
        };
      }
    } catch {
      // Fallback
    }
    return {
      imrad: this.getDefaultAbstract(),
      creditRoles: this.getDefaultCreditRoles(),
      declaration: this.getDefaultDeclaration(),
      statisticalPlan: this.getDefaultStatisticalPlan()
    };
  }

  public saveState(data: {
    imrad: StructuredImradAbstract;
    creditRoles: CreditAuthorRole[];
    declaration: AuthenticityDeclaration;
    statisticalPlan: StatisticalRigorPlan;
  }): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  public generateImradDocument(title: string, imrad: StructuredImradAbstract): string {
    return `=======================================================
پوختەی چوارچێوەداری زانستی (Structured IMRAD Abstract)
ناونیشان: ${title || 'ناونیشانی توێژینەوە'}
=======================================================

[ زمانی کوردی / Kurdish ]
* پاشخان و پێشینە (Background):
${imrad.backgroundKurdish}

* میتۆد و ڕێگە (Methods):
${imrad.methodsKurdish}

* ئەنجامە سەرەکییەکان (Results):
${imrad.resultsKurdish}

* دەرئەنجام و ڕاسپاردە (Conclusion):
${imrad.conclusionKurdish}

* کلیلەوشەکان (Keywords):
${imrad.keywordsKurdish.join(' ، ')}

-------------------------------------------------------
[ زمانی ئینگلیزی / English ]
* Background:
${imrad.backgroundEnglish}

* Methods:
${imrad.methodsEnglish}

* Results:
${imrad.resultsEnglish}

* Conclusion:
${imrad.conclusionEnglish}

* Keywords:
${imrad.keywordsEnglish.join(', ')}
`;
  }

  public generateCreditStatement(authorName: string, roles: CreditAuthorRole[]): string {
    const active = roles.filter(r => r.selected);
    const lines = active.map(r => `${r.roleNameEnglish} (${r.roleNameKurdish}): ${r.assignedAuthor || authorName || 'نووسەری سەرەکی'}`);
    return `CRediT (Contributor Roles Taxonomy) Authorship Statement:
------------------------------------------------------------
${lines.join('\n')}
`;
  }
}
