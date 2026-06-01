import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import type { RowDataPacket } from 'mysql2'
import { queryOne, execute } from '../utils/db'
import { signToken } from '../utils/jwt'
import { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface UserRow extends RowDataPacket {
  id: number
  full_name: string
  email: string
  password_hash: string
  role_id: number
  is_active: boolean
  created_at: Date
}

function roleFromId(roleId: number): 'user' | 'admin' {
  return roleId === 2 ? 'admin' : 'user'
}

function publicUser(user: { id: number; full_name: string; email: string; role_id: number; created_at?: Date }) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: roleFromId(user.role_id),
    createdAt: user.created_at?.toISOString?.() ?? new Date().toISOString(),
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name: string; email: string; password: string }
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = ?', [normalizedEmail])
  if (existing) {
    sendBadRequest(res, 'Email already registered')
    return
  }

  const rounds = Number(process.env['BCRYPT_ROUNDS'] ?? 10)
  const password_hash = await bcrypt.hash(password, rounds)

  const [result] = await execute(
    `INSERT INTO users (email, password_hash, full_name, role_id, is_active)
     VALUES (?, ?, ?, 1, TRUE)`,
    [normalizedEmail, password_hash, name]
  )

  const userId = result.insertId
  const token = signToken({ id: userId, email: normalizedEmail, role: 'user' })
  sendCreated(res, { token, user: { id: userId, name, email: normalizedEmail, role: 'user' } }, 'Registered successfully')
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string }
  const normalizedEmail = email.trim().toLowerCase()

  const user = await queryOne<UserRow>(
    `SELECT id, full_name, email, password_hash, role_id, is_active, created_at
     FROM users WHERE email = ? LIMIT 1`,
    [normalizedEmail]
  )

  if (!user || !user.is_active) {
    sendUnauthorized(res, 'Invalid email or password')
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    sendUnauthorized(res, 'Invalid email or password')
    return
  }

  const role = roleFromId(user.role_id)
  const token = signToken({ id: user.id, email: user.email, role })
  sendSuccess(res, { token, user: publicUser(user) }, 'Login successful')
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await queryOne<UserRow>(
    `SELECT id, full_name, email, role_id, created_at FROM users WHERE id = ?`,
    [req.user!.id]
  )
  if (!user) {
    sendUnauthorized(res, 'User not found')
    return
  }
  sendSuccess(res, publicUser(user))
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { current_password, new_password } = req.body as {
    current_password: string
    new_password: string
  }

  const user = await queryOne<UserRow>(
    'SELECT id, password_hash FROM users WHERE id = ?',
    [req.user!.id]
  )
  if (!user) { sendUnauthorized(res); return }

  const valid = await bcrypt.compare(current_password, user.password_hash)
  if (!valid) { sendBadRequest(res, 'Current password is incorrect'); return }

  const rounds = Number(process.env['BCRYPT_ROUNDS'] ?? 10)
  const new_hash = await bcrypt.hash(new_password, rounds)
  await execute('UPDATE users SET password_hash = ? WHERE id = ?', [new_hash, user.id])
  sendSuccess(res, null, 'Password updated successfully')
}
