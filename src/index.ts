import { processDocumentBatch } from './core/ingestionEngine';
import { config } from './config/env';

/**
 * Main entrance orchestration function for CLI or server batch processing.
 */
async function main() {
  console.log(`سیستەم لەسەر ژینگەی ${config.app.environment} دەستیپێکرد...`);
  
  const docsToProcess = [
    {
      id: "1",
      title: "کتێبی یەکەم (مێژووی ئەدەبی کوردی)",
      content: "ئەمە دەقێکی نموونەیە بۆ تاقیکردنەوەی دروستکردنی ڤێکتەر و پاشەکەوتکردن لە فایەرستۆر بە زمانی کوردی."
    }
  ];

  await processDocumentBatch(docsToProcess);
}

// Only execute immediately if run directly under Node
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

export { main };
