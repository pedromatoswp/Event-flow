import type { Request, Response } from "express";

import {
  createCategory,
  getCategoryById,
  listCategories,
  removeCategory,
  updateCategory
} from "../services/categories.service";
import { sendCreated, sendOk } from "../utils/response.util";

export async function list(req: Request, res: Response) {
  const data = await listCategories();
  sendOk(res, data);
}

export async function getById(req: Request, res: Response) {
  const data = await getCategoryById(Number(req.params.id));
  sendOk(res, data);
}

export async function create(req: Request, res: Response) {
  const data = await createCategory(req.auth, req.body);
  sendCreated(res, data);
}

export async function update(req: Request, res: Response) {
  const data = await updateCategory(req.auth, Number(req.params.id), req.body);
  sendOk(res, data);
}

export async function remove(req: Request, res: Response) {
  const data = await removeCategory(req.auth, Number(req.params.id));
  sendOk(res, data);
}

export const categoriesController = {
  list,
  getById,
  create,
  update,
  remove
};

