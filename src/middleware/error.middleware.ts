import { Request, Response, NextFunction } from 'express';

export interface AppHttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  expose?: boolean;
}

/**
 * Global Error Handler Middleware
 * بەڕێوەبردنی یەکگرتووی هەڵەکانی سێرڤەر بە شێوازی ستاندارد
 */
export function errorMiddleware(
  err: AppHttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const message = err.message || 'هەڵەیەکی نەزانراو لە سێرڤەر ڕوویدا';
  const safeMessage = isClientError || err.expose ? message : 'هەڵەیەکی ناوخۆیی لە سێرڤەر ڕوویدا';

  console.error(`[Server Error] [${req.method} ${req.originalUrl || req.url}] status: ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
    code: err.code || (isClientError ? 'REQUEST_ERROR' : 'INTERNAL_ERROR'),
    timestamp: new Date().toISOString(),
  });
}
