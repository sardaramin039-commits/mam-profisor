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
import { rateLimiterMiddleware } from './server/middleware/rate-limiter.middleware';
import { securityHeadersMiddleware, promptSanitizerMiddleware } from './server/middleware/security.middleware';
import { requireAuth } from './middleware/auth';
import { agentsRouter } from './routes/agents.router';
import { academicRouter as modularAcademicRouter } from './routes/academic.router';
import { libraryRouter as modularLibraryRouter } from './routes/library.router';
import { errorMiddleware } from './middleware/error.middleware';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const trustProxyHops = Number.parseInt(process.env['TRUST_PROXY_HOPS'] || '1', 10);
app.set('trust proxy', Number.isFinite(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);
app.disable('x-powered-by');

// Security headers & strict CORS enforcement middleware
app.use(securityHeadersMiddleware);

app.use(express.json({ limit: '8mb', strict: true }));

// Prompt injection protection middleware
app.use('/api', promptSanitizerMiddleware);

// Pre-request check for GEMINI_API_KEY
app.use('/api', (req, res, next) => {
  const keysEnv = process.env['GEMINI_API_KEY'];
  if (!keysEnv || keysEnv.trim() === '') {
    console.warn('[GEMINI_API_KEY] Not set in environment. Dynamic academic fallbacks will be used for AI routes.');
  }
  next();
});

// Simple In-Memory Rate Limiter middleware
app.use('/api', rateLimiterMiddleware);

const angularApp = new AngularNodeAppEngine();

// Mount API Routers (Public Docs vs Protected API Routes)
app.use('/api/docs', createApiDocsRouter());

// Unified security middleware enforcing requireAuth for protected API endpoints & AI tools
app.use('/api/ai-tools', requireAuth, createAiToolsRouter(getGeminiClient));
app.use('/api/library', requireAuth, createLibraryRouter(getGeminiClient));
app.use('/api/external-integrations', requireAuth, createExternalApiRouter());
app.use('/api', requireAuth, createAcademicRouter(getGeminiClient));
app.use('/api', requireAuth, createThesisWritingRouter(getGeminiClient));
app.use('/api', requireAuth, createResearchAnalysisRouter(getGeminiClient));
app.use('/api', requireAuth, createEvaluationReviewRouter(getGeminiClient));
app.use('/api', requireAuth, createAcademicSearchIntegrationsRouter(getGeminiClient));
app.use('/api/chatgpt-sources', requireAuth, createChatGptAcademicSourcesRouter());
app.use('/api', requireAuth, createAdvancedAcademicToolsRouter(getGeminiClient));
app.use('/api/platform', requireAuth, createAcademicPlatformRouter(getGeminiClient));
app.use('/api/rag', requireAuth, createRagRouter(getGeminiClient));
app.use('/api/multi-agent', requireAuth, createMultiAgentRouter(getGeminiClient));
app.use('/api/research-memory', requireAuth, createResearchMemoryRouter(getGeminiClient));
app.use('/api/workspace', requireAuth, createResearchProjectStateRouter(getGeminiClient));

// Modular Services & Routers (Agents, Scholarly Search, Digital Library Catalog)
app.use('/api/agents', requireAuth, agentsRouter);
app.use('/api/scholarly', requireAuth, modularAcademicRouter);
app.use('/api/library-catalog', requireAuth, modularLibraryRouter);

// Global Error Handler Middleware for API routes
app.use('/api', errorMiddleware);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response: any) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI or Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
export default app;
