# Execution Log — Sprint Stories

This log tracks execution of sprint stories from `SPRINT-BACKLOG.md`, with concrete steps and verification notes.

## Week 1 — Foundation

### DI-001 — Database Schema Migration
- Status: In Progress
- Where: `wohlers-am-explorer/sql-migrations/001_create_am_companies_schema.sql`
- Steps:
  1) Open Supabase SQL editor, paste and run `001_create_am_companies_schema.sql`.
  2) Then run `002_update_schema_for_csv_data.sql` and `003_restructure_for_equipment_data.sql`.
  3) Enable RLS policies are included in 001; ensure they apply post-creation.
- Verify (run in Supabase SQL):
  - `SELECT to_regclass('public.companies');`
  - `SELECT COUNT(*) FROM public.technologies;` (expects > 0)
  - `SELECT COUNT(*) FROM public.materials;` (expects > 0)
- Notes: Indexes and `updated_at` trigger are included for performance.

### DI-002 — Enhanced Company Data Import
- Status: Ready
- Where: `wohlers-am-explorer/scripts/extract-excel-sheets.js`, `import-csv-data.js`
- Steps (local):
  1) Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and a key (`SUPABASE_SERVICE_ROLE_KEY` preferred).
  2) `node scripts/extract-excel-sheets.js` (reads vendor Excel, saves CSV/JSON to `project-documents/extracted-vendor-data`).
  3) Adjust `import-csv-data.js` source paths as needed; run `node scripts/import-csv-data.js`.
- Verify: spot-check company count and sample joins in DB; run app and confirm map/table show data.

### UM-001 — User Authentication System
- Status: Ready
- Steps:
  - Keep mocked login for demo; wire Supabase Auth later behind feature flag.
  - Add guards to dashboard routes; redirect unauthenticated users to `/login`.
- Verify: smoke test login/register pages; access to `/dashboard` gated.

---

Use this log for day-to-day tracking; update status and add notes as each story completes.

