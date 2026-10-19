import { crawlerEngine } from '../../services/crawler-engine';

/**
 * Builds the Digital Library Context Prompt by sampling indexed books and top library sources.
 */
export function getDigitalLibraryContextPrompt(queryOrKeywords?: string): string {
  try {
    const sources = crawlerEngine.getSources();
    const catalog = crawlerEngine.getCatalog();
    
    const topSources = sources.slice(0, 20).map((s: any) => `- ${s.nameKurdish} (${s.name}): ${s.url} [ئەرشیڤی ${s.category}]`).join('\n');

    let matchedBooks = catalog;
    if (queryOrKeywords && queryOrKeywords.trim()) {
      const q = queryOrKeywords.toLowerCase();
      const filtered = catalog.filter((b: any) => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q) || 
        b.subjects.some((sub: any) => String(sub).toLowerCase().includes(q))
      );
      if (filtered.length > 0) {
        matchedBooks = filtered;
      }
    }

    const catalogSample = matchedBooks.slice(0, 15).map((b: any) => 
      `- کتێب: "${b.title}" | نووسەر: "${b.author}" | ساڵ: ${b.year} | جۆر/بابەت: ${Array.isArray(b.subjects) ? b.subjects.join(', ') : b.subjects} | ئەرشیڤ/کتێبخانە: ${b.sourceName} (${b.sourceUrl})`
    ).join('\n');

    return `\n🏛️ **یاسای نەگۆڕی سەرچاوەکانی ٤٠ کتێبخانە دیجیتاڵییەکە (40 Digital Libraries Priority & Anti-Hallucination Protocol)**:
تۆ دەبێت بۆ هەموو ئاماژەدان، سەرچاوە و بەیبلۆگرافیایەک سەرەتا لە ناو بەڵگەنامە و کتێبەکانی ئەم ٤٠ کتێبخانە دیجیتاڵییەی خوارەوەدا بگەڕێیت.
بە هیچ شێوەیەک نابی سەرچاوەی هەڵبەستراو یان خەیاڵی (Hallucinated Source) بنووسیت یان دابهێنیت!

📚 بڕگەیەک لە تۆمارە سەرەتاییەکانی کەتەلۆگ (پشکنینی سەرچاوە پێویستە):
${catalogSample}

🏢 نموونەی ئەرشیڤ و کتێبخانە دیجیتاڵییە چەسپاوەکانی ناو ئەپڵیکەیشن (لە کۆی ٤٠ کتێبخانە):
${topSources}\n`;
  } catch (err) {
    console.warn('Error fetching digital library context prompt:', err);
    return '\n⚠️ تکایە تەنها سەرچاوەی ئەکادیمی ڕاستەقینە لە ٤٠ کتێبخانە دیجیتاڵییەکەوە بەکاربهێنە و لە خۆتەوە سەرچاوەی ناڕاست دروست مەکە.\n';
  }
}
