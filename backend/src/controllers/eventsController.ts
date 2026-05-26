import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute, paginate } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendForbidden } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface EventRow extends RowDataPacket {
  id: number
  title: string
  description: string
  date: Date
  end_date: Date
  location: string
  capacity: number
  price: number
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  category_id: number
  organizer_id: number
  created_at: Date
}

const EVENT_SELECT = `
  SELECT e.id, e.title, e.description, e.date, e.end_date, e.location,
         e.capacity, e.price, e.status, e.created_at,
         c.name AS category, c.id AS category_id,
         u.name AS organizer, u.id AS organizer_id,
         (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status = 'confirmed') AS tickets_sold
  FROM events e
  LEFT JOIN categories c ON e.category_id = c.id
  LEFT JOIN users u ON e.organizer_id = u.id
`

export async function getAllEvents(req: Request, res: Response): Promise<void> {
  const page = Number(req.query['page'] ?? 1)
  const limit = Number(req.query['limit'] ?? 20)
  const { offset } = paginate(page, limit)
  const { category, status, search } = req.query as Record<string, string | undefined>

  let sql = EVENT_SELECT + ' WHERE 1=1'
  const params: unknown[] = []

  if (category) { sql += ' AND c.id = ?'; params.push(category) }
  if (status) { sql += ' AND e.status = ?'; params.push(status) }
  if (search) { sql += ' AND (e.title LIKE ? OR e.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

  sql += ' ORDER BY e.date ASC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const [rows] = await query<EventRow[]>(sql, params)
  const [[{ total }]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM events WHERE 1=1')
  sendSuccess(res, { data: rows, total, page, limit, totalPages: Math.ceil((total as number) / limit) })
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const [rows] = await query<EventRow[]>(EVENT_SELECT + ' WHERE e.id = ?', [req.params['id']])
  if (!rows[0]) { sendNotFound(res, 'Event not found'); return }
  sendSuccess(res, rows[0])
}

export async function createEvent(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, date, end_date, location, capacity, price, category_id, status } =
    req.body as {
      title: string; description: string; date: string; end_date?: string
      location: string; capacity: number; price: number; category_id: number
      status?: 'draft' | 'published'
    }

  const [result] = await execute(
    `INSERT INTO events (title, description, date, end_date, location, capacity, price, category_id, organizer_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, date, end_date ?? null, location, capacity, price, category_id, req.user!.id, status ?? 'draft']
  )
  const event = await queryOne<EventRow>(EVENT_SELECT + ' WHERE e.id = ?', [result.insertId])
  sendCreated(res, event, 'Event created')
}

export async function updateEvent(req: AuthRequest, res: Response): Promise<void> {
  const event = await queryOne<EventRow>('SELECT id, organizer_id FROM events WHERE id = ?', [req.params['id']])
  if (!event) { sendNotFound(res, 'Event not found'); return }
  if (req.user!.role !== 'admin' && event.organizer_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized to edit this event'); return
  }

  const { title, description, date, end_date, location, capacity, price, category_id, status } =
    req.body as Partial<{
      title: string; description: string; date: string; end_date: string
      location: string; capacity: number; price: number; category_id: number
      status: 'draft' | 'published' | 'cancelled' | 'completed'
    }>

  await execute(
    `UPDATE events SET
      title = COALESCE(?, title), description = COALESCE(?, description),
      date = COALESCE(?, date), end_date = COALESCE(?, end_date),
      location = COALESCE(?, location), capacity = COALESCE(?, capacity),
      price = COALESCE(?, price), category_id = COALESCE(?, category_id),
      status = COALESCE(?, status), updated_at = NOW()
     WHERE id = ?`,
    [title ?? null, description ?? null, date ?? null, end_date ?? null,
     location ?? null, capacity ?? null, price ?? null, category_id ?? null,
     status ?? null, event.id]
  )

  const updated = await queryOne<EventRow>(EVENT_SELECT + ' WHERE e.id = ?', [event.id])
  sendSuccess(res, updated, 'Event updated')
}

export async function deleteEvent(req: AuthRequest, res: Response): Promise<void> {
  const event = await queryOne<EventRow>('SELECT id, organizer_id FROM events WHERE id = ?', [req.params['id']])
  if (!event) { sendNotFound(res, 'Event not found'); return }
  if (req.user!.role !== 'admin' && event.organizer_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized to delete this event'); return
  }
  await execute('DELETE FROM events WHERE id = ?', [event.id])
  sendSuccess(res, null, 'Event deleted')
}

export async function getEventComments(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT c.id, c.content, c.created_at, u.name AS user_name, u.id AS user_id
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.event_id = ? ORDER BY c.created_at DESC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function getEventRatings(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT r.id, r.score, r.review, r.created_at, u.name AS user_name
     FROM ratings r JOIN users u ON r.user_id = u.id
     WHERE r.event_id = ? ORDER BY r.created_at DESC`,
    [req.params['id']]
  )
  const [[avg]] = await query<RowDataPacket[]>(
    'SELECT AVG(score) as average, COUNT(*) as total FROM ratings WHERE event_id = ?',
    [req.params['id']]
  )
  sendSuccess(res, { ratings: rows, average: avg['average'], total: avg['total'] })
}
