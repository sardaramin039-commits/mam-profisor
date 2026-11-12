import { Router } from 'express';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export function createCodebasePdfRouter(): Router {
  const router = Router();
  const pdfPath = join(process.cwd(), 'public', 'mam-professor-codebase.pdf');
  const scriptPath = join(process.cwd(), 'scripts', 'generate_codebase_pdf.py');

  // Trigger regeneration of the codebase PDF with latest files
  router.post('/codebase-pdf/regenerate', async (req, res) => {
    try {
      await execAsync(`python3 ${scriptPath}`);
      const stats = existsSync(pdfPath) ? statSync(pdfPath) : null;
      res.json({
        success: true,
        sizeBytes: stats ? stats.size : 0,
        sizeMB: stats ? (stats.size / 1024 / 1024).toFixed(2) : '0',
        message: 'فایلی PDFـی کۆدەکان بە سەرکەوتوویی بە دوایین گۆڕانکارییەکان نوێکرایەوە.'
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'هەڵە ڕوویدا لە دروستکردنەوەی فایلی PDF'
      });
    }
  });

  // Download the codebase PDF directly with mobile-friendly attachment headers
  router.get('/codebase-pdf', async (req, res) => {
    try {
      if (!existsSync(pdfPath)) {
        await execAsync(`python3 ${scriptPath}`);
      }

      if (!existsSync(pdfPath)) {
        res.status(404).json({ error: 'فایلی PDF نەدۆزرایەوە.' });
        return;
      }

      const stats = statSync(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="mam-professor-codebase.pdf"');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const stream = createReadStream(pdfPath);
      stream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'هەڵە لە هەناردەکردنی فایلی PDF' });
    }
  });

  return router;
}
