import { ChapterItemModel as ChapterItem } from '../domain/models';

/**
 * Calculates the target word count for a chapter based on its title and total word budget.
 */
export function calculateChapterTargetWords(
  chapter: ChapterItem,
  list: ChapterItem[],
  totalWords: number
): number {
  if (chapter.customTargetWords) return chapter.customTargetWords;

  const title = (chapter.title || '').toLowerCase();

  // 1. Dedication (پێشکەشە)
  if (title.includes('پێشکەشە') || title.includes('dedication')) {
    return 100;
  }

  // 2. Introduction (پێشەکی) - 12.5% of total
  if (title.includes('پێشەکی') || title.includes('introduction')) {
    return Math.max(800, Math.round(totalWords * 0.125));
  }

  // 3. Conclusion & Findings (ئەنجام)
  if (title.includes('ئەنجام') || title.includes('conclusion')) {
    return 450;
  }

  // 4. Recommendations (ڕاسپاردە)
  if (title.includes('ڕاسپاردە') || title.includes('recommendation')) {
    return 400;
  }

  // 5. Table of Contents (پێڕست)
  if (title.includes('پێڕست') || title.includes('contents')) {
    return 250;
  }

  // 6. References / Bibliography (سەرچاوە)
  if (title.includes('سەرچاوە') || title.includes('references') || title.includes('bibliography')) {
    return 500;
  }

  // For core main chapters, distribute the remaining words
  let specialWords = 0;
  let coreCount = 0;
  for (const c of list) {
    const cTitle = (c.title || '').toLowerCase();
    if (c.customTargetWords) {
      specialWords += c.customTargetWords;
    } else if (cTitle.includes('پێشکەشە') || cTitle.includes('dedication')) {
      specialWords += 100;
    } else if (cTitle.includes('پێشەکی') || cTitle.includes('introduction')) {
      specialWords += Math.max(800, Math.round(totalWords * 0.125));
    } else if (cTitle.includes('ئەنجام') || cTitle.includes('conclusion')) {
      specialWords += 450;
    } else if (cTitle.includes('ڕاسپاردە') || cTitle.includes('recommendation')) {
      specialWords += 400;
    } else if (cTitle.includes('پێڕست') || cTitle.includes('contents')) {
      specialWords += 250;
    } else if (cTitle.includes('سەرچاوە') || cTitle.includes('references') || cTitle.includes('bibliography')) {
      specialWords += 500;
    } else {
      coreCount++;
    }
  }

  const remainingWords = Math.max(1000, totalWords - specialWords);
  if (coreCount > 0) {
    return Math.round(remainingWords / coreCount);
  }

  return Math.round(totalWords / (list.length || 1));
}
