import "server-only";

import { parseEnv } from "./env-schema";

/**
 * Validated server environment. `server-only` makes any import of this from a
 * Client Component a build error, so secrets can't reach the browser bundle.
 */
export const env = parseEnv(process.env);
