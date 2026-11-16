/**
 * Database commands run outside Next.js (via tsx):
 *
 *   pnpm db:seed      load data/seed/*.csv into an empty database
 *   pnpm db:reset     LOCAL ONLY: drop everything, re-run migrations, seed
 *   pnpm db:checksum  print the reference-data content checksum
 *
 * DATABASE_URL comes from the environment, else from .env* files loaded the
 * same way Next loads them. An already-set variable wins, so
 * `DATABASE_URL=... pnpm db:checksum` checks another database.
 */
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { parseEnv } from "../env-schema";
import { referenceChecksums } from "./checksum";
import { createDb, type Db } from "./create-db";
import { readSeedData, seedDatabase } from "./seed";

const root = process.cwd();
const seedDir = path.join(root, "data/seed");
const migrationsFolder = path.join(root, "drizzle");
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

async function seed(db: Db) {
  const data = await readSeedData(seedDir);
  const inserted = await seedDatabase(db, data);
  console.log("Seeded:", inserted);
}

async function reset(db: Db, url: URL) {
  if (!localHosts.has(url.hostname)) {
    throw new Error(
      `Refusing to reset a non-local database (host "${url.hostname}"). db:reset is for local development only.`,
    );
  }
  // Validate the seed files first, so a bad CSV doesn't leave an empty DB.
  const data = await readSeedData(seedDir);
  console.log(`Resetting ${url.pathname.slice(1)} on ${url.host}...`);
  await db.execute(sql`drop schema if exists drizzle cascade`);
  await db.execute(sql`drop schema if exists public cascade`);
  // Recreate public exactly as Postgres 15+ provides it in a new database.
  await db.execute(sql`create schema public authorization pg_database_owner`);
  await db.execute(sql`grant usage on schema public to public`);
  await db.execute(sql`comment on schema public is 'standard public schema'`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied.");
  const inserted = await seedDatabase(db, data);
  console.log("Seeded:", inserted);
}

async function checksum(db: Db) {
  console.table(await referenceChecksums(db));
}

const commands = { seed, reset, checksum } as const;

async function main() {
  const name = process.argv[2];
  if (!(name && name in commands)) {
    throw new Error(`Usage: tsx src/server/db/cli.ts <${Object.keys(commands).join("|")}>`);
  }
  loadEnvConfig(root);
  const { DATABASE_URL } = parseEnv(process.env);
  const db = createDb(DATABASE_URL);
  try {
    await commands[name as keyof typeof commands](db, new URL(DATABASE_URL));
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
