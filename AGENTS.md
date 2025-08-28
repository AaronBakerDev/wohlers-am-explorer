# Repository Guidelines

## Project Structure & Module Organization
- App layout: `src/app/` (routes, API handlers), `src/components/` (UI; shadcn), `src/hooks/`, `src/lib/`, `public/`, optional `sql-migrations/`.
- Tests: E2E specs live in `e2e/`. Primary docs: `README.md`, `LOCAL_SETUP.md`, `AUTH.md`.

## Build, Test, and Development Commands
- `npm run dev`: start Next.js (Turbopack) locally.
- `npm run build`: production compile of the app.
- `npm run start`: serve the production build.
- `npm run lint`: run ESLint with Next config; fix before PR.
- `npx playwright test` | `--ui`: run E2E tests (headless or headed UI).

## Coding Style & Naming Conventions
- Language: TypeScript; 2‑space indent; keep imports sorted and remove unused code.
- Components: PascalCase in `src/components`, files named `ComponentName.tsx`.
- Routes: App Router in `src/app`; API handlers at `src/app/<route>/route.ts`.
- Styling: Tailwind CSS 4 + shadcn/ui; prefer utility classes; reuse design tokens where available.
- Env vars: client values must be prefixed `NEXT_PUBLIC_`; secrets in `.env.local` (untracked). Use `.env.local.example` as a template.
- Linting: configured via `eslint.config.mjs`. Ensure zero warnings in CI.

## Testing Guidelines
- Framework: Playwright for E2E. Cover critical flows (auth, dashboard, map, table, exports).
- Location: place specs under `e2e/` (e.g., `e2e/auth.spec.ts`).
- Run: `npx playwright test` or `npx playwright test --ui` for headed mode.

## Commit & Pull Request Guidelines
- Commits: imperative mood and concise scope (e.g., "feat: map filters", "lint: rules update").
- Branches: topic branches preferred (e.g., `feat/map-filters`).
- PRs: include description, linked issue(s), screenshots for UI, steps to test, and any schema/export notes. CI/lint must pass; verify `npm run build` and E2E smoke tests locally.

## Security Notes
- Never commit `.env.local`. Rotate keys if accidentally exposed.
- Auth is disabled in development; follow `AUTH.md` to re-enable before production.
