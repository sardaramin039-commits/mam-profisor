import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./gemini-request-manager.service', () => ({
  GeminiRequestManagerService: class {}
}));

import { WordCountControllerService } from './word-count-controller.service';

const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => Array.from(storageMap.keys())[index] || null
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('WordCountControllerService', () => {
  let controller: WordCountControllerService;

  beforeEach(() => {
    storageMap.clear();
    controller = new WordCountControllerService();
  });

  it('computes target, current words, and remaining words accurately across chapters', () => {
    controller.setManuscriptTarget(1000);

    controller.editorService.setChapters([
      {
        id: 1,
        title: 'بەشی یەکەم: پێشەکی',
        content: 'ئەمە دەقی بەشی یەکەمە کە دە وشە لەخۆ دەگرێت لێرەدا.',
        wordCount: 10,
        status: 'completed'
      },
      {
        id: 2,
        title: 'بەشی دووەم: شیکاری',
        content: 'لەم بەشەدا شیکاریی زانستی و لێکۆڵینەوە ئەنجام دەدەین بە شێوازی ئەکادیمی.',
        wordCount: 11,
        status: 'completed'
      }
    ]);

    const audit = controller.manuscriptAudit();
    expect(audit.targetWords).toBe(1000);
    // 10 + 11 = 21 words
    expect(audit.currentWords).toBe(21);
    expect(audit.remainingWords).toBe(979);
    expect(audit.status).toBe('UNDER');
  });

  it('supports section-specific word targets and evaluates deviation', () => {
    controller.setManuscriptTarget(500);
    controller.setSectionTarget(1, 15); // Custom section target of 15 words for chapter 1

    controller.editorService.setChapters([
      {
        id: 1,
        title: 'بەشی یەکەم',
        content: 'ئەمە پانزە وشەی دەقی بەشەکەیە بۆ ئەوەی بە تەواوی بگاتە ئامانجی دیاریکراو بە وردی لێرەدا.',
        wordCount: 15,
        status: 'completed'
      }
    ]);

    const audit = controller.manuscriptAudit();
    const ch1 = audit.chapterAudits.find(c => c.chapterId === 1);
    expect(ch1).toBeDefined();
    expect(ch1!.targetWords).toBe(15);
    expect(ch1!.currentWords).toBe(15);
    expect(ch1!.status).toBe('EXACT');
    expect(ch1!.statusLabel).toContain('تەواو');
  });

  it('blocks pre-export validation when manuscript is empty', () => {
    controller.editorService.setChapters([
      { id: 1, title: 'بەشی بەتاڵ', content: '', wordCount: 0, status: 'pending' }
    ]);

    const validation = controller.validateForExport([
      { title: 'بەشی بەتاڵ', content: '' }
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('سفر وشە') || e.includes('بەتاڵە'))).toBe(true);
  });

  it('blocks pre-export validation when manuscript is critically below target', () => {
    controller.setManuscriptTarget(10000);
    controller.editorService.setChapters([
      { id: 1, title: 'بەشی کورت', content: 'دەقێکی زۆر کورت.', wordCount: 3, status: 'completed' }
    ]);

    const validation = controller.validateForExport([
      { title: 'بەشی کورت', content: 'دەقێکی زۆر کورت.' }
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('زۆر کەمترە'))).toBe(true);
  });
});
