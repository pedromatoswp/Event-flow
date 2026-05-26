import type { Request, Response } from "express";

import {
  createComment,
  deleteComment,
  listCommentsByEvent,
  updateComment
} from "../services/comments.service";
import { sendCreated, sendOk } from "../utils/response.util";

export async function listByEvent(req: Request, res: Response) {
  const data = await listCommentsByEvent(Number(req.params.eventId));
  sendOk(res, data);
}

export async function create(req: Request, res: Response) {
  const data = await createComment(req.auth, Number(req.params.eventId), req.body);
  sendCreated(res, data);
}

export async function update(req: Request, res: Response) {
  const data = await updateComment(req.auth, Number(req.params.commentId), req.body);
  sendOk(res, data);
}

export async function remove(req: Request, res: Response) {
  const data = await deleteComment(req.auth, Number(req.params.commentId));
  sendOk(res, data);
}

export const commentsController = {
  listByEvent,
  create,
  update,
  remove
};

