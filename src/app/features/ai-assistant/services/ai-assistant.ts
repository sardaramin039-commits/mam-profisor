import { inject, Injectable } from '@angular/core';
import { VipAcademicLevel, VipDiscipline, VipWritingQualityService } from '../../editor/components/vip-writing-quality.service';
import { GeminiRequestManagerService } from '../../../services/gemini-request-manager.service';
import { AcademicToulminArgumentService } from '../../../services/academic-toulmin-argument.service';
import { AcademicHedgingStanceService } from '../../../services/academic-hedging-stance.service';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private vipQuality = inject(VipWritingQualityService);
  private requestManager = inject(GeminiRequestManagerService);
  private toulminService = inject(AcademicToulminArgumentService);
  private hedgingService = inject(AcademicHedgingStanceService);

  buildMasterAcademicPrompt(
    userQuery: string,
    contextData: string,
    discipline: string,
    academicLevel: string
  ): string {
    const level = (academicLevel || 'bachelor') as VipAcademicLevel;
    const domain = (discipline || 'humanities') as VipDiscipline;
    const directives = this.vipQuality.getGenerationDirectives(level, domain);

    return `
تو پڕۆفیسۆر، توێژەر و نووسەرێکی ئەکادیمیت. دەبێت ناوەڕۆکی خوارەوە بە شێوەی ورد، بەڵگەدار و سروشتی بنووسیت، بەبێ دروستکردنی سەرچاوە یان داتای ساختە.

ڕشتەی زانستی: ${discipline}
ئاستی ئەکادیمی: ${academicLevel}
پرسیاری توێژینەوە / تێمای نووسین: ${userQuery}

سەرچاوەکانی هاتوو لە retrieval ـەوە:
${context_data_sanitized(contextData)}

یاساکانی VIP Pro بۆ ئەم ئاست و بوارە:
${directives.map((item, index) => `${index + 1}. ${item}`).join('\n')}

وەڵامی ئەکادیمی و بۆ ئەم ئاستە گونجاو بنووسە:
`.trim();
  }

  async generateScholarlyChapter(payload: {
    title: string;
    chapterTitle: string;
    discipline: string;
    academicLevel: string;
    targetWords: number;
    outlineHeadings?: string[];
    contextData?: string;
  }): Promise<{ content: string; wordCount: number }> {
    const targetWords = payload.targetWords || 2000;
    const toulminRules = this.toulminService.getToulminDirectives();
    const hedgingRules = this.hedgingService.getHedgingDirectives();

    const academicPrompt = `[نووسینی بەشی تێزی زانستی لەسەر ئاستی ${payload.academicLevel || 'دکتۆرا'}]:
ناونیشانی گشتی: «${payload.title}»
تەوەرەی ئەم بەشە: «${payload.chapterTitle}»
کایەی زانستی: «${payload.discipline || 'گشتی'}»
ئامانجی وشەکان: لانیکەم ${targetWords} وشەی ئەکادیمی بە زمانی کوردیی سۆرانیی فەرمی.

سەرچاوە و زانیاریی پاشخان:
${payload.contextData || 'بەپێی مێتۆدی زانستی و ستانداردی APA-7'}

${toulminRules}

${hedgingRules}

ڕێنمایی زۆر گرنگ:
- زمانی کەسی سێیەمی بێلایەن بەبێ هیچ دەربڕینێکی وتاری یان ڕۆژنامەوانی.
- پاراستنی یاسای واوی درێژ «وو» وەک یەک پیت لە هەموو لێکراوەکاندا.
- قەدەغەکردنی ڕەهای کورتەخاڵ و پوختەکاری؛ هەمووی بە پەڕەگرافی ئەکادیمی بنووسە.`;

    return this.requestManager.generateLongAcademicSection(academicPrompt, targetWords);
  }

  async simulateViva(payload: { title: string; content: string; discipline: string; academicLevel: string; questions?: unknown[]; userDefense?: string }) {
    const response = await fetch('/api/simulate_viva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('پێوەندی لەگەڵ سێرڤەر نییە بۆ تاقیکردنەوەی بەرگری.');
    }
    return response.json();
  }

  async checkPlagiarism(payload: { content: string; title?: string }) {
    const response = await fetch('/api/plagiarism_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('پێوەندی لەگەڵ سێرڤەر نییە بۆ پشکنینی ڕەسەنایەتی.');
    }
    return response.json();
  }

  async runEliteAcademicAssessment(payload: { content: string; title: string; discipline: string; academicLevel: string }) {
    const response = await fetch('/api/elite_academic_assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('پێوەندی لەگەڵ سێرڤەر نییە بۆ هەڵسەنگاندنی ئەکادیمی.');
    }
    return response.json();
  }

  async runHarvardAcademicReview(payload: { title: string; content: string; discipline: string }) {
    const response = await fetch('/api/harvard_academic_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('پێوەندی لەگەڵ سێرڤەر نییە بۆ پێداچوونەوەی هۆڵەندا / هارڤارد.');
    }
    return response.json();
  }
}

function context_data_sanitized(raw: string): string {
  if (!raw || !raw.trim()) {
    return 'هیچ سەرچاوەیەکی داتابەیس لەم کاتەدا نەدۆزرایەوە.';
  }
  return raw;
}

