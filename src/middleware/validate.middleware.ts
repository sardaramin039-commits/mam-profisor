import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validateRequest = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as { issues?: { path?: (string | number)[]; message?: string }[] }).issues || [];
        res.status(400).json({
          success: false,
          error: 'داتای داخڵکراو ڕاست نییە (Validation Failed)',
          details: issues.map((e) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : '',
            message: e.message || 'Validation error',
          })),
        });
        return;
      }
      next(error);
    }
  };
};
