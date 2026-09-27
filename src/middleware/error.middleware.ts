import { Request, Response, NextFunction } from 'express';

export interface AppHttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export function errorMiddleware(
  err: AppHttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const rawStatus = err.status || err.statusCode || 500;
  const statusCode = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus < 600
    ? rawStatus
    : 500;

  const isProduction = process.env['NODE_ENV'] === 'production';
  const isServerError = statusCode >= 500;

  const publicMessage =
    isProduction && isServerError
      ? 'هەڵەیەکی ناوخۆی سێرڤەر ڕوویدا. تکایە دواتر دووبارە هەوڵ بدەرەوە.'
      : (err.message || 'هەڵەیەکی نەزانراو لە سێرڤەر ڕوویدا');

  console.error(
    `[Server Error] [${req.method} ${req.originalUrl || req.url}] status: ${statusCode}:`,
    err
  );

  res.status(statusCode).json({
    success: false,
    error: publicMessage,
    code: isProduction && isServerError ? 'INTERNAL_ERROR' : (err.code || 'INTERNAL_ERROR'),
    timestamp: new Date().toISOString(),
  });
}
