import type { NextFunction, Request, Response } from "express";

import { HttpException } from "../utils/http-exception";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const httpError =
    err instanceof HttpException
      ? err
      : new HttpException(500, "Internal server error");

  // Avoid leaking sensitive details in production responses.
  const message =
    process.env.NODE_ENV === "production" ? httpError.message : httpError.message;

  res.status(httpError.statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "production"
        ? {}
        : httpError.details
          ? { details: httpError.details }
          : {})
    }
  });
}

