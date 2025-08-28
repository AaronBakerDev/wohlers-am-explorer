# Mobile UX/UI Review — Summary and Actions

Date: 2025-08-28

Scope: `src/components/*`, `src/app/(dashboard-template)/*` (base-app untouched)

## Changes Applied

- Mobile card lists added alongside data tables for readability on small screens:
  - `src/components/data-table-content.tsx`: adds `md:hidden` list view with key fields and quick actions; keeps table for `md+`.
  - `src/components/directory-content.tsx`: adds mobile list with name, location, funding, categories.
  - `src/components/print-services-global-content.tsx`: adds mobile list with company, manufacturer/model, printers, segment, process, country.
- Safe-area padding for iOS notches/home indicator:
  - `src/components/map-explorer-content.tsx`: bottom drawer padded with `pb-[env(safe-area-inset-bottom)]`.
  - `src/app/(dashboard-template)/layout.tsx`: mobile sidebar sheet padded with `pt/pb` safe-area insets.
- Accessibility tweaks for icon-only buttons (improves discoverability on touch):
  - `data-table-content.tsx` and `system-manufacturers-matrix.tsx`: add `aria-label`/`title` to website and overflow action buttons.

These are surgical and feature-flag-free; desktop experience unchanged.

## Audit Highlights (What’s Working)

- Navigation:
  - Uses an off-canvas mobile sidebar (Sheet) with proper overlay and close controls.
  - Desktop sidebar collapses and maintains keyboard shortcut (⌘/Ctrl+b).
- Maps:
  - Leaflet rendered client-side; container fills available height; clustering enabled.
  - Loading/legend overlays are positioned and unobtrusive.
- Charts:
  - Recharts wrapped in `ResponsiveContainer` across analytics views; grids use mobile-first columns.
- Tables:
  - `ui/table.tsx` wraps tables in `overflow-auto` to enable horizontal scroll on small screens.
  - Sticky header already used for Print Services table.
- Filter controls:
  - FilterBar supports `flex-wrap`, compact button sizes, and label badges.
  - Numeric inputs set `inputMode="numeric"` where applicable.

## Recommended Patterns (Adopted and For Future)

- Responsive alternatives to dense tables:
  - Provide `md:hidden` card lists for key entities (now in 3 major views). Consider similar for `system-manufacturers-matrix.tsx` if needed by users.
- Safe areas on iOS:
  - Use `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]` on mobile overlays, drawers, and fixed bars.
- Touch target sizing:
  - Primary actions ≥40–44px height. Current dense tables use 24–32px for row actions, which is acceptable in data-dense contexts; consider upsizing if user feedback indicates misses.
- Horizontal overflow:
  - Keep `overflow-x-auto` around any table-like layout. Prefer `whitespace-nowrap` for narrow cells to avoid jittery wrapping.
- Accessible icon buttons:
  - Always include `aria-label` and optional `title` for icon-only controls (applied to website/more actions buttons).
- Motion and focus:
  - Respect `prefers-reduced-motion` for heavy transitions; current app uses minimal transitions.
- Numeric keyboards:
  - Continue using `type="number"` with `inputMode="numeric"` for mobile-friendly inputs.

## Deferred/Optional Enhancements

- Matrix mobile view: add a compact card list to `system-manufacturers-matrix.tsx` mirroring the pattern used elsewhere.
- Sticky headers for other large tables (`data-table-content.tsx`, `directory-content.tsx`) if users request it.
- Map gesture handling: consider Leaflet’s `gestureHandling` plugin to reduce accidental zooms on scroll in mobile contexts.

## QA Notes

- E2E tests run at desktop viewport; added mobile-only views gated by `md:hidden`, so test selectors and flows remain valid.
- `npm run build` currently hits unrelated prerender/type issues in API routes; no changes were made to server routes. Validate UI changes in dev: `npm run dev`.

## Quick Test Scenarios (Mobile)

1) Dashboard → Data Table tab:
   - Narrow viewport to <768px.
   - Verify card list shows name/location/type/metrics; tap opens detail modal; website icon opens link.
2) Dashboard → Directory tab:
   - Verify card list and chips; pagination controls present.
3) Print Services Global → Table tab:
   - Verify card list with printers count; segment/process badges; country shown.
4) Map tab:
   - Select a marker; bottom drawer respects iOS safe area and scrolls internally.
5) Mobile sidebar:
   - Open/close; content respects notch with top/bottom padding.

