import type { Request, Response, NextFunction } from 'express'
import { sendBadRequest } from '../utils/response'

type ValidationRule = {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email'
  minLength?: number
  maxLength?: number
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body as Record<string, unknown>

    for (const rule of rules) {
      const value = body[rule.field]

      if (rule.required && (value === undefined || value === null || value === '')) {
        sendBadRequest(res, `Field '${rule.field}' is required`)
        return
      }

      if (value === undefined || value === null) continue

      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          sendBadRequest(res, `Field '${rule.field}' must be a valid email`)
          return
        }
      }

      if (rule.type === 'number' && isNaN(Number(value))) {
        sendBadRequest(res, `Field '${rule.field}' must be a number`)
        return
      }

      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          sendBadRequest(res, `Field '${rule.field}' must be at least ${rule.minLength} characters`)
          return
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          sendBadRequest(res, `Field '${rule.field}' must be at most ${rule.maxLength} characters`)
          return
        }
      }
    }

    next()
  }
}
