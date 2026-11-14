# Meal Planner — Development Roadmap

## Status

**Current phase:** 0 — Discovery and assessment

**Overall objective:** Modernise the existing Flask/PostgreSQL/JavaScript meal planner into a responsive, full-stack Next.js/React/TypeScript application, then deploy it.

This roadmap is provisional until Phase 0 is complete.

## Phase 0 — Discover and assess the existing application

- [ ] Inspect repository structure, dependencies and configuration.
- [ ] Identify existing Flask routes and their responsibilities.
- [ ] Identify existing frontend pages, interactions and functionality.
- [ ] Inspect the PostgreSQL schema and database access patterns.
- [ ] Identify nutritional data sources and ingestion scripts.
- [ ] Determine whether the original application can still be run locally.
- [ ] Check unmerged branches for potential changes worth keeping
  - [ ] The above steps are repeated for the code in each unmerged branch.
  - [ ] Developer runs the app if possible, and verifies if the branch's changes should be kept.
  - [ ] Developer merges any desired unmerged branches.
- [ ] Identify existing tests and obvious gaps.
- [ ] Classify features as implemented, partial, planned or unclear.
- [ ] Identify functionality worth preserving and obsolete code worth retiring.
- [ ] Record migration risks and unanswered questions.
- [ ] Propose and review the target architecture.
- [ ] Update this roadmap based on findings.

**Deliverable:** `docs/LEGACY_ASSESSMENT.md` containing an evidence-based inventory of the existing application, followed by a proposed implementation plan.

**Exit criterion:** The developer has reviewed and approved the proposed migration approach.

## Phase 1 — Establish the Next.js foundation

- [ ] Decide whether to migrate in place or create a separate application alongside the legacy code.
- [ ] Initialise Next.js with App Router and TypeScript.
- [ ] Establish project structure and coding conventions.
- [ ] Configure linting, formatting and testing.
- [ ] Implement an initial responsive application shell.
- [ ] Establish environment-variable handling.
- [ ] Choose a database access approach.
- [ ] Establish local PostgreSQL connectivity.
- [ ] Document local setup instructions.

**Exit criterion:** The Next.js application runs locally, passes its initial checks and can securely access a development database.

## Phase 2 — Migrate the first complete feature

Select the first feature based on Phase 0 findings. A recipe viewer/editor or food search is a possible candidate.

- [ ] Define the feature's expected behaviour.
- [ ] Implement required server-side data access.
- [ ] Implement React UI components.
- [ ] Add appropriate validation and error handling.
- [ ] Make the feature usable on mobile.
- [ ] Add tests for important behaviour.
- [ ] Compare results against the legacy implementation.
- [ ] Document notable architectural decisions.

**Exit criterion:** One useful feature works end-to-end without depending on the legacy Flask application.

## Phase 3 — Migrate remaining core functionality

Refine this checklist after the legacy assessment.

- [ ] Food and nutritional data browsing/search.
- [ ] Recipe creation, editing and nutritional calculations.
- [ ] Weekly meal scheduling.
- [ ] Nutritional targets and summaries.
- [ ] Shopping-list generation, if appropriate.
- [ ] Other existing functionality identified during discovery.
- [ ] Review and simplify obsolete legacy code.

**Exit criterion:** The agreed core workflows function in the new application and have been validated.

## Phase 4 — Production deployment

- [ ] Choose a managed PostgreSQL provider.
- [ ] Establish a safe database migration and backup strategy.
- [ ] Provision development/production database environments as appropriate.
- [ ] Migrate and verify required nutritional data.
- [ ] Configure Vercel deployment.
- [ ] Configure environment variables and secrets.
- [ ] Validate production database connectivity and connection management.
- [ ] Test critical workflows in the deployed application.
- [ ] Review security, errors, logging and deployment documentation.

**Exit criterion:** The application is usable at a deployed URL, with its required data and core functionality working.

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

- [ ] More sophisticated meal-planning constraints.
- [ ] Automated meal-plan optimisation.
- [ ] Python optimisation API or background worker, if justified.
- [ ] Cloud-based scheduled data updates.
- [ ] Authentication and multi-user functionality.
- [ ] Offline editing and synchronisation.
- [ ] Native mobile client, if necessary.

## Working rules

- Complete one meaningful milestone at a time.
- Review significant architectural decisions before implementation.
- Keep checklist statuses accurate.
- Mark tasks complete only after their exit criteria are met.
- Record important decisions and discoveries in the relevant documentation.
- Do not expand the current phase with unrelated improvements.
- Revisit priorities when new information changes the plan.

## Current next action

**Complete Phase 0. Do not begin the Next.js rewrite until the legacy assessment and proposed architecture have been reviewed.**