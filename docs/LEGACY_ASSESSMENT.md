# Flan — Legacy Assessment (Phase 0)

_Assessed 2026-11-14 against `master` @ `625baea`, `feature/mvp` @ `81db491` and `nenna` @ `61d9b77`._

**Citation convention.** `path:line` refers to `master`. `[mvp] path:line` refers to the file on the `feature/mvp` branch (`git show feature/mvp:path`), and `[nenna] path:line` to the `nenna` branch.

**Evidence levels.** Statements are **observed** (read in the code or data, or checked with a script) unless they are marked _(assumption)_ or _(unverified)_. The first pass of this assessment was static only. **Update (same day):** `feature/mvp` has since been **run successfully**: ingestion, all API routes, and the generate → save → view flow (see §4.4). The runtime findings in §4–§6 are confirmed. Remaining _(unverified)_ markers refer to things that were not exercised.

---

## 1. Executive summary

- **`master` is not the real codebase. `feature/mvp` is.** `feature/mvp` is 11 commits ahead of `master` (Nov–Dec 2021) and only 1 behind (the docs commit `625baea`). It merges cleanly (checked with `git merge-tree`). On `master` the planner's backend is broken (§4.2), so the master frontend probably renders an empty page _(unverified)_.
- **`nenna` is obsolete.** It is a June–July 2020 UI prototype that ran against hard-coded dummy data. Its features (collapsible meal cards, editable quantities) were hand-ported into `feature/mvp` in commits `28c8d27` and `3656dd3`, which then went further. Its only unique content is vendored jQuery/Bootstrap/moment and a font. **Recommendation: do not merge it. Keep an archive tag.**
- **What actually works (on `feature/mvp`)** is one feature, the **meal planner**:
  - pick a date range;
  - see per-day calorie and macro targets (a hard-coded carb-cycling schedule);
  - "generate" a plan (random recipe choice, not real generation);
  - save it to PostgreSQL;
  - view saved plans with real nutrition computed from ingredients.

  There is no UI for browsing recipes or foods, no recipe editing, no shopping list and no tracking. The Home screen buttons for "Daily Tracker", "Weekly Tracker" and "get me a recipe" do nothing.

- **The most valuable assets are the data and the nutrition model:**
  - 49 recipes, 380 ingredient lines and 148 foods;
  - 142 cached Nutritionix JSON files;
  - a unit → gram conversion model (mass, per-item weights, density for volumes) that, on `feature/mvp`, is internally consistent.

  The Python/JS code itself is small (about 1,500 lines) and is better treated as a **reference specification** than as code to port line by line.

- **Real secrets are committed:** a Nutritionix API key and a DB password (§8.1). The key should be rotated whatever else we decide.
- **There are no tests on any branch.**
- **There is no persistent data to migrate.** All reference data is rebuilt from CSV/JSON in the repo. The only database-only data is saved plans in someone's local DB, which is probably disposable _(assumption, see Q2)_.

---

## 2. Branches

| Branch        | Ahead/behind `master`                        | Dates                       | Content                                                                                                                                                     | Recommendation                                                                    |
| ------------- | -------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `master`      | —                                            | to 2021-11-13 (+ docs 2026) | Ingestion of recipes, foods and macros. Planner API is broken.                                                                                              | Merge `feature/mvp` into it.                                                      |
| `feature/mvp` | **+11 / −1**                                 | 2021-11-14 → 2021-12-21     | Measurements and densities, `plan_days` with goals, working save/get plans, ingredient-level nutrition, macro bars and donuts, editable quantities, nav bar | **Merge.** It is a functional superset of `master` and has no conflicts.          |
| `nenna`       | +38 / −9 (diverged at `ece535d`, 2020-06-06) | 2020-06-06 → 2020-07-18     | Dummy-data `flan/app.py`, vendored libs in `web/lib/`, early meal-card UI                                                                                   | **Do not merge.** Tag it (e.g. `archive/nenna`) and optionally delete the branch. |

Evidence:

- `git diff nenna feature/mvp -- web/` shows that every function removed relative to `nenna` is an older version of a function that `feature/mvp` still has (`sbFlex`, `relIngCals`, `addQtyInputEvents` and so on).
- `[nenna] flan/app.py:12-221` is a static `dummy_plan`. `[nenna] flan/app.py:243-258` returns that dummy plan from `savePlan` and `getPlans`.
- The nutritionix JSON churn on `feature/mvp` (about 61k lines, commit `2810744`) is **pretty-printing only**. I compared all 142 files after parsing. Food name, serving weight, protein, fat, carbs and fibre are identical. Only `feature/mvp` adds `data/measures.csv`.

The remotes (`origin/feature/mvp`, `origin/nenna`) are identical to the local branches.

---

## 3. Architecture and dependencies (as found)

```
repo root (must be the CWD: code opens data/… and web/… relative paths)
├── flan/            Python 3.7 + Flask 1.1 + psycopg2, raw SQL, no ORM
│   ├── services.py  Flask app + logger singletons
│   ├── db.py        connection per request (flask.g), @transaction decorator/context manager, sql() helper
│   ├── api.py       HTTP routes (JSON API + static file serving)
│   ├── ingest.py    CSV/JSON → Postgres ingestion
│   └── cmdline.py   cmd.Cmd CLI: clear | ingest | sql | plan | spag
├── web/             vanilla ES modules + jQuery 3.5 + Bootstrap 4.5 + moment 2.26 (CDN)
├── scripts/         00.sql (schema), create-db.sh, sql.sh, get-nutritionix.sh, queries.sql
└── data/            recipes.csv, ingredients.csv, measures.csv [mvp], nutritionix/*.json, …
```

- **Python deps** (`requirements.txt`) are pinned to 2020 versions: Flask 1.1.2, Werkzeug 1.0.1, Jinja2 2.11.2, psycopg2-binary 2.8.5, gunicorn 20.0.4. `runtime.txt` says `python-3.7.4`. These pins very likely won't install on a current Python (psycopg2-binary 2.8.5 has no wheels for modern CPython) _(assumption, not tested)_.
- **Modules import each other as top-level modules**, e.g. `from services import app` (`flan/api.py:7`, `flan/db.py:9`). They therefore only work when run as scripts from inside the `flan/` directory. They are not importable as a package.
- **`Procfile` is broken on every branch except `nenna`.** It references `flan.app:app`, but `flan/app.py` doesn't exist on `master`/`feature/mvp` (it was split into `api.py`), and package-style import would fail anyway because of the import style above. Heroku deployment presumably stopped working at the split _(assumption)_.
- **DB connection settings are hard-coded:** `localhost:5433`, user `svc-flan-api`, password in source (`flan/db.py:12-16`). There is no environment-variable configuration.
- **Frontend:** a hand-rolled SPA. `main.js` keeps a global `STATE`, handles `setState`, re-renders by setting `innerHTML` from template strings, and routes with `history.pushState` between two views (`home`, `planner`). Flask serves `web/` for any `/app/<path>` and maps the view names to `index.html` (`flan/api.py:49-53`).

---

## 4. Backend: routes and database interactions

### 4.1 Routes (`feature/mvp`)

| Route                     | Behaviour                                                                                                                                                                                                                                                                                                                                                       | Evidence                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `GET /`                   | Redirects to `/app/home`.                                                                                                                                                                                                                                                                                                                                       | `[mvp] flan/api.py:84-86`          |
| `GET /app/<path>`         | Serves static files from `web/`. `home` and `planner` map to `index.html`.                                                                                                                                                                                                                                                                                      | `[mvp] flan/api.py:88-92`          |
| `POST /api/generatePlan/` | **Not real generation.** Returns a plan with one random breakfast, lunch and dinner per day, chosen from a hard-coded list of recipe names. Nutrition in the draft is **fake**: either fixed `{carbs:8, fat:4, protein:8}` or two placeholder ingredients ("ingredient 1/2"). Goals are copied from the request, with macro % converted to grams. No DB access. | `[mvp] flan/api.py:39-80, 299-303` |
| `POST /api/savePlan/`     | Inserts `plans`, then `plan_days` (with goal grams), then `plan_elements` (recipe looked up **by name**). Returns the saved plan via `_get_plans`. Hard-coded `user_id = 1`. **Edited quantities are ignored and not persisted.** No input validation. An unknown recipe name raises `IndexError`, giving a 500.                                                | `[mvp] flan/api.py:96-130`         |
| `GET /api/getPlans/`      | Returns all plans for user 1. One large join (plans → days → elements → recipes → ingredients → foods → units → measurements) is folded into nested JSON in Python. Per-ingredient macros are computed per serving (see §5.3).                                                                                                                                  | `[mvp] flan/api.py:139-296`        |
| (delete plan)             | Commented out.                                                                                                                                                                                                                                                                                                                                                  | `[mvp] flan/api.py:133-136`        |

Observations on `_get_plans` (`[mvp] flan/api.py:139-286`):

- SQL is built with f-strings (`user_id`, `plan_ids`, `rho`). The values are integers from server code, so it isn't currently exploitable, but it's a pattern to avoid.
- A recipe with no ingredients would drop out of the result because of the `INNER JOIN ingredients`.
- `full join measurements` behaves as a left join because of the `WHERE p.user_id = …` clause.
- An unrecognised unit measure raises `Exception('cant handle unit')`.

### 4.2 `master` differences (why `master` is broken)

- `get_plans` selects `f.calories`, which was dropped from the schema in commit `4d04075`, and orders by `e.date`, which should be `e.el_date` (`flan/api.py:103, 118`). Every `GET /api/getPlans/` therefore errors. `web/main.js:130` only builds the initial state on success, so the page would stay blank _(inferred from code)_.
- Its fold logic checks "new element" before "new day/plan" (`flan/api.py:156-178`), so day and plan boundaries would be mis-grouped.
- It sums raw per-100 g macros without scaling by amount.
- `do_ingest` doesn't call `ingest_users()` (`flan/cmdline.py:58-60`), so `savePlan` would fail the `user_id` foreign key.

### 4.3 CLI (`flan/cmdline.py`)

| Command       | Purpose                                                                                          | Status                    |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| `clear`       | Drops and recreates the `flan` database and runs `scripts/00.sql`. **Destructive.**              | Works in principle        |
| `ingest`      | `ingest_recipes`, `ingest_ingredients`, plus `ingest_users` on `[mvp]`. Runs in one transaction. | Works in principle (§5.4) |
| `sql <query>` | Ad-hoc SQL.                                                                                      | Dev tool                  |
| `plan`        | Prints a random 7-day CSV plan to stderr using recipe tags.                                      | Superseded prototype      |
| `spag`        | Prints Spag Bol's data, to sanity-check ingestion.                                               | Dev tool                  |

Run as `python flan/cmdline.py <cmd>` from the repo root. It needs `flan/` on `sys.path` for imports and the root as the working directory for `data/`. This was verified in §4.4.

### 4.4 Running the legacy app (verified 2026-11-14)

Environment: an Ubuntu 24.04 container running as root. **No legacy files were modified.** The pinned `requirements.txt` installs unchanged on Python 3.8.

```bash
# PostgreSQL 16, with a dedicated cluster on the port the legacy code hard-codes
apt-get install -y postgresql
pg_createcluster 16 legacy -p 5433 && pg_ctlcluster 16 legacy start   # listens on localhost only
su postgres -c "psql -p 5433 -c \"create role \\\"svc-flan-api\\\" login superuser password 'a6d0ff99cfb8637f6a07a7d12e914b32'\""
#   (burned legacy password, hard-coded in flan/db.py; superuser is needed because `clear` drops/creates the DB)

# feature/mvp checked out next to the repo (no merge, master untouched)
git worktree add --detach ../flan-legacy feature/mvp

# Python 3.8 venv outside the repo
uv python install 3.8 && uv venv -p 3.8 ../.venv-legacy
VIRTUAL_ENV=../.venv-legacy uv pip install -r ../flan-legacy/requirements.txt

# From ../flan-legacy:
../.venv-legacy/bin/python flan/cmdline.py clear     # drop/create DB + schema
../.venv-legacy/bin/python flan/cmdline.py ingest    # 49 recipes, 148 foods, 380 ingredients, 54 measurements, 1 user
../.venv-legacy/bin/gunicorn --pythonpath flan --bind 0.0.0.0:8000 api:app   # http://localhost:8000/
```

Results:

- `GET /` redirects to `/app/home`, and `/app/planner` returns 200.
- `generatePlan`, `savePlan` and `getPlans` all work with the request shape the frontend sends.
- Confirmed: draft nutrition is placeholder data (100 or 240 kcal per item). Saved plans show real per-serving values.
- Confirmed: the generator ignores the day's targets.

Reference data from the running app is stored **outside the repo** in `../legacy-fixtures/` and is not yet committed. It includes `recipe-nutrition-per-serving.json`, captured by saving a temporary plan containing all 49 recipes and reading it back through `getPlans`. **Every recipe matches the offline re-implementation in §5.4** (rounded kcal, protein, fat and carbs).

---

## 5. Data: schema and ingestion

### 5.1 Schema (`[mvp] scripts/00.sql`)

```
recipes(id, name UNIQUE, batch)              -- batch = number of servings the recipe makes
recipe_tags(id, recipe_id→recipes, value)    -- breakfast/lunch/dinner/low_carb/high_carb/keto/various/effort/…
foods(id, name UNIQUE, protein, fat, carbs, fibre)  -- g per 100 g
units(id, unit, measure)                     -- measure ∈ mass | volume | unit | density ('rho')
measurements(food_id, unit_id, grams)        -- grams per 1 unit, or g/ml when unit='rho'
ingredients(recipe_id, food_id, unit_id, amount)
users(id, name)                              -- single seeded 'tester' user
plans(id, user_id, begin_date, end_date)
plan_days(id, plan_date, plan_type, goal_carbs, goal_fat, goal_protein, plan_id)   -- [mvp only]
plan_elements(id, el_type, plan_day_id, recipe_id)                                  -- [mvp]
```

The differences on `master` are that it has no `units.measure`, has `measurements.grams` as `int` instead of `real`, has no `plan_days`, and `plan_elements` carries `el_date`/`plan_type`/`plan_id` directly.

Weaknesses worth fixing during migration (minimal, no redesign):

- No primary key on `ingredients` or `measurements`, and no unique `(food_id, unit_id)` constraint.
- Almost no `NOT NULL` constraints.
- No indexes on foreign keys.
- `plan_elements` has **no quantity or servings column**, so the UI's editable quantities cannot be saved.
- Calories are never stored; they are always derived as 9·fat + 4·protein + 4·carbs. That is good and worth keeping.
- `'rho'` is modelled as a pseudo-unit for density. It's clever but non-obvious and should be documented or renamed.

### 5.2 Source data (`data/`)

| File                        | Role                                                                                  | Notes                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `recipes.csv`               | `NAME,SERVES,TAGS` (pipe-separated tags)                                              | 49 recipes. Names are snake_case, title-cased on ingest.                  |
| `ingredients.csv`           | `recipe,food,quantity` where quantity is e.g. `200g`, `10ml`, `2` (= items, unit `#`) | 380 rows. Units used: `g` 241, `#` 102, `ml` 36, `tbsp` 1.                |
| `measures.csv` [mvp]        | `FOOD,UNIT,API_UNIT`: maps our unit to a Nutritionix `alt_measures` entry             | 54 rows. `{comma}`/`{quote}` escaping.                                    |
| `nutritionix/*.json`        | Cached Nutritionix `/v2/natural/nutrients` responses, one per food                    | 142 files. Fetched by `scripts/get-nutritionix.sh` (requires an API key). |
| `nutritionix_broken/*.json` | 10 responses judged wrong                                                             | Not ingested, so those foods get **0 macros**.                            |
| `ignore_calories.txt`       | Foods deliberately set to 0 macros (spices, stocks, sauces)                           | 30 of the 148 foods.                                                      |
| `recipe_tags.csv`           | Tags in long format                                                                   | **Unused.** Duplicates the `TAGS` column.                                 |
| `revisit.txt`               | Note: guacamole, aioli, baby leaf salad                                               | Data-quality to-do.                                                       |

### 5.3 Nutrition model (the core domain logic)

Ingestion (`[mvp] flan/ingest.py:105-157` (`_add_food_to_measurements` at `:144-157`)):

- **Per-100 g macros:** `100 * nf_<macro> / serving_weight_grams` from the JSON. Foods with no JSON, or listed in `ignore_calories.txt`, get 0.
- **Per-food unit weights:** for each `measures.csv` row, find the `alt_measures` entry with `measure == API_UNIT` and `qty == 1`, and store its `serving_weight` as grams per unit. If our unit is `rho` and the API unit is a volume, divide by ml-per-unit to get **density (g/ml)**.

Calculation at request time (`[mvp] flan/api.py:192-206`), per ingredient and per serving:

```
grams = amount                                   if unit == 'g'
      = ML_PER[unit] * amount * density          if unit is a volume (ml/tsp/tbsp/cup; cup = 240 ml)
      = amount * grams_per_item                  if unit is an item (#, medium, large)
grams /= recipe.batch
macro_g = per100g[macro] * grams / 100
kcal = 9·fat + 4·protein + 4·carbs
```

The frontend then scales by element and ingredient quantity (`[mvp] web/meal_card_components.js:48-55`).

The unit-conversion tables are duplicated in three places: `[mvp] flan/ingest.py:88-102`, `:145` and `[mvp] flan/api.py:193`. In the new app this should live in **one tested TypeScript domain module**.

### 5.4 Offline data validation (scripts run during this assessment)

I re-implemented the ingestion and calculation rules in throwaway Node scripts (outside the repo, in `/tmp`) and ran them against the `feature/mvp` data:

- ✅ All 380 ingredient rows parse, and every ingredient's recipe exists.
- ✅ Every non-gram ingredient has a gram conversion. The `assert` in `[mvp] flan/ingest.py:76-77` would pass.
- ✅ Every `measures.csv` entry has a matching `alt_measures` entry with `qty == 1`. No `KeyError`.
- ✅ Every recipe name in the dummy generator exists in `recipes.csv`, so `savePlan` won't hit the `IndexError` with generated plans.
- ✅ No names contain quotes. The f-string SQL in ingestion is fragile but won't break on the current data.
- ⚠️ 6 foods have no nutrition file and silently get 0 macros: beansprouts, ryvita, cornflour, apple sage jelly, pea shoots, ketjap manis.
- ⚠️ **Per-serving outliers.** Popcorn Chicken comes out at about **4,900 kcal/serving** because `vegetable oil,1000ml` (deep-frying oil) is counted in full. The model has no concept of "oil absorbed vs used".
- ⚠️ **Cooked vs raw weights.** `Spaghetti.json` is "1 cup cooked, 140 g, 42 g carbs", but recipes appear to use dry weights (e.g. `spag_bol,spaghetti,750g`). That would understate pasta and rice carbs by roughly 2–2.5× _(assumption about recipe intent)_.
- ⚠️ Sauces such as soy sauce and fish sauce are zeroed via `ignore_calories.txt`. That's a judgement call.

These per-recipe figures (49 recipes, kcal/P/F/C per serving) can become **golden test fixtures** to prove the TypeScript port matches legacy behaviour, before any deliberate data fixes are made.

---

## 6. Frontend: structure and behaviour (`feature/mvp`)

| File                          | Responsibility                                                                                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/index.html`              | Shell. Bootstrap/jQuery/popper/moment from CDNs, Google Fonts.                                                                                                                                                                                                   |
| `web/main.js`                 | Global `STATE`, `setState` → re-render, view routing (home/planner), nav bar, initial `getPlans` fetch.                                                                                                                                                          |
| `web/api.js`                  | `fetch` wrapper and the three API calls. Its doc comments describe schemas that are now out of date.                                                                                                                                                             |
| `web/planner.js`              | Planner page: saved-plans accordion, "Add a plan" modal (date range → targets grid → Generate → draft → Accept/Cancel).                                                                                                                                          |
| `web/meal_card_components.js` | Day cards (total, goal, plan type, per-meal-type collapsible items → ingredients), macros card (SVG donut, totals vs goal), macro bars, "view macros/more/detailed" toggles, average/summary column, contenteditable quantity editing with proportional scaling. |
| `web/mealplan_config.js`      | **Carb-cycling targets:** Mon/Thu/Sun low carb (1,700 kcal; C10/F65/P25 %), Tue/Fri med (1,900; 30/45/25), Wed/Sat high (2,200; 55/20/25). `[mvp] web/mealplan_config.js:9-29`                                                                                   |
| `web/utils.js`                | `sum`/`avg`/`percent`/rounding, id generator, SVG donut chart.                                                                                                                                                                                                   |
| `web/styles.css`              | Custom styles over Bootstrap. **No media queries.**                                                                                                                                                                                                              |

Behavioural observations:

- **Not responsive.** Card widths are computed from `window.screen.width / 8` in JS (`[mvp] web/meal_card_components.js:440-445`), and the modal has `min-width: 500px`.
- **Quantity edits are local only.** Draft edits are sent to `savePlan` but ignored by the backend. Saved plans are read-only.
- **The draft preview shows fake nutrition** (see `generatePlan` in §4.1), while saved plans show real nutrition. Draft and saved figures for the same recipe will disagree.
- Snacks are a meal type in the UI but are never generated.
- Data is interpolated into `innerHTML` without escaping. It's safe with today's trusted CSVs, but it becomes XSS once user-editable recipes exist. React's escaping solves this by default.
- `main.js` ↔ `meal_card_components.js` import each other (`_assignState`), and UI state such as collapse flags is mutated in place inside plan objects.
- There is no loading state or error UI. Errors go to `console`.

---

## 7. Feature inventory

| Feature                                                    | Status                                                                         | Evidence                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Recipe / food / nutrition ingestion from CSV + cached JSON | **Implemented** (mvp: incl. unit conversions)                                  | `[mvp] flan/ingest.py`                            |
| Fetch nutrition from Nutritionix API                       | **Implemented** (shell script; needs a key; one-off)                           | `scripts/get-nutritionix.sh`                      |
| Per-serving recipe nutrition (computed)                    | **Implemented** server-side, but only exposed inside plans                     | `[mvp] flan/api.py:192-219`                       |
| Daily calorie/macro targets (carb cycling)                 | **Implemented**, hard-coded config, not user-editable                          | `[mvp] web/mealplan_config.js`                    |
| Create plan for a date range                               | **Partial.** Date selection works; "generation" is random and ignores targets. | `[mvp] flan/api.py:39-80`                         |
| Save plan                                                  | **Implemented**, recipes only (no quantities)                                  | `[mvp] flan/api.py:96-130`                        |
| View saved plans with nutrition vs goals, macro charts     | **Implemented**                                                                | `[mvp] web/planner.js`, `meal_card_components.js` |
| Edit quantities in a plan                                  | **Partial.** UI only for drafts; not persisted.                                | `[mvp] web/meal_card_components.js:348-437`       |
| Edit/delete saved plans                                    | **Planned** (commented stub)                                                   | `[mvp] flan/api.py:133-136`                       |
| Daily / weekly tracker                                     | **Planned** (button only)                                                      | `[mvp] web/main.js:73-74`                         |
| "Get me a recipe"                                          | **Planned** (button only)                                                      | `[mvp] web/main.js:76`                            |
| Recipe browsing / search / CRUD                            | **Not present**                                                                | —                                                 |
| Food search / browsing                                     | **Not present**                                                                | —                                                 |
| Shopping list                                              | **Not present**                                                                | —                                                 |
| Users / auth                                               | **Not present.** Table exists; user id hard-coded to 1.                        | `[mvp] flan/api.py:101, 291`                      |
| Recipe tags (meal type, diet)                              | **Implemented in data**, used only by the CLI `plan` command                   | `flan/cmdline.py:19-38`                           |
| Tests                                                      | **None** on any branch                                                         | `git ls-tree`                                     |

---

## 8. Risks, unknowns and migration considerations

### 8.1 Security

- **Committed secrets:**
  - a Nutritionix app ID and key (`scripts/get-nutritionix.sh:8-9`, present since commit `5747193`);
  - a DB password (`flan/db.py:13`, `scripts/create-db.sh:8`).

  `origin` is `github.com/nennao/flan`. If that repo is or was public, assume both are leaked. **Rotate the Nutritionix key.** The DB password only protects a local dev DB, but must never be reused. Rewriting git history is optional and I don't recommend it unless the repo is public.

  **Resolved (2026-11-14):**
  - The repo was public for a few hours, then made private. Treat both values as leaked.
  - The Nutritionix key has been rotated, and the account has been suspended since 2025. The app ID is an identifier, not a secret, and is useless without a valid key.
  - The legacy DB no longer exists. The password is retired and must not be reused.
  - No git history rewrite is needed.
  - Going forward, credentials live only in untracked `.env*` files.

- The DB role is created as `superuser` (`scripts/create-db.sh:16`). The new app should use a least-privilege role.
- There is no auth. A deployed app will need at least deployment-level protection (e.g. Vercel password protection) until accounts exist (see Q8).

### 8.2 Technical risks

- ~~**The legacy app can't easily be run as a reference.**~~ **Resolved:** it runs on Python 3.8 + Postgres 16 with unmodified code (§4.4). Golden fixtures were captured from the running app. This setup lives in the current container and is lost if the container is rebuilt; §4.4 records how to recreate it.
- **Data correctness** issues (§5.4) are domain problems, not migration problems. Recommendation: **port with parity first** (golden tests), then fix data deliberately in separate, reviewable changes.
- **Nutritionix licensing.** Storing and redistributing cached Nutritionix responses in a deployed app may conflict with their API terms _(unverified)_. Public alternatives exist (USDA FoodData Central, UK CoFID). This doesn't block the migration, but it affects Phase 4. **Decided:** move to a public dataset (Q4). Note that `measures.csv` gets per-item and density weights from Nutritionix `alt_measures`, so the new source will also need portion weights. USDA FDC provides these as `foodPortions`; CoFID mostly doesn't.
- **Next.js rendering and DB access at build time.** A Server Component page that queries the DB and uses no request-time APIs may be statically prerendered at `next build`. On Vercel that means the DB must be reachable at build time and the data is frozen until the next deploy. We'll pick dynamic vs cached rendering per route deliberately and check the behaviour against the installed Next.js version in Phase 1, since caching defaults have changed across recent major versions.
- **Serverless connection management.** Neon/Supabase from Vercel functions needs a pooled or serverless driver, not a long-lived `pg.Pool` per instance. This is a Phase 4 concern, but it informs the DB-client choice now.

### 8.3 Worth preserving

- **Data:** `recipes.csv`, `ingredients.csv`, `measures.csv`, `nutritionix/*.json`, `ignore_calories.txt`.
- **Schema concepts:** foods per 100 g; units with a measure type; per-food unit weights and densities; recipes with servings (`batch`); plan → day (with goals) → element. Calories derived, never stored.
- **Nutrition calculation semantics** (§5.3).
- **Per-day goals in the schema** (`plan_days.goal_*`). A flat daily target is the default now (Q10). Because goals are stored per day, carb cycling can return later as a different way of filling them, with no schema change.
- **UI concepts:** day columns grouped by meal type, totals vs goal, macro bar and donut, summary/average column, collapsible recipe → ingredient drill-down, proportional quantity scaling.

### 8.4 Worth retiring

- jQuery, Bootstrap 4, moment.js, the hand-rolled state and router, the JS-computed layout, and the vendored libs on `nenna`.
- `dummy_plan`, `tabulate`, the `plan` and `spag` CLI commands, and `recipe_tags.csv`.
- `Procfile` and `runtime.txt`, and the Python web layer (`api.py`, `services.py`, `db.py`) once replaced.
- `check_nutritionix` can become a data-validation script if useful.

---

## 9. Proposed target architecture

A **single Next.js (App Router) + TypeScript application** in this repo, alongside the legacy code until each feature is verified.

```
src/
  app/                         routes (Server Components by default)
    recipes/page.tsx           list (search/filter via searchParams)
    recipes/[id]/page.tsx      detail
    plans/…                    later milestones
  components/                  presentational React components (app-specific)
    ui/                        shadcn/ui primitives (added on demand only)
  domain/                      PURE TS, no React/Next/DB imports — unit-tested
    units.ts                   unit → grams (mass / volume×density / per-item)
    nutrition.ts               per-ingredient & per-serving macros, kcal
    targets.ts                 flat daily target default, % ↔ grams
  server/                      `import 'server-only'` — never bundled to the client
    db/schema.ts               typed schema (baseline = feature/mvp 00.sql)
    db/client.ts               connection from DATABASE_URL
    queries/recipes.ts         data access returning domain types
    actions/…                  Server Actions (mutations), Zod-validated
scripts/seed/…                 one-off ingestion (separate from request handling)
```

Key decisions and the reasoning behind each:

1. **Server Components for reads.**
   - **Why:** recipe and plan pages call `src/server/queries/*` directly, with no internal REST hop. In the legacy app the browser fetched JSON from Flask and built HTML strings. Here the server renders React, ships HTML, and the DB credentials never leave the server.
   - **Client Components** only for interactive islands: the quantity editor, the plan-creation dialog, view toggles.
2. **Server Actions for mutations** (save/edit/delete plan), with Zod validation at the boundary. They replace the legacy `POST /api/*` endpoints.
   - **Route Handlers** (`app/api/*/route.ts`) are introduced only when a non-React client needs a JSON API (PWA offline sync, mobile, a Python optimiser). That keeps GOALS principle 7 open without building an API speculatively.
3. **Domain logic in `src/domain`.** It is framework-free and unit-tested against the golden fixtures from §5.4. Today the same logic is spread across Python ingestion, Python API code and frontend JS.
4. **DB access: Drizzle ORM + drizzle-kit migrations** (recommended, pending your approval).
   - **Pros:** typed schema close to SQL, plain SQL-like queries, first-class Neon serverless and Postgres drivers, migrations as SQL files you can review.
   - **Alternatives:** Kysely (query builder only, schema types generated from the DB, closest to the legacy raw-SQL style), raw `pg`/`postgres.js` (least abstraction, no type safety), Prisma (heavier, its own schema language; I'd avoid it here).
5. **Schema:** a baseline migration reproducing `[mvp] scripts/00.sql`, followed by small, separately reviewed hardening migrations: PKs/uniques on `ingredients`/`measurements`, `NOT NULL`s, FK indexes, and (when needed) `plan_elements.servings`. No redesign.
6. **Ingestion stays out of the request path.** Two options (see Q5):
   - **(a)** Keep Python, decoupled from Flask, reading `DATABASE_URL`, with parameterised SQL.
   - **(b)** Port it to a TypeScript seed script (about 150 lines). That shares `src/domain/units.ts` with the app, needs one toolchain, and runs the same way locally and against Neon.

   I lean towards **(b)**. The concrete benefits are that the legacy Python environment is effectively dead (3.7 pins), and that the conversion logic must exist in TypeScript anyway. **Fetching** from Nutritionix (`get-nutritionix.sh`) stays a separate, rarely-run step.

   **Decided: (b)** (Q5). The rule that keeps Python cheap to bring back: **the TypeScript migrations own the schema, and the TS seed loads from plain files in `data/`.** Any future Python wrangling (e.g. cleaning a USDA download) writes cleaned CSV/JSON into `data/`. It never writes to the DB directly or defines tables.

   **Refined (2026-11-14):** the Nutritionix-specific ingestion is **not** ported. The legacy DB's reference tables were exported to normalised, name-keyed CSVs in `data/seed/` (see its README). A round-trip load into the legacy schema matched the legacy DB by content checksum. The TS seed only loads those files. `flan/ingest.py`, `data/nutritionix/` and `data/measures.csv` retire with the legacy app.

7. **Local dev DB:** PostgreSQL configured by `DATABASE_URL` in an untracked `.env.local`. The dev environment is already a container without Docker-in-Docker, so we'll use the locally installed PostgreSQL 16 `main` cluster on 5432. It's separate from the `legacy` cluster on 5433 (§4.4).
8. **Testing:** Vitest for domain and query code. One Playwright smoke test per completed vertical slice (each is a dependency to approve in Phase 1).
9. **Styling: Tailwind CSS + shadcn/ui is appropriate.** The app needs accessible dialogs (plan creation), accordion/collapsible (meal cards), date-range input, combobox (recipe/food search), tables and tabs. These are exactly the Radix-backed primitives shadcn provides as copy-in source, with no runtime library lock-in.
   - **Mantine** would also work: it has more built-ins (dates, charts) but is a larger dependency with its own styling system.
   - **CSS Modules alone** would mean hand-building accessible dialogs and comboboxes.
   - Charts: keep the simple SVG donut and bar approach as small React components, rather than adding a chart library for three circles.
   - **I found no compelling reason to deviate.** Add shadcn components only as they're needed.

---

## 10. Recommended migration sequence

| #     | Milestone                                                                                                                                                                              | Roadmap phase               | Outcome                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------- |
| M0    | **Housekeeping (you):** merge `feature/mvp` → `master`; tag and archive `nenna`; ~~rotate the Nutritionix key~~ (done); review this document                                           | 0                           | Clean baseline                                              |
| M1    | **Foundation:** Next.js + TS + lint/format + Vitest; Tailwind/shadcn (after approval); Docker Postgres; Drizzle baseline schema; seed script; responsive app shell                     | 1                           | App runs locally against a seeded DB                        |
| M2    | **First vertical slice — Recipe browser** (below)                                                                                                                                      | 2                           | First end-to-end feature with nutrition parity              |
| M2b   | **Early deployment (Q9):** Vercel + managed Postgres (choose Neon or Supabase here), production migrations and seed, env vars, a deliberate rendering/caching choice per route         | 2 → pulls forward part of 4 | Walking skeleton live; later milestones deploy continuously |
| M3    | Food browser and search (reuses M2's patterns)                                                                                                                                         | 3                           | Searchable food database                                    |
| M4    | Saved plans, read-only: day cards, meal groups, totals vs goals, macro bar/donut, responsive layout                                                                                    | 3                           | Parity with the legacy plan view                            |
| M5    | Create plan: date range + flat daily target; choose recipes per meal slot, plus "fill randomly by tag" (honest port of the legacy generator); save via Server Action; persist servings | 3                           | Parity with legacy planning, with quantities actually saved |
| M6    | Edit and delete plans                                                                                                                                                                  | 3                           | Gaps in legacy closed                                       |
| M7    | Production hardening: backups, connection-management review, error logging, security review                                                                                            | 4                           | Remainder of Phase 4 once the core workflows exist          |
| later | Configurable targets; shopping list (new); recipe CRUD (new); data-quality fixes (§5.4); PWA                                                                                           | 3/5/6                       | —                                                           |

### First vertical slice: Recipe browser (read-only)

**Scope:**

- `/recipes` lists the 49 recipes, with name search and tag filter (breakfast/lunch/dinner/low_carb…) via URL `searchParams`. Each item shows per-serving kcal and macros.
- `/recipes/[id]` shows servings, tags, and an ingredient table with original quantity and unit, resolved grams, and per-ingredient macros. It also shows per-serving totals with a macro bar.
- Mobile-first layout.

**Why this slice first:**

- It exercises every architectural layer: DB, seed, query layer, domain logic, Server Components, routing, `searchParams`, responsive UI and tests.
- It has **no mutations**, so it avoids designing auth and validation too early.
- It ports the **most valuable and riskiest logic**, the nutrition calculation, and can be verified objectively against the §5.4 golden numbers.
- The planner (M4–M6) depends on it.
- Food search would be simpler but proves less. The planner would be the most legacy-faithful, but it builds on fake generation and unsaved quantities.

**Done when:** the domain tests match legacy per-serving values for all 49 recipes, both pages work on a phone-width viewport, and there's no Flask dependency.

---

## 11. Questions for you

1. **Branches.** Shall I prepare the `feature/mvp` → `master` merge (fast and conflict-free), or do you want to do it yourself after running it? And is archiving `nenna` as a tag fine?
2. ~~**Existing data.**~~ **Resolved:** there's no legacy DB to preserve. Everything is re-seeded from the repo files.
3. ~~**Secrets.**~~ **Resolved:** see §8.1.
4. ~~**Nutrition source.**~~ **Decided:** move to a public dataset. Which dataset, and when, is still open. Cached Nutritionix data is kept only as a legacy reference and for parity tests. `scripts/get-nutritionix.sh` is retired (the account is suspended).
5. ~~**Ingestion.**~~ **Decided:** port to a TypeScript seed script. Python may come back for data wrangling, writing files only (see §9 item 6).
6. ~~**Repo layout.**~~ **Decided:** Next.js at the repo root using `src/`, alongside `flan/` and `web/` until they're retired.
7. ~~**DB access.**~~ **Decided:** Drizzle ORM + drizzle-kit migrations. It works with either Neon or Supabase (only the driver and connection config differ), and `drizzle-kit` is the single owner of migrations.
8. ~~**Single user.**~~ **Decided:** single user, no auth, until Phase 6. Read-only features may be public. **Before any write feature (M5) is deployed, the app must be access-protected.** The mechanism is chosen at that point: Vercel Deployment Protection, or Basic Auth in Next.js middleware with credentials in env vars.
9. ~~**Deploy early?**~~ **Decided:** yes. Deploy after the first slice (new milestone M2b in §10). The Neon vs Supabase choice moves up to M2b.
10. ~~**Product intent.**~~ **Decided:** use a flat daily target for now. Carb cycling may return later as an optional way to fill the per-day goals.
    **Product direction noted (2026-11-14):** the core value is now "help me decide what to eat each day without over-eating or cooking too often". This is not in scope for the parity milestones, but it should guide later work:
    - The legacy `recipes.batch` (servings per cook, 1–6) already supports **batch cooking and leftovers**, i.e. cook once and eat it several times.
    - The generator becomes the most valuable feature rather than a placeholder.
    - **Decided:** until then, use a "random by tag" placeholder generator whose drafts show **real** nutrition.
11. ~~**Data fixes.**~~ **Decided:** parity first. The new app reproduces the legacy calculation exactly, verified by the 49-recipe reference data. **Deferred until parity is achieved** (2026-11-14):
    - an overhaul of how recipes and ingredients are modelled (the Nutritionix-shaped data is disliked);
    - replacing most legacy recipes with current ones;
    - the policy on simplicity vs accuracy: how far to go in ignoring minor ingredients such as sauces and stocks;
    - which public dataset to use.

    Already known: **dry vs cooked weights must be handled correctly** in whatever model replaces the current one.
