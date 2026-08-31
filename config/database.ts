import { env } from "./env";
import pg from "pg";

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;
  let dbUrl = env.DATABASE_URL;
  if (!dbUrl.includes("pgbouncer=true")) {
    const sep = dbUrl.includes("?") ? "&" : "?";
    dbUrl += `${sep}pgbouncer=true&connection_limit=3`;
  }
  pool = new pg.Pool({
    connectionString: dbUrl,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}
