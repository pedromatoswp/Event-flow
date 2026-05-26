import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2";

import { pool } from "../config/db";

export type CommentRow = {
  id: number;
  event_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
};

type Db = Pick<PoolConnection, "query" | "execute">;

export async function listCommentsByEvent(db: Db, eventId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      c.id, c.event_id, c.user_id, c.content,
      c.created_at, c.updated_at,
      u.full_name AS author_name
    FROM comments c
    INNER JOIN users u ON u.id = c.user_id
    WHERE c.event_id = ?
    ORDER BY c.created_at DESC
  `,
    [eventId]
  );
  return rows;
}

export async function createComment(
  db: Db,
  input: { eventId: number; userId: number; content: string }
) {
  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO comments (event_id, user_id, content)
    VALUES (?, ?, ?)
  `,
    [input.eventId, input.userId, input.content]
  );
  const commentId = result.insertId;
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, event_id, user_id, content, created_at, updated_at FROM comments WHERE id = ? LIMIT 1`,
    [commentId]
  );
  return rows[0] as CommentRow;
}

export async function getCommentById(db: Db, commentId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT id, event_id, user_id, content, created_at, updated_at
    FROM comments
    WHERE id = ?
    LIMIT 1
  `,
    [commentId]
  );
  return rows[0] as CommentRow | undefined;
}

export async function updateComment(
  db: Db,
  input: { commentId: number; userId: number; content: string }
) {
  await db.execute(
    `
    UPDATE comments
    SET content = ?
    WHERE id = ? AND user_id = ?
  `,
    [input.content, input.commentId, input.userId]
  );
  return getCommentById(db, input.commentId);
}

export async function deleteComment(
  db: Db,
  input: { commentId: number; userId: number }
) {
  await db.execute(`DELETE FROM comments WHERE id = ? AND user_id = ?`, [
    input.commentId,
    input.userId
  ]);
}

export const commentModel = {
  listCommentsByEvent: (eventId: number) => listCommentsByEvent(pool, eventId),
  createComment: (input: Parameters<typeof createComment>[1]) => createComment(pool, input),
  getCommentById: (commentId: number) => getCommentById(pool, commentId),
  updateComment: (input: Parameters<typeof updateComment>[1]) => updateComment(pool, input),
  deleteComment: (input: Parameters<typeof deleteComment>[1]) => deleteComment(pool, input)
};

