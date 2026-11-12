import { Injectable } from '@angular/core';
import {
  ProposalAlignmentFeedback,
  ResearchProposalBlueprint
} from '../models/pre-writing.models';

const STORAGE_KEY = 'mam_prewriting_blueprint_v1';

@Injectable({
  providedIn: 'root'
})
export class PreWritingService {
  public getDefaultBlueprint(): ResearchProposalBlueprint {
    return {
      problemStatement: '',
      coreQuestion: '',
      subQuestions: [
        'ڕادەی بوون و دەرکەوتنی دیاردەکە چۆنە؟',
        'پەیوەندیی نێوان گۆڕاوە سەرەکییەکان چۆن شیکار دەکرێت؟'
      ],
      mainObjective: '',
      specificObjectives: [
        'دەستنیشانکردنی ئاست و قەبارەی کاریگەرییەکان.',
        'خستنەڕووی چارەسەر و ڕاسپاردەی کردارەکی.'
      ],
      coreHypothesis: '',
      temporalScope: 'ساڵی ئەکادیمی ٢٠٢٥ - ٢٠٢٦',
      spatialScope: 'هەرێمی کوردستان (سلێمانی / هەولێر)',
      thematicScope: 'کایەی زانستی و تیۆریی تایبەتمەند بە بابەتەکە',
      significance: 'پڕکردنەوەی کەلێنی زانستی لە ئەدەبیاتی کوردی و پێشکەشکردنی داتای مەیدانی بۆ بڕیاربەدەستان.',
      methodologyType: 'quantitative',
      targetPopulation: 'کۆمەڵگەی ئامانجی لێکۆڵینەوە',
      sampleSize: '١٥٠ - ٢٠٠ بەشداربوو',
      dataCollectionTools: ['فۆرمی ڕاپرسی (Questionnaire)', 'چاوپێکەوتنی نیمچەداڕێژراو (Semi-structured Interview)']
    };
  }

  public loadBlueprint(): ResearchProposalBlueprint {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...this.getDefaultBlueprint(), ...JSON.parse(saved) };
      }
    } catch {
      // Graceful degradation
    }
    return this.getDefaultBlueprint();
  }

  public saveBlueprint(blueprint: ResearchProposalBlueprint): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
    } catch {
      // Ignore storage error
    }
  }

  public validateAlignment(blueprint: ResearchProposalBlueprint): ProposalAlignmentFeedback {
    const hasProb = blueprint.problemStatement.trim().length >= 10;
    const hasQ = blueprint.coreQuestion.trim().length >= 8;
    const hasObj = blueprint.mainObjective.trim().length >= 8;
    const hasHyp = blueprint.coreHypothesis.trim().length >= 8;
    const hasPop = blueprint.targetPopulation.trim().length >= 3;

    const recommendations: string[] = [];
    let score = 0;

    if (hasProb) score += 25;
    else recommendations.push('پێویستە کێشەی توێژینەوە بە ڕوونی پێناسە بکرێت.');

    if (hasQ) score += 25;
    else recommendations.push('پێویستە پرسیاری بنەڕەتیی توێژینەوە دابڕێژرێت.');

    if (hasObj) score += 25;
    else recommendations.push('ئامانجی سەرەکیی کارەکە دیاری بکە بۆ تەبایی لەگەڵ پرسیارەکە.');

    if (hasHyp || blueprint.methodologyType === 'qualitative') score += 15;
    else recommendations.push('بۆ توێژینەوەی چەندایەتی، پێویستە گریمانەی سەرەکی دیاری بکرێت.');

    if (hasPop) score += 10;
    else recommendations.push('کۆمەڵگەی ئامانج و نموونەگیری دەستنیشان بکە.');

    const problemQuestionAlignment = hasProb && hasQ;
    const questionObjectiveAlignment = hasQ && hasObj;
    const objectiveMethodAlignment = hasObj && blueprint.dataCollectionTools.length > 0;

    const status: ProposalAlignmentFeedback['status'] =
      score >= 80 ? 'OPTIMAL' : score >= 50 ? 'COHERENT' : 'NEEDS_ALIGNMENT';

    return {
      score,
      status,
      problemQuestionAlignment,
      questionObjectiveAlignment,
      objectiveMethodAlignment,
      recommendations
    };
  }

  public generateProposalDocument(title: string, bp: ResearchProposalBlueprint): string {
    const methodKurdish = {
      quantitative: 'میتۆدی چەندایەتی (Quantitative Descriptive/Empirical)',
      qualitative: 'میتۆدی چۆنایەتی (Qualitative Analytical/Thematic)',
      mixed: 'میتۆدی تێکەڵاو (Mixed-Methods Triangulation)'
    }[bp.methodologyType];

    return `# نەخشەڕێگە و پێشنیاری توێژینەوە (Research Proposal)
## ناونیشان: ${title || 'ناونیشانی دیاریکراوی توێژینەوە'}

---

### یەکەم: کێشەی سەرەکیی توێژینەوە (Problem Statement)
${bp.problemStatement || 'کێشەی سەرەکی لەم توێژینەوەیەدا دەستنیشان دەکرێت.'}

---

### دووەم: پرسیارە سەرەکی و لاوەکییەکان (Research Questions)
* **پرسیاری سەرەکی:** ${bp.coreQuestion || 'پرسیاری بنەڕەتیی توێژینەوە'}
${bp.subQuestions.map(q => `* ${q}`).join('\n')}

---

### سێیەم: ئامانجەکانی توێژینەوە (Research Objectives)
* **ئامانجی سەرەکی:** ${bp.mainObjective || 'ئامانجی گشتیی توێژینەوە'}
${bp.specificObjectives.map(o => `* ${o}`).join('\n')}

---

### چوارەم: گریمانەی سەرەکی (Research Hypotheses)
${bp.coreHypothesis || 'گریمانەی سەرەکی دەربارەی پەیوەندیی نێوان متغیرەکان.'}

---

### پێنجەم: کایە و سنووردارکردن (Scope & Delimitations)
* **سنووری کاتی:** ${bp.temporalScope}
* **سنووری شوێنی:** ${bp.spatialScope}
* **سنووری بابەتی:** ${bp.thematicScope}

---

### شەشەم: گرنگیی زانستی و کرداری (Significance)
${bp.significance}

---

### حەوتەم: میتۆدۆلۆژیا و کەرەستەکان (Methodology & Design)
* **جۆری میتۆد:** ${methodKurdish}
* **کۆمەڵگەی ئامانج:** ${bp.targetPopulation}
* **قەبارەی نموونە:** ${bp.sampleSize}
* **ئامرازەکانی کۆکردنەوەی داتا:**
${bp.dataCollectionTools.map(t => `  - ${t}`).join('\n')}
`;
  }
}
