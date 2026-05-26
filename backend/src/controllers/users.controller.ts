import type { Request, Response } from "express";

import {
  meDelete,
  meGet,
  meUpdate
} from "../services/users.service";
import { sendOk } from "../utils/response.util";

export async function meGet(req: Request, res: Response) {
  const data = await meGet(req.auth);
  sendOk(res, data);
}

export async function meUpdate(req: Request, res: Response) {
  const data = await meUpdate(req.auth, req.body);
  sendOk(res, data);
}

export async function meDelete(req: Request, res: Response) {
  const data = await meDelete(req.auth);
  res.status(200).json({ success: true, data });
}

export const usersController = {
  meGet,
  meUpdate,
  meDelete
};

