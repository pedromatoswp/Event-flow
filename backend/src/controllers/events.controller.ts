import type { Request, Response } from "express";

import {
  createEvent,
  getEventById,
  listEvents,
  removeEvent,
  updateEvent
} from "../services/events.service";
import { sendCreated, sendOk } from "../utils/response.util";

export async function list(req: Request, res: Response) {
  const data = await listEvents(req.query);
  sendOk(res, data);
}

export async function getById(req: Request, res: Response) {
  const data = await getEventById(Number(req.params.id));
  sendOk(res, data);
}

export async function create(req: Request, res: Response) {
  const data = await createEvent(req.auth, req.body);
  sendCreated(res, data);
}

export async function update(req: Request, res: Response) {
  const eventId = Number(req.params.id);
  const data = await updateEvent(req.auth, eventId, req.body);
  sendOk(res, data);
}

export async function remove(req: Request, res: Response) {
  const eventId = Number(req.params.id);
  const data = await removeEvent(req.auth, eventId);
  sendOk(res, data);
}

export const eventsController = {
  list,
  getById,
  create,
  update,
  remove
};

