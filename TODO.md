# Component Showcase Updates

- [x] Add `aria-pressed` state to code toggle buttons in component showcases.
- [x] Provide accessible remove labels on mock filter chips.
- [x] Sync company table example with shadcn `Table` primitives.
- [x] Correct component counts and lists on the main showcase hub.
- [x] Replace placeholder bullet lists with rendered previews on category pages.
- [x] Swap literal bullet characters for semantic list styling.

# Data Migration to Beta Schema

- [x] Draft Supabase DDL for all Beta workbook tables (companies, pricing, revenue, trade, contacts, FX).
- [x] Stand up `staging_beta` schema and create loaders that validate types from the workbook.
- [x] Run data-quality checks (lead times, FX coverage, missing IDs) and fix upstream issues.
- [ ] Promote clean data into new `public` tables; update Supabase views/API queries.
- [ ] Archive legacy business tables (snapshot + revoke writes) and document retirement.
- [ ] Execute final migration and cutover scripts via Supabase CLI.
