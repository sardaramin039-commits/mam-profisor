import { fileURLToPath } from 'node:url';
import { processDocumentBatch } from './core/ingestionEngine';
import { config } from './config/env';

/**
 * Main entrance orchestration function for CLI or server batch processing.
 */
async function main() {
  console.log(`سیستەم لەسەر ژینگەی ${config.app.environment} دەستیپێکرد...`);

  const docsToProcess = [
    {
      id: '1',
      title: 'کتێبی یەکەم (مێژووی ئەدەبی کوردی)',
      content:
        'ئەمە دەقێکی نموونەیە بۆ تاقیکردنەوەی دروستکردنی ڤێکتەر و پاشەکەوتکردن لە فایەرستۆر بە زمانی کوردی.',
    },
  ];

  await processDocumentBatch(docsToProcess);
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  main().catch((error) => {
    console.error('CLI execution failed:', error);
    process.exitCode = 1;
  });
}

export { main };
