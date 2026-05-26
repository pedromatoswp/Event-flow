import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../types/index'
import { verifyToken } from '../utils/jwt'
import { sendUnauthorized, sendForbidden } from '../utils/response'

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'No token provided')
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    sendUnauthorized(res, 'Malformed token')
    return
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    sendUnauthorized(res, 'Invalid or expired token')
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendUnauthorized(res)
    return
  }
  if (req.user.role !== 'admin') {
    sendForbidden(res, 'Admin access required')
    return
  }
  next()
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token) {
      try {
        req.user = verifyToken(token)
      } catch {
        // silently ignore invalid optional token
      }
    }
  }
  next()
}
