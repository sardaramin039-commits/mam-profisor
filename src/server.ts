import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { createLibraryRouter } from './server/library-routes';
import { createApiDocsRouter } from './server/api-docs';
import { createAiToolsRouter } from './server/ai-tools-routes';
import { createExternalApiRouter } from './server/routes/external-api-routes';
import { createAcademicRouter } from './server/routes/academic.routes';
import { createThesisWritingRouter } from './server/routes/thesis-writing.routes';
import { createResearchAnalysisRouter } from './server/routes/research-analysis.routes';
import { createEvaluationReviewRouter } from './server/routes/evaluation-review.routes';
import { createAcademicSearchIntegrationsRouter } from './server/routes/academic-search-integrations.routes';
import { createChatGptAcademicSourcesRouter } from './server/routes/academic-source-chatgpt.routes';
import { createAdvancedAcademicToolsRouter } from './server/routes/advanced-academic-tools.routes';
import { createAcademicPlatformRouter } from './server/routes/academic-platform.routes';
import { createRagRouter } from './server/routes/rag.routes';
import { createMultiAgentRouter } from './server/routes/multi-agent.routes';
import { createResearchMemoryRouter } from './server/routes/research-memory.routes';
import { createResearchProjectStateRouter } from './server/routes/research-project-state.routes';
import { getGeminiClient } from './server/services/gemini.service';
import {
  rateLimiterMiddleware,
  authenticatedRateLimiterMiddleware
} from './server/middleware/rate-limiter.middleware';
import {
  securityHeadersMiddleware,
  promptSanitizerMiddleware
} from './server/middleware/security.middleware';
import { requireAuth } from './middleware/auth';
import { agentsRouter } from './routes/agents.router';
import { academicRouter as modularAcademicRouter } from './routes/academic.router';
import { libraryRouter as modularLibraryRouter } from './routes/library.router';
import { errorMiddleware } from './middleware/error.middleware';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

// Trust only an explicitly configured number of reverse-proxy hops.
// This keeps req.ip useful behind a known proxy without trusting spoofed chains.
const trustProxyHops = Number.parseInt(process.env['TRUST_PROXY_HOPS'] || '0', 10);
app.set('trust proxy', Number.isInteger(trustProxyHops) && trustProxyHops > 0 ? trustProxyHops : false);
app.disable('x-powered-by');

app.use(securityHeadersMiddleware);

// The application is designed for chunked long-form work, not arbitrarily large
// single JSON requests. 5 MiB is enough for normal chapter/batch payloads while
// preventing an unlimited body-memory attack.
app.use(express.json({ limit: '5mb' }));

app.use('/api', promptSanitizerMiddleware);

app.use('/api', (req, _res, next) => {
  const keysEnv = process.env['GEMINI_API_KEY'];
  if (!keysEnv || keysEnv.trim() === '') {
    console.warn(
      '[GEMINI_API_KEY] Not set in environment. AI routes may fail until the server secret is configured.'
    );
  }
  next();
});

// Public documentation may be read without authentication, but still receives
// the IP limiter so it cannot be used to exhaust the Node process.
app.use('/api', rateLimiterMiddleware);

const angularApp = new AngularNodeAppEngine();

app.use('/api/docs', createApiDocsRouter());

// From this point onward every API endpoint is authenticated once, centrally.
// This prevents a newly-added /api router from accidentally becoming public.
app.use('/api', requireAuth);
app.use('/api', authenticatedRateLimiterMiddleware);

app.use('/api/ai-tools', createAiToolsRouter(getGeminiClient));
app.use('/api/library', createLibraryRouter(getGeminiClient));
app.use('/api/external-integrations', createExternalApiRouter());
app.use('/api', createAcademicRouter(getGeminiClient));
app.use('/api', createThesisWritingRouter(getGeminiClient));
app.use('/api', createResearchAnalysisRouter(getGeminiClient));
app.use('/api', createEvaluationReviewRouter(getGeminiClient));
app.use('/api', createAcademicSearchIntegrationsRouter(getGeminiClient));
app.use('/api/chatgpt-sources', createChatGptAcademicSourcesRouter());
app.use('/api', createAdvancedAcademicToolsRouter(getGeminiClient));
app.use('/api/platform', createAcademicPlatformRouter(getGeminiClient));
app.use('/api/rag', createRagRouter(getGeminiClient));
app.use('/api/multi-agent', createMultiAgentRouter(getGeminiClient));
app.use('/api/research-memory', createResearchMemoryRouter(getGeminiClient));
app.use('/api/workspace', createResearchProjectStateRouter(getGeminiClient));

// Modular Services & Routers (Agents, Scholarly Search, Digital Library Catalog)
app.use('/api/agents', agentsRouter);
app.use('/api/scholarly', modularAcademicRouter);
app.use('/api/library-catalog', modularLibraryRouter);

app.use('/api', errorMiddleware);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response: any) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export { app };
export default app;
