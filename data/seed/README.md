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

These files are the **contract** for future data work. A new food dataset, new recipes, or an optional Python cleaning step should produce files in this format. Nothing else should write reference data to the database directly.

Known data issues are kept as-is for parity (see the assessment, §5.4 and Q11): deep-frying oil counted in full, cooked vs dry weights, zeroed sauces and stocks.
