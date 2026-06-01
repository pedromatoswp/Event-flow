import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute, sqlLimitOffset } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface UserRow extends RowDataPacket {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: Date
  updated_at?: Date
}

const USER_SELECT = `
  SELECT id, full_name AS name, email,
    CASE WHEN role_id = 2 THEN 'admin' ELSE 'user' END AS role,
    is_active, created_at
  FROM users
`

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const page = Number(req.query['page'] ?? 1)
  const limit = Number(req.query['limit'] ?? 50)

  const [rows] = await query<UserRow[]>(
    `${USER_SELECT} ORDER BY created_at DESC ${sqlLimitOffset(page, limit)}`
  )
  sendSuccess(res, rows)
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await queryOne<UserRow>(`${USER_SELECT} WHERE id = ?`, [req.params['id']])
  if (!user) { sendNotFound(res, 'User not found'); return }
  sendSuccess(res, user)
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const targetId = Number(req.params['id'])
  const { name, email } = req.body as { name?: string; email?: string }

  if (req.user!.role !== 'admin' && req.user!.id !== targetId) {
    sendBadRequest(res, 'Cannot update another user')
    return
  }

  if (email) {
    const existing = await queryOne<RowDataPacket>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.trim().toLowerCase(), targetId]
    )
    if (existing) { sendBadRequest(res, 'Email already in use'); return }
  }

  await execute(
    'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), updated_at = NOW() WHERE id = ?',
    [name ?? null, email?.trim().toLowerCase() ?? null, targetId]
  )

  const updated = await queryOne<UserRow>(`${USER_SELECT} WHERE id = ?`, [targetId])
  sendSuccess(res, updated, 'User updated')
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const [result] = await execute('DELETE FROM users WHERE id = ?', [req.params['id']])
  if (result.affectedRows === 0) { sendNotFound(res, 'User not found'); return }
  sendSuccess(res, null, 'User deleted')
}

export async function getUserEvents(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT e.id, e.title, e.venue AS location, e.start_datetime AS date, e.event_status AS status
     FROM events e
     WHERE e.organizer_admin_user_id = ?
     ORDER BY e.start_datetime DESC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function getUserTickets(req: AuthRequest, res: Response): Promise<void> {
  const userId = Number(req.params['id'])
  if (req.user!.role !== 'admin' && req.user!.id !== userId) {
    sendBadRequest(res, 'Not authorized')
    return
  }

  const [rows] = await query<RowDataPacket[]>(
    `SELECT t.id, t.status, t.purchased_at, t.ticket_code, t.qr_code_value,
            e.title AS event_title, e.venue, e.start_datetime
     FROM tickets t
     INNER JOIN events e ON e.id = t.event_id
     WHERE t.owner_user_id = ?
     ORDER BY t.purchased_at DESC`,
    [userId]
  )
  sendSuccess(res, rows)
}

export async function createUserByAdmin(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body as {
    name: string
    email: string
    password: string
    role?: 'user' | 'admin'
  }
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await queryOne<RowDataPacket>('SELECT id FROM users WHERE email = ?', [normalizedEmail])
  if (existing) { sendBadRequest(res, 'Email already registered'); return }

  const hash = await bcrypt.hash(password, Number(process.env['BCRYPT_ROUNDS'] ?? 10))
  const roleId = role === 'admin' ? 2 : 1
  const [result] = await execute(
    'INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
    [normalizedEmail, hash, name, roleId]
  )
  sendCreated(res, {
    id: result.insertId,
    name,
    email: normalizedEmail,
    role: role ?? 'user',
  })
}
