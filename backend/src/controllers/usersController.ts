import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute, paginate } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface UserRow extends RowDataPacket {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: Date
  updated_at: Date
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const page = Number(req.query['page'] ?? 1)
  const limit = Number(req.query['limit'] ?? 20)
  const { offset } = paginate(page, limit)

  const [rows] = await query<UserRow[]>(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  )
  const [[{ total }]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users')
  sendSuccess(res, { data: rows, total, page, limit, totalPages: Math.ceil((total as number) / limit) })
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await queryOne<UserRow>(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.params['id']]
  )
  if (!user) { sendNotFound(res, 'User not found'); return }
  sendSuccess(res, user)
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const targetId = Number(req.params['id'])
  const { name, email } = req.body as { name?: string; email?: string }

  if (req.user!.role !== 'admin' && req.user!.id !== targetId) {
    sendBadRequest(res, 'Cannot update another user'); return
  }

  if (email) {
    const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = ? AND id != ?', [email, targetId])
    if (existing) { sendBadRequest(res, 'Email already in use'); return }
  }

  await execute(
    'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), updated_at = NOW() WHERE id = ?',
    [name ?? null, email ?? null, targetId]
  )

  const updated = await queryOne<UserRow>(
    'SELECT id, name, email, role, updated_at FROM users WHERE id = ?',
    [targetId]
  )
  sendSuccess(res, updated, 'User updated')
}

export async function deleteUser(_req: Request, res: Response): Promise<void> {
  const [result] = await execute('DELETE FROM users WHERE id = ?', [_req.params['id']])
  if (result.affectedRows === 0) { sendNotFound(res, 'User not found'); return }
  sendSuccess(res, null, 'User deleted')
}

export async function getUserEvents(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT e.id, e.title, e.date, e.location, e.status, c.name AS category
     FROM events e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.organizer_id = ?
     ORDER BY e.date DESC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function getUserTickets(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT t.id, t.quantity, t.total_price, t.status, t.purchased_at,
            e.title AS event_title, e.date AS event_date, e.location
     FROM tickets t
     JOIN events e ON t.event_id = e.id
     WHERE t.user_id = ?
     ORDER BY t.purchased_at DESC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function createUserByAdmin(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body as {
    name: string; email: string; password: string; role: 'user' | 'admin'
  }
  const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = ?', [email])
  if (existing) { sendBadRequest(res, 'Email already registered'); return }

  const hash = await bcrypt.hash(password, Number(process.env['BCRYPT_ROUNDS'] ?? 10))
  const [result] = await execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, role ?? 'user']
  )
  sendCreated(res, { id: result.insertId, name, email, role: role ?? 'user' })
}
