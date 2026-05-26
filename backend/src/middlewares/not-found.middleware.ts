import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response, next: NextFunction) {
  void req;
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found"
    }
  });
}

