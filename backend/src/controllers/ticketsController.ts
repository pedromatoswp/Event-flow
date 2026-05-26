import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute, paginate } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendForbidden } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface TicketRow extends RowDataPacket {
  id: number
  user_id: number
  event_id: number
  quantity: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  purchased_at: Date
}

interface EventRow extends RowDataPacket {
  id: number
  title: string
  capacity: number
  price: number
  status: string
  tickets_sold: number
}

export async function getAllTickets(req: Request, res: Response): Promise<void> {
  const page = Number(req.query['page'] ?? 1)
  const limit = Number(req.query['limit'] ?? 20)
  const { offset } = paginate(page, limit)

  const [rows] = await query<RowDataPacket[]>(
    `SELECT t.id, t.quantity, t.total_price, t.status, t.purchased_at,
            u.name AS user_name, u.email AS user_email,
            e.title AS event_title, e.date AS event_date
     FROM tickets t
     JOIN users u ON t.user_id = u.id
     JOIN events e ON t.event_id = e.id
     ORDER BY t.purchased_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  const [[{ total }]] = await query<RowDataPacket[]>('SELECT COUNT(*) as total FROM tickets')
  sendSuccess(res, { data: rows, total, page, limit, totalPages: Math.ceil((total as number) / limit) })
}

export async function getTicketById(req: Request, res: Response): Promise<void> {
  const ticket = await queryOne<RowDataPacket>(
    `SELECT t.*, u.name AS user_name, e.title AS event_title, e.date AS event_date
     FROM tickets t JOIN users u ON t.user_id = u.id JOIN events e ON t.event_id = e.id
     WHERE t.id = ?`,
    [req.params['id']]
  )
  if (!ticket) { sendNotFound(res, 'Ticket not found'); return }
  sendSuccess(res, ticket)
}

export async function purchaseTicket(req: AuthRequest, res: Response): Promise<void> {
  const { event_id, quantity } = req.body as { event_id: number; quantity: number }

  const event = await queryOne<EventRow>(
    `SELECT e.id, e.title, e.capacity, e.price, e.status,
            (SELECT COALESCE(SUM(t.quantity), 0) FROM tickets t WHERE t.event_id = e.id AND t.status = 'confirmed') AS tickets_sold
     FROM events e WHERE e.id = ?`,
    [event_id]
  )

  if (!event) { sendNotFound(res, 'Event not found'); return }
  if (event.status !== 'published') { sendBadRequest(res, 'Event is not available for purchase'); return }

  const available = event.capacity - Number(event.tickets_sold)
  if (quantity > available) {
    sendBadRequest(res, `Only ${available} tickets available`); return
  }

  const total_price = event.price * quantity
  const [result] = await execute(
    'INSERT INTO tickets (user_id, event_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)',
    [req.user!.id, event_id, quantity, total_price, 'confirmed']
  )

  const ticket = await queryOne<TicketRow>(
    `SELECT t.*, e.title AS event_title, e.date AS event_date
     FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.id = ?`,
    [result.insertId]
  )
  sendCreated(res, ticket, 'Ticket purchased successfully')
}

export async function cancelTicket(req: AuthRequest, res: Response): Promise<void> {
  const ticket = await queryOne<TicketRow>('SELECT id, user_id, status FROM tickets WHERE id = ?', [req.params['id']])
  if (!ticket) { sendNotFound(res, 'Ticket not found'); return }
  if (req.user!.role !== 'admin' && ticket.user_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized'); return
  }
  if (ticket.status === 'cancelled') { sendBadRequest(res, 'Ticket already cancelled'); return }

  await execute("UPDATE tickets SET status = 'cancelled' WHERE id = ?", [ticket.id])
  sendSuccess(res, null, 'Ticket cancelled')
}

export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: 'pending' | 'confirmed' | 'cancelled' | 'refunded' }
  const [result] = await execute('UPDATE tickets SET status = ? WHERE id = ?', [status, req.params['id']])
  if (result.affectedRows === 0) { sendNotFound(res, 'Ticket not found'); return }
  sendSuccess(res, null, 'Ticket status updated')
}
