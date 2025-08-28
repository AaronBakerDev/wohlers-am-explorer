-- Seed demo data for Market Insights and Quotes Benchmark (development only)
-- Safe to run multiple times; checks try to avoid duplicates by key fields.

-- 1) Ensure a demo company exists for pricing samples
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.companies WHERE name = 'Demo AM Services'
  ) THEN
    INSERT INTO public.companies (id, name, country, state, city, company_type, created_at)
    VALUES (gen_random_uuid(), 'Demo AM Services', 'United States', 'CA', 'San Jose', 'service', NOW());
  END IF;
END$$;

-- 2) Seed pricing samples (service_pricing)
--   Use the demo company id by name lookup
WITH demo AS (
  SELECT id AS company_id FROM public.companies WHERE name = 'Demo AM Services' LIMIT 1
)
INSERT INTO public.service_pricing (
  id, company_id, material_category, specific_material, process, quantity, price_usd, lead_time_days, notes, data_source, created_at
)
SELECT gen_random_uuid(), demo.company_id, sp.material_category, sp.specific_material, sp.process, sp.quantity, sp.price_usd, sp.lead_time_days, sp.notes, 'seed_demo_2025', NOW()
FROM demo,
     (VALUES
       ('Plastics', 'PLA', 'FDM', 10, 250.00, 5, 'Sample small batch'),
       ('Plastics', 'ABS', 'FDM', 100, 1600.00, 7, 'Sample medium batch'),
       ('Metals', '316L', 'DMLS', 5, 1200.00, 12, 'Metal sample'),
       ('Resins', 'Tough Resin', 'SLA', 20, 900.00, 6, 'Resin sample')
     ) AS sp(material_category, specific_material, process, quantity, price_usd, lead_time_days, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_pricing p
  WHERE p.company_id = (SELECT company_id FROM demo)
    AND p.process = sp.process
    AND p.material_category = sp.material_category
    AND p.quantity = sp.quantity
);

-- 3) Seed market_data for totals and country breakdowns
--   Revenue by year/segment
INSERT INTO public.market_data (id, data_type, year, segment, country, value_usd, data_source, created_at)
SELECT gen_random_uuid(), 'revenue', md.year, md.segment, md.country, md.value_usd, 'seed_demo_2025', NOW()
FROM (
  VALUES
    (2024, 'Equipment', NULL::text, 6000000000.00),
    (2024, 'Services', NULL::text, 4200000000.00),
    (2024, 'Materials', NULL::text, 1800000000.00),
    (2025, 'Equipment', NULL::text, 6600000000.00),
    (2025, 'Services', NULL::text, 4700000000.00),
    (2025, 'Materials', NULL::text, 2000000000.00)
) AS md(year, segment, country, value_usd)
WHERE NOT EXISTS (
  SELECT 1 FROM public.market_data m
  WHERE m.data_type = 'revenue' AND m.year = md.year AND COALESCE(m.segment,'') = COALESCE(md.segment,'') AND m.country IS NULL
);

--   Country breakdown (same year) to power top countries & segment breakdown
INSERT INTO public.market_data (id, data_type, year, segment, country, value_usd, data_source, created_at)
SELECT gen_random_uuid(), 'revenue', md.year, md.segment, md.country, md.value_usd, 'seed_demo_2025', NOW()
FROM (
  VALUES
    (2024, 'Equipment', 'United States', 2300000000.00),
    (2024, 'Services',  'United States', 1700000000.00),
    (2024, 'Materials', 'United States',  650000000.00),
    (2024, 'Equipment', 'Germany',        900000000.00),
    (2024, 'Services',  'Germany',        600000000.00),
    (2024, 'Materials', 'Germany',        300000000.00),
    (2024, 'Equipment', 'Canada',         400000000.00),
    (2024, 'Services',  'Canada',         280000000.00),
    (2024, 'Materials', 'Canada',         120000000.00)
) AS md(year, segment, country, value_usd)
WHERE NOT EXISTS (
  SELECT 1 FROM public.market_data m
  WHERE m.data_type = 'revenue' AND m.year = md.year AND COALESCE(m.segment,'') = COALESCE(md.segment,'') AND COALESCE(m.country,'') = COALESCE(md.country,'')
);

-- Done

