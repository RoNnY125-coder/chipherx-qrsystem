import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Middleware factory to validate request body with a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: "Invalid request payload",
        errors: formattedErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory to validate request params with a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const formattedErrors = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: "Invalid route parameters",
        errors: formattedErrors,
      });
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}
