/**
 * Builds a Drizzle client over a node-postgres pool. Pure (no `server-only`),
 * so scripts such as the seed can use it; app code imports `db` from `./client`.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  // An idle pooled connection can fail at any time (e.g. the server restarts).
  // node-postgres reports that as a pool "error" event, and an unhandled one
  // crashes the process. The pool discards the broken client either way; the
  // next query opens a new connection, or fails and is handled by its caller.
  pool.on("error", (error) => {
    console.error("Idle PostgreSQL client error:", error.message);
  });
  return drizzle({ client: pool, schema });
}

export type Db = ReturnType<typeof createDb>;
