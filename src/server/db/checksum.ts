/**
 * Content checksum of the reference tables, independent of database ids.
 *
 * Each row is rendered with its foreign keys resolved to names (the same shape
 * as data/seed/*.csv), the rows are sorted with the byte-order "C" collation
 * (the legacy and new clusters have different default collations), and the
 * sorted text is hashed with md5. The same query runs against any database
 * with the baseline schema, so it compares the new DB with the legacy one, or
 * a local DB with a deployed one.
 */
import { sql } from "drizzle-orm";

import type { Db } from "./create-db";

export type TableChecksum = { table: string; rows: number; md5: string };

const query = sql`
  with t(tbl, r) as (
    select 'foods', (name, protein, fat, carbs, fibre)::text from foods
    union all
    select 'units', (unit, measure)::text from units
    union all
    select 'measurements', (f.name, u.unit, m.grams)::text
      from measurements m
      left join foods f on f.id = m.food_id
      left join units u on u.id = m.unit_id
    union all
    select 'recipes', (name, batch)::text from recipes
    union all
    select 'recipe_tags', (r.name, t.value)::text
      from recipe_tags t
      left join recipes r on r.id = t.recipe_id
    union all
    select 'ingredients', (r.name, f.name, u.unit, i.amount)::text
      from ingredients i
      left join recipes r on r.id = i.recipe_id
      left join foods f on f.id = i.food_id
      left join units u on u.id = i.unit_id
  ),
  names(tbl, ord) as (
    values ('foods', 1), ('units', 2), ('measurements', 3),
           ('recipes', 4), ('recipe_tags', 5), ('ingredients', 6)
  )
  select n.tbl as "table",
         count(t.r)::int as rows,
         md5(coalesce(string_agg(t.r, E'\\n' order by t.r collate "C"), '')) as md5
    from names n
    left join t on t.tbl = n.tbl
   group by n.tbl, n.ord
   order by n.ord
`;

export async function referenceChecksums(db: Db): Promise<TableChecksum[]> {
  return db.transaction(async (tx) => {
    // Pin float text output (Postgres 12+ default: shortest exact round-trip),
    // in case a session or server overrides it.
    await tx.execute(sql`set local extra_float_digits = 1`);
    const { rows } = await tx.execute<TableChecksum>(query);
    return rows;
  });
}
