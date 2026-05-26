import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2";
import type { Status } from "../types/ticket";

import { pool } from "../config/db";

export type TicketRow = {
  id: number;
  event_id: number;
  owner_user_id: number;
  ticket_code: string;
  qr_code_value: string;
  status: Status;
  purchased_at: string;
  approved_at: string | null;
  canceled_at: string | null;
  validated_at: string | null;
};

type Db = Pick<PoolConnection, "query" | "execute">;

export async function createTickets(
  db: Db,
  input: {
    eventId: number;
    ownerUserId: number;
    tickets: Array<{
      ticketCode: string;
      qrCodeValue: string;
    }>;
    status: Status;
  }
) {
  const values: unknown[] = [];
  const placeholders: string[] = [];

  for (const t of input.tickets) {
    placeholders.push("(?, ?, ?, ?, ?)");
    values.push(
      input.eventId,
      input.ownerUserId,
      t.ticketCode,
      t.qrCodeValue,
      input.status
    );
  }

  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO tickets (
      event_id, owner_user_id, ticket_code, qr_code_value, status
    ) VALUES ${placeholders.join(", ")}
  `,
    values
  );
  void result;

  // Return inserted rows so the API can respond with real persisted ticket data.
  const qrValues = input.tickets.map((t) => t.qrCodeValue);
  const placeholdersQr = qrValues.map(() => "?").join(", ");
  const [rows] = await db.query<RowDataPacket[]>(
    `
      SELECT *
      FROM tickets
      WHERE owner_user_id = ?
        AND qr_code_value IN (${placeholdersQr})
    `,
    [input.ownerUserId, ...qrValues]
  );

  return rows as TicketRow[];
}

export async function listTicketsByOwner(db: Db, ownerUserId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT *
    FROM tickets
    WHERE owner_user_id = ?
    ORDER BY purchased_at DESC
  `,
    [ownerUserId]
  );
  return rows as TicketRow[];
}

export async function getTicketById(db: Db, ticketId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT *
    FROM tickets
    WHERE id = ?
    LIMIT 1
  `,
    [ticketId]
  );
  return rows[0] as TicketRow | undefined;
}

export async function setTicketStatus(db: Db, ticketId: number, status: Status) {
  const now = new Date();
  const approvedAt = status === "approved" ? now : null;
  const canceledAt = status === "canceled" ? now : null;
  const validatedAt = status === "approved" ? null : null;

  await db.execute(
    `
    UPDATE tickets
    SET status = ?,
        approved_at = ?,
        canceled_at = ?,
        validated_at = COALESCE(validated_at, ?)
    WHERE id = ?
  `,
    [status, approvedAt, canceledAt, validatedAt, ticketId]
  );
}

export async function cancelTicketForOwner(db: Db, ticketId: number) {
  await db.execute(
    `
    UPDATE tickets
    SET status = 'canceled',
        canceled_at = NOW()
    WHERE id = ?
  `,
    [ticketId]
  );
}

export const ticketModel = {
  createTickets: (input: Parameters<typeof createTickets>[1]) =>
    createTickets(pool, input as any),
  listTicketsByOwner: (ownerUserId: number) => listTicketsByOwner(pool, ownerUserId),
  getTicketById: (ticketId: number) => getTicketById(pool, ticketId),
  setTicketStatus: (ticketId: number, status: Status) =>
    setTicketStatus(pool, ticketId, status)
};

