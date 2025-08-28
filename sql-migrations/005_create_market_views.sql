-- Migration: Create market intelligence and pricing benchmark views
-- Purpose: Power Market Insights and Quotes Benchmark UIs/APIs

-- View: market_totals
-- Aggregated market size by year and segment (USD)
-- Source: market_data (expects rows with data_type 'revenue' or 'market_size'/'forecast')
CREATE OR REPLACE VIEW public.market_totals AS
SELECT
  md.year::integer AS year,
  COALESCE(md.segment, 'Other')::varchar AS segment,
  SUM(COALESCE(md.value_usd, 0))::numeric AS total_value
FROM public.market_data md
WHERE md.data_type IN ('revenue', 'market_size', 'forecast')
GROUP BY md.year, COALESCE(md.segment, 'Other')
ORDER BY year ASC, segment ASC;

COMMENT ON VIEW public.market_totals IS 'Aggregated market size by year and segment sourced from market_data.';

-- View: market_by_country_segment
-- Aggregated value by year, country, and segment (USD)
CREATE OR REPLACE VIEW public.market_by_country_segment AS
SELECT
  md.year::integer AS year,
  COALESCE(md.country, 'Unknown')::varchar AS country,
  COALESCE(md.segment, 'Other')::varchar AS segment,
  SUM(COALESCE(md.value_usd, 0))::numeric AS value
FROM public.market_data md
WHERE md.data_type IN ('revenue', 'market_size', 'forecast')
GROUP BY md.year, COALESCE(md.country, 'Unknown'), COALESCE(md.segment, 'Other')
ORDER BY year DESC, value DESC;

COMMENT ON VIEW public.market_by_country_segment IS 'Aggregated market size by year/country/segment sourced from market_data.';

-- View: pricing_benchmarks
-- Summary statistics of service pricing by process/material/quantity and country
-- Source: service_pricing + companies (for country context)
CREATE OR REPLACE VIEW public.pricing_benchmarks AS
WITH base AS (
  SELECT
    sp.process,
    sp.material_category,
    sp.quantity,
    COALESCE(c.country, 'Unknown') AS country,
    sp.price_usd::numeric AS price_usd,
    sp.lead_time_days::integer AS lead_time_days
  FROM public.service_pricing sp
  LEFT JOIN public.companies c ON c.id = sp.company_id
  WHERE sp.process IS NOT NULL
    AND sp.material_category IS NOT NULL
    AND sp.quantity IS NOT NULL
    AND sp.price_usd IS NOT NULL
)
SELECT
  b.process,
  b.material_category,
  b.quantity,
  b.country,
  COUNT(*)::integer AS sample_count,
  MIN(b.price_usd) AS min_price,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY b.price_usd) AS q1_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.price_usd) AS median_price,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY b.price_usd) AS q3_price,
  MAX(b.price_usd) AS max_price,
  AVG(b.price_usd) AS avg_price,
  MIN(b.lead_time_days) AS min_lead_time,
  AVG(b.lead_time_days) AS avg_lead_time,
  MAX(b.lead_time_days) AS max_lead_time
FROM base b
GROUP BY b.process, b.material_category, b.quantity, b.country
ORDER BY b.process, b.material_category, b.quantity, b.country;

COMMENT ON VIEW public.pricing_benchmarks IS 'Benchmark statistics for service pricing by process/material/quantity and country.';

