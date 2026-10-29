import { describe, it, expect } from 'vitest';
import { KurdishWordCounter } from './kurdish-word-counter';

describe('KurdishWordCounter', () => {
  it('counts standard Kurdish Sorani words accurately', () => {
    const text = 'زمانەوانی زانستی لێکۆڵینەوەیە لە پێکهاتەی زمان و ئەرکەکانی لە کۆمەڵگەدا.';
    const count = KurdishWordCounter.countWords(text);
    expect(count).toBe(10);
  });

  it('handles Zero-Width Non-Joiner (ZWNJ) in compound Kurdish words as single words', () => {
    // دەستپێکردن with ZWNJ \u200C between دەست and پێکردن
    const textWithZwnj = 'دەست\u200Cپێکردن و فێر\u200Cبوون لە زانکۆ گرنگە.';
    const count = KurdishWordCounter.countWords(textWithZwnj);
    // دەستپێکردن (1), و (1), فێربوون (1), لە (1), زانکۆ (1), گرنگە (1) = 6 words
    expect(count).toBe(6);
  });

  it('strips Arabic harakat and tatweel without altering word boundaries', () => {
    // کَــــلِمَةٌ with tatweel and harakat
    const decoratedText = 'کَــــلِمَةٌ عَرَبِیَّةٌ وَ دەقێکی سۆرانی';
    const count = KurdishWordCounter.countWords(decoratedText);
    expect(count).toBe(5);
  });

  it('ignores standalone Kurdish and Arabic punctuation marks', () => {
    const textWithPunctuation = 'سڵاو، چۆنی؟ بەڵێ؛ تەواوە! «نموونە» ... ---';
    const count = KurdishWordCounter.countWords(textWithPunctuation);
    // سڵاو (1), چۆنی (1), بەڵێ (1), تەواوە (1), نموونە (1) = 5 words
    expect(count).toBe(5);
  });

  it('excludes bibliography when excludeBibliography is true', () => {
    const text = `
ئەمە دەقی سەرەکیی توێژینەوەکەیە کە باس لە زمانی کوردی دەکات.

سەرچاوەکان:
١. مەعرووف خەزنەدار (٢٠٠٥). مێژووی ئەدەبی کوردی. هەولێر: ئاراس.
٢. جەمال نەبەز (٢٠٠٠). زاراوەسازیی کوردی. سلێمانی: سەردەم.
`;
    const fullCount = KurdishWordCounter.countWords(text);
    const bodyOnlyCount = KurdishWordCounter.countWords(text, { excludeBibliography: true });

    expect(fullCount).toBeGreaterThan(bodyOnlyCount);
    // Body has: ئەمە (1) دەقی (2) سەرەکیی (3) توێژینەوەکەیە (4) کە (5) باس (6) لە (7) زمانی (8) کوردی (9) دەکات (10)
    expect(bodyOnlyCount).toBe(10);
  });

  it('excludes markdown headings when excludeTitles is true', () => {
    const text = `
# بەشی یەکەم: پێشەکیی تێز

ئەم پەڕەگرافە تەنها دەقی ناوەڕۆکە کە پێنج وشەیە.
`;
    const withTitles = KurdishWordCounter.countWords(text);
    const withoutTitles = KurdishWordCounter.countWords(text, { excludeTitles: true });

    expect(withTitles).toBeGreaterThan(withoutTitles);
    expect(withoutTitles).toBe(8);
  });

  it('excludes citation keys when requested', () => {
    const text = 'ئەمە ڕاستییەکی زانستییە (ئەحمەد، ٢٠٢٠: ٤٥) کە لە توێژینەوەکەدا ساغکراوەتەوە [١].';
    const bodyOnly = KurdishWordCounter.countWords(text, { excludeCitationKeys: true });
    // Strips (ئەحمەد، ٢٠٢٠: ٤٥) and [١]
    expect(bodyOnly).toBe(7);
  });
});
