import type { Request, Response } from "express";

import { registerUser, loginUser, logoutUser } from "../services/auth.service";
import { sendCreated, sendOk } from "../utils/response.util";

export async function register(req: Request, res: Response) {
  const data = await registerUser(req.body);
  sendCreated(res, data);
}

export async function login(req: Request, res: Response) {
  const data = await loginUser(req.body);
  sendOk(res, data);
}

export async function logout(req: Request, res: Response) {
  const data = await logoutUser(req.auth);
  res.status(200).json({ success: true, data });
}

export const authController = {
  register,
  login,
  logout
};

