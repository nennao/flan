# Agent Instructions

## Project context

Read `GOALS.md` and `ROADMAP.md` before beginning substantial work.

This repository contains a legacy meal-planning application being modernised into a Next.js/React/TypeScript application.

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

## Initial assignment

Begin with Phase 0 of `ROADMAP.md`.

Inspect the legacy repository and produce `docs/LEGACY_ASSESSMENT.md` with:

- Existing architecture and dependencies.
- Implemented and partially implemented features.
- Flask routes and database interactions.
- PostgreSQL schema and nutritional data ingestion.
- Frontend structure and behaviour.
- Tests and local run instructions, where discoverable.
- Risks, unknowns and migration considerations.
- A proposed Next.js target architecture.
- Recommended migration sequence and first vertical slice.

Support findings with references to relevant source files.

**Do not begin the migration until the assessment has been reviewed and approved.**