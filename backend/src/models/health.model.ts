import { pool } from "../config/db";

export async function pingDb(): Promise<{ ok: boolean }> {
  try {
    // Works in MySQL and is safe for connectivity checks.
    await pool.query("SELECT 1");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

