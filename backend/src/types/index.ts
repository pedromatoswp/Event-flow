import type { Request } from 'express'

export interface AuthPayload {
  id: number
  email: string
  role: 'user' | 'admin'
}

export interface AuthRequest extends Request {
  user?: AuthPayload
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PaginationQuery {
  page?: string
  limit?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
