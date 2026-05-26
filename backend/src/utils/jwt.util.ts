import { sign, verify } from "jsonwebtoken";

import { env } from "../config/env";
import type { JWTPayload } from "../types/auth";

export function signAccessToken(payload: JWTPayload): string {
  return sign(
    payload,
    env.jwt.accessSecret as unknown as string,
    { expiresIn: env.jwt.accessExpiresIn as unknown as string } as unknown as object
  );
}

export function verifyAccessToken(token: string): JWTPayload {
  return verify(token, env.jwt.accessSecret as unknown as string) as JWTPayload;
}

