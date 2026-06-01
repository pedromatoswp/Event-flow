import type { RowDataPacket } from 'mysql2'

export function mapTicketForFrontend(row: RowDataPacket) {
  const statusMap: Record<string, 'active' | 'used' | 'cancelled'> = {
    approved: 'active',
    pending: 'active',
    canceled: 'cancelled',
    cancelled: 'cancelled',
  }

  return {
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(row.owner_user_id),
    purchaseDate: row.purchased_at
      ? new Date(row.purchased_at as string).toISOString()
      : new Date().toISOString(),
    status: statusMap[String(row.status)] ?? 'active',
    qrCode: row.qr_code_value ?? row.ticket_code ?? '',
    event: row.event_title
      ? {
          id: String(row.event_id),
          title: row.event_title,
          description: row.event_description ?? '',
          date: row.start_datetime
            ? new Date(row.start_datetime as string).toISOString().split('T')[0]
            : '',
          time: row.start_datetime
            ? new Date(row.start_datetime as string).toTimeString().slice(0, 5)
            : '',
          location: row.venue ?? '',
          imageUrl: '',
          category: '',
          price: 0,
          capacity: 0,
          availableTickets: 0,
          organizerId: '',
          createdAt: new Date().toISOString(),
        }
      : undefined,
  }
}
