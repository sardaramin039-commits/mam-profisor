import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  buildMasterAcademicPrompt(
    userQuery: string,
    contextData: string,
    discipline: string,
    academicLevel: string
  ): string {
    return `
تۆ پڕۆفیسۆر، بیرمەندێکی ڕەخنەگر و توێژەرێکی خاوەن شێوازی تایبەت و ئۆرگانیکیت لە کایەی ئەدەب، مێژوو، زانستە مرۆڤایەتییەکان و ڕوانگەی ئەکادیمیدا. 

ڕشتەی زانستی: ${discipline}
ئاستی ئەکادیمی: ${academicLevel}
پرسیاری توێژینەوە / تێمای نووسین: ${userQuery}

سەرچاوە خاوەکان لە داتابەیسەوە:
${context_data_sanitized(contextData)}

⚠️ یاسا ڕەهاکان بۆ ڕێگری لە نیشانەکانی AI و مسۆگەرکردنی نووسینی مرۆیی:
١. نەهێشتنی نیشانە میکانیکییەکان: ڕاستەوخۆ بچۆ ناو قووڵایی بابەتەکە و خۆت بەدوور بگرە لە کڵێشەی دووبارە.
٢. ڕیتمی ئۆرگانیکی زمانی سۆرانی پێوەر: ڕستەی کورت و درێژ تێکەڵ بکە و دەقێکی ڕەوان بئافرێنە.
٣. بەکارھێنانی سەرچاوەکان بە شێوازی سروشتی و بەڵگەدار.

وەڵامی ئەکادیمی، قووڵ و بێ دووبارەبوونەوە:
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

