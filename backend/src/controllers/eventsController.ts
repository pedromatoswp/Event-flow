import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendBadRequest } from '../utils/response'
import type { AuthRequest } from '../types/index'
import { mapEventForFrontend } from '../mappers/event.mapper'

async function getFavoriteEventIds(userId: number): Promise<Set<number>> {
  const [rows] = await query<RowDataPacket[]>(
    'SELECT event_id FROM favorites WHERE user_id = ?',
    [userId]
  )
  return new Set(rows.map((r) => Number(r.event_id)))
}

function mapEventsWithFavorites(rows: RowDataPacket[], favoriteIds: Set<number>) {
  return rows.map((row) =>
    mapEventForFrontend(row, favoriteIds.has(Number(row.id)))
  )
}

const EVENT_BASE = `
  SELECT
    e.id, e.title, e.description, e.venue, e.start_datetime, e.end_datetime,
    e.capacity, e.event_status, e.organizer_admin_user_id, e.created_at,
    GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR '||') AS categories,
    (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status IN ('approved', 'pending')) AS tickets_sold
  FROM events e
  LEFT JOIN event_categories ec ON ec.event_id = e.id
  LEFT JOIN categories c ON c.id = ec.category_id
`

export async function getAllEvents(req: AuthRequest, res: Response): Promise<void> {
  const { category, status, search } = req.query as Record<string, string | undefined>
  let sql = `${EVENT_BASE} WHERE 1=1`
  const params: unknown[] = []

  if (category) {
    sql += ' AND ec.category_id = ?'
    params.push(category)
  }
  if (status === 'all' && req.user?.role === 'admin') {
    // Admin list: show all statuses
  } else if (status) {
    sql += ' AND e.event_status = ?'
    params.push(status === 'published' ? 'active' : status)
  } else {
    sql += " AND e.event_status = 'active'"
  }
  if (search) {
    sql += ' AND (e.title LIKE ? OR e.description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  sql += ' GROUP BY e.id ORDER BY e.start_datetime ASC'

  const [rows] = await query<RowDataPacket[]>(sql, params)
  const favoriteIds = req.user ? await getFavoriteEventIds(req.user.id) : new Set<number>()
  sendSuccess(res, mapEventsWithFavorites(rows, favoriteIds))
}

export async function getEventById(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `${EVENT_BASE} WHERE e.id = ? GROUP BY e.id LIMIT 1`,
    [req.params['id']]
  )
  if (!rows[0]) { sendNotFound(res, 'Event not found'); return }
  const favoriteIds = req.user ? await getFavoriteEventIds(req.user.id) : new Set<number>()
  sendSuccess(res, mapEventForFrontend(rows[0], favoriteIds.has(Number(rows[0].id))))
}

export async function getFavoriteEvents(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `${EVENT_BASE}
     INNER JOIN favorites f ON f.event_id = e.id AND f.user_id = ?
     WHERE e.event_status = 'active'
     GROUP BY e.id
     ORDER BY MAX(f.created_at) DESC`,
    [req.user!.id]
  )
  sendSuccess(res, rows.map((row) => mapEventForFrontend(row, true)))
}

export async function toggleFavorite(req: AuthRequest, res: Response): Promise<void> {
  const eventId = Number(req.params['id'])
  if (!eventId) {
    sendBadRequest(res, 'Invalid event id')
    return
  }

  const event = await queryOne<RowDataPacket>('SELECT id FROM events WHERE id = ?', [eventId])
  if (!event) {
    sendNotFound(res, 'Event not found')
    return
  }

  const existing = await queryOne<RowDataPacket>(
    'SELECT event_id FROM favorites WHERE user_id = ? AND event_id = ?',
    [req.user!.id, eventId]
  )

  if (existing) {
    await execute('DELETE FROM favorites WHERE user_id = ? AND event_id = ?', [
      req.user!.id,
      eventId,
    ])
  } else {
    await execute('INSERT INTO favorites (user_id, event_id) VALUES (?, ?)', [
      req.user!.id,
      eventId,
    ])
  }

  const [rows] = await query<RowDataPacket[]>(
    `${EVENT_BASE} WHERE e.id = ? GROUP BY e.id LIMIT 1`,
    [eventId]
  )
  if (!rows[0]) {
    sendNotFound(res, 'Event not found')
    return
  }

  sendSuccess(
    res,
    mapEventForFrontend(rows[0], !existing),
    existing ? 'Removed from favorites' : 'Added to favorites'
  )
}

export async function createEvent(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'admin') {
    sendForbidden(res, 'Admin access required')
    return
  }

  const body = req.body as {
    title: string
    description: string
    date: string
    time?: string
    location: string
    capacity: number
    category_id?: number | string
  }

  const categoryId = Number(body.category_id)
  if (!categoryId || Number.isNaN(categoryId)) {
    sendBadRequest(res, 'A valid category_id is required')
    return
  }

  const category = await queryOne<RowDataPacket>(
    'SELECT id FROM categories WHERE id = ?',
    [categoryId]
  )
  if (!category) {
    sendBadRequest(res, 'Category not found. Run database seed or refresh categories.')
    return
  }

  const { title, description, date, time, location, capacity } = body
  const startDatetime = `${date} ${time ?? '09:00'}:00`
  const adminRow = await queryOne<RowDataPacket>(
    'SELECT user_id FROM administrators WHERE user_id = ?',
    [req.user!.id]
  )
  const organizerId = adminRow ? req.user!.id : null

  const [result] = await execute(
    `INSERT INTO events (title, description, venue, start_datetime, capacity, event_status, organizer_admin_user_id)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    [title, description ?? '', location, startDatetime, capacity, organizerId]
  )

  await execute(
    'INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)',
    [result.insertId, categoryId]
  )

  const [rows] = await query<RowDataPacket[]>(
    `${EVENT_BASE} WHERE e.id = ? GROUP BY e.id`,
    [result.insertId]
  )
  sendCreated(res, mapEventForFrontend(rows[0]!), 'Event created')
}

export async function updateEvent(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'admin') {
    sendForbidden(res, 'Admin access required')
    return
  }

  const eventId = req.params['id']
  const exists = await queryOne<RowDataPacket>('SELECT id FROM events WHERE id = ?', [eventId])
  if (!exists) { sendNotFound(res, 'Event not found'); return }

  const { title, description, location, capacity, status } = req.body as Partial<{
    title: string
    description: string
    location: string
    capacity: number
    status: string
  }>

  await execute(
    `UPDATE events SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      venue = COALESCE(?, venue),
      capacity = COALESCE(?, capacity),
      event_status = COALESCE(?, event_status)
     WHERE id = ?`,
    [title ?? null, description ?? null, location ?? null, capacity ?? null, status ?? null, eventId]
  )

  const [rows] = await query<RowDataPacket[]>(`${EVENT_BASE} WHERE e.id = ? GROUP BY e.id`, [eventId])
  sendSuccess(res, mapEventForFrontend(rows[0]!), 'Event updated')
}

export async function deleteEvent(req: AuthRequest, res: Response): Promise<void> {
  if (req.user!.role !== 'admin') {
    sendForbidden(res, 'Admin access required')
    return
  }

  const [result] = await execute('DELETE FROM events WHERE id = ?', [req.params['id']])
  if (result.affectedRows === 0) { sendNotFound(res, 'Event not found'); return }
  sendSuccess(res, null, 'Event deleted')
}

export async function getEventComments(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT c.id, c.content, c.created_at, u.full_name AS user_name, u.id AS user_id
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.event_id = ? ORDER BY c.created_at DESC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function getEventRatings(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT r.id, r.score, r.created_at, u.full_name AS user_name
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
