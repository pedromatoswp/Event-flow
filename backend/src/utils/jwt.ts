import jwt from 'jsonwebtoken'
import type { AuthPayload } from '../types/index'

const secret = process.env['JWT_SECRET'] ?? 'fallback_secret'
const expiresIn = process.env['JWT_EXPIRES_IN'] ?? '7d'

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, secret) as AuthPayload
}
