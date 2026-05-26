import bcrypt from "bcrypt";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

import { pool } from "../config/db";
 
export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role_id: number;
  is_active: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, password_hash, full_name, phone, role_id, is_active
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizeEmail(email)]
  );

  return rows[0] as UserRow | undefined;
}

export async function findUserById(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, password_hash, full_name, phone, role_id, is_active
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] as UserRow | undefined;
}

export async function createClientUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
}) {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, full_name, phone, role_id, is_active)
     VALUES (?, ?, ?, ?, 1, TRUE)`,
    [normalizeEmail(input.email), input.passwordHash, input.fullName, input.phone]
  );

  return { id: result.insertId };
}

export async function ensureAdministrator(userId: number) {
  // administrators has PRIMARY KEY(user_id), so this will either insert or no-op.
  await pool.execute(
    `INSERT INTO administrators (user_id, admin_since)
     VALUES (?, NOW())
     ON DUPLICATE KEY UPDATE admin_since = admin_since`,
    [userId]
  );
}

export async function removeAdministrator(userId: number) {
  await pool.execute(`DELETE FROM administrators WHERE user_id = ?`, [userId]);
}

export async function updateUserProfile(input: {
  userId: number;
  fullName?: string;
  phone?: string | null;
  passwordHash?: string;
}) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (typeof input.fullName === "string") {
    sets.push("full_name = ?");
    params.push(input.fullName);
  }
  if (input.phone !== undefined) {
    sets.push("phone = ?");
    params.push(input.phone);
  }
  if (typeof input.passwordHash === "string") {
    sets.push("password_hash = ?");
    params.push(input.passwordHash);
  }

  if (sets.length === 0) return;

  params.push(input.userId);
  await pool.execute(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
}

export async function deleteUserById(userId: number) {
  await pool.execute(`DELETE FROM users WHERE id = ?`, [userId]);
}

export async function listUsers(input: { limit: number; offset: number }) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.email, u.full_name, u.phone, u.role_id, u.is_active, u.created_at
     FROM users u
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [input.limit, input.offset]
  );
  return rows as UserRow[];
}

export async function setUserRoleAndActive(input: {
  userId: number;
  roleId: number;
  isActive: boolean;
}) {
  await pool.execute(
    `UPDATE users
     SET role_id = ?, is_active = ?
     WHERE id = ?`,
    [input.roleId, input.isActive ? 1 : 0, input.userId]
  );

  if (input.roleId === 2) {
    await ensureAdministrator(input.userId);
  } else {
    await removeAdministrator(input.userId);
  }
}

export async function hashPassword(password: string) {
  // bcrypt salt rounds kept constant for deterministic local dev speed.
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "10", 10);
  return bcrypt.hash(password, rounds);
}

