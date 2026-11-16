/**
 * Loads the reference data in `data/seed/*.csv` (see its README) into the
 * database. Parsing and validation are pure and unit-tested; `seedDatabase`
 * does the inserts in a single transaction.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";
import { count } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./create-db";
import { foods, ingredients, measurements, recipes, recipeTags, units } from "./schema";

// --- Row schemas (lengths match the varchar limits in schema.ts) -----------

const text = (max: number) => z.string().trim().min(1).max(max);
/** A non-empty numeric string; z.number() rejects NaN and ±Infinity. */
const decimal = z.string().trim().min(1).pipe(z.coerce.number<string>());

const rowSchemas = {
  foods: z.strictObject({
    name: text(100),
    protein: decimal,
    fat: decimal,
    carbs: decimal,
    fibre: decimal,
  }),
  units: z.strictObject({
    unit: text(16),
    measure: z.enum(["mass", "volume", "unit", "density"]),
  }),
  measurements: z.strictObject({
    food: text(100),
    unit: text(16),
    grams: decimal,
  }),
  recipes: z.strictObject({
    name: text(100),
    batch: z.string().trim().min(1).pipe(z.coerce.number<string>().int().positive()),
  }),
  recipe_tags: z.strictObject({ recipe: text(100), tag: text(100) }),
  ingredients: z.strictObject({
    recipe: text(100),
    food: text(100),
    unit: text(16),
    amount: decimal,
  }),
};

export type SeedFile = keyof typeof rowSchemas;
export const seedFiles = Object.keys(rowSchemas) as SeedFile[];

export type SeedData = {
  [F in SeedFile]: z.output<(typeof rowSchemas)[F]>[];
};

export class SeedDataError extends Error {
  constructor(readonly problems: string[]) {
    super(
      `Invalid seed data (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n` +
        problems.map((p) => `  ${p}`).join("\n"),
    );
    this.name = "SeedDataError";
  }
}

// --- Parsing and validation ------------------------------------------------

/**
 * Parses and validates the CSV contents of every seed file, including
 * uniqueness of names and that every by-name reference resolves.
 * Collects all problems (as `file.csv:line: message`) before throwing.
 */
export function parseSeedData(csv: Record<SeedFile, string>): SeedData {
  const problems: string[] = [];
  const data = {} as SeedData;

  for (const file of seedFiles) {
    const records: Record<string, string>[] = parse(csv[file], {
      columns: true,
      skip_empty_lines: true,
    });
    const rows = [];
    for (const [i, record] of records.entries()) {
      const result = rowSchemas[file].safeParse(record);
      if (result.success) {
        rows.push(result.data);
      } else {
        // Header is line 1, so record i is on line i + 2.
        for (const issue of result.error.issues) {
          const field = issue.path.join(".") || "(row)";
          problems.push(`${file}.csv:${i + 2}: ${field}: ${issue.message}`);
        }
      }
    }
    (data as Record<SeedFile, unknown[]>)[file] = rows;
  }

  if (problems.length === 0) {
    problems.push(...checkReferences(data));
  }
  if (problems.length > 0) {
    throw new SeedDataError(problems);
  }
  return data;
}

function checkReferences(data: SeedData): string[] {
  const problems: string[] = [];
  const unique = (file: SeedFile, keys: string[]) => {
    const seen = new Set<string>();
    keys.forEach((key, i) => {
      if (seen.has(key)) {
        problems.push(`${file}.csv:${i + 2}: duplicate ${JSON.stringify(key)}`);
      }
      seen.add(key);
    });
    return seen;
  };
  const exists = (file: SeedFile, i: number, kind: string, set: Set<string>, name: string) => {
    if (!set.has(name)) {
      problems.push(`${file}.csv:${i + 2}: unknown ${kind} ${JSON.stringify(name)}`);
    }
  };

  const foodNames = unique(
    "foods",
    data.foods.map((r) => r.name),
  );
  const unitNames = unique(
    "units",
    data.units.map((r) => r.unit),
  );
  const recipeNames = unique(
    "recipes",
    data.recipes.map((r) => r.name),
  );
  // A food may have at most one conversion per unit, or lookups are ambiguous.
  unique(
    "measurements",
    data.measurements.map((r) => `${r.food} / ${r.unit}`),
  );

  data.measurements.forEach((r, i) => {
    exists("measurements", i, "food", foodNames, r.food);
    exists("measurements", i, "unit", unitNames, r.unit);
  });
  data.recipe_tags.forEach((r, i) => {
    exists("recipe_tags", i, "recipe", recipeNames, r.recipe);
  });
  data.ingredients.forEach((r, i) => {
    exists("ingredients", i, "recipe", recipeNames, r.recipe);
    exists("ingredients", i, "food", foodNames, r.food);
    exists("ingredients", i, "unit", unitNames, r.unit);
  });
  return problems;
}

export async function readSeedData(dir: string): Promise<SeedData> {
  const entries = await Promise.all(
    seedFiles.map(async (file) => [file, await readFile(path.join(dir, `${file}.csv`), "utf8")] as const),
  );
  return parseSeedData(Object.fromEntries(entries) as Record<SeedFile, string>);
}

// --- Loading ---------------------------------------------------------------

const referenceTables = {
  foods,
  units,
  measurements,
  recipes,
  recipe_tags: recipeTags,
  ingredients,
};

/**
 * Inserts the seed data in one transaction. Refuses (and changes nothing) if
 * any reference table already has rows: seeding is for an empty database,
 * not an upsert. Returns the number of rows inserted per table.
 */
export async function seedDatabase(db: Db, data: SeedData): Promise<Record<SeedFile, number>> {
  return db.transaction(async (tx) => {
    const nonEmpty: string[] = [];
    for (const [name, table] of Object.entries(referenceTables)) {
      const [{ n }] = await tx.select({ n: count() }).from(table);
      if (n > 0) nonEmpty.push(`${name} (${n} rows)`);
    }
    if (nonEmpty.length > 0) {
      throw new Error(
        `Refusing to seed: reference tables are not empty: ${nonEmpty.join(", ")}. ` +
          "Use `pnpm db:reset` to rebuild a local database.",
      );
    }

    const idsByName = (rows: { id: number; key: string | null }[]) => new Map(rows.map((r) => [r.key!, r.id]));
    const id = (map: Map<string, number>, key: string) => map.get(key)!; // validated by parseSeedData

    const foodIds = idsByName(await tx.insert(foods).values(data.foods).returning({ id: foods.id, key: foods.name }));
    const unitIds = idsByName(await tx.insert(units).values(data.units).returning({ id: units.id, key: units.unit }));
    const recipeIds = idsByName(
      await tx.insert(recipes).values(data.recipes).returning({ id: recipes.id, key: recipes.name }),
    );

    await tx.insert(measurements).values(
      data.measurements.map((r) => ({
        foodId: id(foodIds, r.food),
        unitId: id(unitIds, r.unit),
        grams: r.grams,
      })),
    );
    await tx.insert(recipeTags).values(
      data.recipe_tags.map((r) => ({
        recipeId: id(recipeIds, r.recipe),
        value: r.tag,
      })),
    );
    await tx.insert(ingredients).values(
      data.ingredients.map((r) => ({
        recipeId: id(recipeIds, r.recipe),
        foodId: id(foodIds, r.food),
        unitId: id(unitIds, r.unit),
        amount: r.amount,
      })),
    );

    return Object.fromEntries(seedFiles.map((file) => [file, data[file].length])) as Record<SeedFile, number>;
  });
}
