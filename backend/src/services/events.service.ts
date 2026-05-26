import type { JWTPayload } from "../types/auth";
import { HttpException } from "../utils/http-exception";
import { withTransaction } from "../utils/transaction.util";
import { pool } from "../config/db";
import {
  createEvent as createEventDb,
  deleteEvent as deleteEventDb,
  getEventById as getEventByIdDb,
  getEventCategories,
  getEventRatingSummary,
  listEvents as listEventsDb,
  updateEvent as updateEventDb
} from "../models/event.model";

const allowedStatuses = new Set(["active", "cancelled", "draft"] as const);

function coerceNumber(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function parseStatus(v: unknown) {
  const s = typeof v === "string" ? v : undefined;
  if (!s) return undefined;
  if (!allowedStatuses.has(s as any)) throw new HttpException(400, "Invalid event status");
  return s as "active" | "cancelled" | "draft";
}

export async function listEvents(query: Record<string, unknown>) {
  const q = typeof query.q === "string" ? query.q : undefined;
  const categoryId = coerceNumber(query.categoryId);
  const status = parseStatus(query.status);
  const limit = coerceNumber(query.limit) ?? 20;
  const offset = coerceNumber(query.offset) ?? 0;

  return listEventsDb(pool, {
    q,
    categoryId,
    status,
    limit,
    offset
  });
}

export async function getEventById(eventId: number) {
  const event = await getEventByIdDb(pool, eventId);
  if (!event) throw new HttpException(404, "Event not found");

  const categories = await getEventCategories(pool, eventId);
  const ratingSummary = await getEventRatingSummary(pool, eventId);

  return {
    ...event,
    categories,
    ratingSummary: {
      avgScore: Number(ratingSummary.avg_score ?? 0),
      ratingsCount: ratingSummary.ratings_count
    }
  };
}

export async function createEvent(auth?: JWTPayload, input?: unknown) {
  if (!auth) throw new HttpException(401, "Unauthorized");

  const body = (input ?? {}) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const venue = typeof body.venue === "string" ? body.venue.trim() : null;
  const startDatetime = typeof body.startDatetime === "string" ? body.startDatetime : "";
  const endDatetime = typeof body.endDatetime === "string" ? body.endDatetime : null;
  const capacity = coerceNumber(body.capacity);
  const categoryIds =
    Array.isArray(body.categoryIds) ? body.categoryIds.map(coerceNumber) : undefined;

  if (!title) throw new HttpException(400, "title is required");
  if (!description) throw new HttpException(400, "description is required");
  if (!startDatetime) throw new HttpException(400, "startDatetime is required");
  if (!capacity || capacity <= 0) throw new HttpException(400, "capacity must be > 0");

  const normalizedCategoryIds = (categoryIds ?? []).filter(
    (v): v is number => typeof v === "number"
  );

  const created = await withTransaction(async (conn) => {
    const result = await createEventDb(conn, {
      title,
      description,
      venue,
      startDatetime,
      endDatetime,
      capacity,
      eventStatus: "active",
      organizerAdminUserId: auth.userId,
      categoryIds: normalizedCategoryIds
    });
    return result;
  });

  return getEventById(created.id);
}

export async function updateEvent(auth: JWTPayload | undefined, eventId: number, input?: unknown) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!eventId || !Number.isFinite(eventId)) throw new HttpException(400, "Invalid event id");

  const body = (input ?? {}) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const venue =
    body.venue === null
      ? null
      : typeof body.venue === "string"
        ? body.venue.trim()
        : undefined;
  const startDatetime = typeof body.startDatetime === "string" ? body.startDatetime : undefined;
  const endDatetime =
    body.endDatetime === null
      ? null
      : typeof body.endDatetime === "string"
        ? body.endDatetime
        : undefined;
  const capacity = coerceNumber(body.capacity);
  const eventStatus = parseStatus(body.eventStatus);
  const categoryIds =
    Array.isArray(body.categoryIds) ? body.categoryIds.map(coerceNumber) : undefined;
  const normalizedCategoryIds = categoryIds
    ? categoryIds.filter((v): v is number => typeof v === "number")
    : undefined;

  await withTransaction(async (conn) => {
    await updateEventDb(conn, {
      eventId,
      title,
      description,
      venue,
      startDatetime,
      endDatetime,
      capacity,
      eventStatus,
      categoryIds: normalizedCategoryIds
    });
    return true;
  });

  return getEventById(eventId);
}

export async function removeEvent(auth?: JWTPayload, eventId?: number) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!eventId || !Number.isFinite(eventId)) throw new HttpException(400, "Invalid event id");

  await withTransaction(async (conn) => {
    await deleteEventDb(conn, eventId);
    return true;
  });

  return { message: "Event deleted" };
}

