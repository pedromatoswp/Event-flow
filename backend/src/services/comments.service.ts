import type { JWTPayload } from "../types/auth";
import { HttpException } from "../utils/http-exception";
import { pool } from "../config/db";
import {
  createComment,
  deleteComment,
  getCommentById,
  listCommentsByEvent,
  updateComment
} from "../models/comment.model";

export async function listCommentsByEventService(eventId: number) {
  if (!Number.isFinite(eventId) || eventId <= 0) {
    throw new HttpException(400, "Invalid eventId");
  }
  return listCommentsByEvent(pool, eventId);
}

export async function createCommentService(
  auth?: JWTPayload,
  eventId?: number,
  input?: unknown
) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!eventId || !Number.isFinite(eventId)) throw new HttpException(400, "Invalid eventId");

  const body = (input ?? {}) as Record<string, unknown>;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) throw new HttpException(400, "content is required");
  if (content.length > 2000) throw new HttpException(400, "content too long");

  // Ensure event exists (real validation via DB)
  const [events] = await pool.query<any[]>(
    `SELECT id FROM events WHERE id = ? LIMIT 1`,
    [eventId]
  );
  if (!events[0]) throw new HttpException(404, "Event not found");

  return createComment(pool, { eventId, userId: auth.userId, content });
}

export async function updateCommentService(
  auth?: JWTPayload,
  commentId?: number,
  input?: unknown
) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!commentId || !Number.isFinite(commentId)) throw new HttpException(400, "Invalid commentId");

  const body = (input ?? {}) as Record<string, unknown>;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) throw new HttpException(400, "content is required");

  const comment = await getCommentById(pool, commentId);
  if (!comment) throw new HttpException(404, "Comment not found");

  const isOwner = comment.user_id === auth.userId;
  const isAdmin = auth.roleId === 2;
  if (!isOwner && !isAdmin) throw new HttpException(403, "Forbidden");

  const updated = await updateComment(pool, {
    commentId,
    userId: auth.userId,
    content
  });
  if (!updated) throw new HttpException(404, "Comment not found");
  return updated;
}

export async function deleteCommentService(
  auth?: JWTPayload,
  commentId?: number
) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!commentId || !Number.isFinite(commentId)) throw new HttpException(400, "Invalid commentId");

  const comment = await getCommentById(pool, commentId);
  if (!comment) throw new HttpException(404, "Comment not found");

  const isOwner = comment.user_id === auth.userId;
  const isAdmin = auth.roleId === 2;
  if (!isOwner && !isAdmin) throw new HttpException(403, "Forbidden");

  await deleteComment(pool, { commentId, userId: comment.user_id });
  return { message: "Comment deleted" };
}

// Named exports expected by controller
export const listCommentsByEvent = listCommentsByEventService;
export const createComment = createCommentService;
export const updateComment = updateCommentService;
export const deleteComment = deleteCommentService;

