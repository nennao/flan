/**
 * Server environment schema. Pure (no `server-only`), so it can also be used by
 * code that runs outside Next.js: drizzle.config.ts, the seed script, tests.
 * App code should import `env` from `./env` instead.
 */
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "must be a postgres:// or postgresql:// URL",
  }),
});

export type Env = z.infer<typeof envSchema>;

/** Validates the environment, throwing an error that names each bad variable (never its value). */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${problems}`);
  }
  return result.data;
}
