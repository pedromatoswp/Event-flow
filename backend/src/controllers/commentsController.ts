import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute, paginate } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendForbidden } from '../utils/response'
import type { AuthRequest } from '../types/index'

interface CommentRow extends RowDataPacket {
  id: number
  content: string
  event_id: number
  user_id: number
  created_at: Date
}

export async function getAllComments(req: Request, res: Response): Promise<void> {
  const page = Number(req.query['page'] ?? 1)
  const limit = Number(req.query['limit'] ?? 20)
  const { offset } = paginate(page, limit)

  const [rows] = await query<RowDataPacket[]>(
    `SELECT c.id, c.content, c.created_at,
            u.name AS user_name, e.title AS event_title
     FROM comments c
     JOIN users u ON c.user_id = u.id
     JOIN events e ON c.event_id = e.id
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  sendSuccess(res, rows)
}

export async function getCommentById(req: Request, res: Response): Promise<void> {
  const comment = await queryOne<CommentRow>(
    `SELECT c.*, u.name AS user_name, e.title AS event_title
     FROM comments c JOIN users u ON c.user_id = u.id JOIN events e ON c.event_id = e.id
     WHERE c.id = ?`,
    [req.params['id']]
  )
  if (!comment) { sendNotFound(res, 'Comment not found'); return }
  sendSuccess(res, comment)
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const { event_id, content } = req.body as { event_id: number; content: string }

  const [result] = await execute(
    'INSERT INTO comments (user_id, event_id, content) VALUES (?, ?, ?)',
    [req.user!.id, event_id, content]
  )
  const comment = await queryOne<CommentRow>(
    `SELECT c.*, u.name AS user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
    [result.insertId]
  )
  sendCreated(res, comment, 'Comment posted')
}

export async function updateComment(req: AuthRequest, res: Response): Promise<void> {
  const comment = await queryOne<CommentRow>('SELECT id, user_id FROM comments WHERE id = ?', [req.params['id']])
  if (!comment) { sendNotFound(res, 'Comment not found'); return }
  if (req.user!.role !== 'admin' && comment.user_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized'); return
  }

  const { content } = req.body as { content: string }
  await execute('UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?', [content, comment.id])
  sendSuccess(res, null, 'Comment updated')
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const comment = await queryOne<CommentRow>('SELECT id, user_id FROM comments WHERE id = ?', [req.params['id']])
  if (!comment) { sendNotFound(res, 'Comment not found'); return }
  if (req.user!.role !== 'admin' && comment.user_id !== req.user!.id) {
    sendForbidden(res, 'Not authorized'); return
  }
  await execute('DELETE FROM comments WHERE id = ?', [comment.id])
  sendSuccess(res, null, 'Comment deleted')
}
