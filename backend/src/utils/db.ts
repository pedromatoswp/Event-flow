import pool from '../config/database'
import type { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise'

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: unknown[]
): Promise<[T, FieldPacket[]]> {
  return pool.execute<T>(sql, params)
}

export async function execute(
  sql: string,
  params?: unknown[]
): Promise<[ResultSetHeader, FieldPacket[]]> {
  return pool.execute<ResultSetHeader>(sql, params)
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const [rows] = await pool.execute<T[]>(sql, params)
  return rows[0] ?? null
}

export function paginate(page: number, limit: number): { offset: number; limit: number } {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(100, Math.max(1, limit))
  return { offset: (safePage - 1) * safeLimit, limit: safeLimit }
}
