-- Verify core schema exists and seed data present
SELECT 'companies_exists' AS check, to_regclass('public.companies') IS NOT NULL AS ok;
SELECT 'technologies_exists' AS check, to_regclass('public.technologies') IS NOT NULL AS ok;
SELECT 'materials_exists' AS check, to_regclass('public.materials') IS NOT NULL AS ok;
SELECT 'company_technologies_exists' AS check, to_regclass('public.company_technologies') IS NOT NULL AS ok;
SELECT 'company_materials_exists' AS check, to_regclass('public.company_materials') IS NOT NULL AS ok;

-- Seed counts should be > 0
SELECT 'technologies_seed_count' AS check, COUNT(*) > 0 AS ok FROM public.technologies;
SELECT 'materials_seed_count' AS check, COUNT(*) > 0 AS ok FROM public.materials;

-- Index presence (not all RDBMS expose easily; this checks via pg_class)
SELECT 'idx_companies_location_present' AS check, (SELECT COUNT(1) FROM pg_class WHERE relname = 'idx_companies_location') = 1 AS ok;

