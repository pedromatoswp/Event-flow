import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "../config/db";

export type EventStatus = "active" | "cancelled" | "draft";

export type EventRow = {
  id: number;
  title: string;
  description: string;
  venue: string | null;
  start_datetime: string;
  end_datetime: string | null;
  capacity: number;
  event_status: EventStatus;
  organizer_admin_user_id: number | null;
  created_at: string;
};

type Db = Pick<PoolConnection, "query" | "execute">;

export async function listEvents(db: Db, input: {
  q?: string;
  categoryId?: number;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}) {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;

  const params: unknown[] = [];
  const where: string[] = [];

  if (input.status) {
    where.push("e.event_status = ?");
    params.push(input.status);
  }

  if (input.categoryId) {
    // Only keep events that match the category.
    where.push("ec.category_id = ?");
    params.push(input.categoryId);
  }

  if (input.q) {
    where.push("(e.title LIKE ? OR e.description LIKE ?)");
    params.push(`%${input.q}%`, `%${input.q}%`);
  }

  const joinCategory = input.categoryId
    ? "JOIN event_categories ec ON ec.event_id = e.id"
    : "LEFT JOIN event_categories ec ON ec.event_id = e.id";

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      e.id, e.title, e.description, e.venue, e.start_datetime, e.end_datetime,
      e.capacity, e.event_status, e.organizer_admin_user_id, e.created_at
    FROM events e
    ${joinCategory}
    ${whereClause}
    GROUP BY e.id
    ORDER BY e.start_datetime DESC
    LIMIT ? OFFSET ?
  `,
    [...params, limit, offset]
  );

  return rows as EventRow[];
}

export async function getEventById(db: Db, eventId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      e.id, e.title, e.description, e.venue,
      e.start_datetime, e.end_datetime, e.capacity,
      e.event_status, e.organizer_admin_user_id,
      e.created_at, e.updated_at,
      u.full_name AS organizer_name
    FROM events e
    LEFT JOIN users u ON u.id = e.organizer_admin_user_id
    WHERE e.id = ?
    LIMIT 1
  `,
    [eventId]
  );

  return rows[0] as (EventRow & { organizer_name?: string }) | undefined;
}

export async function getEventCategories(db: Db, eventId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT c.id, c.name, c.slug, c.description
    FROM categories c
    INNER JOIN event_categories ec ON ec.category_id = c.id
    WHERE ec.event_id = ?
    ORDER BY c.name ASC
  `,
    [eventId]
  );
  return rows;
}

export async function getEventRatingSummary(db: Db, eventId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      AVG(r.score) AS avg_score,
      COUNT(*) AS ratings_count
    FROM ratings r
    WHERE r.event_id = ?
  `,
    [eventId]
  );
  return rows[0] as { avg_score: number | null; ratings_count: number };
}

export async function createEvent(db: Db, input: {
  title: string;
  description: string;
  venue?: string | null;
  startDatetime: string;
  endDatetime?: string | null;
  capacity: number;
  eventStatus?: EventStatus;
  organizerAdminUserId: number;
  categoryIds?: number[];
}) {
  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO events (
      title, description, venue, start_datetime, end_datetime,
      capacity, event_status, organizer_admin_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      input.title,
      input.description,
      input.venue ?? null,
      input.startDatetime,
      input.endDatetime ?? null,
      input.capacity,
      input.eventStatus ?? "active",
      input.organizerAdminUserId
    ]
  );

  const eventId = result.insertId;
  if (input.categoryIds?.length) {
    await setEventCategories(db, eventId, input.categoryIds);
  }

  return { id: eventId };
}

export async function updateEvent(db: Db, input: {
  eventId: number;
  title?: string;
  description?: string;
  venue?: string | null;
  startDatetime?: string;
  endDatetime?: string | null;
  capacity?: number;
  eventStatus?: EventStatus;
  categoryIds?: number[];
}) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    sets.push("title = ?");
    params.push(input.title);
  }
  if (input.description !== undefined) {
    sets.push("description = ?");
    params.push(input.description);
  }
  if (input.venue !== undefined) {
    sets.push("venue = ?");
    params.push(input.venue);
  }
  if (input.startDatetime !== undefined) {
    sets.push("start_datetime = ?");
    params.push(input.startDatetime);
  }
  if (input.endDatetime !== undefined) {
    sets.push("end_datetime = ?");
    params.push(input.endDatetime);
  }
  if (input.capacity !== undefined) {
    sets.push("capacity = ?");
    params.push(input.capacity);
  }
  if (input.eventStatus !== undefined) {
    sets.push("event_status = ?");
    params.push(input.eventStatus);
  }

  if (sets.length) {
    params.push(input.eventId);
    await db.execute(
      `UPDATE events SET ${sets.join(", ")} WHERE id = ?`,
      params
    );
  }

  if (input.categoryIds) {
    await setEventCategories(db, input.eventId, input.categoryIds);
  }

  return { updated: true };
}

export async function deleteEvent(db: Db, eventId: number) {
  await db.execute(`DELETE FROM events WHERE id = ?`, [eventId]);
}

export async function setEventCategories(
  db: Db,
  eventId: number,
  categoryIds: number[]
) {
  // Replace all categories for the event.
  await db.execute(`DELETE FROM event_categories WHERE event_id = ?`, [eventId]);

  if (!categoryIds.length) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  for (const categoryId of categoryIds) {
    placeholders.push("(?, ?)");
    values.push(eventId, categoryId);
  }

  await db.execute(
    `
    INSERT INTO event_categories (event_id, category_id)
    VALUES ${placeholders.join(", ")}
  `,
    values
  );
}

export const eventModel = {
  listEvents: (input: Parameters<typeof listEvents>[1]) =>
    listEvents(pool, input),
  getEventById: (eventId: number) => getEventById(pool, eventId),
  getEventCategories: (eventId: number) => getEventCategories(pool, eventId),
  getEventRatingSummary: (eventId: number) =>
    getEventRatingSummary(pool, eventId),
  createEvent: (input: Parameters<typeof createEvent>[1]) =>
    createEvent(pool, input),
  updateEvent: (input: Parameters<typeof updateEvent>[1]) =>
    updateEvent(pool, input),
  deleteEvent: (eventId: number) => deleteEvent(pool, eventId)
};

