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

  static formatTextSelection(
    textarea: HTMLTextAreaElement,
    format: 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'quote' | 'footnote' | 'bullet' | 'number' | 'table' | 'sub' | 'sup'
  ): string {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const val = textarea.value || '';
    const selected = val.substring(start, end);

    let formatted = selected;
    switch (format) {
      case 'bold':
        formatted = `**${selected || 'دەقی تۆخ'}**`;
        break;
      case 'italic':
        formatted = `*${selected || 'دەقی لار'}*`;
        break;
      case 'h1':
        formatted = `\n# ${selected || 'سەرپەڕەی سەرەکی (Heading 1)'}\n`;
        break;
      case 'h2':
        formatted = `\n## ${selected || 'تەوەری سەرەکی (Heading 2)'}\n`;
        break;
      case 'h3':
        formatted = `\n### ${selected || 'لقی توێژینەوە (Heading 3)'}\n`;
        break;
      case 'quote':
        formatted = `«${selected || 'دەقی وەرگیراو بەپێی ستاندارد'}»`;
        break;
      case 'footnote': {
        const footnoteMatches = (val.match(/\[[١٢٣٤٥٦٧٨٩٠\d]+\]/g) || []).length;
        const nextNum = footnoteMatches + 1;
        const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const numStr = String(nextNum).split('').map(d => kurdishDigits[parseInt(d, 10)] ?? d).join('');
        const marker = `[${numStr}]`;
        const noteEntry = `\n\n---\n${marker} تێبینی و سەرچاوە: (نووسەر، ساڵ، ل. لاپەڕە).`;
        const hasFootnotesSection = val.includes('پەراوێزەکان') || val.includes('---');
        const appendFooter = hasFootnotesSection ? `\n${marker} تێبینی: ` : noteEntry;
        return val.substring(0, start) + marker + val.substring(end) + appendFooter;
      }
      case 'bullet':
        formatted = `\n- ${selected || 'بڕگەی یەکەم'}\n- بڕگەی دووەم\n- بڕگەی سێیەم\n`;
        break;
      case 'number':
        formatted = `\n١. ${selected || 'خاڵی یەکەم'}\n٢. خاڵی دووەم\n٣. خاڵی سێیەم\n`;
        break;
      case 'table':
        formatted = `\n| پێوەر / گۆڕاو | قەبارە (N) | تێکڕا (Mean) | لادانی پێوانەیی (SD) | ئاستی واتاداری (p) |\n| :--- | :---: | :---: | :---: | :---: |\n| نموونەی یەکەم | ٣٠ | ٤.٢٥ | ٠.٦٢ | p < 0.05 |\n| نموونەی دووەم | ٣٠ | ٣.٨٠ | ٠.٧٥ | p < 0.05 |\n`;
        break;
      case 'sub':
        formatted = `<sub>${selected || 'ژێرنووس'}</sub>`;
        break;
      case 'sup':
        formatted = `<sup>${selected || 'سەرنووس'}</sup>`;
        break;
      default:
        formatted = selected;
    }

    return val.substring(0, start) + formatted + val.substring(end);
  }

  static getKurdishDialectLabel(dialect: 'thesis' | 'antithesis' | 'synthesis'): string {
    if (dialect === 'thesis') return 'شێوازی تێز (سەلمێنەر)';
    if (dialect === 'antithesis') return 'شێوازی ئەنتی-تێز (ڕەخنەیی/شیکاری)';
    return 'شێوازی سینتێز (کۆکەرەوە و هەمەلایەن)';
  }
}
