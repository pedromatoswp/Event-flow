import crypto from "crypto";

import { HttpException } from "../utils/http-exception";
import { pool } from "../config/db";
import type { JWTPayload } from "../types/auth";
import type { Status } from "../types/ticket";
import {
  cancelTicketForOwner,
  createTickets,
  getTicketById,
  listTicketsByOwner,
  setTicketStatus
} from "../models/ticket.model";

function parseQuantity(input: unknown): number {
  const n = typeof input === "string" ? Number(input) : typeof input === "number" ? input : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new HttpException(400, "Invalid quantity");
  return n;
}

function parseEventId(body: Record<string, unknown>): number {
  const raw = body.eventId ?? body.event_id ?? body.eventID ?? body.event_id;
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) throw new HttpException(400, "Invalid eventId");
  return n;
}

function parseTicketStatus(input: unknown): Status {
  const s = typeof input === "string" ? input : "";
  if (s !== "pending" && s !== "approved" && s !== "canceled") {
    throw new HttpException(400, "Invalid ticket status");
  }
  return s;
}

export async function purchaseTickets(auth?: JWTPayload, input?: unknown) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  const body = (input ?? {}) as Record<string, unknown>;

  const eventId = parseEventId(body);
  const quantity = body.quantity === undefined ? 1 : parseQuantity(body.quantity);
  if (quantity <= 0 || quantity > 10) throw new HttpException(400, "quantity must be between 1 and 10");

  const [events] = await pool.query<any[]>(
    `SELECT id, event_status FROM events WHERE id = ? LIMIT 1`,
    [eventId]
  );
  const event = events[0];
  if (!event) throw new HttpException(404, "Event not found");
  if (event.event_status !== "active") throw new HttpException(400, "Event is not active");

  const tickets = Array.from({ length: quantity }).map(() => {
    const uuid = crypto.randomUUID();
    return {
      ticketCode: uuid,
      qrCodeValue: `EVFQR:${uuid}`
    };
  });

  const createdTickets = await createTickets(pool, {
    eventId,
    ownerUserId: auth.userId,
    tickets,
    status: "pending"
  });

  return { tickets: createdTickets };
}

export async function listMyTickets(auth?: JWTPayload) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  const tickets = await listTicketsByOwner(pool, auth.userId);
  return { tickets };
}

export async function getTicketByIdForViewer(auth?: JWTPayload, ticketId?: number) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!ticketId || !Number.isFinite(ticketId)) throw new HttpException(400, "Invalid ticket id");

  const ticket = await getTicketById(pool, ticketId);
  if (!ticket) throw new HttpException(404, "Ticket not found");

  const isAdmin = auth.roleId === 2;
  const isOwner = ticket.owner_user_id === auth.userId;
  if (!isAdmin && !isOwner) throw new HttpException(403, "Forbidden");

  return ticket;
}

export async function updateTicketStatus(
  auth?: JWTPayload,
  ticketId?: number,
  input?: unknown
) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (auth.roleId !== 2) throw new HttpException(403, "Forbidden: admin access required");
  if (!ticketId || !Number.isFinite(ticketId)) throw new HttpException(400, "Invalid ticket id");

  const body = (input ?? {}) as Record<string, unknown>;
  const status = parseTicketStatus(body.status);

  await setTicketStatus(pool, ticketId, status);
  const ticket = await getTicketById(pool, ticketId);
  if (!ticket) throw new HttpException(404, "Ticket not found");
  return ticket;
}

export async function cancelTicketByOwner(auth?: JWTPayload, ticketId?: number) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!ticketId || !Number.isFinite(ticketId)) throw new HttpException(400, "Invalid ticket id");

  const ticket = await getTicketById(pool, ticketId);
  if (!ticket) throw new HttpException(404, "Ticket not found");

  if (auth.roleId !== 2 && ticket.owner_user_id !== auth.userId) {
    throw new HttpException(403, "Forbidden");
  }

  await cancelTicketForOwner(pool, ticketId);
  const updated = await getTicketById(pool, ticketId);
  if (!updated) throw new HttpException(404, "Ticket not found");
  return updated;
}

