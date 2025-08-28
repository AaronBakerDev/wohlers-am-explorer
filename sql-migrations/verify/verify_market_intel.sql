-- Verify new market intelligence tables and columns
SELECT 'companies_parent_company' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema='public' AND table_name='companies' AND column_name='parent_company'
) AS ok;
SELECT 'companies_public_stock_ticker' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema='public' AND table_name='companies' AND column_name='public_stock_ticker'
) AS ok;
SELECT 'companies_total_funding_usd' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema='public' AND table_name='companies' AND column_name='total_funding_usd'
) AS ok;

SELECT 'company_categories_exists' AS check, to_regclass('public.company_categories') IS NOT NULL AS ok;
SELECT 'investments_exists' AS check, to_regclass('public.investments') IS NOT NULL AS ok;
SELECT 'mergers_acquisitions_exists' AS check, to_regclass('public.mergers_acquisitions') IS NOT NULL AS ok;
SELECT 'service_pricing_exists' AS check, to_regclass('public.service_pricing') IS NOT NULL AS ok;
SELECT 'market_data_exists' AS check, to_regclass('public.market_data') IS NOT NULL AS ok;

