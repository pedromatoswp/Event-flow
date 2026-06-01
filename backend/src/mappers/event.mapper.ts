import type { RowDataPacket } from 'mysql2'

export function mapEventForFrontend(row: RowDataPacket, isFavorite = false) {
  const start = row.start_datetime ? new Date(row.start_datetime as string) : new Date()
  const categories = row.categories
    ? String(row.categories).split('||').filter(Boolean)
    : []

  const capacity = Number(row.capacity ?? 0)
  const sold = Number(row.tickets_sold ?? 0)

  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    date: start.toISOString().split('T')[0],
    time: start.toTimeString().slice(0, 5),
    location: row.venue ?? '',
    imageUrl: '',
    category: categories[0] ?? 'General',
    price: 0,
    capacity,
    availableTickets: Math.max(0, capacity - sold),
    organizerId: row.organizer_admin_user_id ? String(row.organizer_admin_user_id) : '',
    createdAt: row.created_at
      ? new Date(row.created_at as string).toISOString()
      : new Date().toISOString(),
    status: row.event_status,
    categories,
    isFavorite,
  }
}
