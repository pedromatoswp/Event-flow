import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import type { RowDataPacket } from 'mysql2'
import { queryOne, execute } from '../utils/db'
import { signToken } from '../utils/jwt'
import { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface UserRow extends RowDataPacket {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'user' | 'admin'
  created_at: Date
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name: string; email: string; password: string }

  const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = ?', [email])
  if (existing) {
    sendBadRequest(res, 'Email already registered')
    return
  }

  const rounds = Number(process.env['BCRYPT_ROUNDS'] ?? 10)
  const password_hash = await bcrypt.hash(password, rounds)

  const [result] = await execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, 'user']
  )

  const token = signToken({ id: result.insertId, email, role: 'user' })
  sendCreated(res, { token, user: { id: result.insertId, name, email, role: 'user' } }, 'Registered successfully')
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string }

  const user = await queryOne<UserRow>(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
    [email]
  )

  if (!user) {
    sendUnauthorized(res, 'Invalid email or password')
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    sendUnauthorized(res, 'Invalid email or password')
    return
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  sendSuccess(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }, 'Login successful')
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await queryOne<UserRow>(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.user!.id]
  )
  if (!user) {
    sendUnauthorized(res, 'User not found')
    return
  }
  sendSuccess(res, user)
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
