# Flan: Meal Planner — Project Goals

## Background

Flan (portmanteau of food + plan). This is an existing personal meal-planning web application, originally developed approximately five years ago using Flask, PostgreSQL and vanilla JavaScript.

The project was abandoned before completion. Its current functionality, code quality and implementation status need to be assessed before planning the migration.

The intention is to revive and modernise the application, both to make it genuinely useful and to provide a practical learning opportunity.

## Product vision

Build a convenient, intuitive meal-planning application that helps users organise meals and understand their nutritional intake.

Potential capabilities include:

- A searchable database of foods and nutritional information.
- Creating and editing recipes with ingredients, quantities and calculated nutritional values.
- Planning meals across a week.
- Tracking nutritional intake against configurable targets.
- Generating shopping lists from planned meals.
- A responsive interface suitable for desktop and mobile browsers.

These are desired capabilities, **not claims about the existing implementation**. Inspect the repository to establish what is already implemented.

### Future possibilities

Not part of the initial migration:

- Installable Progressive Web App (PWA).
- Offline access to shopping lists and saved meal plans.
- User accounts and personal preferences.
- Automated meal-plan generation using nutritional, dietary, budget and variety constraints.
- Python-based mathematical optimisation services.
- Native mobile application, if genuinely justified.

The architecture should not unnecessarily obstruct these possibilities, but avoid implementing speculative infrastructure for them now.

## Technical goals

### Primary stack

- **Next.js** using the App Router.
- **React** for the user interface.
- **TypeScript** throughout the main application.
- **PostgreSQL** for persistent data.
- **Vercel** as the intended application deployment platform.
- A managed PostgreSQL provider, provisionally Neon or Supabase.

These are preferred technologies, not justification for unnecessary complexity.

### Styling and UI strategy

The provisional styling approach is **Tailwind CSS with shadcn/ui**, supplemented by CSS Modules or ordinary CSS where appropriate.

Goals:

- Build a clean, modern, responsive interface that works well on desktop and mobile.
- Establish consistent design tokens for colours, spacing, typography and component states.
- Use accessible, reusable UI primitives rather than reimplementing complex controls unnecessarily.
- Keep application-specific UI components independent of any particular component library where practical.
- Avoid excessive utility-class duplication, unnecessary abstractions and large collections of unused components.
- Prefer simple, maintainable styling over elaborate visual effects.

During the initial repository assessment, briefly evaluate whether Tailwind + shadcn/ui is appropriate for the application, and identify any compelling reasons to prefer an alternative such as Mantine or CSS Modules.

**Do not install or configure a styling framework until the proposed approach has been reviewed.**

### Migration approach

- Replace the existing Flask application and vanilla JavaScript frontend with a full-stack Next.js application.
- Preserve useful existing functionality and data.
- Retain PostgreSQL initially, avoiding unnecessary schema redesign.
- Migrate incrementally through complete, testable features.
- Keep the existing implementation available as a reference until replacement functionality is verified.
- Treat one-time dataset ingestion separately from web request handling.
- Do not automatically rewrite working Python ingestion scripts unless there is a concrete benefit.

### Architectural principles

1. Prefer simple, maintainable solutions over elaborate abstractions.
2. Separate domain logic from React components and framework-specific entry points.
3. Use Server Components, Client Components, Server Actions and Route Handlers according to their actual responsibilities.
4. Keep database credentials and sensitive operations server-side.
5. Use TypeScript types and runtime validation appropriately at system boundaries.
6. Build responsive layouts from the outset.
7. Preserve the option of introducing an API for other clients in the future.
8. Allow specialised Python services or background workers to be added later without restructuring the entire application.
9. Avoid premature microservices, queues, authentication systems or cloud infrastructure.
10. Make architectural decisions based on concrete requirements, not simply to introduce additional technologies.

## Learning goals

This is also a deliberate exercise in developing practical experience with:

- Next.js App Router architecture and rendering models.
- React and TypeScript in a full-stack application.
- Database access, migrations and managed PostgreSQL.
- Deployment, environment management and production debugging.
- Responsive application design and potentially PWAs.
- AI-agent-assisted software engineering.

**An important objective is understanding the work, not merely completing it.**

The developer is an experienced full-stack software engineer but relatively new to Next.js. Do not explain general programming fundamentals unnecessarily. Do explain Next.js-specific conventions, trade-offs and less obvious behaviours.

## AI-assisted development principles

Coding agents may perform substantial implementation work, but the developer retains responsibility for architectural decisions and validation.

Agents should:

- Inspect existing code before recommending changes.
- Distinguish observed facts from assumptions.
- Propose significant architectural decisions before implementing them.
- Explain important Next.js-specific choices and alternatives.
- Make focused, reviewable changes.
- Add or update appropriate tests.
- Report what was actually verified.
- Avoid claiming functionality is complete without evidence.

The aim is to develop a maintainable application while gaining genuine experience directing, reviewing and validating AI-generated code.

## Success criteria

The initial modernisation is successful when:

- Core existing functionality has been identified and either migrated, deliberately deferred or deliberately retired.
- The application runs on Next.js, React and TypeScript.
- PostgreSQL data is accessible through secure server-side application logic.
- Important workflows are covered by appropriate tests.
- The application works well on desktop and mobile browsers.
- A working version is deployed to Vercel with managed PostgreSQL.
- The migration is documented and the application can be developed further without relying on the original Flask implementation.

Feature expansion beyond the original application is a separate phase.