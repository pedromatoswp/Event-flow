import type { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'
import { query, queryOne, execute } from '../utils/db'
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response'
import { ensureDefaultCategories, repairOrphanEventCategories } from '../utils/categories.util'

interface CategoryRow extends RowDataPacket {
  id: number
  name: string
  slug: string
  description: string | null
  event_count: number
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'categoria'
}

export async function getAllCategories(_req: Request, res: Response): Promise<void> {
  await ensureDefaultCategories()
  const repaired = await repairOrphanEventCategories()
  if (repaired > 0) {
    console.log(`[categories] Linked ${repaired} event(s) without category`)
  }

  const [rows] = await query<CategoryRow[]>(
    `SELECT c.id, c.name, c.slug, c.description,
            COUNT(ec.event_id) AS event_count
     FROM categories c
     LEFT JOIN event_categories ec ON ec.category_id = c.id
     GROUP BY c.id, c.name, c.slug, c.description
     ORDER BY c.name ASC`
  )
  sendSuccess(res, rows)
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  const category = await queryOne<CategoryRow>(
    'SELECT id, name, slug, description FROM categories WHERE id = ?',
    [req.params['id']]
  )
  if (!category) { sendNotFound(res, 'Category not found'); return }
  sendSuccess(res, category)
}

export async function getCategoryEvents(req: Request, res: Response): Promise<void> {
  const [rows] = await query<RowDataPacket[]>(
    `SELECT e.id, e.title, e.venue AS location, e.start_datetime AS date, e.event_status AS status
     FROM events e
     INNER JOIN event_categories ec ON ec.event_id = e.id AND ec.category_id = ?
     WHERE e.event_status = 'active'
     ORDER BY e.start_datetime ASC`,
    [req.params['id']]
  )
  sendSuccess(res, rows)
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body as { name: string; description?: string }

  const existing = await queryOne<CategoryRow>('SELECT id FROM categories WHERE name = ?', [name])
  if (existing) { sendBadRequest(res, 'Category already exists'); return }

  const slug = slugify(name)
  const [result] = await execute(
    'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
    [name, slug, description ?? null]
  )
  sendCreated(res, { id: result.insertId, name, slug, description })
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body as { name?: string; description?: string }
  const [result] = await execute(
    'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
    [name ?? null, description ?? null, req.params['id']]
  )
  if (result.affectedRows === 0) { sendNotFound(res, 'Category not found'); return }
  const updated = await queryOne<CategoryRow>(
    'SELECT id, name, slug, description FROM categories WHERE id = ?',
    [req.params['id']]
  )
  sendSuccess(res, updated, 'Category updated')
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const [linked] = await query<RowDataPacket[]>(
    'SELECT event_id FROM event_categories WHERE category_id = ? LIMIT 1',
    [req.params['id']]
  )
  if (linked.length > 0) {
    sendBadRequest(res, 'Cannot delete category with existing events')
    return
  }
  const [result] = await execute('DELETE FROM categories WHERE id = ?', [req.params['id']])
  if (result.affectedRows === 0) { sendNotFound(res, 'Category not found'); return }
  sendSuccess(res, null, 'Category deleted')
}
