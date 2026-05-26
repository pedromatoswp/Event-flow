import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, execute } from '../utils/db'
import { sendSuccess } from '../utils/response'

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [[users]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users')
  const [[events]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM events')
  const [[tickets]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total, COALESCE(SUM(total_price), 0) as revenue FROM tickets WHERE status = "confirmed"')
  const [[comments]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM comments')
  const [[ratings]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total, COALESCE(AVG(score), 0) as avg_score FROM ratings')

  const [recentEvents] = await query<RowDataPacket[]>(
    `SELECT e.id, e.title, e.date, e.status, u.name AS organizer,
            COUNT(t.id) AS tickets_sold
     FROM events e
     LEFT JOIN users u ON e.organizer_id = u.id
     LEFT JOIN tickets t ON t.event_id = e.id AND t.status = 'confirmed'
     GROUP BY e.id ORDER BY e.created_at DESC LIMIT 5`
  )

  const [recentUsers] = await query<RowDataPacket[]>(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
  )

  sendSuccess(res, {
    stats: {
      users: users!['total'],
      events: events!['total'],
      tickets: tickets!['total'],
      revenue: tickets!['revenue'],
      comments: comments!['total'],
      ratings: ratings!['total'],
      avg_rating: Number(ratings!['avg_score']).toFixed(1),
    },
    recent: { events: recentEvents, users: recentUsers },
  })
}

export async function getRevenueReport(_req: Request, res: Response): Promise<void> {
  const [monthly] = await query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(purchased_at, '%Y-%m') AS month,
            COUNT(*) AS ticket_count,
            SUM(total_price) AS revenue
     FROM tickets WHERE status = 'confirmed'
     GROUP BY month ORDER BY month DESC LIMIT 12`
  )
  sendSuccess(res, monthly)
}

export async function getEventStats(_req: Request, res: Response): Promise<void> {
  const [byStatus] = await query<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS count FROM events GROUP BY status`
  )
  const [byCategory] = await query<RowDataPacket[]>(
    `SELECT c.name AS category, COUNT(e.id) AS count
     FROM events e LEFT JOIN categories c ON e.category_id = c.id
     GROUP BY c.id ORDER BY count DESC`
  )
  sendSuccess(res, { by_status: byStatus, by_category: byCategory })
}

export async function banUser(req: Request, res: Response): Promise<void> {
  const { reason } = req.body as { reason?: string }
  await execute(
    "UPDATE users SET role = 'banned', ban_reason = ?, banned_at = NOW() WHERE id = ?",
    [reason ?? null, req.params['id']]
  )
  sendSuccess(res, null, 'User banned')
}

export async function unbanUser(req: Request, res: Response): Promise<void> {
  await execute(
    "UPDATE users SET role = 'user', ban_reason = NULL, banned_at = NULL WHERE id = ?",
    [req.params['id']]
  )
  sendSuccess(res, null, 'User unbanned')
}

export async function forceDeleteEvent(req: Request, res: Response): Promise<void> {
  await execute('DELETE FROM tickets WHERE event_id = ?', [req.params['id']])
  await execute('DELETE FROM comments WHERE event_id = ?', [req.params['id']])
  await execute('DELETE FROM ratings WHERE event_id = ?', [req.params['id']])
  await execute('DELETE FROM events WHERE id = ?', [req.params['id']])
  sendSuccess(res, null, 'Event and all related data deleted')
}
