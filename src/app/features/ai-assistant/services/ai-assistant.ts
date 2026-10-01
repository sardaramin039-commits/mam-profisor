import { inject, Injectable } from '@angular/core';
import { VipAcademicLevel, VipDiscipline, VipWritingQualityService } from '../../editor/components/vip-writing-quality.service';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private vipQuality = inject(VipWritingQualityService);
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
تۆ پڕۆفیسۆر، توێژەر و نووسەرێکی ئەکادیمیت. دەبێت ناوەڕۆکی خوارەوە بە شێوەی ورد، بەڵگەدار و سروشتی بنووسیت، بەبێ دروستکردنی سەرچاوە یان داتای ساختە.

ڕشتەی زانستی: ${discipline}
ئاستی ئەکادیمی: ${academicLevel}
پرسیاری توێژینەوە / تێمای نووسین: ${userQuery}

سەرچاوەکانی هاتوو لە retrieval ـەوە:
${context_data_sanitized(contextData)}

یاسای پشتڕاستیی سەرچاوە:
تۆمارێک کە تەنها لە index ـێک هاتووە، بە خۆی بەڵگەی citation ـی پشتڕاستکراو نییە.
تەنها تۆمارێک کە بە ڕوونی VERIFIED دیاریکراوە و evidence ـی پەیوەندیداری هەیە، وەک سەرچاوەی پشتڕاستکراو بەکاربهێنە.
retrieved، partially_verified، unverified یان metadata-only تەنها وەک leads بن، نەک وەک citationی کۆتایی.
هیچ DOI، نووسەر، ساڵ، لاپەڕە، ئامار یان دەرئەنجامێک لە خۆتەوە پڕ مەکە.
${context_data_sanitized(contextData)}

یاساکانی VIP Pro بۆ ئەم ئاست و بوارە:
${directives.map((item, index) => `${index + 1}. ${item}`).join('\n')}

یاسای کۆتایی: ئەگەر بەڵگەی پێویست نییە، مەکۆڵە؛ بڵێ زانیاریی پشتڕاستنەکراوە و پێویستی بە سەرچاوەی دڵنیابەخش هەیە. دووبارەبوونەوە، کڵێشە، درێژکردنی بێ مەبەست و تۆنی گفتوگۆیی کەم بکە.

وەڵامی ئەکادیمی و بۆ ئەم ئاستە گونجاو بنووسە:
`.trim();
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

