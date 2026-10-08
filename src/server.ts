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
import { createResearchDecisionLedgerRouter } from './server/routes/research-decision-ledger.routes';
import { createResearchControlPlaneRouter } from './server/routes/research-control-plane.routes';
import { createResearchVersionHistoryRouter } from './server/routes/research-version-history.routes';
import { createManuscriptAssemblyRouter } from './server/routes/manuscript-assembly.routes';
import { createPublicationDefenseReadinessRouter } from './server/routes/publication-defense-readiness.routes';
import { createPublicationSubmissionRouter } from './server/routes/publication-submission.routes';
import { createPublicationSubmissionIntegrityRouter } from './server/routes/publication-submission-integrity.routes';
import { createPublicationSubmissionLifecycleRouter } from './server/routes/publication-submission-lifecycle.routes';
import { createPublicationSubmissionManifestRouter } from './server/routes/publication-submission-manifest.routes';
import { createPublicationSubmissionEditorialRouter } from './server/routes/publication-submission-editorial.routes';
import { createDefenseRehearsalRouter } from './server/routes/defense-rehearsal.routes';
import { createPlagiarismRouter } from './server/routes/plagiarism.routes';
import { getGeminiClient } from './server/services/gemini.service';
import { rateLimiterMiddleware, authenticatedRateLimiterMiddleware } from './server/middleware/rate-limiter.middleware';
import { securityHeadersMiddleware, promptSanitizerMiddleware } from './server/middleware/security.middleware';
import { requireAuth, optionalAuth } from './middleware/auth';
import { agentsRouter } from './routes/agents.router';
import { academicRouter as modularAcademicRouter } from './routes/academic.router';
import { libraryRouter as modularLibraryRouter } from './routes/library.router';
import { errorMiddleware } from './middleware/error.middleware';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// Only trust a reverse proxy when explicitly configured by the deployment.
// This prevents clients from spoofing proxy-derived values such as their IP.
app.set('trust proxy', process.env['TRUST_PROXY'] === 'true');
app.disable('x-powered-by');

// Security headers & strict CORS enforcement middleware
app.use(securityHeadersMiddleware);

// Academic requests can be larger than Express's default 100 KB, but keep a hard upper bound.
app.use(express.json({ limit: '5mb' }));

// Prompt injection protection middleware
app.use('/api', promptSanitizerMiddleware);

// Simple in-memory rate limiter middleware
app.use('/api', rateLimiterMiddleware);

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '*.run.app', '*.google.com']
});

// Mount API Routers (Public Docs vs Protected API Routes)
app.use('/api/docs', createApiDocsRouter());

// Enable optional authentication and rate limiting for scholarly AI tools and searches
app.use('/api', optionalAuth, authenticatedRateLimiterMiddleware);

// Public & Scholarly AI Tools
app.use('/api/ai-tools', createAiToolsRouter(getGeminiClient));
app.use('/api/library', createLibraryRouter(getGeminiClient));
app.use('/api/external-integrations', createExternalApiRouter());
app.use('/api', createAcademicRouter(getGeminiClient));
app.use('/api', createThesisWritingRouter(getGeminiClient));
app.use('/api', createResearchAnalysisRouter(getGeminiClient));
app.use('/api', createPlagiarismRouter(getGeminiClient));
app.use('/api', createEvaluationReviewRouter(getGeminiClient));
app.use('/api', createAcademicSearchIntegrationsRouter(getGeminiClient));
app.use('/api/chatgpt-sources', createChatGptAcademicSourcesRouter());
app.use('/api', createAdvancedAcademicToolsRouter(getGeminiClient));
app.use('/api/platform', createAcademicPlatformRouter(getGeminiClient));
app.use('/api/rag', createRagRouter(getGeminiClient));
app.use('/api/multi-agent', createMultiAgentRouter(getGeminiClient));

// Protected State & Workspace Persistence Endpoints (Strict Authentication Guard)
app.use('/api/workspace', requireAuth, createResearchProjectStateRouter(getGeminiClient));
app.use('/api/research-memory', requireAuth, createResearchMemoryRouter(getGeminiClient));
app.use('/api/research-decisions', requireAuth, createResearchDecisionLedgerRouter());
app.use('/api/research-control', requireAuth, createResearchControlPlaneRouter());
app.use('/api/research-versions', requireAuth, createResearchVersionHistoryRouter());
app.use('/api/manuscript', requireAuth, createManuscriptAssemblyRouter());
app.use('/api/publication-defense', requireAuth, createPublicationDefenseReadinessRouter());
app.use('/api/publication-submission', requireAuth, createPublicationSubmissionRouter());
app.use('/api/publication-submission-integrity', requireAuth, createPublicationSubmissionIntegrityRouter());
app.use('/api/publication-submission-lifecycle', requireAuth, createPublicationSubmissionLifecycleRouter());
app.use('/api/publication-submission-manifest', requireAuth, createPublicationSubmissionManifestRouter());
app.use('/api/publication-submission-editorial', requireAuth, createPublicationSubmissionEditorialRouter());
app.use('/api/defense-rehearsal', requireAuth, createDefenseRehearsalRouter());

// Modular Services & Routers (Agents, Scholarly Search, Digital Library Catalog)
app.use('/api/agents', agentsRouter);
app.use('/api/scholarly', modularAcademicRouter);
app.use('/api/library-catalog', modularLibraryRouter);

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
    .then((response) =>
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
