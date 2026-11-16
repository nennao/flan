import "server-only";

import { env } from "../env";
import { createDb, type Db } from "./create-db";

/**
 * The app's shared database client.
 *
 * In development, Next re-evaluates modules on every hot reload, which would
 * create a new connection pool each time and eventually exhaust Postgres
 * connections. Keeping the client on `globalThis` reuses one pool across
 * reloads. In production the module is evaluated once per server instance.
 */
const globalForDb = globalThis as typeof globalThis & { __flanDb?: Db };

export const db = globalForDb.__flanDb ?? createDb(env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__flanDb = db;
}
