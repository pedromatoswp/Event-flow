import type { RowDataPacket } from 'mysql2'
import { query, execute } from './db'

const DEFAULT_CATEGORIES = [
  { name: 'Technology', slug: 'tech', description: 'Workshops and tech conferences.' },
  { name: 'Music', slug: 'music', description: 'Shows, live sessions and performers.' },
  { name: 'Sports', slug: 'sports', description: 'Matches, leagues and sports events.' },
] as const

/** Ensures at least the default categories exist (e.g. when seed was not run). */
export async function ensureDefaultCategories(): Promise<void> {
  const [[row]] = await query<RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM categories'
  )
  if (Number(row?.count ?? 0) > 0) return

  for (const cat of DEFAULT_CATEGORIES) {
    await execute(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [cat.name, cat.slug, cat.description]
    )
  }
  console.log('[categories] Default categories created (Technology, Music, Sports)')
}

/** Links events that have no row in event_categories to the first available category. */
export async function repairOrphanEventCategories(): Promise<number> {
  const [[row]] = await query<RowDataPacket[]>(
    'SELECT COUNT(*) AS count FROM categories'
  )
  if (Number(row?.count ?? 0) === 0) return 0

  const [result] = await execute(
    `INSERT INTO event_categories (event_id, category_id)
     SELECT e.id, (SELECT id FROM categories ORDER BY id ASC LIMIT 1)
     FROM events e
     LEFT JOIN event_categories ec ON ec.event_id = e.id
     WHERE ec.event_id IS NULL`
  )
  return result.affectedRows
}
