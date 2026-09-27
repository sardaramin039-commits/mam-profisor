import assert from 'node:assert/strict';
import { generateDynamicAcademicFallback } from '../src/fallback-generator.ts';

const result = generateDynamicAcademicFallback({
  chapterTitle: 'کاریگەریی میدیا لەسەر فێربوون',
  discipline: 'پەروەردە',
  academicLevel: 'ماستەر',
  targetWords: 3000,
  documentTitle: 'توێژینەوەی کاریگەری میدیا',
  currentChapterIndex: 1
});

assert.ok(result.content.includes('پێویستی بە بەڵگە'));
assert.ok(!result.content.includes('Verified Source Required'));
assert.ok(!result.content.includes('داتای مەیدانی کۆکراوەتەوە'));
assert.ok(!result.content.includes('توێژینەوەکانی پێشوو بە تایبەتی'));
assert.ok(!result.content.includes('getScholar'));
assert.ok(result.wordCount > 0);

console.log('P0 fallback safety test passed.');