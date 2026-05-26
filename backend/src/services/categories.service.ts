import type { JWTPayload } from "../types/auth";
import { HttpException } from "../utils/http-exception";
import { slugify } from "../utils/slugify.util";
import { createCategory as createCategoryDb, deleteCategory, getCategoryById as getCategoryByIdDb, listCategories as listCategoriesDb, updateCategory as updateCategoryDb } from "../models/category.model";

export async function listCategories() {
  return listCategoriesDb();
}

export async function getCategoryById(categoryId: number) {
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw new HttpException(400, "Invalid category id");
  }
  const category = await getCategoryByIdDb(categoryId);
  if (!category) throw new HttpException(404, "Category not found");
  return category;
}

export async function createCategory(auth?: JWTPayload, input?: unknown) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  const body = (input ?? {}) as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const slug = typeof body.slug === "string" ? body.slug.trim() : slugify(name);

  if (!name) throw new HttpException(400, "name is required");
  if (!slug) throw new HttpException(400, "slug is required");

  const created = await createCategoryDb({ name, slug, description });
  return created;
}

export async function updateCategory(
  auth?: JWTPayload,
  categoryId?: number,
  input?: unknown
) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!categoryId || !Number.isFinite(categoryId)) throw new HttpException(400, "Invalid category id");

  const body = (input ?? {}) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const slug = typeof body.slug === "string" ? body.slug.trim() : undefined;
  const description = body.description === undefined ? undefined : typeof body.description === "string" ? body.description.trim() : null;

  if (name !== undefined && !name) throw new HttpException(400, "name cannot be empty");
  if (slug !== undefined && !slug) throw new HttpException(400, "slug cannot be empty");

  const category = await getCategoryByIdDb(categoryId);
  if (!category) throw new HttpException(404, "Category not found");

  await updateCategoryDb({ categoryId, name, slug, description });
  return getCategoryById(categoryId);
}

export async function removeCategory(auth?: JWTPayload, categoryId?: number) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  if (!categoryId || !Number.isFinite(categoryId)) throw new HttpException(400, "Invalid category id");

  const category = await getCategoryByIdDb(categoryId);
  if (!category) throw new HttpException(404, "Category not found");

  await deleteCategory(categoryId);
  return { message: "Category deleted" };
}

