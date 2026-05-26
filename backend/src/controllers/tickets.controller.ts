import type { Request, Response } from "express";

import {
  cancelTicketByOwner,
  getTicketByIdForViewer,
  listMyTickets,
  purchaseTickets,
  updateTicketStatus
} from "../services/tickets.service";
import { sendCreated, sendOk } from "../utils/response.util";

export async function purchase(req: Request, res: Response) {
  const data = await purchaseTickets(req.auth, req.body);
  sendCreated(res, data);
}

export async function listMine(req: Request, res: Response) {
  const data = await listMyTickets(req.auth);
  sendOk(res, data);
}

export async function getById(req: Request, res: Response) {
  const data = await getTicketByIdForViewer(req.auth, Number(req.params.id));
  sendOk(res, data);
}

export async function setStatus(req: Request, res: Response) {
  const data = await updateTicketStatus(req.auth, Number(req.params.id), req.body);
  sendOk(res, data);
}

export async function cancelByOwner(req: Request, res: Response) {
  const data = await cancelTicketByOwner(req.auth, Number(req.params.id));
  sendOk(res, data);
}

export const ticketsController = {
  purchase,
  listMine,
  getById,
  setStatus,
  cancelByOwner
};

