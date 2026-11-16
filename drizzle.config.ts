import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { parseEnv } from "./src/server/env-schema";

// Load .env.local etc. the same way Next does, since drizzle-kit runs outside Next.
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: parseEnv(process.env).DATABASE_URL },
  strict: true,
  verbose: true,
});
