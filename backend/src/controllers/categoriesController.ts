import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response'

interface CategoryRow extends RowDataPacket {
  id: number
  name: string
  description: string
  created_at: Date
}

export async function getAllCategories(_req: Request, res: Response): Promise<void> {
  const [rows] = await query<CategoryRow[]>(
    `SELECT c.id, c.name, c.description,
            COUNT(e.id) AS event_count
     FROM categories c
     LEFT JOIN events e ON e.category_id = c.id
     GROUP BY c.id ORDER BY c.name ASC`
  )
  sendSuccess(res, rows)
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  const category = await queryOne<CategoryRow>('SELECT * FROM categories WHERE id = ?', [req.params['id']])
  if (!category) { sendNotFound(res, 'Category not found'); return }
  sendSuccess(res, category)
}

export async function getCategoryEvents(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT e.id, e.title, e.date, e.location, e.price, e.status,
            u.name AS organizer
     FROM events e JOIN users u ON e.organizer_id = u.id
     WHERE e.category_id = ? AND e.status = 'published'
     ORDER BY e.date ASC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body as { name: string; description?: string }

  const existing = await queryOne<CategoryRow>('SELECT id FROM categories WHERE name = ?', [name])
  if (existing) { sendBadRequest(res, 'Category already exists'); return }

  const [result] = await execute(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description ?? null]
  )
  sendCreated(res, { id: result.insertId, name, description })
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body as { name?: string; description?: string }
  const [result] = await execute(
    'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
    [name ?? null, description ?? null, req.params['id']]
  )
  if (result.affectedRows === 0) { sendNotFound(res, 'Category not found'); return }
  const updated = await queryOne<CategoryRow>('SELECT * FROM categories WHERE id = ?', [req.params['id']])
  sendSuccess(res, updated, 'Category updated')
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const [events] = await query<RowDataPacket[]>('SELECT id FROM events WHERE category_id = ? LIMIT 1', [req.params['id']])
  if (events.length > 0) {
    sendBadRequest(res, 'Cannot delete category with existing events'); return
  }
  const [result] = await execute('DELETE FROM categories WHERE id = ?', [req.params['id']])
  if (result.affectedRows === 0) { sendNotFound(res, 'Category not found'); return }
  sendSuccess(res, null, 'Category deleted')
}
