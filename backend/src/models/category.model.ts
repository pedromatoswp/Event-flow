import type { RowDataPacket, ResultSetHeader } from "mysql2";

import { pool } from "../config/db";

export async function listCategories() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, slug, description, created_at
     FROM categories
     ORDER BY name ASC`
  );
  return rows;
}

export async function getCategoryById(categoryId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, slug, description, created_at
     FROM categories
     WHERE id = ?
     LIMIT 1`,
    [categoryId]
  );
  return rows[0];
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO categories (name, slug, description)
     VALUES (?, ?, ?)`,
    [input.name, input.slug, input.description ?? null]
  );
  return { id: result.insertId };
}

export async function updateCategory(input: {
  categoryId: number;
  name?: string;
  slug?: string;
  description?: string | null;
}) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    sets.push("name = ?");
    params.push(input.name);
  }
  if (input.slug !== undefined) {
    sets.push("slug = ?");
    params.push(input.slug);
  }
  if (input.description !== undefined) {
    sets.push("description = ?");
    params.push(input.description);
  }
  if (sets.length === 0) return;

  params.push(input.categoryId);
  await pool.execute(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteCategory(categoryId: number) {
  await pool.execute(`DELETE FROM categories WHERE id = ?`, [categoryId]);
}

