# Seed data

These are normalised reference data files. The new app's seed script loads them into PostgreSQL. Rows refer to each other by **name**, not database id, so the files can be read and edited by hand.

| File | Columns | Notes |
|---|---|---|
| `foods.csv` | `name, protein, fat, carbs, fibre` | grams per 100 g |
| `units.csv` | `unit, measure` | measure ∈ `mass`, `volume`, `unit` (countable), `density` |
| `measurements.csv` | `food, unit, grams` | grams per 1 unit of that food; for `rho`, density in g/ml |
| `recipes.csv` | `name, batch` | batch = number of servings the recipe makes |
| `recipe_tags.csv` | `recipe, tag` | |
| `ingredients.csv` | `recipe, food, unit, amount` | amount for the whole batch |

## Provenance

Exported on 2026-11-14 from the database built by the legacy Python ingestion (`flan/ingest.py` at `feature/mvp` 81db491). Its sources were `data/recipes.csv`, `data/ingredients.csv` and `data/measures.csv`, plus the cached Nutritionix responses in `data/nutritionix/`.

Loading these files into the legacy schema reproduces the legacy reference tables exactly (checked by content checksum). See `docs/LEGACY_ASSESSMENT.md` §5.

## Loading and checking

- `pnpm db:seed` validates every file (types, column lengths, unique names, every name reference resolves) and loads them in one transaction. It refuses to run if any reference table already has rows.
- `pnpm db:reset` (local databases only) drops everything, re-runs the migrations and seeds.
- `pnpm db:checksum` prints a content checksum per table: rows with ids resolved to names, sorted, then md5'd. It's independent of database ids, so it can compare any two databases with the baseline schema. Set `DATABASE_URL` inline to check a different database.

Parity checksums of the legacy database, which the files reproduce (2026-11-15, PostgreSQL 16):

| Table          | Rows | md5                                |
| -------------- | ---- | ---------------------------------- |
| `foods`        | 148  | `23ed88805a24234538efb6f967e90137` |
| `units`        | 9    | `9c4f43bae3bd64eb14c235bc7998af98` |
| `measurements` | 54   | `bc647426f78a4e7a60d1a0ab341eb088` |
| `recipes`      | 49   | `ce014a78f839e9189fcb3557e97a1dfb` |
| `recipe_tags`  | 88   | `37f3aa426dc1ab9945eb6369383a272b` |
| `ingredients`  | 380  | `38e5f16fbd3128defd2e94ed9f9096b0` |

A deliberate change to these files changes the checksums. Update this table in the same commit.

These files are the **contract** for future data work. A new food dataset, new recipes, or an optional Python cleaning step should produce files in this format. Nothing else should write reference data to the database directly.

Known data issues are kept as-is for parity (see the assessment, §5.4 and Q11): deep-frying oil counted in full, cooked vs dry weights, zeroed sauces and stocks.
