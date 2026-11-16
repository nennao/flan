import "server-only";

import { connection } from "next/server";

import { db } from "../db/client";
import { foods, ingredients, measurements, recipes, recipeTags, units } from "../db/schema";

export type ReferenceCounts = {
  recipes: number;
  foods: number;
  ingredients: number;
  measurements: number;
  units: number;
  recipeTags: number;
};

/**
 * Live row counts of the reference tables, read per request.
 *
 * `connection()` makes this request-time only: prerendering stops here, so
 * `next build` never opens a database connection for it. Callers must render
 * it inside `<Suspense>`.
 */
export async function getReferenceCounts(): Promise<ReferenceCounts> {
  await connection();
  const [r, f, i, m, u, t] = await Promise.all([
    db.$count(recipes),
    db.$count(foods),
    db.$count(ingredients),
    db.$count(measurements),
    db.$count(units),
    db.$count(recipeTags),
  ]);
  return {
    recipes: r,
    foods: f,
    ingredients: i,
    measurements: m,
    units: u,
    recipeTags: t,
  };
}
