# GH Issue: Hook cleaner into prebuild/prestart

- Title: Hook cache cleaner into prebuild/prestart to ensure clean production builds
- Labels: enhancement, build, tooling

## Context
We added a cross‑platform cleaner at `scripts/clean.js` and wired it to `predev` so `npm run dev` starts from a clean state. To avoid stale build artifacts in production/CI, we should also run the cleaner before `next build` and `next start`.

## Proposal
- Add `"prebuild": "node scripts/clean.js"` to `package.json`.
- Add `"prestart": "node scripts/clean.js"` to `package.json`.
- Document the `NEXT_SKIP_CLEAN=1` override in README (for faster local iteration).
- In CI, consider setting `NEXT_SKIP_CLEAN=1` if caching is desired and reliable.

## Rationale
- Prevents issues caused by stale `.next` or TypeScript incremental caches (e.g., transient routing errors like `/_document`).
- Improves build reproducibility across local, CI, and Vercel.

## Acceptance Criteria
- Running `npm run build` logs the cleaner activity and completes successfully on a warm workspace.
- Running `npm run start` after a previous build also logs cleaner activity and serves without leftovers.
- Setting `NEXT_SKIP_CLEAN=1` skips cleaning for both commands.
- README mentions the behavior and skip flag succinctly.

## Notes
- Cleaner already wired to `predev`; `npm run clean` is available.
- Node version is `20` (see `.nvmrc`); matches CI/Vercel config.

