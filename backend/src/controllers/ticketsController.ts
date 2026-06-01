import crypto from 'crypto'
import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendForbidden } from '../utils/response'
import type { AuthRequest } from '../types/index'
import { mapTicketForFrontend } from '../mappers/ticket.mapper'

export async function getMyTickets(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT t.*, e.title AS event_title, e.description AS event_description,
            e.venue, e.start_datetime
     FROM tickets t
     INNER JOIN events e ON e.id = t.event_id
     WHERE t.owner_user_id = ?
     ORDER BY t.purchased_at DESC`,
    [req.user!.id]
  )
  sendSuccess(res, rows.map(mapTicketForFrontend))
}

export async function getAllTickets(_req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email,
            e.title AS event_title, e.start_datetime
     FROM tickets t
     INNER JOIN users u ON u.id = t.owner_user_id
     INNER JOIN events e ON e.id = t.event_id
     ORDER BY t.purchased_at DESC`
  )
  sendSuccess(res, rows.map(mapTicketForFrontend))
}

export async function getTicketById(req: AuthRequest, res: Response): Promise<void> {
  const ticket = await queryOne<RowDataPacket>(
    `SELECT t.*, e.title AS event_title, e.description AS event_description,
            e.venue, e.start_datetime
     FROM tickets t
     INNER JOIN events e ON e.id = t.event_id
     WHERE t.id = ?`,
    [req.params['id']]
  )
  if (!ticket) { sendNotFound(res, 'Ticket not found'); return }

  if (req.user!.role !== 'admin' && Number(ticket.owner_user_id) !== req.user!.id) {
    sendForbidden(res, 'Not authorized')
    return
  }

  sendSuccess(res, mapTicketForFrontend(ticket))
}

export async function purchaseTicket(req: AuthRequest, res: Response): Promise<void> {
  const body = req.body as { event_id?: number; eventId?: string | number; quantity?: number }
  const eventId = Number(body.event_id ?? body.eventId)
  const quantity = body.quantity ?? 1

  if (!eventId || quantity < 1 || quantity > 10) {
    sendBadRequest(res, 'Invalid purchase request')
    return
  }

  const event = await queryOne<RowDataPacket>(
    `SELECT id, capacity, event_status,
            (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status IN ('approved', 'pending')) AS sold
     FROM events e WHERE id = ?`,
    [eventId]
  )

  if (!event) { sendNotFound(res, 'Event not found'); return }
  if (event.event_status !== 'active') {
    sendBadRequest(res, 'Event is not available for purchase')
    return
  }

  const available = Number(event.capacity) - Number(event.sold)
  if (quantity > available) {
    sendBadRequest(res, `Only ${available} tickets available`)
    return
  }

  const created: ReturnType<typeof mapTicketForFrontend>[] = []

  for (let i = 0; i < quantity; i++) {
    const uuid = crypto.randomUUID()
    const [result] = await execute(
      `INSERT INTO tickets (event_id, owner_user_id, ticket_code, qr_code_value, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [eventId, req.user!.id, uuid, `EVFQR:${uuid}`]
    )

    const ticket = await queryOne<RowDataPacket>(
      `SELECT t.*, e.title AS event_title, e.description AS event_description,
              e.venue, e.start_datetime
       FROM tickets t
       INNER JOIN events e ON e.id = t.event_id
       WHERE t.id = ?`,
      [result.insertId]
    )
    if (ticket) created.push(mapTicketForFrontend(ticket))
  }

  sendCreated(res, quantity === 1 ? created[0] : created, 'Ticket purchased successfully')
}

export async function cancelTicket(req: AuthRequest, res: Response): Promise<void> {
  const ticket = await queryOne<RowDataPacket>(
    'SELECT id, owner_user_id, status FROM tickets WHERE id = ?',
    [req.params['id']]
  )
  if (!ticket) { sendNotFound(res, 'Ticket not found'); return }
  if (req.user!.role !== 'admin' && Number(ticket.owner_user_id) !== req.user!.id) {
    sendForbidden(res, 'Not authorized')
    return
  }
  if (ticket.status === 'canceled') {
    sendBadRequest(res, 'Ticket already cancelled')
    return
  }

  await execute(
    "UPDATE tickets SET status = 'canceled', canceled_at = NOW() WHERE id = ?",
    [ticket.id]
  )
  sendSuccess(res, null, 'Ticket cancelled')
}

export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: 'pending' | 'approved' | 'canceled' }
  const approvedAt = status === 'approved' ? new Date() : null
  const canceledAt = status === 'canceled' ? new Date() : null

  const [result] = await execute(
    `UPDATE tickets SET status = ?, approved_at = ?, canceled_at = ? WHERE id = ?`,
    [status, approvedAt, canceledAt, req.params['id']]
  )
  if (result.affectedRows === 0) { sendNotFound(res, 'Ticket not found'); return }
  sendSuccess(res, null, 'Ticket status updated')
}
