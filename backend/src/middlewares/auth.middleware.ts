import type { NextFunction, Request, Response } from "express";

import { HttpException } from "../utils/http-exception";
import { verifyAccessToken } from "../utils/jwt.util";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    throw new HttpException(401, "Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpException(401, "Invalid Authorization header format");
  }

  const payload = verifyAccessToken(token);
  req.auth = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    throw new HttpException(401, "Unauthorized");
  }

  if (req.auth.roleId !== 2) {
    throw new HttpException(403, "Forbidden: admin access required");
  }

  next();
}

