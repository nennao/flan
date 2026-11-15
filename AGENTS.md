# Agent Instructions

## Project context

Read `GOALS.md` and `ROADMAP.md` before beginning substantial work. `docs/LEGACY_ASSESSMENT.md` describes the legacy app; its §9–11 are the **record of agreed architecture and decisions**. Don't contradict them without discussing it first.

This repository contains a legacy meal-planning application being modernised into a Next.js/React/TypeScript application.

- **Legacy code is reference-only.** Don't modify `flan/`, `web/`, `scripts/` or the legacy `data/` files. They are consulted for parity and retired once replaced.
- **Reference data** changes only through the name-keyed CSVs in `data/seed/` (see its README). Never write reference data to the database directly.
- **Schema changes** go only through `drizzle-kit generate` migrations, which are reviewed and committed. Never use `drizzle-kit push`.
- **Package manager:** pnpm only. Don't use npm or yarn to install.

The developer is an experienced software engineer learning Next.js and practising AI-assisted development. Prioritise correctness, maintainability, transparent reasoning and opportunities for meaningful technical review.

## Before making changes

1. Inspect the relevant existing code.
2. Check the current roadmap phase.
3. Summarise your understanding of the task.
4. Identify assumptions, unknowns and risks.
5. Propose an implementation approach.
6. Obtain approval before significant architectural changes, broad refactors, destructive operations or migrations.

Do not assume the legacy application is fully functional or that planned features were implemented.

## Implementation standards

- Prefer small, cohesive, reviewable changes.
- Follow existing conventions unless there is a good reason to change them.
- Avoid speculative abstractions and unnecessary dependencies.
- Keep business logic separate from framework-specific code.
- Use TypeScript deliberately; avoid unnecessary `any` types.
- Validate untrusted input and handle errors appropriately.
- Do not expose secrets or database credentials to client-side code.
- Add or update tests for meaningful behaviour changes.
- Preserve existing data and functionality unless changes are approved.
- Do not modify production infrastructure or data without explicit approval.

## Next.js learning expectations

When introducing an important Next.js concept or pattern, briefly explain:

- Why it is appropriate here.
- How it differs from the legacy approach.
- Any meaningful alternatives or trade-offs.

Particularly relevant topics include Server Components, Client Components, Server Actions, Route Handlers, caching, data fetching, rendering strategies and deployment behaviour.

Avoid lengthy tutorials unless requested.

## Validation and reporting

After each implementation task:

1. Summarise the changes made.
2. Explain significant decisions.
3. Report tests, builds and checks actually run.
4. Identify any unverified behaviour or remaining risks.
5. Suggest the next logical task.
6. Update `ROADMAP.md` when appropriate.

Never report a check as passed unless it was actually executed.

## Scope control

- Follow the current roadmap phase.
- Do not automatically implement future phases.
- Ask before introducing major dependencies or changing the agreed architecture.
- Prefer finishing and validating one feature over starting several.
- Keep documentation useful and concise.

## Workflow

- Work on a short-lived branch per milestone (e.g. `m1-foundation`). Merge into `master` only when the milestone's exit check passes; `master` must always work.
- Make one small, cohesive commit per planned step, then **pause** so the developer can review the diff before continuing.
- Do not push, merge into `master` or delete branches without explicit approval.

## Current work

See `ROADMAP.md` → "Current next action".
