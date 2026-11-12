import 'dotenv/config';
import express from 'express';
import { createGeminiEvolutionRouter } from './routes/gemini-evolution.routes';
import { geminiApiKeyCheckMiddleware } from './middleware/security.middleware';
import { apiConfigService } from './services/api-config.service';

const app = express();
const port = Number(process.env['MAM_API_PORT'] || 4301);

app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin) {
    try {
      const parsed = new URL(origin);
      const isLocalOrigin =
        parsed.protocol === 'http:' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
      if (isLocalOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
    } catch {
      res.status(400).json({ success: false, error: 'Origin header is invalid.' });
      return;
    }
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: '5mb' }));
app.get('/health', (_req, res) => {
  res.json({
    service: 'mam-profisor-local-gemini-api',
    ready: true,
    geminiConfigured: apiConfigService.getApiKeys().length > 0
  });
});
app.use('/api/gemini/write-subsection', geminiApiKeyCheckMiddleware);
app.use('/api/gemini/stream-subsection', geminiApiKeyCheckMiddleware);
app.use('/api/gemini', createGeminiEvolutionRouter());

app.listen(port, '127.0.0.1', () => {
  console.log(`[Local API] Gemini writing API listening on 127.0.0.1:${port}`);
});
