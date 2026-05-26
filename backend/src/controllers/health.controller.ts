import type { Request, Response } from "express";

import { getHealthStatus } from "../services/health.service";
import { sendOk } from "../utils/response.util";

export async function getHealth(req: Request, res: Response) {
  void req;
  const data = await getHealthStatus();
  sendOk(res, data);
}

