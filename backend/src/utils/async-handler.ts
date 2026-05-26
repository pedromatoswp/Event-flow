import type { NextFunction, Request, Response } from "express";

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return function (req: Request, res: Response, next: NextFunction) {
    void handler(req, res, next).catch(next);
  };
}

