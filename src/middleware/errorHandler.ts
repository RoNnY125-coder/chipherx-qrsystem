import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A database conflict occurred: duplicate record exists.",
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "The requested resource was not found.",
      });
      return;
    }
  }

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction ? "An internal server error occurred." : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
