# Meal Planner — Development Roadmap

## Status

**Current phase:** 1 — Establish the Next.js foundation

**Overall objective:** Modernise the existing Flask/PostgreSQL/JavaScript meal planner into a responsive, full-stack Next.js/React/TypeScript application, then deploy it.

Phase 0 is complete. The findings, agreed architecture and decision log are in [`docs/LEGACY_ASSESSMENT.md`](docs/LEGACY_ASSESSMENT.md); see §9 (architecture), §10 (milestones) and §11 (decisions).

## Agreed decisions (summary)

- **Codebase:** `feature/mvp` merged into `master`. `nenna` archived as tag `archive/nenna`.
- **Layout:** Next.js App Router + TypeScript at the repo root under `src/`, alongside the legacy `flan/` and `web/` until they're retired.
- **Data access:** Drizzle ORM. `drizzle-kit` is the sole owner of migrations. The baseline schema is the legacy `feature/mvp` schema plus small hardening migrations.
- **Seed data:** normalised, name-keyed CSVs in `data/seed/`, exported from the legacy DB and verified identical. A TypeScript seed script loads them. Nutritionix ingestion is retired, not ported. Optional future Python may only write files into `data/`.
- **Styling:** Tailwind CSS + shadcn/ui, with components added only when needed.
- **Users:** single user, no auth. Must be access-protected before any write feature is deployed.
- **Targets and generator:** a flat daily target (carb cycling may return later). A "random by tag" placeholder generator whose drafts show real nutrition.
- **Parity first:** the new app reproduces the legacy nutrition calculations, verified against the 49-recipe reference captured from the running legacy app.
- **Deployment:** early, straight after the first feature.

## Phase 0 — Discover and assess the existing application ✅

- [x] Inspect repository structure, dependencies and configuration.
- [x] Identify existing Flask routes and their responsibilities.
- [x] Identify existing frontend pages, interactions and functionality.
- [x] Inspect the PostgreSQL schema and database access patterns.
- [x] Identify nutritional data sources and ingestion scripts.
- [x] Determine whether the original application can still be run locally. _(Yes, unmodified, on Python 3.8 + Postgres 16. See assessment §4.4.)_
- [x] Check unmerged branches for potential changes worth keeping
  - [x] The above steps are repeated for the code in each unmerged branch.
  - [x] Developer runs the app if possible, and verifies if the branch's changes should be kept. _(Run and exercised by the agent on port 8000; the developer accepted the findings.)_
  - [x] Developer merges any desired unmerged branches. _(`feature/mvp` merged in `2270d29`; `nenna` archived as tag `archive/nenna`.)_
- [x] Identify existing tests and obvious gaps. _(No tests on any branch.)_
- [x] Classify features as implemented, partial, planned or unclear.
- [x] Identify functionality worth preserving and obsolete code worth retiring.
- [x] Record migration risks and unanswered questions.
- [x] Propose and review the target architecture.
- [x] Update this roadmap based on findings.
- [x] Export legacy reference data to `data/seed/` (verified by round-trip checksum).

**Exit criterion met (2026-11-14):** the developer reviewed and approved the migration approach.

## Phase 1 — Establish the Next.js foundation (milestone M1)

- [x] Decide whether to migrate in place or create a separate application alongside the legacy code. _(Alongside, at the repo root under `src/`.)_
- [ ] Initialise Next.js with App Router and TypeScript.
- [ ] Establish project structure and coding conventions (`src/app`, `src/components`, `src/domain`, `src/server`).
- [ ] Configure linting, formatting and testing (Vitest). Exclude the legacy `flan/` and `web/`.
- [ ] Install and configure Tailwind CSS + shadcn/ui.
- [ ] Implement an initial responsive application shell.
- [ ] Establish environment-variable handling (`DATABASE_URL` in untracked `.env.local`).
- [x] Choose a database access approach. _(Drizzle.)_
- [ ] Baseline Drizzle schema and migration matching the legacy schema.
- [ ] TypeScript seed script loading `data/seed/*.csv`.
- [ ] Establish local PostgreSQL connectivity (local PG 16 `main` cluster, port 5432).
- [ ] Document local setup instructions.

**Exit criterion:** The Next.js application runs locally, passes its initial checks and can securely access a seeded development database.

## Phase 2 — First complete feature and early deployment (milestones M2, M2b)

**First feature: read-only recipe browser.** `/recipes` offers search and tag filtering with per-serving kcal and macros. `/recipes/[id]` shows ingredients, resolved grams and per-serving totals.

- [ ] Define the feature's expected behaviour.
- [ ] Implement the nutrition domain module (`src/domain`) with golden tests against the legacy 49-recipe reference.
- [ ] Implement required server-side data access.
- [ ] Implement React UI components.
- [ ] Add appropriate validation and error handling.
- [ ] Make the feature usable on mobile.
- [ ] Add tests for important behaviour.
- [ ] Compare results against the legacy implementation.
- [ ] Document notable architectural decisions.

**Early deployment (M2b):**

- [ ] Choose a managed PostgreSQL provider (Neon or Supabase).
- [ ] Configure Vercel deployment, environment variables and secrets.
- [ ] Run migrations and seed against the production database.
- [ ] Choose rendering and caching deliberately per route; make sure the build doesn't depend on DB access unintentionally.
- [ ] Validate production database connectivity and connection pooling.

**Exit criterion:** The recipe browser works end-to-end, locally and at a deployed URL, without depending on the legacy Flask application.

## Phase 3 — Migrate remaining core functionality (milestones M3–M6)

- [ ] **M3:** food browsing and search.
- [ ] **M4:** saved plans, read-only (day cards, meal groups, totals vs goals, macro bar and donut, responsive).
- [ ] **M5:** create plan: date range, flat daily target, recipes per meal slot, "random by tag" fill with real nutrition, save via Server Action, persist servings. **The deployed app must be access-protected first.**
- [ ] **M6:** edit and delete plans.
- [ ] Retire the legacy Flask app, `web/`, the Nutritionix ingestion and associated data once replacements are verified.

**Exit criterion:** The agreed core workflows function in the new application and have been validated.

## Phase 4 — Production hardening (milestone M7)

Initial deployment moved to Phase 2 (M2b).

- [ ] Establish a safe database migration and backup strategy.
- [ ] Review connection management under real usage.
- [ ] Test critical workflows in the deployed application.
- [ ] Review security, errors, logging and deployment documentation.

**Exit criterion:** The deployed application is reliable, recoverable and documented.

## Phase 5 — Usability and polish

- [ ] Review desktop and mobile UX.
- [ ] Improve navigation and form interactions.
- [ ] Review loading, empty and error states.
- [ ] Assess accessibility and keyboard usability.
- [ ] Measure and address meaningful performance issues.
- [ ] Consider PWA installation support.
- [ ] Consider offline read-only access to shopping lists.

**Exit criterion:** The application is pleasant and reliable enough for regular personal use.

## Phase 6 — Optional future enhancements

Not required for the initial migration:

- [ ] Smarter generation: "what should I eat" within targets, with **batch cooking and leftovers** (cook less often; uses `recipes.batch`) and variety.
- [ ] Optional carb cycling as a way of filling per-day goals.
- [ ] Shopping-list generation.
- [ ] Recipe creation and editing.
- [ ] Automated meal-plan optimisation; a Python optimisation API or background worker, if justified.
- [ ] Cloud-based scheduled data updates.
- [ ] Authentication and multi-user functionality.
- [ ] Offline editing and synchronisation.
- [ ] Native mobile client, if necessary.

## Deferred decisions (revisit after parity, i.e. end of Phase 3)

- Overhaul of the recipe and ingredient data model (move away from Nutritionix-shaped data).
- Replace most legacy recipes with current ones.
- Simplicity vs accuracy policy: how far to go in ignoring minor ingredients such as sauces and stocks.
- Public nutrition dataset choice (USDA FoodData Central, UK CoFID, …), including portion weights.
- **Fixed requirement:** dry vs cooked weights must be handled correctly.

## Working rules

- Complete one meaningful milestone at a time.
- Review significant architectural decisions before implementation.
- Keep checklist statuses accurate.
- Mark tasks complete only after their exit criteria are met.
- Record important decisions and discoveries in the relevant documentation.
- Do not expand the current phase with unrelated improvements.
- Revisit priorities when new information changes the plan.

## Current next action

**Phase 1 (M1):** propose the concrete foundation setup (exact packages and versions, config, directory layout, scripts) for review. Then initialise the Next.js application.
