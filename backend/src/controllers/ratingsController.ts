import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendForbidden } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface RatingRow extends RowDataPacket {
  id: number
  score: number
  review: string
  event_id: number
  user_id: number
  created_at: Date
}

export async function getAllRatings(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT r.id, r.score, r.review, r.created_at,
            u.name AS user_name, e.title AS event_title
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     JOIN events e ON r.event_id = e.id
     ORDER BY r.created_at DESC`
  )
  sendSuccess(res, rows)
}

export async function getRatingById(req: Request, res: Response): Promise<void> {
  const rating = await queryOne<RatingRow>(
    `SELECT r.*, u.name AS user_name, e.title AS event_title
     FROM ratings r JOIN users u ON r.user_id = u.id JOIN events e ON r.event_id = e.id
     WHERE r.id = ?`,
    [req.params['id']]
  )
  if (!rating) { sendNotFound(res, 'Rating not found'); return }
  sendSuccess(res, rating)
}

export async function createRating(req: AuthRequest, res: Response): Promise<void> {
  const { event_id, score, review } = req.body as { event_id: number; score: number; review?: string }

  if (score < 1 || score > 5) { sendBadRequest(res, 'Score must be between 1 and 5'); return }

  const existing = await queryOne<RatingRow>(
    'SELECT id FROM ratings WHERE user_id = ? AND event_id = ?',
    [req.user!.id, event_id]
  )
  if (existing) { sendBadRequest(res, 'You already rated this event'); return }

  const attended = await queryOne<RowDataPacket>(
    "SELECT id FROM tickets WHERE user_id = ? AND event_id = ? AND status = 'confirmed'",
    [req.user!.id, event_id]
  )
  if (!attended) { sendBadRequest(res, 'You must have a confirmed ticket to rate this event'); return }

  const [result] = await execute(
    'INSERT INTO ratings (user_id, event_id, score, review) VALUES (?, ?, ?, ?)',
    [req.user!.id, event_id, score, review ?? null]
  )
  const rating = await queryOne<RatingRow>('SELECT * FROM ratings WHERE id = ?', [result.insertId])
  sendCreated(res, rating, 'Rating submitted')
}

export async function updateRating(req: AuthRequest, res: Response): Promise<void> {
  const rating = await queryOne<RatingRow>('SELECT id, user_id FROM ratings WHERE id = ?', [req.params['id']])
  if (!rating) { sendNotFound(res, 'Rating not found'); return }
  if (req.user!.role !== 'admin' && rating.user_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized'); return
  }

  const { score, review } = req.body as { score?: number; review?: string }
  if (score !== undefined && (score < 1 || score > 5)) {
    sendBadRequest(res, 'Score must be between 1 and 5'); return
  }

  await execute(
    'UPDATE ratings SET score = COALESCE(?, score), review = COALESCE(?, review), updated_at = NOW() WHERE id = ?',
    [score ?? null, review ?? null, rating.id]
  )
  sendSuccess(res, null, 'Rating updated')
}

export async function deleteRating(req: AuthRequest, res: Response): Promise<void> {
  const rating = await queryOne<RatingRow>('SELECT id, user_id FROM ratings WHERE id = ?', [req.params['id']])
  if (!rating) { sendNotFound(res, 'Rating not found'); return }
  if (req.user!.role !== 'admin' && rating.user_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized'); return
  }
  await execute('DELETE FROM ratings WHERE id = ?', [rating.id])
  sendSuccess(res, null, 'Rating deleted')
}
