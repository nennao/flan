/**
 * Builds a Drizzle client over a node-postgres pool. Pure (no `server-only`),
 * so scripts such as the seed can use it; app code imports `db` from `./client`.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle({ client: pool, schema });
}

export type Db = ReturnType<typeof createDb>;
