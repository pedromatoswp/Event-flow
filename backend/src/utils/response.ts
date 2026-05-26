import type { Response } from 'express'
import type { ApiResponse } from '../types/index'

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void {
  const response: ApiResponse<T> = { success: true, message, data }
  res.status(statusCode).json(response)
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): void {
  const response: ApiResponse = { success: false, message, error }
  res.status(statusCode).json(response)
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201)
}

export function sendNotFound(res: Response, message = 'Resource not found'): void {
  sendError(res, message, 404)
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): void {
  sendError(res, message, 401)
}

export function sendForbidden(res: Response, message = 'Forbidden'): void {
  sendError(res, message, 403)
}

export function sendBadRequest(res: Response, message: string): void {
  sendError(res, message, 400)
}
