import { ChapterItemModel as ChapterItem } from '../domain/models';

export class AppAcademicActions {
  static applyMarginPreset(targetPages: number, preset: '5%' | '10%' | '15%' | '1page' | '2pages'): { minPages: number; maxPages: number } {
    let min = targetPages;
    let max = targetPages;

    if (preset === '5%') {
      min = Math.max(1, Number((targetPages * 0.95).toFixed(1)));
      max = Number((targetPages * 1.05).toFixed(1));
    } else if (preset === '10%') {
      min = Math.max(1, Number((targetPages * 0.90).toFixed(1)));
      max = Number((targetPages * 1.10).toFixed(1));
    } else if (preset === '15%') {
      min = Math.max(1, Number((targetPages * 0.85).toFixed(1)));
      max = Number((targetPages * 1.15).toFixed(1));
    } else if (preset === '1page') {
      min = Math.max(1, targetPages - 1);
      max = targetPages + 1;
    } else if (preset === '2pages') {
      min = Math.max(1, targetPages - 2);
      max = targetPages + 2;
    }

    return { minPages: min, maxPages: max };
  }

  static getChapterHeaders(content: string): { text: string; id: string; level: number }[] {
    if (!content) return [];
    const lines = content.split('\n');
    const headers: { text: string; id: string; level: number }[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        let level = 1;
        while (trimmed[level] === '#') level++;
        const text = trimmed.replace(/^#+\s*/, '');
        headers.push({ text, id: `header-${index}`, level });
      } else if (trimmed.startsWith('بەشی') || trimmed.startsWith('دەروازەی') || trimmed.startsWith('تەوەرەی')) {
        headers.push({ text: trimmed, id: `header-${index}`, level: 1 });
      }
    });

    return headers;
  }

  static formatTextSelection(textarea: HTMLTextAreaElement, format: 'bold' | 'italic' | 'sub' | 'sup'): string {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end) || 'دەقی هەڵبژێردراو';

    let formatted = selected;
    if (format === 'bold') formatted = `**${selected}**`;
    if (format === 'italic') formatted = `*${selected}*`;
    if (format === 'sub') formatted = `<sub>${selected}</sub>`;
    if (format === 'sup') formatted = `<sup>${selected}</sup>`;

    return val.substring(0, start) + formatted + val.substring(end);
  }

  static getKurdishDialectLabel(dialect: 'thesis' | 'antithesis' | 'synthesis'): string {
    if (dialect === 'thesis') return 'شێوازی تێز (سەلمێنەر)';
    if (dialect === 'antithesis') return 'شێوازی ئەنتی-تێز (ڕەخنەیی/شیکاری)';
    return 'شێوازی سینتێز (کۆکەرەوە و هەمەلایەن)';
  }
}
