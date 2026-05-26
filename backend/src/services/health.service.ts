import { pingDb } from "../models/health.model";

export async function getHealthStatus() {
  const db = await pingDb();

  return {
    api: "EventFlow",
    status: "ok",
    db,
    timestamp: new Date().toISOString()
  };
}

