# Repository Guidelines

This guide summarizes how to work effectively in this repository.

## Project Structure & Module Organization
- App code: `src/app/` (routes, API handlers).
- UI components: `src/components/` (shadcn/ui), hooks in `src/hooks/`, utilities in `src/lib/`.
- Public assets: `public/`. Optional DB migrations: `sql-migrations/`.
- Tests: Playwright E2E specs in `e2e/`.
- Primary docs: `README.md`, `docs/setup/LOCAL_SETUP.md`, `docs/setup/AUTH.md`.

## Build, Test, and Development Commands
- `npm run dev`: start Next.js (Turbopack) locally at `http://localhost:3000`.
- `npm run build`: compile a production build.
- `npm run start`: serve the production build.
- `npm run lint`: run ESLint; fix all issues before PR.
- `npx playwright test` | `--ui`: run E2E tests (headless or headed UI).

## Coding Style & Naming Conventions
- Language: TypeScript; 2-space indent; keep imports sorted; remove unused code.
- Components: PascalCase in `src/components/`; file name `ComponentName.tsx`.
- Routes: App Router in `src/app/`; API handlers at `src/app/<route>/route.ts`.
- Styling: Tailwind CSS 4 + shadcn/ui; prefer utility classes; reuse design tokens.
- Env vars: client values prefixed `NEXT_PUBLIC_*`; secrets in `.env.local` (untracked). Use `.env.local.example` as a template.
- Linting: configured via `eslint.config.mjs`. CI should report zero warnings.

## Testing Guidelines
- Framework: Playwright for E2E. Place specs under `e2e/` (e.g., `e2e/auth.spec.ts`).
- Coverage: prioritize critical flows (auth, dashboard, map, table, exports).
- Run: `npx playwright test` or `npx playwright test --ui` for headed mode.

## Commit & Pull Request Guidelines
- Commits: imperative, concise scope (e.g., `feat: map filters`, `lint: rules update`).
- Branches: topic branches (e.g., `feat/map-filters`).
- PRs: include description, linked issues, UI screenshots, steps to test, and any schema/export notes. Ensure `npm run build` passes and E2E smoke tests run locally.

## Security & Configuration Tips
- Never commit `.env.local`. Rotate any exposed keys immediately.
- Auth is disabled in development; follow `AUTH.md` to re-enable before production.

## Database Schema & Migrations
- Migrations live in `sql-migrations/` (e.g., `020_unified_companies_schema.sql`, `021_migrate_vendor_to_unified_companies*.sql`).
- Apply migrations via your DB tooling (e.g., Supabase SQL editor). Document any manual steps in PR descriptions.
